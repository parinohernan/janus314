const { porcentajeBonificacionDesdeFactura } = require("../../../utils/bonificacionGeneral");
const { textoImporteBonificado } = require("./formatBonificacion");
const { redondear2, totalesPieConIva } = require("./precioItem");

/**
 * Pie exacto familia B: Subtotal = suma renglones c/IVA;
 * Bonificación sobre ese subtotal; TOTAL = ImporteTotal (CAE).
 */
function renderPieExactoConIva(doc, { items, documento, y = 660, xTotales = 420 }) {
  const yTotales = y;
  const pct = porcentajeBonificacionDesdeFactura(documento);
  const pie = totalesPieConIva(items, pct);
  const percepcion =
    Number(documento?.ImportePercepcionIIBB) > 0 ? Number(documento.ImportePercepcionIIBB) : 0;
  const total = redondear2(Number(documento?.ImporteTotal) || pie.total + percepcion);

  doc.x = xTotales;
  doc.font("Helvetica-Bold");

  if (pie.bonificacion > 0) {
    doc.text("Subtotal:", xTotales, y, { width: 90, align: "right" });
    doc.text(pie.subtotal.toFixed(2), xTotales + 90, y, { width: 70, align: "right" });
    y += 20;

    doc.text("Bonificación:", xTotales, y, { width: 90, align: "right" });
    doc.text(textoImporteBonificado(pie.bonificacion, pie.porcentajeMostrar), xTotales + 70, y, {
      width: 90,
      align: "right",
    });
    y += 20;
  }

  if (percepcion > 0) {
    doc.text("Perc. IIBB:", xTotales, y, { width: 90, align: "right" });
    doc.text(percepcion.toFixed(2), xTotales + 90, y, { width: 70, align: "right" });
    y += 20;
  }

  doc.strokeColor("#000000").moveTo(20, 650).lineTo(580, 650).stroke();
  y += 10;

  doc.fontSize(12).text("TOTAL:", xTotales, y, { width: 90, align: "right" });
  doc.text(total.toFixed(2), xTotales + 90, y, { width: 70, align: "right" });

  return { y, yTotales, pie, total };
}

module.exports = { renderPieExactoConIva };
