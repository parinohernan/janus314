const renderHeader = require("./common/header");
const renderClienteInfo = require("./common/clienteInfo.js");
const renderItemsListConIva = require("./common/itemsListConIva.js");
const path = require("path");

/**
 * PRF (remito interno) con encabezado completo de empresa, mismo criterio que Factura A.
 * @param {PDFDocument} doc
 * @param {{ prefactura: object, items: object[], logoPath?: string }} data
 */
async function renderPrefacturaConEmpresa(doc, data) {
  const { prefactura, items, logoPath } = data;
  const finalLogoPath = logoPath || path.join(__dirname, "./common/logos/logoempresa.png");
  const Empresa = prefactura.Empresa || {};

  doc.font("Helvetica");
  const interlineado = 10;

  const fechaStr = new Date(prefactura.Fecha).toLocaleDateString("es-AR");

  let inicioActividadesStr = "No especificado";
  if (Empresa.InicioActividades) {
    const d =
      Empresa.InicioActividades instanceof Date
        ? Empresa.InicioActividades
        : new Date(Empresa.InicioActividades);
    if (!Number.isNaN(d.getTime())) {
      inicioActividadesStr = d.toLocaleDateString("es-AR");
    }
  }

  let y = renderHeader(doc, {
    fecha: fechaStr,
    companyName: Empresa.RazonSocial || "",
    companyName2: Empresa.PieCero || "",
    companyTaxId: Empresa.Cuit || "",
    companyAddress: Empresa.DomicilioComercial || "",
    companyPhone: Empresa.Telefono || "",
    companyEmail: Empresa.Email || "",
    companyLocalidad: Empresa.Localidad || "",
    companyIngresosBrutos: Empresa.IngresosBrutos || "",
    companyInicioActividades: inicioActividadesStr,
    title: "R",
    documentType: "R",
    documentNumber: `${prefactura.DocumentoSucursal}-${prefactura.DocumentoNumero}`,
    logoPath: finalLogoPath,
    isNotaCredito: false,
    isRemito: true,
  });

  y += 8;
  y = renderClienteInfo(doc, prefactura, y);
  y = renderItemsListConIva(doc, items, y, interlineado);

  let xTotales = 370;
  doc.x = xTotales;
  doc.font("Helvetica");

  const subtotal = items.reduce((sum, item) => sum + (item.TotalConIva || 0), 0);

  if (true || (prefactura.ImporteBonificado && prefactura.ImporteBonificado > 0)) {
    doc.text("Subtotal:", xTotales, y, { width: 90, align: "right" });
    doc.text(subtotal.toFixed(2), xTotales + 90, y, { width: 70, align: "right" });
    y += interlineado;

    doc.text("Bonificación:", xTotales, y, { width: 90, align: "right" });
    doc.text(prefactura.ImporteBonificado.toFixed(2), xTotales + 90, y, {
      width: 70,
      align: "right",
    });
    y += interlineado;
  }

  if (prefactura.ImportePercepcionIIBB && prefactura.ImportePercepcionIIBB > 0) {
    doc.text("Perc. IIBB:", xTotales, y, { width: 90, align: "right" });
    doc.text(prefactura.ImportePercepcionIIBB.toFixed(2), xTotales + 90, y, {
      width: 70,
      align: "right",
    });
    y += interlineado;
  }

  y += interlineado;

  doc.fontSize(12).text("TOTAL:", xTotales, y, { width: 90, align: "right" });
  doc.text(
    prefactura.ImporteTotal ? prefactura.ImporteTotal.toFixed(2) : "0.00",
    xTotales + 90,
    y,
    { width: 70, align: "right" }
  );

  doc.fontSize(10).font("Helvetica");
  const convertirNumeroAPalabras = require("../../utils/convertirNumeroAPalabras");
  const TotalEnPalabras = convertirNumeroAPalabras(prefactura.ImporteTotal);
  doc.text("Son: " + TotalEnPalabras, 20, y - 22, { align: "left" });
  doc.text("Este documento es una prefactura y no tiene validez fiscal", 20, y - 10, {
    align: "left",
  });
}

module.exports = renderPrefacturaConEmpresa;
