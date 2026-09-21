function alicuotaIvaValor(valor, fallback = 21) {
  if (valor === null || valor === undefined || valor === "") return fallback;
  const iva = Number(valor);
  return Number.isFinite(iva) ? iva : fallback;
}

function alicuotaIvaArticulo(articulo, fallback = 21) {
  if (!articulo) return fallback;
  const raw =
    articulo.PorcentajeIVA1 ??
    articulo.PorcentajeIva1 ??
    articulo.PorcentajeIva ??
    articulo.iva;
  return alicuotaIvaValor(raw, fallback);
}

module.exports = { alicuotaIvaValor, alicuotaIvaArticulo };
