const PreventaCabeza = require("../models/preventaCabeza.model");
const PreventaItem = require("../models/preventaItem.model");
const Articulo = require("../models/articulo.model");
const Cliente = require("../models/cliente.model");
const Vendedor = require("../models/vendedor.model");
const sequelize = require("../config/database");
const { Op } = require("sequelize");
const numerosControlController = require("./numerosControl.controller");

// Obtener listado de preventas con paginación y filtros
exports.listarPreventas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const tipo = req.query.tipo || null;
    const clienteCodigo = req.query.cliente || null;
    const vendedorCodigo = req.query.vendedor || null;
    const fechaDesde = req.query.fechaDesde || null;
    const fechaHasta = req.query.fechaHasta || null;
    const pendientes = req.query.pendientes === "true";

    // Construir condiciones de filtrado
    const whereClause = {};
    if (tipo) whereClause.DocumentoTipo = tipo;
    if (clienteCodigo) whereClause.ClienteCodigo = clienteCodigo;
    if (vendedorCodigo) whereClause.VendedorCodigo = vendedorCodigo;

    // Filtro para preventas pendientes (no anuladas y no facturadas)
    if (pendientes) {
      whereClause.FechaAnulacion = null;
      whereClause.FacturaNumero = null;
    }

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

    // Consulta con join a cliente y vendedor
    const preventas = await PreventaCabeza.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Cliente,
          attributes: ["Codigo", "Descripcion", "Localidad", "Telefono"],
        },
        {
          model: Vendedor,
          attributes: ["Codigo", "Descripcion"],
        },
      ],
      order: [
        ["Fecha", "DESC"],
        ["DocumentoSucursal", "DESC"],
        ["DocumentoNumero", "DESC"],
      ],
      limit,
      offset,
    });

    // Calcular total de páginas
    const totalItems = preventas.count;
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      success: true,
      message: "Preventas obtenidas correctamente",
      data: preventas.rows,
      meta: {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error("Error al listar preventas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener preventas",
      error: error.message,
    });
  }
};

// Obtener detalle de una preventa
exports.obtenerPreventa = async (req, res) => {
  console.log("obtenerPreventa", req.params);
  try {
    const { tipo, sucursal, numero } = req.params;

    const preventa = await PreventaCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      include: [
        {
          model: Cliente,
          attributes: [
            "Codigo",
            "Descripcion",
            "Calle",
            "Numero",
            "Piso",
            "Departamento",
            "CodigoPostal",
            "Localidad",
            "Telefono",
            "CategoriaIva",
            "Cuit",
          ],
        },
        {
          model: Vendedor,
          attributes: ["Codigo", "Descripcion"],
        },
      ],
    });

    if (!preventa) {
      return res.status(404).json({
        success: false,
        message: "Preventa no encontrada",
      });
    }

    // Obtener ítems de la preventa
    const items = await PreventaItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      include: [
        {
          model: Articulo,
          attributes: ["Codigo", "Descripcion"],
        },
      ],
      attributes: [
        "DocumentoTipo",
        "DocumentoSucursal",
        "DocumentoNumero",
        "CodigoArticulo",
        "Cantidad",
        "PrecioUnitario",
        "PrecioLista",
        "PorcentajeBonificacion",
      ],
    });

    res.status(200).json({
      success: true,
      message: "Preventa obtenida correctamente",
      data: {
        preventa,
        items,
      },
    });
  } catch (error) {
    console.error("Error al obtener detalle de preventa:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener detalle de preventa",
      error: error.message,
    });
  }
};

