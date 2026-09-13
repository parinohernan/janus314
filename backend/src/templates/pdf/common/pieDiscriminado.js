const { porcentajeBonificacionDesdeFactura } = require("../../../utils/bonificacionGeneral");
const { textoImporteBonificado, lineasIvaDiscriminado } = require("./formatBonificacion");
const { redondear2, totalesPieDiscriminado } = require("./precioItem");

/**
 * Pie exacto familia A: suma renglones netos = Subtotal;
 * Subtotal − Bonif = Neto; Neto + IVA = TOTAL impreso (ImporteTotal).
 */
function renderPieExactoDiscriminado(doc, { items, documento, y = 660, xTotales = 420 }) {
  const yTotales = y;
  const pct = porcentajeBonificacionDesdeFactura(documento);
  const pie = totalesPieDiscriminado(items, pct);
  const percepcion =
    Number(documento?.ImportePercepcionIIBB) > 0 ? Number(documento.ImportePercepcionIIBB) : 0;
  const total = redondear2(Number(documento?.ImporteTotal) || pie.total + percepcion);
  const hayBonificacion = pie.bonificacion > 0;

  doc.x = xTotales;
  doc.font("Helvetica-Bold");

  doc.text("Subtotal s/IVA:", xTotales - 16, y, { width: 106, align: "right" });
  doc.text(pie.subtotal.toFixed(2), xTotales + 90, y, { width: 70, align: "right" });
  y += 20;

  if (hayBonificacion) {
    doc.text("Bonificación:", xTotales, y, { width: 90, align: "right" });
    doc.text(textoImporteBonificado(pie.bonificacion, pie.porcentajeMostrar), xTotales + 70, y, {
      width: 90,
      align: "right",
    });
    y += 20;

    doc.text("Importe neto:", xTotales, y, { width: 90, align: "right" });
    doc.text(pie.neto.toFixed(2), xTotales + 90, y, { width: 70, align: "right" });
    y += 20;
  }

  const ivas =
    documento?.IvasPorPorcentaje && documento.IvasPorPorcentaje.length > 0
      ? documento.IvasPorPorcentaje.filter((iva) => Number(iva.importe) > 0)
      : lineasIvaDiscriminado({
          ImporteIva1: pie.iva21,
          ImporteIva2: pie.iva105,
        });

  ivas.forEach((iva) => {
    doc.text(`IVA ${iva.porcentaje}%:`, xTotales, y, { width: 90, align: "right" });
    doc.text(Number(iva.importe).toFixed(2), xTotales + 90, y, { width: 70, align: "right" });
    y += 20;
  });

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

module.exports = { renderPieExactoDiscriminado };
