const TIPOS_VENTA = ['FAA', 'FAB', 'FCA', 'FCB', 'PRF'];

function fechaISO(valor) {
  if (!valor) return '';
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    const year = valor.getFullYear();
    const month = String(valor.getMonth() + 1).padStart(2, '0');
    const day = String(valor.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(valor).slice(0, 10);
}

function redondear2(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return 0;
  return Number(n.toFixed(2));
}

function esAnulado(registro) {
  return Boolean(registro?.FechaAnulacion);
}

function mapearEventos({ stk = [], ventas = [], notas = [] }) {
  const eventos = [];

  for (const movimiento of stk) {
    const cantidad = redondear2(movimiento.Cantidad);
    const esEgreso = String(movimiento.MovimientoTipo || '').toUpperCase() === 'EGR';
    eventos.push({
      fecha: fechaISO(movimiento.Fecha),
      tipo: esEgreso ? 'EGR' : 'ING',
      origen: 'STK',
      documentoTipo: movimiento.DocumentoTipo || 'STK',
      documentoSucursal: movimiento.DocumentoSucursal || '',
      documentoNumero: movimiento.DocumentoNumero || '',
      cantidad,
      signed: redondear2(esEgreso ? -cantidad : cantidad),
      observacion: movimiento.Observacion || 'Movimiento de stock',
    });
  }

  for (const venta of ventas) {
    if (esAnulado(venta)) continue;
    if (!TIPOS_VENTA.includes(String(venta.DocumentoTipo || '').toUpperCase())) continue;
    const cantidad = redondear2(venta.Cantidad);
    eventos.push({
      fecha: fechaISO(venta.Fecha),
      tipo: 'EGR',
      origen: 'VENTA',
      documentoTipo: venta.DocumentoTipo,
      documentoSucursal: venta.DocumentoSucursal,
      documentoNumero: venta.DocumentoNumero,
      cantidad,
      signed: redondear2(-cantidad),
      observacion: 'Salida por venta',
    });
  }

  for (const nota of notas) {
    if (esAnulado(nota)) continue;
    if (!nota.PorStock) continue;
    const cantidad = redondear2(nota.Cantidad);
    eventos.push({
      fecha: fechaISO(nota.Fecha),
      tipo: 'ING',
      origen: 'NC',
      documentoTipo: nota.DocumentoTipo,
      documentoSucursal: nota.DocumentoSucursal,
      documentoNumero: nota.DocumentoNumero,
      cantidad,
      signed: redondear2(cantidad),
      observacion: 'Devolución por nota de crédito',
    });
  }

  return eventos;
}

function sumarSigned(eventos) {
  return redondear2(eventos.reduce((acc, evento) => acc + evento.signed, 0));
}

function armarSerie(existenciaInicial, fechaDesde, fechaHasta, movimientos) {
  const porDia = new Map();
  for (const movimiento of movimientos) {
    porDia.set(movimiento.fecha, redondear2((porDia.get(movimiento.fecha) || 0) + movimiento.signed));
  }

  const serie = [];
  let running = existenciaInicial;
  const inicio = new Date(`${fechaDesde}T00:00:00`);
  const fin = new Date(`${fechaHasta}T00:00:00`);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime()) || inicio > fin) {
    return serie;
  }

  for (let dia = new Date(inicio); dia <= fin; dia.setDate(dia.getDate() + 1)) {
    const fecha = fechaISO(dia);
    running = redondear2(running + (porDia.get(fecha) || 0));
    serie.push({ fecha, existencia: running });
  }
  return serie;
}

function armarInformeMovimientoStock({
  articulo,
  existenciaActual,
  fechaDesde,
  fechaHasta,
  stk = [],
  ventas = [],
  notas = [],
}) {
  const desde = fechaISO(fechaDesde);
  const hasta = fechaISO(fechaHasta);
  const actual = redondear2(existenciaActual);
  const eventos = mapearEventos({ stk, ventas, notas });

  const posterioresAlInicio = eventos.filter((evento) => evento.fecha >= desde);
  const enPeriodo = eventos
    .filter((evento) => evento.fecha >= desde && evento.fecha <= hasta)
    .sort((a, b) => {
      if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
      return String(a.documentoNumero).localeCompare(String(b.documentoNumero));
    });

  const existenciaInicial = redondear2(actual - sumarSigned(posterioresAlInicio));
  let stock = existenciaInicial;
  const movimientos = enPeriodo.map((evento) => {
    stock = redondear2(stock + evento.signed);
    return { ...evento, existencia: stock };
  });

  const ingresos = movimientos.filter((m) => m.signed > 0);
  const egresos = movimientos.filter((m) => m.signed < 0);
  const ventasPeriodo = movimientos.filter((m) => m.origen === 'VENTA');

  return {
    articulo: articulo || null,
    existenciaActual: actual,
    existenciaInicial,
    totales: {
      ingresos: redondear2(ingresos.reduce((acc, m) => acc + m.cantidad, 0)),
      egresos: redondear2(egresos.reduce((acc, m) => acc + m.cantidad, 0)),
      ventas: redondear2(ventasPeriodo.reduce((acc, m) => acc + m.cantidad, 0)),
    },
    movimientos,
    serie: armarSerie(existenciaInicial, desde, hasta, movimientos),
  };
}

module.exports = {
  TIPOS_VENTA,
  fechaISO,
  mapearEventos,
  armarInformeMovimientoStock,
};
