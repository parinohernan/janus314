/**
 * Genera el encabezado estándar para documentos
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} options - Opciones de configuración
 */
function renderHeader(doc, options = {}) {
  const {
    title = "DOCUMENTO",
    documentType = "",
    documentNumber = "",
    companyName = "EMPRESA S.A.",
    companyTaxId = "30-12345678-9",
    companyAddress = "Calle Principal 123, Ciudad",
    companyPhone = "(123) 456-7890",
    showLogo = true,
    logoPath = null,
  } = options;

  // Logo de la empresa (si está habilitado y se proporciona una ruta)
  if (showLogo && logoPath) {
    try {
      doc.image(logoPath, 50, 45, { width: 80 });
    } catch (error) {
      console.error("Error al cargar el logo:", error);
    }
  }

  // Título del documento
  doc.fontSize(20).text(title, { align: "center" });
  doc.moveDown(0.5);

  // Tipo y número de documento
  if (documentType && documentNumber) {
    doc
      .fontSize(16)
      .text(`${documentType} N° ${documentNumber}`, { align: "center" });
    doc.moveDown();
  }

  // Información de la empresa
  doc.fontSize(12).text(companyName, { align: "left" });
  doc.fontSize(10).text(`CUIT: ${companyTaxId}`);
  doc.text(`Dirección: ${companyAddress}`);
  doc.text(`Tel: ${companyPhone}`);
  doc.moveDown();

  return doc.y; // Retornar la posición Y actual para saber dónde continuar
}

module.exports = renderHeader;
