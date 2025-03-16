const FacturaCabeza = require("../models/facturaCabeza.model");
const FacturaItem = require("../models/facturaItem.model");
const Articulo = require("../models/articulo.model");
const Cliente = require("../models/cliente.model");
const sequelize = require("../config/database");
const { Op } = require("sequelize");
const fetch = require("node-fetch");

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
      order: [["Fecha", "DESC"]],
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
          attributes: ["Codigo", "RazonSocial", "Domicilio", "CategoriaIva"],
        },
      ],
    });

    if (!factura) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      });
    }

    // Obtener items con información del artículo
    const items = await FacturaItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      include: [
        {
          model: Articulo,
          attributes: [
            "Codigo",
            "Descripcion",
            "PrecioVenta",
            "Existencia",
            "CategoriaIva",
          ],
        },
      ],
    });

    res.json({
      success: true,
      data: {
        encabezado: factura,
        items: items,
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

// Crear nueva factura
exports.crearFactura = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { encabezado, items } = req.body;

    // Validaciones básicas
    if (!encabezado || !items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Debe proporcionar encabezado y al menos un ítem para la factura",
      });
    }

    // Si no se proporcionó un número de documento, obtener uno nuevo
    if (
      !encabezado.DocumentoNumero ||
      encabezado.DocumentoNumero.trim() === ""
    ) {
      try {
        // Obtener el próximo número para el tipo de documento
        const response = await fetch(
          `${req.protocol}://${req.get("host")}/api/numeros-control/${
            encabezado.DocumentoTipo
          }/${encabezado.DocumentoSucursal}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) {
          throw new Error("Error al obtener número de factura");
        }

        const numeroData = await response.json();
        encabezado.DocumentoNumero = numeroData.data.numeroFormateado;
      } catch (error) {
        console.error("Error obteniendo número de factura:", error);
        throw new Error("No se pudo obtener el número de factura");
      }
    }

    // Calcular totales
    let importeBruto = 0;
    let importeNeto = 0;
    let importeIva1 = 0;
    let importeIva2 = 0;
    let baseImponible1 = 0;
    let baseImponible2 = 0;

    // Procesar artículos y calcular totales
    for (const item of items) {
      const articulo = await Articulo.findByPk(item.CodigoArticulo, {
        transaction: t,
      });
      if (!articulo) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: `Artículo con código ${item.CodigoArticulo} no encontrado`,
        });
      }

      // Calcular importes del ítem
      const precioUnitario = parseFloat(
        item.PrecioUnitario || articulo.PrecioVenta
      );
      const cantidad = parseFloat(item.Cantidad);
      const importeItem = precioUnitario * cantidad;

      // Acumular al total bruto
      importeBruto += importeItem;

      // Calcular IVA según categoría del artículo
      if (articulo.CategoriaIva === "1") {
        // 21%
        baseImponible1 += importeItem;
        importeIva1 += importeItem * 0.21;
      } else if (articulo.CategoriaIva === "2") {
        // 10.5%
        baseImponible2 += importeItem;
        importeIva2 += importeItem * 0.105;
      }

      // Actualizar stock si es necesario
      if (encabezado.DocumentoTipo === "FAC") {
        const nuevoStock = parseFloat(articulo.Existencia) - cantidad;
        await articulo.update({ Existencia: nuevoStock }, { transaction: t });
      } else if (encabezado.DocumentoTipo === "NCA") {
        const nuevoStock = parseFloat(articulo.Existencia) + cantidad;
        await articulo.update({ Existencia: nuevoStock }, { transaction: t });
      }
    }

    // Calcular totales finales
    importeNeto = importeBruto;

    if (encabezado.PorcentajeBonificacion > 0) {
      const importeBonificado =
        importeBruto * (encabezado.PorcentajeBonificacion / 100);
      importeNeto = importeBruto - importeBonificado;
      encabezado.ImporteBonificado = importeBonificado;
    }

    const importeTotal =
      importeNeto +
      importeIva1 +
      importeIva2 +
      (encabezado.ImportePercepcionIIBB || 0) +
      (encabezado.ImporteAdicional || 0);

    // Completar datos del encabezado
    encabezado.ImporteBruto = importeBruto;
    encabezado.ImporteNeto = importeNeto;
    encabezado.ImporteIva1 = importeIva1;
    encabezado.ImporteIva2 = importeIva2;
    encabezado.BaseImponible1 = baseImponible1;
    encabezado.BaseImponible2 = baseImponible2;
    encabezado.ImporteTotal = importeTotal;
    encabezado.PorcentajeIva1 = 21;
    encabezado.PorcentajeIva2 = 10.5;

    if (!encabezado.Fecha) {
      encabezado.Fecha = new Date();
    }

    // Crear encabezado de factura
    const facturaCabeza = await FacturaCabeza.create(encabezado, {
      transaction: t,
    });

    // Crear items de factura
    for (const item of items) {
      await FacturaItem.create(
        {
          DocumentoTipo: encabezado.DocumentoTipo,
          DocumentoSucursal: encabezado.DocumentoSucursal,
          DocumentoNumero: encabezado.DocumentoNumero,
          CodigoArticulo: item.CodigoArticulo,
          Cantidad: item.Cantidad,
          ImporteCosto: item.ImporteCosto || 0,
          PrecioLista: item.PrecioLista || item.PrecioUnitario || 0,
          PorcentajeBonificado: item.PorcentajeBonificado || 0,
          ImporteBonificado: item.ImporteBonificado || 0,
          PrecioUnitario: item.PrecioUnitario || 0,
        },
        { transaction: t }
      );
    }

    await t.commit();

    res.status(201).json({
      success: true,
      message: "Factura creada correctamente",
      documento: {
        tipo: encabezado.DocumentoTipo,
        sucursal: encabezado.DocumentoSucursal,
        numero: encabezado.DocumentoNumero,
        total: importeTotal,
      },
    });
  } catch (error) {
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
