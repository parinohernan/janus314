const { Op } = require("sequelize");
const sequelize = require("../config/database");

// Listar cajas con paginación y filtros
exports.listarCajas = async (req, res) => {
  try {
    const { CajaCabeza, Vendedor } = req.models;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const vendedorId = req.query.vendedor || null;
    const estado = req.query.estado || null;
    const fechaDesde = req.query.fechaDesde || null;
    const fechaHasta = req.query.fechaHasta || null;

    // Construir condiciones de filtrado
    const whereClause = {};
    if (vendedorId) whereClause.VendedorId = vendedorId;
    if (estado) whereClause.Estado = estado;

    if (fechaDesde && fechaHasta) {
      whereClause.Apertura = {
        [Op.between]: [fechaDesde, fechaHasta],
      };
    } else if (fechaDesde) {
      whereClause.Apertura = {
        [Op.gte]: fechaDesde,
      };
    } else if (fechaHasta) {
      whereClause.Apertura = {
        [Op.lte]: fechaHasta,
      };
    }

    const cajas = await CajaCabeza.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Vendedor,
          as: 'Vendedor',
          attributes: ['Codigo', 'Descripcion'],
        },
      ],
      order: [['Apertura', 'DESC']],
      limit,
      offset,
    });

    res.json({
      items: cajas.rows,
      meta: {
        totalItems: cajas.count,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: Math.ceil(cajas.count / limit),
      },
    });
  } catch (error) {
    console.error("Error al listar cajas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener cajas",
      error: error.message,
    });
  }
};

// Obtener detalle de una caja
exports.obtenerCaja = async (req, res) => {
  try {
    const { CajaCabeza, Vendedor } = req.models;
    const { codigo } = req.params;

    const caja = await CajaCabeza.findOne({
      where: { Codigo: codigo },
      include: [
        {
          model: Vendedor,
          as: 'Vendedor',
          attributes: ['Codigo', 'Descripcion'],
        },
      ],
    });

    if (!caja) {
      return res.status(404).json({
        success: false,
        message: "Caja no encontrada",
      });
    }

    res.json({
      success: true,
      data: caja,
    });
  } catch (error) {
    console.error("Error al obtener detalle de caja:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener detalle de caja",
      error: error.message,
    });
  }
};

// Abrir nueva caja
exports.abrirCaja = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { CajaCabeza } = req.models;
    const { vendedorId, saldoInicial, descripcion } = req.body;

    // Verificar si el vendedor ya tiene una caja abierta
    const cajaAbierta = await CajaCabeza.findOne({
      where: {
        VendedorId: vendedorId,
        Estado: 'abierta',
      },
      transaction: t,
    });

    if (cajaAbierta) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "El vendedor ya tiene una caja abierta",
      });
    }

    // Crear nueva caja
    const nuevaCaja = await CajaCabeza.create({
      VendedorId: vendedorId,
      SaldoInicial: saldoInicial,
      Descripcion: descripcion,
      Estado: 'abierta',
      Apertura: new Date(),
    }, { transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: "Caja abierta exitosamente",
      data: nuevaCaja,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error al abrir caja:", error);
    res.status(500).json({
      success: false,
      message: "Error al abrir caja",
      error: error.message,
    });
  }
};

// Registrar movimiento de caja
exports.registrarMovimiento = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { CajaCabeza, CajaMovimientos } = req.models;
    const {
      cajaCabezaId,
      tipo,
      importe,
      concepto,
      metodoPago,
      referencia,
      banco,
      valorFecha,
      documentoAsociado,
      tipoDocumento,
      usuarioId,
    } = req.body;

    // Verificar que la caja esté abierta
    const caja = await CajaCabeza.findOne({
      where: {
        Codigo: cajaCabezaId,
        Estado: 'abierta',
      },
      transaction: t,
    });

    if (!caja) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "La caja no está abierta",
      });
    }

    // Crear el movimiento
    const movimiento = await CajaMovimientos.create({
      CajaCabezaId: cajaCabezaId,
      Tipo: tipo,
      Importe: importe,
      Concepto: concepto,
      MetodoPago: metodoPago,
      Referencia: referencia,
      Banco: banco,
      ValorFecha: valorFecha,
      DocumentoAsociado: documentoAsociado,
      TipoDocumento: tipoDocumento,
      UsuarioId: usuarioId,
    }, { transaction: t });

    // Actualizar saldo teórico de la caja
    const nuevoSaldo = tipo === 'ingreso' 
      ? caja.SaldoTeorico + importe 
      : caja.SaldoTeorico - importe;

    await caja.update({
      SaldoTeorico: nuevoSaldo,
    }, { transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: "Movimiento registrado exitosamente",
      data: movimiento,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error al registrar movimiento:", error);
    res.status(500).json({
      success: false,
      message: "Error al registrar movimiento",
      error: error.message,
    });
  }
};

