const renderHeader = require("./common/header");
const renderClienteInfo = require("./common/clienteInfo.js");
const renderElectronicInfo = require("./common/electronicInfo.js");
const { formatearNumero, formatearFecha } = require("../../utils/formatters");
const path = require("path");

async function renderNotaCreditoF(doc, { factura: notaCredito, items, logoPath }) {
  // Si no se proporciona logoPath, usar el por defecto
  const finalLogoPath = logoPath || path.join(__dirname, "./common/logos/logoempresa.png");

  // Establecer la fuente Helvetica para todo el documento
  doc.font("Helvetica");

  // Función para renderizar una página (original o duplicado)
  const renderPage = async (isOriginal) => {
    // Encabezado
    let y = renderHeader(doc, {
      fecha: notaCredito.Fecha,
      companyName: notaCredito.Empresa.RazonSocial,
      companyName2: notaCredito.Empresa.PieCero,
      companyTaxId: notaCredito.Empresa.Cuit,
      companyAddress: notaCredito.Empresa.DomicilioComercial,
      companyPhone: notaCredito.Empresa.Telefono,
      companyEmail: notaCredito.Empresa.Email,
      companyLocalidad: notaCredito.Empresa.Localidad,
      companyIngresosBrutos: notaCredito.Empresa.IngresosBrutos,
      companyInicioActividades: notaCredito.Empresa.InicioActividades 
        ? notaCredito.Empresa.InicioActividades.toLocaleDateString("es-AR")
        : "No especificado",
      title: "F",
      documentType: "F",
      documentNumber: `${notaCredito.DocumentoSucursal}-${notaCredito.DocumentoNumero}`,
      logoPath: finalLogoPath,
      isNotaCredito: true,
    });

    // Agregar indicador de "Nota de Crédito"
    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("Nota de Crédito", 30, 2, { align: "center" });
    doc.font("Helvetica");

    // Información del cliente
    y += 8;
    y = renderClienteInfo(doc, notaCredito, y);

    // Información de referencia a factura (si existe)
    if (notaCredito.factura_tipo && notaCredito.factura_sucursal && notaCredito.factura_numero) {
      y += 10;
      doc.font("Helvetica-Bold").fontSize(10);
      doc.text("COMPROBANTE DE REFERENCIA:", 20, y);
      doc.font("Helvetica").fontSize(10);
      doc.text(`${notaCredito.factura_tipo} ${notaCredito.factura_sucursal}-${notaCredito.factura_numero}`, 20, y + 15);
      y += 25;
    }

    // Tabla de items
    y += 10;
    let tableY = y;

    // Encabezados (ancho total 20 a 580 = 560px)
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Código", 20, tableY, { width: 60 });
    doc.text("Cant.", 80, tableY, { width: 35 });
    doc.text("Descripción", 118, tableY, { width: 287 });
    doc.text("Precio c/IVA", 405, tableY, { width: 85, align: "right" });
    doc.text("Subtotal c/IVA", 490, tableY, { width: 90, align: "right" });

    // Línea separadora
    tableY += 15;
    doc.moveTo(20, tableY).lineTo(580, tableY).stroke();
    tableY += 10;

    // Items (precios CON IVA incluido - usar valores ya calculados del controlador)
    doc.font("Helvetica").fontSize(10);
    items.forEach((item) => {
      if (tableY > 640) {
        doc.addPage();
        tableY = 50;
        
        // Repetir encabezados
        doc.font("Helvetica-Bold");
        doc.text("Código", 20, tableY, { width: 60 });
        doc.text("Cant.", 80, tableY, { width: 35 });
        doc.text("Descripción", 118, tableY, { width: 287 });
        doc.text("Precio c/IVA", 405, tableY, { width: 85, align: "right" });
        doc.text("Subtotal c/IVA", 490, tableY, { width: 90, align: "right" });
        
        tableY += 15;
        doc.moveTo(20, tableY).lineTo(580, tableY).stroke();
        tableY += 10;
        
        doc.font("Helvetica");
      }

      doc.text(item.CodigoArticulo || "", 20, tableY, { width: 60 });
      doc.text(item.Cantidad.toString(), 80, tableY, { width: 35 });
      doc.text(item.Descripcion || item.Articulo?.Descripcion || "", 118, tableY, { width: 287 });
      doc.text(formatearNumero(item.PrecioUnitario || 0), 405, tableY, { width: 85, align: "right" });
      doc.text(formatearNumero(item.Subtotal || 0), 490, tableY, { width: 90, align: "right" });

      tableY += 15;
    });

    // me posiciono en la parte de los totales
    y = 660;
    let yTotales = y;
    let xTotales = 420;

    doc.x = xTotales;

    // Totales
    doc.font("Helvetica-Bold").fontSize(10);

    // Línea antes del total
    doc.strokeColor("#000000").moveTo(20, 650).lineTo(580, 650).stroke();
    y += 10;

    // Total en palabras
    doc.fontSize(10);
    const convertirNumeroAPalabras = require("../../utils/convertirNumeroAPalabras");
    const TotalEnPalabras = convertirNumeroAPalabras(notaCredito.ImporteTotal);
    doc.text(`Son ${TotalEnPalabras}`, 20, yTotales);
    
    // Observaciones específicas para notas de crédito
    if (notaCredito.Observacion) {
      doc.text(`Observación: ${notaCredito.Observacion}`, 20, yTotales + 12);
    }

    doc.fontSize(12).text("TOTAL:", xTotales, y, { width: 90, align: "right" });
    doc.text(
      formatearNumero(notaCredito.ImporteTotal),
      xTotales + 90,
      y,
      { width: 70, align: "right" }
    );

    // Renderizar información electrónica (QR, CAE, logo ARCA, etc.) si corresponde
    // NCF típicamente no es electrónica, pero por si acaso
    if (notaCredito.afip_cae) {
      await renderElectronicInfo(doc, notaCredito, yTotales);
    }
  };

  // Renderizar página original
  await renderPage(true);
  
  // Agregar nueva página para el duplicado
  doc.addPage();
  
  // Renderizar página duplicado
  await renderPage(false);
}

module.exports = renderNotaCreditoF; 