// Crear nueva preventa
exports.crearPreventa = async (req, res) => {
  // Iniciar transacción
  console.log("crearPreventa", req.body);
  const t = await sequelize.transaction();

  try {
    const preventaData = req.body;
    const items = preventaData.Items || [];
    delete preventaData.Items;

    // Validar datos mínimos
    if (
      !preventaData.DocumentoTipo ||
      !preventaData.DocumentoSucursal ||
      !preventaData.ClienteCodigo
    ) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Faltan datos obligatorios (tipo, sucursal, cliente)",
      });
    }

    // Si no viene número, obtener el siguiente
    if (!preventaData.DocumentoNumero) {
      console.log("preventaData.DocumentoNumero", preventaData.DocumentoNumero);
      try {
        // Usar el método actualizarNumeroDirecto en lugar de obtenerProximoNumero
        const resultado =
          await numerosControlController.actualizarNumeroDirecto(
            preventaData.DocumentoTipo,
            preventaData.DocumentoSucursal
          );
        preventaData.DocumentoNumero = resultado.numeroUtilizado

          .toString()
          .padStart(8, "0");
        console.log(
          "preventaData.DocumentoNumero",
          preventaData.DocumentoNumero
        );
      } catch (error) {
        await t.rollback();
        return res.status(500).json({
          success: false,
          message: "Error al obtener número de preventa",
          error: error.message,
        });
      }
    }

    // Establecer fecha si no viene
    if (!preventaData.Fecha) {
      preventaData.Fecha = new Date();
    }
    console.log("preventaData", preventaData);
    // Crear preventa (cabecera)
    const preventaCreada = await PreventaCabeza.create(preventaData, {
      transaction: t,
    });

    // Si hay items, crearlos
    if (items.length > 0) {
      // Preparar los items con las claves de la preventa
      const itemsConClaves = items.map((item) => ({
        ...item,
        DocumentoTipo: preventaCreada.DocumentoTipo,
        DocumentoSucursal: preventaCreada.DocumentoSucursal,
        DocumentoNumero: preventaCreada.DocumentoNumero,
      }));

      await PreventaItem.bulkCreate(itemsConClaves, { transaction: t });
    }

    // Confirmar transacción
    await t.commit();

    // Devolver preventa creada
    const preventaCompleta = await PreventaCabeza.findOne({
      where: {
        DocumentoTipo: preventaCreada.DocumentoTipo,
        DocumentoSucursal: preventaCreada.DocumentoSucursal,
        DocumentoNumero: preventaCreada.DocumentoNumero,
      },
      include: [
        {
          model: Cliente,
          attributes: ["Codigo", "Descripcion"],
        },
        {
          model: Vendedor,
          attributes: ["Codigo", "Descripcion"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Preventa creada correctamente",
      data: preventaCompleta,
    });
  } catch (error) {
    // Aseguramos el rollback en caso de cualquier error
    await t.rollback();
    console.error("Error al crear preventa:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear preventa",
      error: error.message,
    });
  }
};

// Anular preventa
exports.anularPreventa = async (req, res) => {
  try {
    const { tipo, sucursal, numero } = req.params;

    const preventa = await PreventaCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
    });

    if (!preventa) {
      return res.status(404).json({
        success: false,
        message: "Preventa no encontrada",
      });
    }

    if (preventa.FacturaNumero) {
      return res.status(400).json({
        success: false,
        message: "No se puede anular una preventa que ya ha sido facturada",
      });
    }

    if (preventa.FechaAnulacion) {
      return res.status(400).json({
        success: false,
        message: "La preventa ya está anulada",
      });
    }

    // Anular preventa (establecer fecha de anulación)
    preventa.FechaAnulacion = new Date();
    await preventa.save();

    res.status(200).json({
      success: true,
      message: "Preventa anulada correctamente",
      data: preventa,
    });
  } catch (error) {
    console.error("Error al anular preventa:", error);
    res.status(500).json({
      success: false,
      message: "Error al anular preventa",
      error: error.message,
    });
  }
};

// Facturar preventa
exports.facturarPreventa = async (req, res) => {
  try {
    const { tipo, sucursal, numero } = req.params;
    const { facturaTipo, facturaSucursal, facturaNumero } = req.body;

    if (!facturaTipo || !facturaSucursal || !facturaNumero) {
      return res.status(400).json({
        success: false,
        message: "Datos de factura incompletos",
      });
    }

    const preventa = await PreventaCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
    });

    if (!preventa) {
      return res.status(404).json({
        success: false,
        message: "Preventa no encontrada",
      });
    }

    if (preventa.FacturaNumero) {
      return res.status(400).json({
        success: false,
        message: "La preventa ya ha sido facturada",
      });
    }

    if (preventa.FechaAnulacion) {
      return res.status(400).json({
        success: false,
        message: "No se puede facturar una preventa anulada",
      });
    }

    // Actualizar datos de facturación
    preventa.FacturaTipo = facturaTipo;
    preventa.FacturaSucursal = facturaSucursal;
    preventa.FacturaNumero = facturaNumero;
    preventa.FechaHoraEnvio = new Date();
    await preventa.save();

    res.status(200).json({
      success: true,
      message: "Preventa facturada correctamente",
      data: preventa,
    });
  } catch (error) {
    console.error("Error al facturar preventa:", error);
    res.status(500).json({
      success: false,
      message: "Error al facturar preventa",
      error: error.message,
    });
  }
};
