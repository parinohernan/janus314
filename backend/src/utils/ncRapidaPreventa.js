function acotarPorcentaje(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function alicuotaIvaArticulo(articulo) {
  const raw =
    articulo?.PorcentajeIVA1 ??
    articulo?.PorcentajeIva1 ??
    articulo?.PorcentajeIva ??
    articulo?.iva;
  if (raw === null || raw === undefined || raw === "") return 21;
  const iva = Number(raw);
  return Number.isFinite(iva) ? iva : 21;
}

function precioListaPreventa(item) {
  const lista = Number(item.PrecioLista);
  if (Number.isFinite(lista) && lista > 0) return lista;
  const neto = Number(item.PrecioUnitario);
  const pct = acotarPorcentaje(item.PorcentajeBonificacion);
  if (pct > 0 && pct < 100 && Number.isFinite(neto)) return neto / (1 - pct / 100);
  return Number.isFinite(neto) ? neto : 0;
}

function precioNeto(lista, porcentaje) {
  return Number(lista) * (1 - acotarPorcentaje(porcentaje) / 100);
}

function mapearItemPreventaANotaCredito(plain) {
  const articulo = plain.Articulo || {};
  const cantidad = parseFloat(plain.Cantidad) || 0;
  const pct = acotarPorcentaje(plain.PorcentajeBonificacion);
  const lista = precioListaPreventa(plain);
  const enviado = Number(plain.PrecioUnitario);
  const precioUnitario = Number.isFinite(enviado)
    ? enviado
    : precioNeto(lista, pct);
  const porcIva = Number.isFinite(Number(plain.PorcentajeIva))
    ? Number(plain.PorcentajeIva)
    : alicuotaIvaArticulo(articulo);

  return {
    CodigoArticulo: plain.CodigoArticulo,
    Descripcion: articulo.Descripcion || plain.Descripcion || "",
    Cantidad: cantidad,
    PrecioUnitario: precioUnitario,
    PorcentajeIva: porcIva,
    PorcentajeBonificacion: pct,
  };
}

function porcentajeBonificacionNcRapida({ solicitado, preventa }) {
  if (solicitado !== undefined && solicitado !== null && solicitado !== "") {
    return acotarPorcentaje(solicitado);
  }
  return acotarPorcentaje(preventa?.PorcentajeBonificacion);
}

module.exports = {
  acotarPorcentaje,
  mapearItemPreventaANotaCredito,
  porcentajeBonificacionNcRapida,
};
