const renderClienteInfo = require("./common/clienteInfo.js");
const renderItemsListConIva = require("./common/itemsListConIva.js");
const { renderPiePrefactura } = require("./common/piePrefactura");
const path = require("path");

/**
 * Genera un PDF para una Prefactura
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} data - Datos de la prefactura
 */
async function renderPrefactura(doc, data) {
  const { prefactura, items, logoPath, imprimirDuplicado = false } = data;
  const finalLogoPath = logoPath || path.join(__dirname, "./common/logos/logoempresa.png");
  doc.font("Helvetica");
  const interlineado = 10;

  const renderPage = async (isOriginal) => {
    if (imprimirDuplicado) {
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text(isOriginal ? "ORIGINAL" : "DUPLICADO", 40, 2, { align: "center" });
      doc.font("Helvetica");
    }

    if (finalLogoPath) {
      try {
        doc.image(finalLogoPath, 20, 20, {
          width: 60,
          height: 60,
          resolution: 300
        });
      } catch (error) {
        console.error("Error al cargar el logo en prefactura:", error);
      }
    }

    doc.fontSize(14).font("Helvetica-Bold");
    doc.text(`Remito Nº: ${prefactura.DocumentoSucursal} - ${prefactura.DocumentoNumero}`, 40, 40, { align: "center" });

    const fecha = new Date(prefactura.Fecha).toLocaleDateString('es-AR');
    doc.fontSize(12).font("Helvetica");
    doc.text(`Fecha: ${fecha}`, 450, 40, { align: "right" });

    doc.font("Helvetica");

    let y = 80;
    y = renderClienteInfo(doc, prefactura, y);

    y = 110;
    y = renderItemsListConIva(doc, items, y, interlineado);
    renderPiePrefactura(doc, {
      items,
      prefactura,
      y,
      xTotales: 370,
      interlineado,
    });
  };

  await renderPage(true);
  if (imprimirDuplicado) {
    doc.addPage();
    await renderPage(false);
  }
}

module.exports = renderPrefactura;
