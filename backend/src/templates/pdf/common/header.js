/**
 * Genera el encabezado estándar para documentos
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} options - Opciones de configuración
 */
function renderHeader(doc, options = {}) {
  const {
    fecha = null,
    title = "",
    documentType = "",
    documentNumber = "",
    companyName = "",
    companyName2 = "",
    companyTaxId = "",
    companyAddress = "",
    companyLocalidad = "",
    companyPhone = "",
    companyEmail = "",

    companyIngresosBrutos = "",
    companyInicioActividades = "",
    showLogo = true,
    logoPath = null,
  } = options;

  // constantes de posicionamiento
  const logoY = 20;
  const logoX = 20;
  const logoWidth = 90;
  const logoHeight = 90;
  const titleY = 30;
  const titleX = doc.page.width / 2 - 12;
  const titleWidth = 12;
  const titleHeight = 7;
  const infoEmpresaY = logoY + 50;
  const infoEmpresaX = logoX + logoWidth + 20;

  const fontSize = {
    infoEmpresa: 12,
    fecha: 12,
  };
  //   // Título del documento
  //   doc.rect(10, 10, doc.page.width - 20, 110).stroke(); //rectangulo contenedor del encabezado
  //linea debajo del rectangulo
  //   doc.rect(10, 115, doc.page.width - 20, 0.1).stroke();
  doc.strokeColor("#000000").moveTo(20, 115).lineTo(580, 115).stroke();
  const rectY = doc.y;
  doc.rect(doc.page.width / 2 - 15, 20, 30, 30).stroke(); //rectangulo contenedor de letra de Comprobante
  doc.fontSize(26).text(title, doc.page.width / 2 - 14, 26, {
    width: 12,
    align: "center",
    height: 7,
  });
  doc.y = rectY + 30; // Asegurar que la posición Y esté después del rectángulo
  doc.moveDown();

  // Logo de la empresa (si está habilitado y se proporciona una ruta)
  if (showLogo && logoPath) {
    try {
      doc.image(logoPath, logoX, logoY, {
        width: logoWidth,
        height: logoHeight,
      });
    } catch (error) {
      console.error("Error al cargar el logo:", error);
    }
  }

  // informacion del documento
  // Posicionamos en el margen superior
  doc.y = 20;

  // Tipo y número de documento
  if (documentType && documentNumber) {
    doc.fontSize(12).text(`Factura N° ${documentNumber}`, { align: "right" });
  }
  // fecha
  doc.fontSize(12).text(`Fecha: ${fecha}`, { align: "right" });
  doc.moveDown();

  // informacion general de la empresa
  // correr x a margen izquierdo

  doc.y = 20;
  doc.x = infoEmpresaX;

  doc
    .fontSize(fontSize.infoEmpresa + 4)
    .text(`${companyName}`, { align: "left" });
  doc.text(`${companyName2}`, { align: "left" });

  doc.y = infoEmpresaY;
  doc
    .fontSize(fontSize.infoEmpresa)
    .text(`${companyLocalidad}`, { align: "left" });
  doc
    .fontSize(fontSize.infoEmpresa)
    .text(`${companyAddress}`, { align: "left" });
  doc
    .fontSize(fontSize.infoEmpresa)
    .text(`Teléfono: ${companyPhone}`, { align: "left" });

  // Información legalde la empresa
  doc.x = doc.page.width / 2 + 40;
  doc.y = infoEmpresaY;

  //   doc.fontSize(12).text(companyName, { align: "left" });
  doc.fontSize(fontSize.infoEmpresa).text(`CUIT: ${companyTaxId}`);
  doc
    .fontSize(fontSize.infoEmpresa)
    .text(`Ingresos Brutos: ${companyIngresosBrutos}`);
  doc
    .fontSize(fontSize.infoEmpresa)
    .text(`Inicio de Actividades: ${companyInicioActividades}`);
  //   doc.text(`Dirección: ${companyAddress}`);
  //   doc.text(`Tel: ${companyPhone}`);
  doc.moveDown(); // espacio
  return doc.y; // Retornar la posición Y actual para saber dónde continuar
}

module.exports = renderHeader;
