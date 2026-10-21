const { porcentajeBonificacionDesdeFactura } = require("../../../utils/bonificacionGeneral");
const { redondear2, totalesPieConIva } = require("./precioItem");
const {
  columnasPie,
  filaPie,
  etiquetaBonificacion,
  importeBonificadoSolo,
} = require("./pieTotalesLayout");

/**
 * Pie exacto familia B: Subtotal = suma renglones c/IVA;
 * Bonificación sobre ese subtotal; TOTAL = ImporteTotal (CAE).
 */
function renderPieExactoConIva(doc, { items, documento, y = 660, xTotales }) {
  const yTotales = y;
  const cols = columnasPie(doc);
  const pct = porcentajeBonificacionDesdeFactura(documento);
  const pie = totalesPieConIva(items, pct);
  const percepcion =
    Number(documento?.ImportePercepcionIIBB) > 0 ? Number(documento.ImportePercepcionIIBB) : 0;
  const total = redondear2(Number(documento?.ImporteTotal) || pie.total + percepcion);

  doc.font("Helvetica-Bold");

  if (pie.bonificacion > 0) {
    y = filaPie(doc, cols, y, "Subtotal:", pie.subtotal.toFixed(2));
    y = filaPie(
      doc,
      cols,
      y,
      etiquetaBonificacion(pie.porcentajeMostrar),
      importeBonificadoSolo(pie.bonificacion)
    );
  }

  if (percepcion > 0) {
    y = filaPie(doc, cols, y, "Perc. IIBB:", percepcion.toFixed(2));
  }

  doc.strokeColor("#000000").moveTo(20, 650).lineTo(580, 650).stroke();
  y += 10;

  doc.fontSize(12);
  y = filaPie(doc, cols, y, "TOTAL:", total.toFixed(2));

  return { y, yTotales, pie, total, cols };
}

module.exports = { renderPieExactoConIva };
