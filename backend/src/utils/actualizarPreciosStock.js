const { ajusteExistencia, redondearCantidad } = require('./ajusteExistencia');

const CAMPOS_PRECIO = [
  'PrecioCosto',
  'PrecioCostoMasImp',
  'Lista1',
  'Lista2',
  'Lista3',
  'Lista4',
  'Lista5',
];

const OBSERVACION_AJUSTE = 'Ajuste desde actualización de precios y stock';

function campoEnviado(valor) {
  return valor !== undefined && valor !== null && valor !== '';
}

function parseNumeroFinito(valor, etiqueta) {
  const n = Number(valor);
  if (!Number.isFinite(n)) {
    return { error: `${etiqueta} debe ser un número finito` };
  }
  return { valor: n };
}

function numerosIguales(a, b) {
  const na = redondearCantidad(a);
  const nb = redondearCantidad(b);
  if (na === null && nb === null) return true;
  if (na === null || nb === null) return false;
  return na === nb;
}

function ivaArticulo(articulo) {
  return Number(articulo?.PorcentajeIVA1) || 0;
}

/**
 * Compara el payload con el artículo actual y arma el update + ajuste STK.
 * PrecioCosto y PrecioCostoMasImp se derivan entre sí solo si se envió uno de los dos.
 */
function prepararActualizacionPreciosStock(articulo, item = {}) {
  if (!articulo) {
    return { ok: false, error: 'Artículo no encontrado' };
  }

  const updates = {};
  const costoEnviado = campoEnviado(item.PrecioCosto);
  const masImpEnviado = campoEnviado(item.PrecioCostoMasImp);
  const iva = ivaArticulo(articulo);

  if (costoEnviado) {
    const parseado = parseNumeroFinito(item.PrecioCosto, 'PrecioCosto');
    if (parseado.error) return { ok: false, error: parseado.error };
    if (!numerosIguales(articulo.PrecioCosto, parseado.valor)) {
      updates.PrecioCosto = parseado.valor;
    }
  }

  if (masImpEnviado) {
    const parseado = parseNumeroFinito(item.PrecioCostoMasImp, 'PrecioCostoMasImp');
    if (parseado.error) return { ok: false, error: parseado.error };
    if (!numerosIguales(articulo.PrecioCostoMasImp, parseado.valor)) {
      updates.PrecioCostoMasImp = parseado.valor;
    }
  }

  if (costoEnviado && !masImpEnviado && Object.prototype.hasOwnProperty.call(updates, 'PrecioCosto')) {
    updates.PrecioCostoMasImp = updates.PrecioCosto * (1 + iva / 100);
  }
  if (masImpEnviado && !costoEnviado && Object.prototype.hasOwnProperty.call(updates, 'PrecioCostoMasImp')) {
    updates.PrecioCosto = updates.PrecioCostoMasImp / (1 + iva / 100);
  }

  for (const campo of ['Lista1', 'Lista2', 'Lista3', 'Lista4', 'Lista5']) {
    if (!campoEnviado(item[campo])) continue;
    const parseado = parseNumeroFinito(item[campo], campo);
    if (parseado.error) return { ok: false, error: parseado.error };
    if (!numerosIguales(articulo[campo], parseado.valor)) {
      updates[campo] = parseado.valor;
    }
  }

  let ajuste = null;
  if (campoEnviado(item.Existencia)) {
    const parseado = parseNumeroFinito(item.Existencia, 'Existencia');
    if (parseado.error) return { ok: false, error: parseado.error };
    if (parseado.valor < 0) {
      return { ok: false, error: 'Existencia no puede ser negativa' };
    }
    ajuste = ajusteExistencia(articulo.Existencia, parseado.valor);
    if (ajuste) {
      updates.Existencia = redondearCantidad(parseado.valor);
    }
  }

  const hayPrecio = CAMPOS_PRECIO.some((campo) => Object.prototype.hasOwnProperty.call(updates, campo));
  const registrarCosto = Object.prototype.hasOwnProperty.call(updates, 'PrecioCosto')
    && !numerosIguales(articulo.PrecioCosto, updates.PrecioCosto);

  if (!hayPrecio && !ajuste) {
    return { ok: true, noop: true, updates: {}, ajuste: null, registrarCosto: false };
  }

  return {
    ok: true,
    noop: false,
    updates,
    ajuste,
    registrarCosto,
    costoAnterior: articulo.PrecioCosto,
    existenciaAnterior: articulo.Existencia,
  };
}

module.exports = {
  CAMPOS_PRECIO,
  OBSERVACION_AJUSTE,
  prepararActualizacionPreciosStock,
  numerosIguales,
};
