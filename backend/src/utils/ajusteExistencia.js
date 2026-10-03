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

function partirAjustes(lineas = []) {
  const ingresos = [];
  const egresos = [];
  for (const linea of lineas) {
    if (!linea || !linea.codigo) continue;
    if (linea.movimientoTipo === 'ING') ingresos.push(linea);
    else if (linea.movimientoTipo === 'EGR') egresos.push(linea);
  }
  return { ingresos, egresos };
}

async function sucursalStock(models, transaction) {
  const { DatosEmpresa } = models;
  const empresa = await DatosEmpresa.findOne({ transaction });
  const sucursalRaw = empresa?.Sucursal;
  if (!sucursalRaw || !String(sucursalRaw).trim()) {
    throw new Error('No se encontró la sucursal de la empresa para registrar el movimiento de stock');
  }
  return String(sucursalRaw).trim().padStart(4, '0');
}

async function asegurarNumeroStk(models, sucursal, transaction) {
  const { NumerosControl } = models;
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
}

async function grabarBloqueStock({
  models,
  sucursal,
  lineas,
  movimientoTipo,
  transaction,
  fecha,
  observacion,
}) {
  if (!lineas.length) return null;
  const { MovimientoStock, NumerosControl } = models;
  const documentoNumero = await NumeroControlService.obtenerYActualizarNumero(
    'STK',
    sucursal,
    transaction,
    NumerosControl
  );
  await MovimientoStock.bulkCreate(
    lineas.map((linea) => ({
      DocumentoTipo: 'STK',
      DocumentoSucursal: sucursal,
      DocumentoNumero: documentoNumero,
      Fecha: fecha,
      CodigoArticulo: linea.codigo,
      Cantidad: linea.cantidad,
      MovimientoTipo: movimientoTipo,
      Observacion: observacion,
    })),
    { transaction }
  );
  return { documentoNumero, sucursal, lineas: lineas.length };
}

async function registrarAjustesEnBloque({
  models,
  lineas = [],
  transaction,
  fecha = fechaLocal(),
  observacion = 'Ajuste desde actualización de precios y stock',
}) {
  const { ingresos, egresos } = partirAjustes(lineas);
  if (!ingresos.length && !egresos.length) {
    return { ingreso: null, egreso: null };
  }

  const sucursal = await sucursalStock(models, transaction);
  await asegurarNumeroStk(models, sucursal, transaction);

  const ingreso = await grabarBloqueStock({
    models,
    sucursal,
    lineas: ingresos,
    movimientoTipo: 'ING',
    transaction,
    fecha,
    observacion,
  });
  const egreso = await grabarBloqueStock({
    models,
    sucursal,
    lineas: egresos,
    movimientoTipo: 'EGR',
    transaction,
    fecha,
    observacion,
  });
  return { ingreso, egreso };
}

module.exports = {
  redondearCantidad,
  ajusteExistencia,
  fechaLocal,
  partirAjustes,
  registrarAjusteExistencia,
  registrarAjustesEnBloque,
};
