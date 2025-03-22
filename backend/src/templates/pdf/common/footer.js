/**
 * Genera el pie de página estándar para documentos
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} options - Opciones de configuración
 */
function renderFooter(doc, options = {}) {
  const {
    pageNumber = true,
    legalText = "Documento no válido como factura",
    additionalText = null,
  } = options;

  const pageCount = doc.bufferedPageRange().count;

  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);

    // Agregar número de página
    if (pageNumber) {
      doc
        .fontSize(8)
        .text(`Página ${i + 1} de ${pageCount}`, 50, doc.page.height - 50, {
          align: "center",
          width: doc.page.width - 100,
        });
    }

    // Agregar información legal en la última página
    if (i === pageCount - 1 && legalText) {
      doc
        .fontSize(8)
        .text(legalText, 50, doc.page.height - 30, {
          align: "center",
          width: doc.page.width - 100,
        });
    }

    // Texto adicional si se proporciona
    if (additionalText) {
      doc
        .fontSize(8)
        .text(additionalText, 50, doc.page.height - 15, {
          align: "center",
          width: doc.page.width - 100,
        });
    }
  }
}

module.exports = renderFooter;
