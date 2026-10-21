/** Límites verticales del pie en A4 (respeta márgenes del doc). */

const QR_SIZE = 80;
const GAP_QR_LEYENDA_LEGAL = 6;
const LEGAL_LINE_HEIGHT = 11;

function yMaxContenido(doc) {
  const pageHeight = doc.page?.height ?? 841.89;
  const bottom = doc.page?.margins?.bottom ?? 42.5;
  return pageHeight - bottom;
}

/** Y fija de la leyenda legal (siempre en la misma hoja). */
function yLeyendaLegal(doc) {
  return yMaxContenido(doc) - LEGAL_LINE_HEIGHT;
}

/** Máxima Y de inicio del QR para que quepan QR + leyenda legal. */
function yMaxInicioQr(doc) {
  return yLeyendaLegal(doc) - GAP_QR_LEYENDA_LEGAL - QR_SIZE;
}

/**
 * @param {number} yFinLeyenda - Y justo debajo del último renglón de leyendas izquierdas
 * @param {number} [gapAntesQr=8]
 */
function resolverYInicioQr(doc, yFinLeyenda, gapAntesQr = 8) {
  const yDeseado = yFinLeyenda + gapAntesQr;
  const yMax = yMaxInicioQr(doc);
  return Math.min(yDeseado, yMax);
}

module.exports = {
  QR_SIZE,
  yMaxContenido,
  yLeyendaLegal,
  yMaxInicioQr,
  resolverYInicioQr,
};
