/**
 * Precio de lista sin IVA para armar renglones de PDF.
 * Facturas traen PrecioLista; notas de crédito solo PrecioUnitario/PrecioBase.
 */
function resolverPrecioLista(item) {
  const lista = Number(item?.PrecioLista);
  if (Number.isFinite(lista) && lista > 0) return lista;
  const base = Number(item?.PrecioBase);
  if (Number.isFinite(base) && base > 0) return base;
  const unitario = Number(item?.PrecioUnitario);
  if (Number.isFinite(unitario) && unitario > 0) return unitario;
  return 0;
}

function redondear2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/**
 * Renglón PRF/FCB: precios con IVA a 2 decimales; el total es cantidad × Precio U. ya redondeado.
 */
function renglonPdfConIva(item) {
  const cantidad = Number(item?.Cantidad) || 0;
  const precioListaSinIva = resolverPrecioLista(item);
  const descuento = Number(item?.PorcentajeBonificado ?? item?.PorcentajeBonificacion) || 0;
  const porcentajeIva = Number(item?.PorcentajeIVA1 || item?.PorcentajeIVA2) || 0;
  const precioUnitarioSinIva =
    Number(item?.PrecioUnitario) > 0
      ? Number(item.PrecioUnitario)
      : precioListaSinIva * (1 - descuento / 100);

  const precioListaConIva = redondear2(precioListaSinIva * (1 + porcentajeIva / 100));
  const precioUnitarioConIva = redondear2(precioUnitarioSinIva * (1 + porcentajeIva / 100));
  const totalConIva = redondear2(cantidad * precioUnitarioConIva);

  return {
    cantidad,
    descuento,
    porcentajeIva,
    precioListaConIva,
    precioUnitarioConIva,
    totalConIva,
  };
}

function totalesPieConIva(items, porcentajeBonificacion = 0) {
  const renglones = (items || []).map(renglonPdfConIva);
  const subtotal = redondear2(renglones.reduce((sum, r) => sum + r.totalConIva, 0));
  const pct = Number(porcentajeBonificacion) || 0;
  const bonificacion = redondear2(subtotal * (pct / 100));
  const total = redondear2(subtotal - bonificacion);
  return { subtotal, bonificacion, total, renglones };
}

module.exports = {
  resolverPrecioLista,
  redondear2,
  renglonPdfConIva,
  totalesPieConIva,
};
