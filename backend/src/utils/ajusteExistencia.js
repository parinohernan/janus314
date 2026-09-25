const NumeroControlService = require('../services/numeroControl.service');

function redondearCantidad(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  if (!Number.isFinite(n)) return null;
  return Number(n.toFixed(2));
}

function ajusteExistencia(anterior, nuevo) {
  const existenciaAnterior = redondearCantidad(anterior);
  const existenciaNueva = redondearCantidad(nuevo);
  if (existenciaAnterior === null || existenciaNueva === null) return null;
  const delta = Number((existenciaNueva - existenciaAnterior).toFixed(2));
  if (delta === 0) return null;
  return {
    cantidad: Math.abs(delta),
    movimientoTipo: delta > 0 ? 'ING' : 'EGR',
  };
}

function fechaLocal(ahora = new Date()) {
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

async function registrarAjusteExistencia({
  models,
  articulo,
  existenciaAnterior,
  existenciaNueva,
  transaction,
  fecha = fechaLocal(),
  observacion = 'Ajuste desde edición de producto',
}) {
  const ajuste = ajusteExistencia(existenciaAnterior, existenciaNueva);
  if (!ajuste) return null;

  const { MovimientoStock, NumerosControl, DatosEmpresa } = models;
  const empresa = await DatosEmpresa.findOne({ transaction });
  const sucursalRaw = empresa?.Sucursal;
  if (!sucursalRaw || !String(sucursalRaw).trim()) {
    throw new Error('No se encontró la sucursal de la empresa para registrar el movimiento de stock');
  }
  const sucursal = String(sucursalRaw).trim().padStart(4, '0');

  const numeroControl = await NumerosControl.findOne({
    where: { Codigo: 'STK', Sucursal: sucursal },
    transaction,
  });
  if (!numeroControl) {
    await NumerosControl.create(
      {
        Codigo: 'STK',
        Descripcion: 'Movimientos de stock',
        NumeroProximo: 1,
        Copias: 1,
        Sucursal: sucursal,
      },
      { transaction }
    );
  }

  const documentoNumero = await NumeroControlService.obtenerYActualizarNumero(
    'STK',
    sucursal,
    transaction,
    NumerosControl
  );

  await MovimientoStock.create(
    {
      DocumentoTipo: 'STK',
      DocumentoSucursal: sucursal,
      DocumentoNumero: documentoNumero,
      Fecha: fecha,
      CodigoArticulo: articulo.Codigo,
      Cantidad: ajuste.cantidad,
      MovimientoTipo: ajuste.movimientoTipo,
      Observacion: observacion,
    },
    { transaction }
  );

  return {
    documentoNumero,
    sucursal,
    ...ajuste,
  };
}

module.exports = {
  redondearCantidad,
  ajusteExistencia,
  fechaLocal,
  registrarAjusteExistencia,
};
