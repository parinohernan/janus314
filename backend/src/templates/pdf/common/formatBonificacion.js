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

/** Alícuotas a mostrar en Factura/NCA: solo las que tienen importe. */
function lineasIvaDiscriminado(doc) {
  const lineas = [];
  const iva21 = Number(doc?.ImporteIva1);
  const iva105 = Number(doc?.ImporteIva2);
  if (Number.isFinite(iva21) && iva21 > 0) {
    lineas.push({ porcentaje: 21, importe: iva21 });
  }
  if (Number.isFinite(iva105) && iva105 > 0) {
    lineas.push({ porcentaje: 10.5, importe: iva105 });
  }
  return lineas;
}

module.exports = { textoImporteBonificado, subtotalConIvaDesdeItems, lineasIvaDiscriminado };
