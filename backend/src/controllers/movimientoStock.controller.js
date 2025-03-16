const MovimientoStock = require("../models/movimientoStock");
const Articulo = require("../models/articulo.model");
const sequelize = require("../config/database");
const { QueryTypes } = require("sequelize");
const fetch = require("node-fetch");

// Obtener todos los encabezados de movimientos (agrupados)
exports.getMovimientos = async (req, res) => {
  try {
    // Query para obtener encabezados agrupados por documento
    const movimientos = await sequelize.query(
      `
      SELECT 
        DocumentoTipo, 
        DocumentoSucursal, 
        DocumentoNumero, 
        Fecha, 
        MovimientoTipo, 
        COUNT(CodigoArticulo) as Items,
        SUM(CASE WHEN MovimientoTipo = 'ING' THEN Cantidad ELSE -Cantidad END) as TotalItems,
        MAX(Observacion) as Observacion
      FROM movimientosstock
      GROUP BY DocumentoTipo, DocumentoSucursal, DocumentoNumero
      ORDER BY Fecha DESC, DocumentoTipo, DocumentoSucursal, DocumentoNumero
      LIMIT :limit OFFSET :offset
    `,
      {
        replacements: {
          limit: parseInt(req.query.limit || 10),
          offset: parseInt(req.query.offset || 0),
        },
        type: QueryTypes.SELECT,
      }
    );

    // Contar total de registros
    const totalCount = await sequelize.query(
      `
      SELECT COUNT(DISTINCT CONCAT(DocumentoTipo, DocumentoSucursal, DocumentoNumero)) as count 
      FROM movimientosstock
    `,
      {
        type: QueryTypes.SELECT,
      }
    );

    res.json({
      items: movimientos,
      meta: {
        totalItems: totalCount[0].count,
        itemsPerPage: parseInt(req.query.limit || 10),
        currentPage: parseInt(req.query.page || 1),
        totalPages: Math.ceil(
          totalCount[0].count / parseInt(req.query.limit || 10)
        ),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener movimientos de stock" });
  }
};

// Obtener detalle de un movimiento específico
exports.getMovimientoDetalle = async (req, res) => {
  try {
    const { tipo, sucursal, numero } = req.params;

    // Obtener encabezado (datos del primer registro)
    const encabezado = await MovimientoStock.findOne({
      attributes: [
        "DocumentoTipo",
        "DocumentoSucursal",
        "DocumentoNumero",
        "Fecha",
        "MovimientoTipo",
        "Observacion",
      ],
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
    });

    if (!encabezado) {
      return res.status(404).json({ message: "Movimiento no encontrado" });
    }

    // Obtener todos los items del movimiento con detalles del artículo
    const items = await MovimientoStock.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      include: [
        {
          model: Articulo,
          attributes: ["Descripcion", "PrecioCosto"],
        },
      ],
    });

    // Formatear los datos para respuesta
    res.json({
      encabezado: {
        DocumentoTipo: encabezado.DocumentoTipo,
        DocumentoSucursal: encabezado.DocumentoSucursal,
        DocumentoNumero: encabezado.DocumentoNumero,
        Fecha: encabezado.Fecha,
        MovimientoTipo: encabezado.MovimientoTipo,
        Observacion: encabezado.Observacion,
      },
      items: items.map((item) => ({
        CodigoArticulo: item.CodigoArticulo,
        Descripcion: item.Articulo?.Descripcion || "Artículo no encontrado",
        Cantidad: item.Cantidad,
        PrecioCosto: item.Articulo?.PrecioCosto || 0,
      })),
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al obtener detalle del movimiento" });
  }
};

// Crear un nuevo movimiento con sus items
exports.crearMovimiento = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { encabezado, items } = req.body;

    // Si no se proporcionó un número de documento, obtener uno nuevo
    if (
      !encabezado.DocumentoNumero ||
      encabezado.DocumentoNumero.trim() === ""
    ) {
      try {
        // Llamar internamente a nuestro propio servicio para obtener el número
        const response = await fetch(
          `${req.protocol}://${req.get("host")}/api/numeros-control/STK/${
            encabezado.DocumentoSucursal
          }`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Error al obtener número de comprobante");
        }

        const numeroData = await response.json();
        encabezado.DocumentoNumero = numeroData.data.numeroFormateado;
        encabezado.DocumentoTipo = "STK"; // Asegurar que sea STK para movimientos de stock
      } catch (error) {
        console.error("Error obteniendo número de comprobante:", error);
        throw new Error("No se pudo obtener el número de comprobante");
      }
    }

    // Validar datos del encabezado
    if (
      !encabezado.DocumentoTipo ||
      !encabezado.DocumentoSucursal ||
      !encabezado.DocumentoNumero ||
      !encabezado.Fecha ||
      !encabezado.MovimientoTipo
    ) {
      return res
        .status(400)
        .json({ message: "Datos de encabezado incompletos" });
    }

    // Validar que existan items
    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ message: "El movimiento debe tener al menos un item" });
    }

    // Verificar si ya existe un movimiento con esa clave primaria
    const movimientoExistente = await MovimientoStock.findOne({
      where: {
        DocumentoTipo: encabezado.DocumentoTipo,
        DocumentoSucursal: encabezado.DocumentoSucursal,
        DocumentoNumero: encabezado.DocumentoNumero,
      },
    });

    if (movimientoExistente) {
      return res.status(400).json({
        message: "Ya existe un movimiento con ese número de documento",
      });
    }

    // Crear los registros para cada item
    const movimientosData = items.map((item) => ({
      DocumentoTipo: encabezado.DocumentoTipo,
      DocumentoSucursal: encabezado.DocumentoSucursal,
      DocumentoNumero: encabezado.DocumentoNumero,
      Fecha: encabezado.Fecha,
      CodigoArticulo: item.CodigoArticulo,
      Cantidad: item.Cantidad,
      MovimientoTipo: encabezado.MovimientoTipo,
      Observacion: encabezado.Observacion || null,
    }));

    // Guardar todos los registros
    await MovimientoStock.bulkCreate(movimientosData, { transaction: t });

    // Actualizar stock de artículos (en una implementación real, esto podría hacerse con triggers)
    for (const item of items) {
      const articulo = await Articulo.findByPk(item.CodigoArticulo, {
        transaction: t,
      });
      if (articulo) {
        const cantidadActualizada =
          encabezado.MovimientoTipo === "ING"
            ? parseFloat(articulo.Existencia) + parseFloat(item.Cantidad)
            : parseFloat(articulo.Existencia) - parseFloat(item.Cantidad);

        await articulo.update(
          { Existencia: cantidadActualizada },
          { transaction: t }
        );
      }
    }

    await t.commit();
    res.status(201).json({
      message: "Movimiento creado correctamente",
      documento: {
        tipo: encabezado.DocumentoTipo,
        sucursal: encabezado.DocumentoSucursal,
        numero: encabezado.DocumentoNumero,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: "Error al crear el movimiento de stock" });
  }
};

// Eliminar un movimiento completo
exports.eliminarMovimiento = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { tipo, sucursal, numero } = req.params;

    // Obtener todos los items del movimiento para actualizar stock
    const items = await MovimientoStock.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      transaction: t,
    });

    if (items.length === 0) {
      await t.rollback();
      return res.status(404).json({ message: "Movimiento no encontrado" });
    }

    // Revertir el stock (contrario a lo que se hizo en crearMovimiento)
    for (const item of items) {
      const articulo = await Articulo.findByPk(item.CodigoArticulo, {
        transaction: t,
      });
      if (articulo) {
        const cantidadActualizada =
          item.MovimientoTipo === "ING"
            ? parseFloat(articulo.Existencia) - parseFloat(item.Cantidad)
            : parseFloat(articulo.Existencia) + parseFloat(item.Cantidad);

        await articulo.update(
          { Existencia: cantidadActualizada },
          { transaction: t }
        );
      }
    }

    // Eliminar todos los registros del movimiento
    await MovimientoStock.destroy({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      transaction: t,
    });

    await t.commit();
    res.json({ message: "Movimiento eliminado correctamente" });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al eliminar el movimiento de stock" });
  }
};
