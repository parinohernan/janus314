const renderHeader = require("./common/header");
const renderClienteInfo = require("./common/clienteInfo.js");
const renderElectronicInfo = require("./common/electronicInfo.js");
const path = require("path");

/**
 * Genera un PDF para una Nota de Débito A
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} data - Datos de la nota de débito
 */
async function renderNotaDebitoA(doc, data) {
  const { notaDebito, items, logoPath } = data;
  // Si no se proporciona logoPath, usar el por defecto
  const finalLogoPath = logoPath || path.join(__dirname, "./common/logos/logoempresa.png");

  // Establecer la fuente Helvetica para todo el documento
  doc.font("Helvetica");

  // Función para renderizar una página (original o duplicado)
  const renderPage = async (isOriginal) => {
    // Encabezado
    let y = renderHeader(doc, {
      fecha: notaDebito.Fecha,
      companyName: notaDebito.Empresa.RazonSocial,
      companyName2: notaDebito.Empresa.PieCero,
      companyTaxId: notaDebito.Empresa.Cuit,
      companyAddress: notaDebito.Empresa.DomicilioComercial,
      companyPhone: notaDebito.Empresa.Telefono,
      companyEmail: notaDebito.Empresa.Email,
      companyLocalidad: notaDebito.Empresa.Localidad,
      companyIngresosBrutos: notaDebito.Empresa.IngresosBrutos,
      companyInicioActividades: notaDebito.Empresa.InicioActividades 
        ? notaDebito.Empresa.InicioActividades.toLocaleDateString("es-AR")
        : "No especificado",
      title: "A",
      documentType: "A",
      documentNumber: `${notaDebito.DocumentoSucursal}-${notaDebito.DocumentoNumero}`,
      logoPath: finalLogoPath,
      isNotaDebito: true,
    });

    // Agregar indicador de "Nota de Débito"
    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("Nota de Débito", 30, 2, { align: "center" });
    doc.font("Helvetica");

    // Información del cliente
    y += 8;
    y = renderClienteInfo(doc, notaDebito, y);

    // Tabla de items (simplificada para notas de débito)
    y += 15;
    
    // Encabezado de tabla
    doc.font("Helvetica-Bold").fontSize(9);
    doc.text("Descripción", 20, y, { width: 420 });
    doc.text("Importe", 450, y, { width: 130, align: "right" });
    
    // Línea separadora
    y += 15;
    doc.strokeColor("#cccccc").moveTo(20, y).lineTo(580, y).stroke();
    y += 10;

    // Items
    doc.font("Helvetica").fontSize(9);
    items.forEach((item) => {
      const descripcion = item.Descripcion || '';
      const importe = item.Importe || 0;
      
      // Verificar si hay espacio suficiente en la página
      if (y > 600) {
        doc.addPage();
        y = 50;
      }
      
      // Descripción del item (puede ser multilínea)
      const descripcionHeight = doc.heightOfString(descripcion, { width: 420 });
      doc.text(descripcion, 20, y, { width: 420 });
      
      // Importe alineado a la derecha
      doc.text(`$${importe.toFixed(2)}`, 450, y, { width: 130, align: "right" });
      
      y += Math.max(descripcionHeight, 15) + 5;
    });

    // Línea antes de los totales
    y += 10;
    doc.strokeColor("#cccccc").moveTo(20, y).lineTo(580, y).stroke();
    y += 15;

    // Posición de los totales
    let yTotales = 660;
    let xTotales = 420;

    // Totales
    doc.font("Helvetica-Bold").fontSize(10);
    
    // Subtotal
    doc.text("Subtotal:", xTotales, yTotales, { width: 90, align: "right" });
    doc.text(
      notaDebito.ImporteNeto ? notaDebito.ImporteNeto.toFixed(2) : "0.00",
      xTotales + 90,
      yTotales,
      { width: 70, align: "right" }
    );
    yTotales += 20;

    // IVA 21%
    if (notaDebito.ImporteIva1 && notaDebito.ImporteIva1 > 0) {
      doc.text("IVA 21%:", xTotales, yTotales, { width: 90, align: "right" });
      doc.text(
        notaDebito.ImporteIva1.toFixed(2),
        xTotales + 90,
        yTotales,
        { width: 70, align: "right" }
      );
      yTotales += 20;
    }

    // Línea antes del total
    doc.strokeColor("#000000").moveTo(20, 650).lineTo(580, 650).stroke();

    // Total
    doc.fontSize(12).text("TOTAL:", xTotales, yTotales, { width: 90, align: "right" });
    doc.text(
      notaDebito.ImporteTotal ? notaDebito.ImporteTotal.toFixed(2) : "0.00",
      xTotales + 90,
      yTotales,
      { width: 70, align: "right" }
    );

    // Total en palabras
    const convertirNumeroAPalabras = require("../../utils/convertirNumeroAPalabras");
    const TotalEnPalabras = convertirNumeroAPalabras(notaDebito.ImporteTotal);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Son ${TotalEnPalabras}`, 20, 660);

    // Renderizar información electrónica (QR, CAE, logo ARCA, etc.)
    // await renderElectronicInfo(doc, notaDebito, 660);
  };

  // Renderizar página original
  await renderPage(true);
  
  // Agregar nueva página para el duplicado
  doc.addPage();
  
  // Renderizar página duplicado
  await renderPage(false);
}

module.exports = renderNotaDebitoA;
