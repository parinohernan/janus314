const CajaCabeza = require('../models/cajaCabeza.model');
const CajaMovimientos = require('../models/cajaMovimientos.model');

// Obtener resumen de caja
async function obtenerResumenCaja(req, res) {
  try {
    const { id } = req.params;

    // Obtener la caja
    const caja = await CajaCabeza.findByPk(id);
    if (!caja) {
      return res.status(404).json({
        success: false,
        message: 'Caja no encontrada'
      });
    }

    // Obtener todos los movimientos de la caja
    const movimientos = await CajaMovimientos.findAll({
      where: {
        CajaCabezaId: id
      }
    });

    // Calcular totales
    const totalIngresos = movimientos
      .filter(m => m.Tipo === 'ingreso')
      .reduce((sum, m) => sum + parseFloat(m.Importe || 0), 0);

    const totalEgresos = movimientos
      .filter(m => m.Tipo === 'egreso')
      .reduce((sum, m) => sum + parseFloat(m.Importe || 0), 0);

    // Calcular saldo teórico
    const saldoTeorico = parseFloat(caja.SaldoInicial || 0) + totalIngresos - totalEgresos;

    res.json({
      success: true,
      data: {
        saldoInicial: parseFloat(caja.SaldoInicial || 0),
        totalIngresos,
        totalEgresos,
        saldoTeorico
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

// Cerrar caja
async function cerrarCaja(req, res) {
  const transaction = await req.db.transaction();

  try {
    const { id } = req.params;
    const { efectivoFinal, observaciones } = req.body;

    // Obtener la caja
    const caja = await CajaCabeza.findByPk(id);
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

    // Obtener movimientos para calcular saldo teórico
    const movimientos = await CajaMovimientos.findAll({
      where: { CajaCabezaId: id }
    });

    const totalIngresos = movimientos
      .filter(m => m.Tipo === 'ingreso')
      .reduce((sum, m) => sum + parseFloat(m.Importe || 0), 0);

    const totalEgresos = movimientos
      .filter(m => m.Tipo === 'egreso')
      .reduce((sum, m) => sum + parseFloat(m.Importe || 0), 0);

    const saldoTeorico = parseFloat(caja.SaldoInicial || 0) + totalIngresos - totalEgresos;

    // Actualizar la caja
    await caja.update({
      SaldoCierre: efectivoFinal,
      Cierre: new Date(),
      Estado: 'cerrada',
      Observaciones: observaciones
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