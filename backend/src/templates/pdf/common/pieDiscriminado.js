const { porcentajeBonificacionDesdeFactura } = require("../../../utils/bonificacionGeneral");
const { lineasIvaDiscriminado } = require("./formatBonificacion");
const { redondear2, totalesPieDiscriminado } = require("./precioItem");
const {
  columnasPie,
  filaPie,
  etiquetaBonificacion,
  importeBonificadoSolo,
} = require("./pieTotalesLayout");

/**
 * Pie exacto familia A: suma renglones netos = Subtotal;
 * Subtotal − Bonif = Neto; Neto + IVA = TOTAL impreso (ImporteTotal).
 */
function renderPieExactoDiscriminado(doc, { items, documento, y = 660, xTotales }) {
  const yTotales = y;
  const cols = columnasPie(doc);
  const pct = porcentajeBonificacionDesdeFactura(documento);
  const pie = totalesPieDiscriminado(items, pct);
  const percepcion =
    Number(documento?.ImportePercepcionIIBB) > 0 ? Number(documento.ImportePercepcionIIBB) : 0;
  const total = redondear2(Number(documento?.ImporteTotal) || pie.total + percepcion);
  const hayBonificacion = pie.bonificacion > 0;

  doc.font("Helvetica-Bold");

  y = filaPie(doc, cols, y, "Subtotal s/IVA:", pie.subtotal.toFixed(2));

  if (hayBonificacion) {
    y = filaPie(
      doc,
      cols,
      y,
      etiquetaBonificacion(pie.porcentajeMostrar),
      importeBonificadoSolo(pie.bonificacion)
    );
    y = filaPie(doc, cols, y, "Importe neto:", pie.neto.toFixed(2));
  }

  const ivas =
    documento?.IvasPorPorcentaje && documento.IvasPorPorcentaje.length > 0
      ? documento.IvasPorPorcentaje.filter((iva) => Number(iva.importe) > 0)
      : lineasIvaDiscriminado({
          ImporteIva1: pie.iva21,
          ImporteIva2: pie.iva105,
        });

  ivas.forEach((iva) => {
    y = filaPie(
      doc,
      cols,
      y,
      `IVA ${iva.porcentaje}%:`,
      Number(iva.importe).toFixed(2)
    );
  });

  if (percepcion > 0) {
    y = filaPie(doc, cols, y, "Perc. IIBB:", percepcion.toFixed(2));
  }

  doc.strokeColor("#000000").moveTo(20, 650).lineTo(580, 650).stroke();
  y += 10;

  doc.fontSize(12);
  y = filaPie(doc, cols, y, "TOTAL:", total.toFixed(2));

  return { y, yTotales, pie, total, cols };
}

module.exports = { renderPieExactoDiscriminado };
