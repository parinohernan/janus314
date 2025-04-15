const renderClienteInfo = require("./common/clienteInfo.js");
const renderItemsListConIva = require("./common/itemsListConIva.js");
const path = require("path");

/**
 * Genera un PDF para una Prefactura
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} data - Datos de la prefactura
 */
async function renderPrefactura(doc, data) {
  const { prefactura, items } = data;
  const logoPath = path.join(__dirname, "./common/logos/logoempresa.png");
  //prefactura.DocumentoNumero = "1234567890";
  // Establecer la fuente Helvetica para todo el documento
  doc.font("Helvetica");
  const interlineado = 10; //10 media pagina y 20 A4

  // Función para renderizar una página
  const renderPage = async (isOriginal) => {
    // Encabezado simple con solo la leyenda "Prefactura Nº:" y el número
    doc.fontSize(14).font("Helvetica-Bold");
    doc.text(`Prefactura Nº: ${prefactura.DocumentoSucursal} - ${prefactura.DocumentoNumero}`, 40, 40, { align: "center" });
    
    // Agregar indicador de original o duplicado
    doc.fontSize(12);
    doc.text(isOriginal ? "ORIGINAL" : "DUPLICADO", 40, 60, { align: "center" });
    
    // Restaurar fuente normal
    doc.font("Helvetica");
    
    // Información del cliente
    let y = 80;
    y = renderClienteInfo(doc, prefactura, y);
    
    // Tabla de items con IVA individual
    y=110
    y = renderItemsListConIva(doc, items, y, interlineado);

    // me posiciono en la parte de los totales
    //y = 660;
    let yTotales = y;
    let xTotales = 370;

    doc.x = xTotales;

    // Totales
    doc.font("Helvetica");

    if (true || prefactura.ImporteBonificado && prefactura.ImporteBonificado > 0) {
      doc.text("Subtotal:", xTotales, y, { width: 90, align: "right" });
      doc.text(
        prefactura.ImporteBruto ? prefactura.ImporteBruto.toFixed(2) : "0.00",
        xTotales + 90,
        y,
        { width: 70, align: "right" }
      );
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

    // Línea antes del total
    //doc.strokeColor("#000000").moveTo(20, 650).lineTo(580, 650).stroke();
    y += interlineado;

    doc.fontSize(12).text("TOTAL:", xTotales, y, { width: 90, align: "right" });
    doc.text(
      prefactura.ImporteTotal ? prefactura.ImporteTotal.toFixed(2) : "0.00",
      xTotales + 90,
      y,
      { width: 70, align: "right" }
    );
    
    // Agregar leyenda de prefactura
    doc.fontSize(10).font("Helvetica");
    const convertirNumeroAPalabras = require("../../utils/convertirNumeroAPalabras");

    const TotalEnPalabras = convertirNumeroAPalabras(prefactura.ImporteTotal);
    doc.text("Son: "+ TotalEnPalabras, 20, y-22, { align: "left" });
    doc.text("Este documento es una prefactura y no tiene validez fiscal", 20, y-10, { align: "left" });
  };

  // Renderizar página original
  await renderPage(true);
  
  // Agregar página duplicado
  doc.addPage();
  
  // Renderizar página duplicado
  await renderPage(false);
}

module.exports = renderPrefactura; 