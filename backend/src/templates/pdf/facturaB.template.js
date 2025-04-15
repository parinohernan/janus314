const renderHeader = require("./common/header");
const renderClienteInfo = require("./common/clienteInfo.js");
const renderItemsListConIva = require("./common/itemsListConIva.js");
const renderElectronicInfo = require("./common/electronicInfo.js");
const path = require("path");

/**
 * Genera un PDF para una Factura B
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} data - Datos de la factura
 */
async function renderFacturaB(doc, data) {
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
      title: "B",
      documentType: "B",
      documentNumber: `${factura.DocumentoSucursal}-${factura.DocumentoNumero}`,
      logoPath: logoPath,
    });

    // Agregar indicador de original o duplicado
    doc.fontSize(12).font("Helvetica-Bold");
    if (isOriginal) {
      doc.text("ORIGINAL", 40, 2, { align: "center" });
    } else {
      doc.text("DUPLICADO", 40, 2, { align: "center" });
    }
    doc.font("Helvetica");

    // Información del cliente
    y += 8;
    y = renderClienteInfo(doc, factura, y);
    
    // Tabla de items con IVA individual
    // console.log("items", items);
    y = renderItemsListConIva(doc, items, y);

    // me posiciono en la parte de los totales
    y = 660;
    let yTotales = y;
    let xTotales = 420;

    doc.x = xTotales;

    // Totales (en Factura B no se discrimina IVA)
    doc.font("Helvetica-Bold");

    if (factura.ImporteBonificado && factura.ImporteBonificado > 0) {
      doc.text("Subtotal:", xTotales, y, { width: 90, align: "right" });
      doc.text(
        factura.ImporteBruto ? factura.ImporteBruto.toFixed(2) : "0.00",
        xTotales + 90,
        y,
        { width: 70, align: "right" }
      );
      y += 20;

      doc.text("Bonificación:", xTotales, y, { width: 90, align: "right" });
      doc.text(factura.ImporteBonificado.toFixed(2), xTotales + 90, y, {
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

    // Línea antes del total
    doc.strokeColor("#000000").moveTo(20, 650).lineTo(580, 650).stroke();
    y += 10;

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

module.exports = renderFacturaB;
