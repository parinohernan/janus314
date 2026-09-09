const renderHeader = require("./common/header");
const renderClienteInfo = require("./common/clienteInfo.js");
const renderItemsListConIva = require("./common/itemsListConIva.js");
const { renderPiePrefactura } = require("./common/piePrefactura");
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
  renderPiePrefactura(doc, {
    items,
    prefactura,
    y,
    xTotales: 370,
    interlineado,
  });
}

module.exports = renderPrefacturaConEmpresa;
