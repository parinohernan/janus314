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

module.exports = { resolverPrecioLista };
