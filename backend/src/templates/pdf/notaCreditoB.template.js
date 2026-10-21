const renderHeader = require("./common/header");
const renderClienteInfo = require("./common/clienteInfo.js");
const renderItemsListConIva = require("./common/itemsListConIva.js");
const renderElectronicInfo = require("./common/electronicInfo.js");
const { subtotalConIvaDesdeItems } = require("./common/formatBonificacion");
const { renderPieExactoConIva } = require("./common/pieConIva");
const {
  columnasPie,
  filaPie,
  etiquetaBonificacion,
  importeBonificadoSolo,
} = require("./common/pieTotalesLayout");
const { renderPieLeyendaIzquierda } = require("./common/pieLeyendaIzquierda");
const { resolverYInicioQr } = require("./common/piePageBounds");
const { usaMatematicaExacta } = require("../../utils/matematicaExacta");
const path = require("path");

/**
 * Genera un PDF para una Nota de Crédito B
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} data - Datos de la nota de crédito
 */
async function renderNotaCreditoB(doc, data) {
  const { factura: notaCredito, items, logoPath } = data;
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
      title: "B",
      documentType: "B",
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

    // Tabla de items CON IVA incluido (igual que Factura B)
    y = renderItemsListConIva(doc, items, y);

    // me posiciono en la parte de los totales
    y = 660;
    let yTotales = y;
    const cols = columnasPie(doc);
    const anchoLeyendaIzq = Math.max(200, cols.xLabel - 28);

    let yZonaElectronica = resolverYInicioQr(doc, yTotales, 8);
    const convertirNumeroAPalabras = require("../../utils/convertirNumeroAPalabras");

    // Totales (NO se discrimina IVA en NCB)
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
      doc.font("Helvetica-Bold");

      if (notaCredito.ImporteBonificado && notaCredito.ImporteBonificado > 0) {
        const subtotalConIva = subtotalConIvaDesdeItems(items);
        y = filaPie(
          doc,
          cols,
          y,
          "Subtotal:",
          subtotalConIva ? subtotalConIva.toFixed(2) : "0.00"
        );

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
      filaPie(
        doc,
        cols,
        y,
        "TOTAL:",
        notaCredito.ImporteTotal ? notaCredito.ImporteTotal.toFixed(2) : "0.00"
      );
    }

    // Renderizar información electrónica (QR, CAE, logo ARCA, etc.)
    await renderElectronicInfo(doc, notaCredito, yZonaElectronica);
  };

  // Renderizar página original
  await renderPage(true);
  
  // Agregar nueva página para el duplicado
  doc.addPage();
  
  // Renderizar página duplicado
  await renderPage(false);
}

module.exports = renderNotaCreditoB;
