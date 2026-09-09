const convertirNumeroAPalabras = require("../../../utils/convertirNumeroAPalabras");
const { porcentajeBonificacionDesdeFactura } = require("../../../utils/bonificacionGeneral");
const { textoImporteBonificado } = require("./formatBonificacion");
const { redondear2, totalesPieConIva } = require("./precioItem");

/**
 * Pie de PRF: subtotal = suma de renglones (ya con desc. de línea);
 * bonificación = solo la general sobre ese subtotal.
 * El importe en letras va a la izquierda, sin tapar la tabla ni los totales.
 */
function renderPiePrefactura(doc, { items, prefactura, y, xTotales = 370, interlineado = 10 }) {
  const pctGeneral = porcentajeBonificacionDesdeFactura(prefactura);
  const pie = totalesPieConIva(items, pctGeneral);
  const percepcion = Number(prefactura?.ImportePercepcionIIBB) > 0 ? Number(prefactura.ImportePercepcionIIBB) : 0;
  const totalImpreso = redondear2(pie.total + percepcion);

  y += 12;
  const yTexto = y;
  const anchoTexto = xTotales - 28;

  doc.font("Helvetica").fontSize(10);

  if (pie.bonificacion > 0) {
    doc.text("Subtotal:", xTotales, y, { width: 90, align: "right" });
    doc.text(pie.subtotal.toFixed(2), xTotales + 90, y, { width: 70, align: "right" });
    y += interlineado;

    doc.text("Bonificación:", xTotales, y, { width: 90, align: "right" });
    doc.text(
      textoImporteBonificado(pie.bonificacion, pie.porcentajeMostrar),
      xTotales + 90,
      y,
      { width: 90, align: "right" }
    );
    y += interlineado;
  }

  if (percepcion > 0) {
    doc.text("Perc. IIBB:", xTotales, y, { width: 90, align: "right" });
    doc.text(percepcion.toFixed(2), xTotales + 90, y, { width: 70, align: "right" });
    y += interlineado;
  }

  y += interlineado;
  doc.fontSize(12).text("TOTAL:", xTotales, y, { width: 90, align: "right" });
  doc.text(totalImpreso.toFixed(2), xTotales + 90, y, { width: 70, align: "right" });

  doc.fontSize(10).font("Helvetica");
  const totalEnPalabras = convertirNumeroAPalabras(totalImpreso);
  doc.text("Son: " + totalEnPalabras, 20, yTexto, { width: anchoTexto, align: "left" });
  doc.text("Este documento es una prefactura y no tiene validez fiscal", 20, yTexto + 22, {
    width: anchoTexto,
    align: "left",
  });

  return y + 16;
}

module.exports = { renderPiePrefactura };
