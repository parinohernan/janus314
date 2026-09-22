function totalesDe(movimientos) {
  const totalIngresos = movimientos
    .filter((m) => m.Tipo === 'ingreso')
    .reduce((sum, m) => sum + parseFloat(m.Importe || 0), 0);

  const totalEgresos = movimientos
    .filter((m) => m.Tipo === 'egreso')
    .reduce((sum, m) => sum + parseFloat(m.Importe || 0), 0);

  const porTipo = new Map();
  for (const movimiento of movimientos) {
    if (movimiento.Tipo !== 'ingreso') continue;
    const codigo = movimiento.MetodoPago || 'CO';
    const actual = porTipo.get(codigo) || {
      codigo,
      descripcion: movimiento.TipoPago?.Descripcion || codigo,
      importe: 0,
    };
    actual.importe += parseFloat(movimiento.Importe || 0);
    porTipo.set(codigo, actual);
  }

  return {
    totalIngresos,
    totalEgresos,
    ingresosPorTipo: [...porTipo.values()].filter((tipo) => tipo.importe > 0),
  };
}

async function obtenerResumenCaja(req, res) {
  try {
    const { CajaCabeza, CajaMovimientos, TipoDePago } = req.models;
    const { id } = req.params;

    const caja = await CajaCabeza.findByPk(id);
    if (!caja) {
      return res.status(404).json({
        success: false,
        message: 'Caja no encontrada'
      });
    }

    const movimientos = await CajaMovimientos.findAll({
      where: { CajaCabezaId: id },
      include: [{
        model: TipoDePago,
        as: 'TipoPago',
        attributes: ['Codigo', 'Descripcion'],
        required: false
      }]
    });

    const { totalIngresos, totalEgresos, ingresosPorTipo } = totalesDe(movimientos);
    const saldoTeorico = parseFloat(caja.SaldoInicial || 0) + totalIngresos - totalEgresos;

    res.json({
      success: true,
      data: {
        saldoInicial: parseFloat(caja.SaldoInicial || 0),
        totalIngresos,
        totalEgresos,
        saldoTeorico,
        ingresosPorTipo
      }
    });

  } catch (error) {
    console.error('Error al obtener resumen de caja:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen de caja'
    });
  }
}

async function cerrarCaja(req, res) {
  const transaction = await req.db.transaction();

  try {
    const { CajaCabeza, CajaMovimientos } = req.models;
    const { id } = req.params;
    const { efectivoFinal, observaciones } = req.body;

    const caja = await CajaCabeza.findByPk(id, { transaction });
    if (!caja) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Caja no encontrada'
      });
    }

    if (caja.Estado !== 'abierta') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'La caja no está abierta'
      });
    }

    const movimientos = await CajaMovimientos.findAll({
      where: { CajaCabezaId: id },
      transaction
    });

    const { totalIngresos, totalEgresos } = totalesDe(movimientos);
    const saldoTeorico = parseFloat(caja.SaldoInicial || 0) + totalIngresos - totalEgresos;

    await caja.update({
      SaldoCierre: efectivoFinal,
      Cierre: new Date(),
      Estado: 'cerrada',
      Observaciones: observaciones,
      SaldoTeorico: saldoTeorico
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Caja cerrada exitosamente',
      data: {
        saldoTeorico,
        saldoReal: efectivoFinal,
        diferencia: efectivoFinal - saldoTeorico
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al cerrar caja:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar la caja'
    });
  }
}

module.exports = {
  obtenerResumenCaja,
  cerrarCaja
}; 