const { Op } = require("sequelize");

// Listar cajas con paginación y filtros
exports.listarCajas = async (req, res) => {
  try {
    const { CajaCabeza, Vendedor } = req.models;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const vendedorId = req.query.vendedor || null;
    const estado = req.query.estado || null;
    const fechaDesde = req.query.fechaDesde ? new Date(req.query.fechaDesde + 'T00:00:00') : null;
    const fechaHasta = req.query.fechaHasta ? new Date(req.query.fechaHasta + 'T23:59:59') : null;

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

    // Obtener el total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM caja_cabeza_new c
      WHERE ${Object.keys(whereClause).map(key => {
        if (key === 'Apertura') {
          if (fechaDesde && fechaHasta) {
            return `c.Apertura BETWEEN '${fechaDesde.toISOString()}' AND '${fechaHasta.toISOString()}'`;
          } else if (fechaDesde) {
            return `c.Apertura >= '${fechaDesde.toISOString()}'`;
          } else {
            return `c.Apertura <= '${fechaHasta.toISOString()}'`;
          }
        }
        return `c.${key} = '${whereClause[key]}'`;
      }).join(' AND ') || '1=1'}
    `;

    const [[{ total }]] = await req.db.query(countQuery);

    console.log('Total registros:', total);
    console.log('Página actual:', page);
    console.log('Límite por página:', limit);
    console.log('Total páginas:', Math.ceil(total / limit));

    // Obtener las cajas con una consulta SQL directa
    const query = `
      SELECT 
        c.*,
        v.Codigo as VendedorCodigo,
        v.Descripcion as VendedorDescripcion
      FROM caja_cabeza_new c
      LEFT JOIN t_vendedores v ON c.VendedorId = v.Codigo
      WHERE ${Object.keys(whereClause).map(key => {
        if (key === 'Apertura') {
          if (fechaDesde && fechaHasta) {
            return `c.Apertura BETWEEN '${fechaDesde.toISOString()}' AND '${fechaHasta.toISOString()}'`;
          } else if (fechaDesde) {
            return `c.Apertura >= '${fechaDesde.toISOString()}'`;
          } else {
            return `c.Apertura <= '${fechaHasta.toISOString()}'`;
          }
        }
        return `c.${key} = '${whereClause[key]}'`;
      }).join(' AND ') || '1=1'}
      ORDER BY c.Apertura DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [cajas] = await req.db.query(query);

    // Formatear los resultados
    const cajasFormateadas = cajas.map(caja => ({
      ...caja,
      Vendedor: {
        Codigo: caja.VendedorCodigo,
        Descripcion: caja.VendedorDescripcion
      }
    }));

    // Deshabilitar el caché para esta respuesta
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json({
      success: true,
      items: cajasFormateadas,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
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
          as: 'CajaVendedor',
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

// Crear nueva caja
exports.crearCaja = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const { CajaCabeza, Vendedor } = req.models;
    const { vendedorId, saldoInicial, descripcion } = req.body;

    // Asegurarnos de que el vendedorId sea '1' si viene como '001'
    const normalizedVendedorId = vendedorId.replace(/^0+/, '') || '1';

    // Verificar si el vendedor existe
    const vendedor = await Vendedor.findByPk(normalizedVendedorId);
    if (!vendedor) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `El vendedor ${normalizedVendedorId} no existe`,
      });
    }

    // Verificar si el vendedor ya tiene una caja abierta
    const cajaAbierta = await CajaCabeza.findOne({
      where: {
        VendedorId: normalizedVendedorId,
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
      VendedorId: normalizedVendedorId,
      SaldoInicial: saldoInicial || 0,
      Descripcion: descripcion || 'Apertura de caja',
      Estado: 'abierta',
      Apertura: new Date(),
      SaldoTeorico: saldoInicial || 0
    }, { transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: "Caja creada exitosamente",
      data: nuevaCaja,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error al crear caja:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear caja",
      error: error.message,
    });
  }
};

