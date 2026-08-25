/**
 * Formato de importe de bonificación general para totales de PDF.
 * Ej: 2819.83 (10%)
 */
function textoImporteBonificado(importe, porcentaje) {
  const amount = Number(importe || 0).toFixed(2);
  const n = Number(porcentaje);
  if (!Number.isFinite(n) || n <= 0) {
    return amount;
  }
  const pct = parseFloat(n.toFixed(2)).toString();
  return `${amount} (${pct}%)`;
}

module.exports = { textoImporteBonificado };
