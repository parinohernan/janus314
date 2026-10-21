const renderHeader = require("./common/header");
const renderClienteInfo = require("./common/clienteInfo.js");
const renderElectronicInfo = require("./common/electronicInfo.js");
const { subtotalConIvaDesdeItems } = require("./common/formatBonificacion");
const {
  columnasPie,
  filaPie,
  etiquetaBonificacion,
  importeBonificadoSolo,
} = require("./common/pieTotalesLayout");
const { renderPieLeyendaIzquierda } = require("./common/pieLeyendaIzquierda");
const { resolverYInicioQr } = require("./common/piePageBounds");
const { formatearNumero, formatearFecha } = require("../../utils/formatters");
const { renderPieExactoConIva } = require("./common/pieConIva");
const { usaMatematicaExacta } = require("../../utils/matematicaExacta");
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
        ? notaCredito.Empresa.InicioActividades
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
    const cols = columnasPie(doc);
    const anchoLeyendaIzq = Math.max(200, cols.xLabel - 28);
    const convertirNumeroAPalabras = require("../../utils/convertirNumeroAPalabras");
    let yZonaElectronica = resolverYInicioQr(doc, yTotales, 8);

    if (usaMatematicaExacta(notaCredito.Fecha)) {
      renderPieExactoConIva(doc, { items, documento: notaCredito, y });
      const TotalEnPalabras = convertirNumeroAPalabras(notaCredito.ImporteTotal);
      yZonaElectronica = renderPieLeyendaIzquierda(doc, {
        y: yTotales,
        width: anchoLeyendaIzq,
        totalEnPalabras: TotalEnPalabras,
        observacion: notaCredito.Observacion,
        mostrarDevoluciones: false,
      });
    } else {
      doc.font("Helvetica-Bold").fontSize(10);

      if (notaCredito.ImporteBonificado && notaCredito.ImporteBonificado > 0) {
        const subtotalConIva = subtotalConIvaDesdeItems(items);
        y = filaPie(doc, cols, y, "Subtotal:", formatearNumero(subtotalConIva));

        const pct = Number(notaCredito.PorcentajeBonificacion) || 0;
        const bonificacionConIva =
          pct > 0 ? subtotalConIva * (pct / 100) : Number(notaCredito.ImporteBonificado) || 0;
        y = filaPie(
          doc,
          cols,
          y,
          etiquetaBonificacion(notaCredito.PorcentajeBonificacion),
          importeBonificadoSolo(bonificacionConIva)
        );
      }

      doc.strokeColor("#000000").moveTo(20, 650).lineTo(580, 650).stroke();
      y += 10;

      const TotalEnPalabras = convertirNumeroAPalabras(notaCredito.ImporteTotal);
      yZonaElectronica = renderPieLeyendaIzquierda(doc, {
        y: yTotales,
        width: anchoLeyendaIzq,
        totalEnPalabras: TotalEnPalabras,
        observacion: notaCredito.Observacion,
        mostrarDevoluciones: false,
      });

      doc.fontSize(12);
      filaPie(doc, cols, y, "TOTAL:", formatearNumero(notaCredito.ImporteTotal));
    }

    // Renderizar información electrónica (QR, CAE, logo ARCA, etc.) si corresponde
    // NCF típicamente no es electrónica, pero por si acaso
    if (notaCredito.afip_cae) {
      await renderElectronicInfo(doc, notaCredito, yZonaElectronica);
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