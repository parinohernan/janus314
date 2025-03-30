const NotaCreditoCabeza = require("../models/notaCreditoCabeza.model");
const NotaCreditoItem = require("../models/notaCreditoItem.model");
const Articulo = require("../models/articulo.model");
const Cliente = require("../models/cliente.model");
const sequelize = require("../config/database");
const { Op } = require("sequelize");
const numerosControlController = require("./numerosControl.controller");
const NotaCreditoService = require("../services/notaCredito.service");

// Obtener listado de notas de crédito (con paginación y filtros)
exports.listarNotasCredito = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const tipo = req.query.tipo || null;
    const clienteCodigo = req.query.cliente || null;
    const fechaDesde = req.query.fechaDesde || null;
    const fechaHasta = req.query.fechaHasta || null;
    const sucursal = req.query.sucursal || null;

    // Construir condiciones de filtrado
    const whereClause = {
      DocumentoTipo: { [Op.ne]: "NTC" }, // Excluir documentos tipo NTC
    };

    if (tipo) whereClause.DocumentoTipo = tipo;
    if (clienteCodigo) whereClause.CodigoCliente = clienteCodigo;
    if (sucursal) whereClause.DocumentoSucursal = sucursal;

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
    console.log("whereClause", whereClause);

    // Consulta con join a cliente
    const notasCredito = await NotaCreditoCabeza.findAndCountAll({
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
      items: notasCredito.rows,
      meta: {
        totalItems: notasCredito.count,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: Math.ceil(notasCredito.count / limit),
      },
    });
  } catch (error) {
    console.error("Error al listar notas de crédito:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener notas de crédito",
      error: error.message,
    });
  }
};

// Obtener detalle de una nota de crédito
exports.obtenerNotaCredito = async (req, res) => {
  try {
    const { tipo, sucursal, numero } = req.params;

    // Obtener encabezado
    const notaCredito = await NotaCreditoCabeza.findOne({
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

    if (!notaCredito) {
      return res.status(404).json({
        success: false,
        message: "Nota de crédito no encontrada",
      });
    }

    // Obtener items manualmente
    const items = await NotaCreditoItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      include: [{ model: Articulo }],
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
      return {
        ...item,
        Articulo: articulo,
      };
    });

    res.json({
      success: true,
      data: {
        encabezado: notaCredito,
        items: itemsConArticulos,
      },
    });
  } catch (error) {
    console.error("Error al obtener detalle de nota de crédito:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener detalle de nota de crédito",
      error: error.message,
    });
  }
};

// Crear nueva nota de crédito
exports.crearNotaCredito = async (req, res) => {
  try {
    const notaCreditoData = req.body;

    // Completar datos necesarios
    notaCreditoData.DocumentoNumero = notaCreditoData.DocumentoNumero
      ? notaCreditoData.DocumentoNumero.toString().padStart(8, "0")
      : null;

    // Si tiene referencia a factura, formatear los datos
    if (notaCreditoData.FacturaReferencia) {
      notaCreditoData.factura_tipo = notaCreditoData.FacturaReferencia.tipo;
      notaCreditoData.factura_sucursal =
        notaCreditoData.FacturaReferencia.sucursal;
      notaCreditoData.factura_numero = notaCreditoData.FacturaReferencia.numero;
      delete notaCreditoData.FacturaReferencia;
    }

    // Crear nota de crédito usando el servicio
    const notaCreditoCreada = await NotaCreditoService.crearNotaCredito(
      notaCreditoData
    );

    res.status(201).json({
      success: true,
      message: "Nota de crédito creada correctamente",
      data: notaCreditoCreada,
    });
  } catch (error) {
    console.error("Error al crear nota de crédito:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear nota de crédito",
      error: error.message,
    });
  }
};

// Anular nota de crédito
exports.anularNotaCredito = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { tipo, sucursal, numero } = req.params;

    // Verificar si la nota de crédito existe
    const notaCredito = await NotaCreditoCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      transaction: t,
    });

    if (!notaCredito) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Nota de crédito no encontrada",
      });
    }

    // Verificar si ya está anulada
    if (notaCredito.FechaAnulacion) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "La nota de crédito ya se encuentra anulada",
      });
    }

    // Obtener ítems para restaurar stock si es necesario
    if (notaCredito.PorStock) {
      const items = await NotaCreditoItem.findAll({
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
          // Al anular nota de crédito, restamos el stock (ya que la NC había sumado)
          const nuevoStock =
            parseFloat(item.Articulo.Existencia) - parseFloat(item.Cantidad);
          await item.Articulo.update(
            { Existencia: nuevoStock },
            { transaction: t }
          );
        }
      }
    }

    // Marcar como anulada
    await notaCredito.update(
      {
        FechaAnulacion: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    res.json({
      success: true,
      message: "Nota de crédito anulada correctamente",
    });
  } catch (error) {
    await t.rollback();
    console.error("Error al anular nota de crédito:", error);
    res.status(500).json({
      success: false,
      message: "Error al anular nota de crédito",
      error: error.message,
    });
  }
};
