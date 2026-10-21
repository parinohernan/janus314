const { formatearFecha } = require("../../../utils/formatters");

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
    companyIngresosBrutos = "",
    companyInicioActividades = "",
    showLogo = true,
    logoPath = null,
    isNotaCredito = false, // Para distinguir notas de crédito
    isNotaDebito = false, // Para distinguir notas de débito
    isOrdenCompra = false, // Para órdenes de compra
    isRemito = false, // PRF / remito interno con encabezado completo
    typography = null,
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
  /** Borde izquierdo del recuadro de la letra (A/B/C); la razón social no debe invadirlo. */
  const letterBoxLeft = doc.page.width / 2 - 15;
  const companyNameMaxWidth = Math.max(72, letterBoxLeft - infoEmpresaX - 10);

  const fontSize = typography?.header || {
    infoEmpresa: 12,
    fecha: 12,
    documentMeta: 12,
    companyName: 16,
    titleLetter: 26,
  };

  // Logo de la empresa (si está habilitado y se proporciona una ruta)
  if (showLogo && logoPath) {
    try {
      // Cargar el logo con resolución de 300 DPI
      doc.image(logoPath, logoX, logoY, {
        width: logoWidth,
        height: logoHeight,
        resolution: 300 // Establecer resolución a 300 DPI
      });
    } catch (error) {
      console.error("❌ Error al cargar el logo:", error.message);
    }
  }

  //   // Título del documento
  //   doc.rect(10, 10, doc.page.width - 20, 110).stroke(); //rectangulo contenedor del encabezado
  //linea debajo del rectangulo
  //   doc.rect(10, 115, doc.page.width - 20, 0.1).stroke();
  doc.strokeColor("#000000").moveTo(20, 115).lineTo(580, 115).stroke();
  const rectY = doc.y;
  doc.rect(doc.page.width / 2 - 15, 20, 30, 30).stroke(); //rectangulo contenedor de letra de Comprobante
  doc.fontSize(fontSize.titleLetter || 26).text(title, doc.page.width / 2 - 14, 26, {
    width: 12,
    align: "center",
    height: 7,
  });
  doc.y = rectY + 30; // Asegurar que la posición Y esté después del rectángulo
  doc.moveDown();

  // informacion del documento
  // Posicionamos en el margen superior
  doc.y = 20;

  // Tipo y número de documento
  if (documentType && documentNumber) {
    // Determinar el tipo de documento
    let documentTypeText = "Factura";
    if (isNotaCredito) {
      documentTypeText = "Nota de Crédito";
    } else if (isNotaDebito) {
      documentTypeText = "Nota de Débito";
    } else if (isOrdenCompra) {
      documentTypeText = "Orden de Compra";
    } else if (isRemito) {
      documentTypeText = "Remito";
    }
    
    doc
      .fontSize(fontSize.documentMeta || fontSize.fecha || 12)
      .text(`${documentTypeText} N° ${documentNumber}`, { align: "right" });
  }
  // fecha
  doc
    .fontSize(fontSize.fecha || 12)
    .text(`Fecha: ${formatearFecha(fecha)}`, { align: "right" });
  doc.moveDown();

  // informacion general de la empresa
  // correr x a margen izquierdo

  doc.x = infoEmpresaX;
  doc.y = logoY;

  doc.fontSize(fontSize.companyName);
  doc.text(String(companyName || "").trim(), {
    width: companyNameMaxWidth,
    align: "left",
    lineGap: 1,
  });
  const pieEmpresa = String(companyName2 || "").trim();
  if (pieEmpresa) {
    doc.text(pieEmpresa, {
      width: companyNameMaxWidth,
      align: "left",
      lineGap: 1,
    });
  }

  // Dirección/teléfono: debajo del nombre aunque ocupe varios renglones
  doc.y = Math.max(infoEmpresaY, doc.y + 2);
  doc.x = infoEmpresaX;
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
  const inicioActividades =
    !companyInicioActividades || companyInicioActividades === "No especificado"
      ? companyInicioActividades || "No especificado"
      : formatearFecha(companyInicioActividades);
  doc.fontSize(fontSize.infoEmpresa).text(`Inicio de Actividades: ${inicioActividades}`);
  //   doc.text(`Dirección: ${companyAddress}`);
  //   doc.text(`Tel: ${companyPhone}`);
  doc.moveDown(); // espacio
  return doc.y; // Retornar la posición Y actual para saber dónde continuar
}

module.exports = renderHeader;