// Realizar arqueo de caja
exports.realizarArqueo = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { CajaCabeza, CajaArqueoDetalle } = req.models;
    const { codigo } = req.params;
    const { detalles } = req.body;

    // Verificar que la caja esté abierta
    const caja = await CajaCabeza.findOne({
      where: {
        Codigo: codigo,
        Estado: 'abierta',
      },
      transaction: t,
    });

    if (!caja) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "La caja no está abierta",
      });
    }

    // Cambiar estado a en_arqueo
    await caja.update({
      Estado: 'en_arqueo',
    }, { transaction: t });

    // Registrar detalles del arqueo
    const arqueoDetalles = await Promise.all(
      detalles.map(detalle => 
        CajaArqueoDetalle.create({
          CajaCabezaId: codigo,
          MetodoPago: detalle.metodoPago,
          MontoContado: detalle.montoContado,
          MontoSistema: detalle.montoSistema,
          Diferencia: detalle.montoContado - detalle.montoSistema,
          Observaciones: detalle.observaciones,
        }, { transaction: t })
      )
    );

    await t.commit();

    res.json({
      success: true,
      message: "Arqueo realizado exitosamente",
      data: {
        caja,
        arqueoDetalles,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Error al realizar arqueo:", error);
    res.status(500).json({
      success: false,
      message: "Error al realizar arqueo",
      error: error.message,
    });
  }
};

// Cerrar caja
exports.cerrarCaja = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { CajaCabeza } = req.models;
    const { codigo } = req.params;
    const { saldoCierre, observaciones } = req.body;

    // Verificar que la caja esté en arqueo
    const caja = await CajaCabeza.findOne({
      where: {
        Codigo: codigo,
        Estado: 'en_arqueo',
      },
      transaction: t,
    });

    if (!caja) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "La caja no está en arqueo",
      });
    }

    // Cerrar la caja
    await caja.update({
      Estado: 'cerrada',
      SaldoCierre: saldoCierre,
      Cierre: new Date(),
      Observaciones: observaciones,
    }, { transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: "Caja cerrada exitosamente",
      data: caja,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error al cerrar caja:", error);
    res.status(500).json({
      success: false,
      message: "Error al cerrar caja",
      error: error.message,
    });
  }
};

// Obtener movimientos de una caja
exports.obtenerMovimientos = async (req, res) => {
  try {
    const { CajaMovimientos, TipoDePago, Vendedor } = req.models;
    const { codigo } = req.params;

    const movimientos = await CajaMovimientos.findAll({
      where: { CajaCabezaId: codigo },
      include: [
        {
          model: TipoDePago,
          as: 'TipoPago',
          attributes: ['Codigo', 'Descripcion'],
        },
        {
          model: Vendedor,
          as: 'Usuario',
          attributes: ['Codigo', 'Descripcion'],
        },
      ],
      order: [['FechaHora', 'DESC']],
    });

    res.json({
      success: true,
      data: movimientos,
    });
  } catch (error) {
    console.error("Error al obtener movimientos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener movimientos",
      error: error.message,
    });
  }
};

// Obtener cajas abiertas por vendedor
exports.obtenerCajasVendedor = async (req, res) => {
  try {
    const { CajaCabeza } = req.models;
    const { vendedorId } = req.params;

    const cajas = await CajaCabeza.findAll({
      where: {
        VendedorId: vendedorId,
        Estado: {
          [Op.in]: ['abierta', 'en_arqueo'],
        },
      },
      order: [['Apertura', 'DESC']],
    });

    res.json({
      success: true,
      data: cajas,
    });
  } catch (error) {
    console.error("Error al obtener cajas del vendedor:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener cajas del vendedor",
      error: error.message,
    });
  }
}; 