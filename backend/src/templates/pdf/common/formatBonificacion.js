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

/** Suma de renglones con IVA (NCB/NCF/PRF). */
function subtotalConIvaDesdeItems(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    return sum + (Number(item?.TotalConIva) || Number(item?.Subtotal) || 0);
  }, 0);
}

module.exports = { textoImporteBonificado, subtotalConIvaDesdeItems };
