/** Leyenda izquierda del pie (importe en palabras, observación, devoluciones). */

const { resolverYInicioQr } = require("./piePageBounds");

function alturaTexto(doc, text, width, lineGap = 0) {
  return doc.heightOfString(String(text), { width, lineGap });
}

/**
 * Dibuja el bloque izquierdo del pie y devuelve la Y donde puede empezar QR/ARCA.
 * @returns {number} y inicio zona electrónica (con margen antes del QR)
 */
function renderPieLeyendaIzquierda(doc, {
  y,
  width,
  totalEnPalabras,
  fontSize = 10,
  observacion,
  mostrarDevoluciones = true,
  leyendaDevoluciones = "No se aceptan devoluciones después de las 48hs",
  gapEntreLineas = 4,
  gapAntesQr = 8,
}) {
  doc.fontSize(fontSize).font("Helvetica");
  let yCur = y;

  const sonLine = `Son ${totalEnPalabras}`;
  const sonLineGap = 2;
  doc.text(sonLine, 20, yCur, { width, lineGap: sonLineGap });
  yCur += alturaTexto(doc, sonLine, width, sonLineGap) + gapEntreLineas;

  if (observacion) {
    const obsLine = `Observación: ${observacion}`;
    doc.text(obsLine, 20, yCur, { width, lineGap: 0 });
    yCur += alturaTexto(doc, obsLine, width, 0) + gapEntreLineas;
  }

  if (mostrarDevoluciones && leyendaDevoluciones) {
    doc.text(leyendaDevoluciones, 20, yCur, { width, lineGap: 0 });
    yCur += alturaTexto(doc, leyendaDevoluciones, width, 0);
  }

  return resolverYInicioQr(doc, yCur, gapAntesQr);
}

module.exports = { renderPieLeyendaIzquierda, alturaTexto };
