/**
 * Renderiza la información electrónica en el documento PDF (QR, CAE, logo ARCA, etc.)
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} factura - Datos de la factura
 * @param {number} yTotales - Posición Y de los totales
 * @returns {number} - Posición Y final
 */
async function renderElectronicInfo(doc, factura, yTotales) {
  // Código QR en el pie de página (solo para comprobantes electrónicos)
  if (
    (factura.DocumentoTipo === "FCA" || factura.DocumentoTipo === "FCB") &&
    factura.afip_cae
  ) {
    // Zona para el QR
    doc.y = yTotales;
    doc.x = 20;

    try {
      // Generar datos del QR
      const datosQR = await generarDatosQR(factura);

      if (datosQR) {
        // Generar imagen QR
        const qrImage = await generarQR(datosQR);

        if (qrImage) {
          // Dibujar el QR
          doc.image(qrImage, doc.x, doc.y + 24, { width: 80, height: 80 });
        } else {
          console.error("Error generando QR para factura");
        }
      }
    } catch (error) {
      console.error("Error generando QR para factura:", error);
    }
  }

  // Información del CAE a la derecha del QR
  if (factura.DocumentoTipo === "FCA" || factura.DocumentoTipo === "FCB") {
    doc.x = 140;
    doc.y = yTotales + 80;
    doc.fontSize(8);
    doc.text(
      factura.afip_cae
        ? `CAE: ${factura.afip_cae} - Vto: ${new Date(
            factura.afip_cae_vencimiento
          ).toLocaleDateString("es-AR")}`
        : null
    );
    doc.x = 140;
    doc.y = yTotales + 10;

    // Modificar esta parte para verificar si el archivo existe
    const logoARCA = path.join(__dirname, "./logos/ARCA.PNG");
    try {
      // Verificar si el archivo existe antes de intentar cargarlo
      const fs = require("fs");
      if (fs.existsSync(logoARCA)) {
        doc.image(logoARCA, doc.x, doc.y + 10, { width: 80, height: 40 });
      } else {
        console.warn(`Logo ARCA no encontrado en: ${logoARCA}`);
        // Opcional: Dibujar un rectángulo o texto alternativo
        doc.rect(doc.x, doc.y, 60, 100).strokeColor("#cccccc").stroke();
        doc.text("Logo no disponible", doc.x + 10, doc.y + 40, {
          width: 80,
          align: "center",
        });
      }
    } catch (error) {
      console.error(`Error al cargar el logo ARCA: ${error.message}`);
    }
  }

  // Leyenda "Esta Agencia no se responsabiliza..."
  doc.fontSize(8);
  doc.y = yTotales + 100;
  doc.text(
    "Esta Agencia no se responsabiliza por los datos ingresados en el detalle de la operación"
  );

  return doc.y;
}

// Importar las funciones necesarias
const path = require("path");
const { generarDatosQR, generarQR } = require("../../../utils/qrAfip");

module.exports = renderElectronicInfo; 