// Registrar movimiento de caja
exports.registrarMovimiento = async (req, res) => {
  const t = await req.db.transaction();
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
    
    if (!cajaCabezaId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "El ID de la caja es requerido"
      });
    }

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
      FechaHora: new Date(),
      UsuarioId: usuarioId,
    }, { transaction: t });

    // Actualizar saldo teórico de la caja
    const nuevoSaldo = tipo === 'ingreso' 
      ? parseFloat(caja.SaldoTeorico || 0) + parseFloat(importe) 
      : parseFloat(caja.SaldoTeorico || 0) - parseFloat(importe);

    await caja.update({
      SaldoTeorico: nuevoSaldo,
    }, { transaction: t });

    await t.commit();

    // Devolver el movimiento y el nuevo saldo
    res.json({
      success: true,
      message: "Movimiento registrado exitosamente",
      data: {
        movimiento,
        nuevoSaldo
      }
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
  const t = await req.db.transaction();
  try {
    const { CajaCabeza, CajaArqueoDetalle } = req.models;
    const { codigo } = req.params;
    const { formasPago, totalDeclarado, diferencia, observaciones, usuarioId, cerrarCaja } = req.body;

    // Verificar que la caja exista y esté abierta
    const caja = await CajaCabeza.findOne({
      where: {
        Codigo: codigo,
        Estado: 'abierta'
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

    // Registrar detalle del arqueo para cada forma de pago
    const detallesArqueo = await Promise.all(formasPago.map(async formaPago => {
      return await CajaArqueoDetalle.create({
        CajaCabezaId: codigo,
        MetodoPago: formaPago.formaPago,
        MontoContado: formaPago.totalDeclarado,
        MontoSistema: formaPago.totalSistema,
        Diferencia: formaPago.diferencia,
        Observaciones: observaciones,
        UsuarioId: usuarioId,
        FechaHora: new Date()
      }, { transaction: t });
    }));

    // Si se solicita cerrar la caja, actualizamos su estado
    if (cerrarCaja) {
      await caja.update({
        Estado: 'cerrada',
        SaldoCierre: totalDeclarado,
        Cierre: new Date(),
        Observaciones: observaciones,
      }, { transaction: t });
    } else {
      // Si no se cierra, solo actualizamos las observaciones
      await caja.update({
        Estado: 'abierta',
        Observaciones: observaciones
      }, { transaction: t });
    }

    await t.commit();

    res.json({
      success: true,
      message: cerrarCaja ? "Arqueo realizado y caja cerrada exitosamente" : "Arqueo realizado exitosamente",
      data: {
        caja,
        detallesArqueo,
        totalDeclarado,
        diferencia
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
  const t = await req.db.transaction();
  try {
    const { CajaCabeza } = req.models;
    const { codigo } = req.params;
    const { saldoCierre, observaciones } = req.body;

    // Verificar que la caja esté en arqueo
    const caja = await CajaCabeza.findOne({
      where: {
        Codigo: codigo,
        Estado: 'en_arqueo'
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

    // Asegurarnos de que el vendedorId sea '1' si viene como '001'
    const normalizedVendedorId = vendedorId.replace(/^0+/, '') || '1';

    const cajas = await CajaCabeza.findAll({
      where: {
        VendedorId: normalizedVendedorId,
        Estado: 'abierta'
      },
      order: [['Apertura', 'DESC']],
    });

    // Asegurarnos de que SaldoTeorico sea siempre un número
    const cajasNormalizadas = cajas.map(caja => ({
      ...caja.toJSON(),
      SaldoTeorico: parseFloat(caja.SaldoTeorico || 0).toFixed(2),
      SaldoInicial: parseFloat(caja.SaldoInicial || 0).toFixed(2),
      SaldoCierre: caja.SaldoCierre ? parseFloat(caja.SaldoCierre).toFixed(2) : null
    }));

    res.json({
      success: true,
      data: cajasNormalizadas,
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

// Obtener resumen de arqueo por forma de pago
exports.obtenerResumenArqueo = async (req, res) => {
  try {
    const { CajaCabeza, CajaMovimientos, TipoDePago } = req.models;
    const { codigo } = req.params;

    // Verificar que la caja exista y esté abierta
    const caja = await CajaCabeza.findOne({
      where: {
        Codigo: codigo,
        Estado: 'abierta'
      }
    });

    if (!caja) {
      return res.status(400).json({
        success: false,
        message: "La caja no está abierta"
      });
    }

    // Obtener todas las formas de pago que no aplican saldo
    const formasPago = await TipoDePago.findAll({
      where: {
        aplicaSaldo: false,
        Activo: true
      },
      attributes: ['Codigo', 'Descripcion']
    });

    // Obtener todos los movimientos de la caja
    const movimientos = await CajaMovimientos.findAll({
      where: { 
        CajaCabezaId: codigo
      },
      include: [{
        model: TipoDePago,
        as: 'TipoPago',
        attributes: ['Codigo', 'Descripcion', 'aplicaSaldo']
      }]
    });

    // Calcular totales por forma de pago
    const totalesPorFormaPago = formasPago.map(formaPago => {
      const movimientosFormaPago = movimientos.filter(m => 
        m.MetodoPago === formaPago.Codigo && 
        m.TipoPago && 
        !m.TipoPago.aplicaSaldo
      );

      const ingresos = movimientosFormaPago
        .filter(m => m.Tipo === 'ingreso')
        .reduce((sum, m) => sum + parseFloat(m.Importe || 0), 0);

      const egresos = movimientosFormaPago
        .filter(m => m.Tipo === 'egreso')
        .reduce((sum, m) => sum + parseFloat(m.Importe || 0), 0);

      // Si es tipo de pago "CO" (Contado), incluir el saldo inicial
      const saldoInicial = formaPago.Codigo === 'CO' ? parseFloat(caja.SaldoInicial || 0) : 0;
      const totalSistema = ingresos - egresos + saldoInicial;

      return {
        formaPago: formaPago.Codigo,
        descripcion: formaPago.Descripcion,
        totalSistema,
        saldoInicial: formaPago.Codigo === 'CO' ? saldoInicial : 0,
        totalDeclarado: 0, // Este valor se llenará en el frontend
        diferencia: 0 // Este valor se calculará en el frontend
      };
    });

    // Asegurarse de que exista el tipo de pago "CO"
    if (!totalesPorFormaPago.some(t => t.formaPago === 'CO')) {
      totalesPorFormaPago.unshift({
        formaPago: 'CO',
        descripcion: 'Contado',
        totalSistema: parseFloat(caja.SaldoInicial || 0),
        saldoInicial: parseFloat(caja.SaldoInicial || 0),
        totalDeclarado: 0,
        diferencia: 0
      });
    }

    // Calcular totales generales
    const totalSistema = totalesPorFormaPago.reduce((sum, t) => sum + t.totalSistema, 0);

    res.json({
      success: true,
      data: {
        cajaId: codigo,
        saldoInicial: parseFloat(caja.SaldoInicial || 0),
        saldoTeorico: parseFloat(caja.SaldoTeorico || 0),
        formasPago: totalesPorFormaPago,
        totalSistema
      }
    });

  } catch (error) {
    console.error("Error al obtener resumen de arqueo:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener resumen de arqueo",
      error: error.message
    });
  }
};

// Listar cajas cerradas con paginación y filtros
exports.listarCajasCerradas = async (req, res) => {
  try {
    const { CajaCabeza, Vendedor, CajaArqueoDetalle } = req.models;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const vendedorId = req.query.vendedor || null;
    const fechaDesde = req.query.fechaDesde || null;
    const fechaHasta = req.query.fechaHasta || null;

    // Construir condiciones de filtrado
    const whereClause = {
      Estado: 'cerrada'
    };
    if (vendedorId) whereClause.VendedorId = vendedorId;

    if (fechaDesde && fechaHasta) {
      whereClause.Cierre = {
        [Op.between]: [fechaDesde, fechaHasta],
      };
    } else if (fechaDesde) {
      whereClause.Cierre = {
        [Op.gte]: fechaDesde,
      };
    } else if (fechaHasta) {
      whereClause.Cierre = {
        [Op.lte]: fechaHasta,
      };
    }

    const cajas = await CajaCabeza.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Vendedor,
          as: 'CajaVendedor',
          attributes: ['Codigo', 'Descripcion'],
        },
        {
          model: CajaArqueoDetalle,
          as: 'Arqueos',
          required: false,
          attributes: ['MetodoPago', 'MontoContado', 'MontoSistema', 'Diferencia', 'FechaHora']
        }
      ],
      order: [['Cierre', 'DESC']],
      limit,
      offset,
    });

    // Normalizar los valores numéricos
    const cajasNormalizadas = cajas.rows.map(caja => ({
      ...caja.toJSON(),
      SaldoTeorico: parseFloat(caja.SaldoTeorico || 0).toFixed(2),
      SaldoInicial: parseFloat(caja.SaldoInicial || 0).toFixed(2),
      SaldoCierre: caja.SaldoCierre ? parseFloat(caja.SaldoCierre).toFixed(2) : null
    }));

    res.json({
      success: true,
      data: {
        items: cajasNormalizadas,
        meta: {
          totalItems: cajas.count,
          itemsPerPage: limit,
          currentPage: page,
          totalPages: Math.ceil(cajas.count / limit),
        }
      }
    });
  } catch (error) {
    console.error("Error al listar cajas cerradas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener cajas cerradas",
      error: error.message,
    });
  }
};

// Exportar todas las funciones
module.exports = {
  listarCajas: exports.listarCajas,
  obtenerCaja: exports.obtenerCaja,
  crearCaja: exports.crearCaja,
  registrarMovimiento: exports.registrarMovimiento,
  obtenerMovimientos: exports.obtenerMovimientos,
  obtenerCajasVendedor: exports.obtenerCajasVendedor,
  obtenerResumenArqueo: exports.obtenerResumenArqueo,
  realizarArqueo: exports.realizarArqueo,
  cerrarCaja: exports.cerrarCaja,
  listarCajasCerradas: exports.listarCajasCerradas
}; 