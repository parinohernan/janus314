const FacturaCabeza = require("../models/facturaCabeza.model");
const FacturaItem = require("../models/facturaItem.model");
const Articulo = require("../models/articulo.model");
const Cliente = require("../models/cliente.model");
const sequelize = require("../config/database");
const { Op } = require("sequelize");
const fetch = require("node-fetch");
const numerosControlController = require("./numerosControl.controller");
const FacturaService = require("../services/factura.service");

// Obtener listado de facturas (con paginación y filtros)
exports.listarFacturas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const tipo = req.query.tipo || null;
    const clienteCodigo = req.query.cliente || null;
    const fechaDesde = req.query.fechaDesde || null;
    const fechaHasta = req.query.fechaHasta || null;

    // Construir condiciones de filtrado
    const whereClause = {};
    if (tipo) whereClause.DocumentoTipo = tipo;
    if (clienteCodigo) whereClause.ClienteCodigo = clienteCodigo;

    if (fechaDesde && fechaHasta) {
      whereClause.Fecha = {
        [Op.between]: [fechaDesde, fechaHasta],
      };
    } else if (fechaDesde) {
      whereClause.Fecha = {
        [Op.gte]: fechaDesde,
      };
    } else if (fechaHasta) {
      whereClause.Fecha = {
        [Op.lte]: fechaHasta,
      };
    }

    // Consulta con join a cliente
    const facturas = await FacturaCabeza.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Cliente,
          attributes: ["Codigo", "Descripcion"],
        },
      ],
      order: [
        ["DocumentoSucursal", "DESC"],
        ["DocumentoTipo", "DESC"],
        ["DocumentoNumero", "DESC"],
      ],
      limit,
      offset,
    });

    res.json({
      items: facturas.rows,
      meta: {
        totalItems: facturas.count,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: Math.ceil(facturas.count / limit),
      },
    });
  } catch (error) {
    console.error("Error al listar facturas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener facturas",
      error: error.message,
    });
  }
};

// Obtener detalle de una factura
exports.obtenerFactura = async (req, res) => {
  try {
    const { tipo, sucursal, numero } = req.params;

    // Obtener encabezado
    const factura = await FacturaCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      include: [
        {
          model: Cliente,
          attributes: ["Codigo", "Descripcion", "CategoriaIva"],
        },
      ],
    });

    if (!factura) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      });
    }

    // Obtener items sin usar la asociación
    const items = await FacturaItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      raw: true,
    });

    // Obtener los códigos de artículos para buscarlos
    const codigosArticulos = items.map((item) => item.CodigoArticulo);

    // Buscar los artículos correspondientes
    const articulos = await Articulo.findAll({
      where: {
        Codigo: codigosArticulos,
      },
      raw: true,
    });

    // Crear un mapa de artículos por código para facilitar la búsqueda
    const articulosPorCodigo = {};
    articulos.forEach((articulo) => {
      articulosPorCodigo[articulo.Codigo] = articulo;
    });

    // Combinar los items con la información de artículos
    const itemsConArticulos = items.map((item) => {
      const articulo = articulosPorCodigo[item.CodigoArticulo] || null;
      // console.log("articulo", articulo);
      return {
        ...item,
        PorcentajeIVA1: articulo.PorcentajeIVA1,
        PorcentajeIVA2: articulo.PorcentajeIVA2,
        Descripcion: articulo.Descripcion,
      };
    });
    // console.log("itemsConArticulos", itemsConArticulos.length);
    res.json({
      success: true,
      data: {
        encabezado: factura,
        items: itemsConArticulos,
        // articulos: articulos,
      },
    });
  } catch (error) {
    console.error("Error al obtener detalle de factura:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener detalle de factura",
      error: error.message,
    });
  }
};

