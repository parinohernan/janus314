const sequelize = require("../config/database");
const { Op } = require("sequelize");

// Obtener listado de pedidos con paginación y filtros
exports.listarPedidos = async (req, res) => {
  try {
    const { PedidoCabeza, Cliente, UnidadMovil } = req.models;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const tipo = req.query.tipo || null;
    const clienteCodigo = req.query.cliente || null;
    const fechaDesde = req.query.fechaDesde || null;
    const fechaHasta = req.query.fechaHasta || null;
    const pendientes = req.query.pendientes === "true";

    // Construir condiciones de filtrado
    const whereClause = {};
    if (tipo) whereClause.DocumentoTipo = tipo;
    if (clienteCodigo) whereClause.CodigoCliente = clienteCodigo;

    // Filtro para pedidos pendientes (no anulados y no entregados)
    if (pendientes) {
      whereClause.FechaAnulacion = null;
      whereClause.FechaEnviado = null;
    }

    if (fechaDesde && fechaHasta) {
      whereClause.FechaEmicion = {
        [Op.between]: [fechaDesde, fechaHasta],
      };
    } else if (fechaDesde) {
      whereClause.FechaEmicion = {
        [Op.gte]: fechaDesde,
      };
    } else if (fechaHasta) {
      whereClause.FechaEmicion = {
        [Op.lte]: fechaHasta,
      };
    }

    // Consulta con join a cliente y unidad móvil
    const pedidos = await PedidoCabeza.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Cliente,
          attributes: ["Codigo", "Descripcion"],
        },
        {
          model: UnidadMovil,
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
      distinct: true,
    });

    // Calcular páginas
    const totalItems = pedidos.count;
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      success: true,
      data: pedidos.rows,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error al listar pedidos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener listado de pedidos",
      error: error.message,
    });
  }
};

// Obtener detalle de un pedido
exports.obtenerPedido = async (req, res) => {
  try {
    const { PedidoCabeza, Cliente, UnidadMovil, PedidoItem, Articulo } = req.models;
    const { tipo, sucursal, numero } = req.params;

    // Buscar cabecera del pedido
    const pedido = await PedidoCabeza.findOne({
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
            "Localidad",
            "Telefono",
          ],
        },
        {
          model: UnidadMovil,
          attributes: ["Codigo", "Descripcion"],
        },
      ],
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    // Buscar items del pedido
    const items = await PedidoItem.findAll({
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
            "Precio1",
            "Precio2",
            "Precio3",
          ],
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        pedido,
        items,
      },
    });
  } catch (error) {
    console.error("Error al obtener pedido:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener detalle del pedido",
      error: error.message,
    });
  }
};

// Crear nuevo pedido
exports.crearPedido = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { PedidoCabeza, PedidoItem } = req.models;
    const pedidoData = req.body;

    // Validar datos mínimos
    if (
      !pedidoData.DocumentoTipo ||
      !pedidoData.DocumentoSucursal ||
      !pedidoData.CodigoCliente
    ) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Faltan datos obligatorios para crear el pedido",
      });
    }

    // Crear pedido (cabecera)
    const pedidoCreado = await PedidoCabeza.create(pedidoData, {
      transaction: t,
    });

    // Si hay items, crearlos
    if (pedidoData.Items && pedidoData.Items.length > 0) {
      const itemsParaCrear = pedidoData.Items.map((item) => ({
        DocumentoTipo: pedidoData.DocumentoTipo,
        DocumentoSucursal: pedidoData.DocumentoSucursal,
        DocumentoNumero: pedidoData.DocumentoNumero,
        CodigoArticulo: item.CodigoArticulo,
        Cantidad: item.Cantidad,
      }));

      await PedidoItem.bulkCreate(itemsParaCrear, { transaction: t });
    }

    // Confirmar transacción
    await t.commit();

    res.status(201).json({
      success: true,
      message: "Pedido creado correctamente",
      data: pedidoCreado,
    });
  } catch (error) {
    // Rollback en caso de error
    await t.rollback();
    console.error("Error al crear pedido:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear pedido",
      error: error.message,
    });
  }
};

// Actualizar estado de pedido
exports.actualizarEstado = async (req, res) => {
  try {
    const { PedidoCabeza, Cliente, UnidadMovil } = req.models;
    const { tipo, sucursal, numero } = req.params;
    const { estado, fecha } = req.body;

    const pedido = await PedidoCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    // Actualizar según el estado requerido
    let updateData = {};

    switch (estado) {
      case "enviado":
        updateData.FechaEnviado = fecha || new Date();
        break;
      case "anulado":
        updateData.FechaAnulacion = fecha || new Date();
        break;
      case "programado":
        updateData.FechaEntrega = fecha || new Date();
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Estado no válido",
        });
    }

    await pedido.update(updateData);

    res.status(200).json({
      success: true,
      message: `Pedido ${estado} correctamente`,
      data: pedido,
    });
  } catch (error) {
    console.error(`Error al actualizar estado del pedido:`, error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar estado del pedido",
      error: error.message,
    });
  }
};
