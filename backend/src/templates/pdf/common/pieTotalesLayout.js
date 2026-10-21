/** Columnas alineadas del bloque de totales (derecha del PDF). */

const PIE_RIGHT_MARGIN = 20;

function columnasPie(doc) {
  const valueWidth = 82;
  const labelWidth = 118;
  const gap = 8;
  const pageWidth = doc.page?.width || 595.28;
  const xValue = pageWidth - PIE_RIGHT_MARGIN - valueWidth;
  const xLabel = xValue - gap - labelWidth;
  return {
    xLabel,
    labelWidth,
    xValue,
    valueWidth,
    rowStep: 18,
    /** Compatibilidad con código que usaba xTotales = 420 */
    xTotales: xLabel,
  };
}

function filaPie(doc, cols, y, label, value) {
  doc.text(String(label), cols.xLabel, y, {
    width: cols.labelWidth,
    align: "right",
  });
  doc.text(String(value), cols.xValue, y, {
    width: cols.valueWidth,
    align: "right",
  });
  return y + cols.rowStep;
}

function etiquetaBonificacion(porcentaje) {
  const n = Number(porcentaje);
  if (Number.isFinite(n) && n > 0) {
    const pct = parseFloat(n.toFixed(2)).toString();
    return `Bonificación (${pct}%):`;
  }
  return "Bonificación:";
}

function importeBonificadoSolo(importe) {
  return Number(importe || 0).toFixed(2);
}

module.exports = {
  PIE_RIGHT_MARGIN,
  columnasPie,
  filaPie,
  etiquetaBonificacion,
  importeBonificadoSolo,
};
