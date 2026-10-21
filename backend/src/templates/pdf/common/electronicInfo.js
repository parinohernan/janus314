/**
 * Renderiza la información electrónica en el documento PDF (QR, CAE, logo ARCA, etc.)
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} factura - Datos de la factura o nota de crédito
 * @param {number} yZonaElectronica - Y donde empieza el bloque QR / ARCA (debajo de leyendas)
 * @returns {number} - Posición Y final
 */
async function renderElectronicInfo(doc, factura, yZonaElectronica) {
  yZonaElectronica = Math.min(yZonaElectronica, yMaxInicioQr(doc));
  console.log('🔍 Verificando datos para QR:', {
    documentoTipo: factura.DocumentoTipo,
    afip_cae: factura.afip_cae,
    afip_cae_vencimiento: factura.afip_cae_vencimiento
  });
  
  // Código QR en el pie de página (para facturas A y B, y notas de crédito A y B)
  if (factura.DocumentoTipo === "FCA" || factura.DocumentoTipo === "FCB" || 
      factura.DocumentoTipo === "NCA" || factura.DocumentoTipo === "NCB") {
    doc.y = yZonaElectronica;
    doc.x = 20;

    try {
      console.log('🔄 Generando datos del QR...');
      // Generar datos del QR
      const datosQR = await generarDatosQR(factura);
      console.log('📊 Datos QR generados:', datosQR ? 'Sí' : 'No');

      if (datosQR) {
        console.log('🔄 Generando imagen QR...');
        // Generar imagen QR
        const qrImage = await generarQR(datosQR);
        console.log('🖼️ Imagen QR generada:', qrImage ? 'Sí' : 'No');

        if (qrImage) {
          console.log('📱 Dibujando QR en PDF...');
          // Dibujar el QR
          doc.image(qrImage, doc.x, doc.y, { width: QR_SIZE, height: QR_SIZE });
          console.log('✅ QR dibujado exitosamente');
        } else {
          console.error("❌ Error generando QR para documento");
        }
      } else {
        console.log('⚠️ No se generaron datos QR');
      }
    } catch (error) {
      console.error("💥 Error generando QR para documento:", error);
    }
  }

  // Información del CAE y logo ARCA a la derecha del QR
  if (factura.DocumentoTipo === "FCA" || factura.DocumentoTipo === "FCB" || 
      factura.DocumentoTipo === "NCA" || factura.DocumentoTipo === "NCB") {
    doc.x = 140;
    doc.y = yZonaElectronica;

    // Modificar esta parte para verificar si el archivo existe
    const logoARCA = path.join(__dirname, "./logos/ARCA.PNG");
    try {
      // Verificar si el archivo existe antes de intentar cargarlo
      const fs = require("fs");
      if (fs.existsSync(logoARCA)) {
        doc.image(logoARCA, doc.x, doc.y, { width: 80, height: 40 });
      } else {
        console.warn(`Logo ARCA no encontrado en: ${logoARCA}`);
        // Opcional: Dibujar un rectángulo o texto alternativo
        doc.rect(doc.x, doc.y, 80, 40).strokeColor("#cccccc").stroke();
        doc.text("Logo no disponible", doc.x + 10, doc.y + 20, {
          width: 60,
          align: "left",
        });
      }
    } catch (error) {
      console.error(`Error al cargar el logo ARCA: ${error.message}`);
    }

    // Mostrar CAE y fecha de vencimiento debajo del logo ARCA
    doc.fontSize(10);
    const caeX = 140;
    const caeY = yZonaElectronica + 50;

    if (factura.afip_cae) {
      doc.text(`CAE N°: ${factura.afip_cae}`, caeX, caeY, { width: 200, align: "left" });
    }

    if (factura.afip_cae_vencimiento) {
      doc.text(
        `Fecha Vto. CAE: ${formatearFecha(factura.afip_cae_vencimiento)}`,
        caeX,
        caeY + 14,
        { width: 200, align: "left" }
      );
    }
  }

  // Leyenda "Esta Agencia no se responsabiliza..."
  doc.fontSize(8);
  const yPieLegal = yLeyendaLegal(doc);
  doc.text(
    "Esta Agencia no se responsabiliza por los datos ingresados en el detalle de la operación",
    30,
    yPieLegal,
    { width: 535, align: "center", lineBreak: false }
  );

  return yPieLegal;
}

// Importar las funciones necesarias
const path = require("path");
const { formatearFecha } = require("../../../utils/formatters");
const { generarDatosQR, generarQR } = require("../../../utils/qrAfip");
const { QR_SIZE, yLeyendaLegal, yMaxInicioQr } = require("./piePageBounds");

module.exports = renderElectronicInfo; 