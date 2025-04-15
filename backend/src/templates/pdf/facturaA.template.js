const renderHeader = require("./common/header");
const renderClienteInfo = require("./common/clienteInfo.js");
const renderItemsList = require("./common/itemsList.js");
const renderElectronicInfo = require("./common/electronicInfo.js");
const path = require("path");

/**
 * Genera un PDF para una Factura A
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} data - Datos de la factura
 */
async function renderFacturaA(doc, data) {
  const { factura, items } = data;
  const logoPath = path.join(__dirname, "./common/logos/logoempresa.png");

  // Establecer la fuente Helvetica para todo el documento
  doc.font("Helvetica");

  // Función para renderizar una página (original o duplicado)
  const renderPage = async (isOriginal) => {
    // Encabezado
    let y = renderHeader(doc, {
      fecha: factura.Fecha,
      companyName: factura.Empresa.RazonSocial,
      companyName2: factura.Empresa.PieCero,
      companyTaxId: factura.Empresa.Cuit,
      companyAddress: factura.Empresa.DomicilioComercial,
      companyPhone: factura.Empresa.Telefono,
      companyEmail: factura.Empresa.Email,
      companyLocalidad: factura.Empresa.Localidad,
      companyIngresosBrutos: factura.Empresa.IngresosBrutos,
      companyInicioActividades:
        factura.Empresa.InicioActividades.toLocaleDateString("es-AR"),
      title: "A",
      documentType: "A",
      documentNumber: `${factura.DocumentoSucursal}-${factura.DocumentoNumero}`,
      logoPath: logoPath,
    });

    // Agregar indicador de original o duplicado
/*
doc.fontSize(26).text(title, doc.page.width / 2 - 14, 26, {
    width: 12,
    align: "center",
    height: 7,
  });
*/

   
    doc.fontSize(12).font("Helvetica-Bold");
    if (isOriginal) {
      doc.text("ORIGINAL", 40, 2, { align: "center" });
    } else {
      doc.text("DUPLICADO", 36, 2, { align: "center" });
    }
    doc.font("Helvetica");

    // Información del cliente
    y += 8;
    y = renderClienteInfo(doc, factura, y);

    // Tabla de items
    y = renderItemsList(doc, items, y, {
      showIva: true, // Mostrar columna de IVA en facturas A
    });

    // me posiciono en la parte de los totales
    //   y += 10;
    y = 660;
    let yTotales = y;
    let xTotales = 420;

    doc.x = xTotales;

    // Totales
    doc.font("Helvetica-Bold");
    doc.text("Subtotal:", xTotales, y, { width: 90, align: "right" });
    doc.text(
      factura.ImporteNeto ? factura.ImporteNeto.toFixed(2) : "0.00",
      xTotales + 90,
      y,
      { width: 70, align: "right" }
    );
    y += 20;

    doc.text("IVA 21%:", xTotales, y, { width: 90, align: "right" });
    doc.text(
      factura.ImporteIva1 ? factura.ImporteIva1.toFixed(2) : "0.00",
      xTotales + 90,
      y,
      { width: 70, align: "right" }
    );
    y += 20;

    if (factura.ImporteIva2 && factura.ImporteIva2 > 0) {
      doc.text("IVA 10.5%:", xTotales, y, { width: 90, align: "right" });
      doc.text(factura.ImporteIva2.toFixed(2), xTotales + 90, y, {
        width: 70,
        align: "right",
      });
      y += 20;
    }

    if (factura.ImportePercepcionIIBB && factura.ImportePercepcionIIBB > 0) {
      doc.text("Perc. IIBB:", xTotales, y, { width: 90, align: "right" });
      doc.text(factura.ImportePercepcionIIBB.toFixed(2), xTotales + 90, y, {
        width: 70,
        align: "right",
      });
      y += 20;
    }

    //   // Línea antes de los TOTALES
    doc.strokeColor("#000000").moveTo(20, 650).lineTo(580, 650).stroke();
    y += 10;
    // texto no se aceptan deboluciones despues le las 48hs

    doc.fontSize(10);
    const convertirNumeroAPalabras = require("../../utils/convertirNumeroAPalabras");

    const TotalEnPalabras = convertirNumeroAPalabras(factura.ImporteTotal);
    console.log("Total", factura.ImporteTotal);
    doc.text(`Son ${TotalEnPalabras}`, 20, yTotales);
    doc.text("No se aceptan devoluciones después de las 48hs", 20, yTotales + 12);

    doc.fontSize(12).text("TOTAL:", xTotales, y, { width: 90, align: "right" });
    doc.text(
      factura.ImporteTotal ? factura.ImporteTotal.toFixed(2) : "0.00",
      xTotales + 90,
      y,
      { width: 70, align: "right" }
    );

    // Renderizar información electrónica (QR, CAE, logo ARCA, etc.)
    await renderElectronicInfo(doc, factura, yTotales);
  };

  // Renderizar página original
  await renderPage(true);
  
  // Agregar nueva página para el duplicado
  doc.addPage();
  
  // Renderizar página duplicado
  await renderPage(false);
}

module.exports = renderFacturaA;