// Crear nueva factura - Versión modularizada
exports.crearFactura = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const facturaData = req.body;
    // completo los campos necesarios con los nombres adecuados
    facturaData.DocumentoNumero =
      facturaData.DocumentoNumero.toString().padStart(8, "0");
    facturaData.PagoTipo = facturaData.FormaPagoCodigo;
    delete facturaData.FormaPagoCodigo;
    facturaData.VendedorCodigo = facturaData.Vendedor || "1";
    delete facturaData.Vendedor;
    facturaData.PorcentajeIva1 = "21";
    facturaData.PorcentajeIva2 = "10.5";
    facturaData.ListaNumero = facturaData.ListaPrecio;
    delete facturaData.ListaPrecio;
    facturaData.CodigoUsuario = "admin";

    if (facturaData.PagoTipo === "CC") {
      // actualizo saldo del cliente
      const cliente = await Cliente.findOne({
        where: { Codigo: facturaData.ClienteCodigo },
      });
      await Cliente.update(
        { ImporteDeuda: cliente.ImporteDeuda + facturaData.ImporteTotal },
        { where: { Codigo: facturaData.ClienteCodigo } }
      );
    } else {
      facturaData.ImportePagado = facturaData.ImporteTotal;
    }

    // Crear factura usando el servicio (pasando la transacción)
    const facturaCreada = await FacturaService.crearFactura(facturaData, t);

    // Actualizar número de control dentro de la transacción
    try {
      await numerosControlController.actualizarNumeroDirecto(
        facturaData.DocumentoTipo,
        facturaData.DocumentoSucursal,
        t
      );
    } catch (errorNumero) {
      // Si hay error en la actualización del número, hacemos rollback
      await t.rollback();
      return res.status(500).json({
        success: false,
        message: "Error al actualizar el número de control",
        error: errorNumero.message,
      });
    }

    // Si todo está bien, confirmamos la transacción
    await t.commit();

    //aca incluir Comunicacion con ARCA o AFIP
    res.status(201).json({
      success: true,
      message: "Factura creada correctamente",
      data: facturaCreada,
    });
  } catch (error) {
    // Aseguramos el rollback en caso de cualquier error
    await t.rollback();
    console.error("Error al crear factura:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear factura",
      error: error.message,
    });
  }
};

// Anular factura
exports.anularFactura = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { tipo, sucursal, numero } = req.params;

    // Verificar si la factura existe
    const factura = await FacturaCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      transaction: t,
    });

    if (!factura) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      });
    }

    // Verificar si ya está anulada
    if (factura.FechaAnulacion) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "La factura ya se encuentra anulada",
      });
    }

    // Obtener ítems de factura para restaurar stock
    const items = await FacturaItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      include: [{ model: Articulo }],
      transaction: t,
    });

    // Restaurar stock de artículos
    for (const item of items) {
      if (item.Articulo) {
        let nuevoStock;

        if (tipo === "FAC") {
          // Si es factura, devolvemos el stock
          nuevoStock =
            parseFloat(item.Articulo.Existencia) + parseFloat(item.Cantidad);
        } else if (tipo === "NCA") {
          // Si es nota de crédito, restamos el stock
          nuevoStock =
            parseFloat(item.Articulo.Existencia) - parseFloat(item.Cantidad);
        }

        await item.Articulo.update(
          { Existencia: nuevoStock },
          { transaction: t }
        );
      }
    }

    // Marcar como anulada
    await factura.update(
      {
        FechaAnulacion: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    res.json({
      success: true,
      message: "Factura anulada correctamente",
    });
  } catch (error) {
    await t.rollback();
    console.error("Error al anular factura:", error);
    res.status(500).json({
      success: false,
      message: "Error al anular factura",
      error: error.message,
    });
  }
};

// Obtener últimas facturas de un cliente
exports.obtenerUltimasFacturasCliente = async (req, res) => {
  const { codigoCliente } = req.params;
  const { limit = 5 } = req.query;

  try {
    // Obtener las facturas
    const facturas = await FacturaCabeza.findAll({
      where: {
        ClienteCodigo: codigoCliente,
        FechaAnulacion: null, // Opcional: solo facturas no anuladas
      },
      include: [
        {
          model: Cliente,
          attributes: ["Codigo", "Descripcion"],
        },
      ],
      order: [["Fecha", "DESC"]],
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      items: facturas.map((factura) => ({
        tipo: factura.DocumentoTipo,
        sucursal: factura.DocumentoSucursal,
        numero: factura.DocumentoNumero,
        fecha: factura.Fecha,
        cliente: factura.Cliente?.Descripcion,
        total: factura.ImporteTotal,
        label: `${factura.DocumentoTipo}-${factura.DocumentoSucursal}-${
          factura.DocumentoNumero
        } (${new Date(factura.Fecha).toLocaleDateString()})`,
      })),
    });
  } catch (error) {
    console.error("Error al obtener últimas facturas del cliente:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener últimas facturas del cliente",
      error: error.message,
    });
  }
};
