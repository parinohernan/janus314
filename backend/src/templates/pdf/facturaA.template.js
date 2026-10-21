const renderHeader = require("./common/header");
const renderClienteInfo = require("./common/clienteInfo.js");
const renderItemsList = require("./common/itemsList.js");
const renderElectronicInfo = require("./common/electronicInfo.js");
const { lineasIvaDiscriminado } = require("./common/formatBonificacion");
const { renderPieExactoDiscriminado } = require("./common/pieDiscriminado");
const {
  columnasPie,
  filaPie,
  etiquetaBonificacion,
  importeBonificadoSolo,
} = require("./common/pieTotalesLayout");
const { renderPieLeyendaIzquierda } = require("./common/pieLeyendaIzquierda");
const { resolverYInicioQr } = require("./common/piePageBounds");
const { usaMatematicaExacta } = require("../../utils/matematicaExacta");
const { TYPOGRAPHY_DEFAULT } = require("./facturaA.typography");
const path = require("path");

/**
 * Genera un PDF para una Factura A
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} data - Datos de la factura
 */
async function renderFacturaA(doc, data) {
  const { factura, items, logoPath, typography = TYPOGRAPHY_DEFAULT } = data;
  // Si no se proporciona logoPath, usar el por defecto
  const finalLogoPath = logoPath || path.join(__dirname, "./common/logos/logoempresa.png");

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
      companyInicioActividades: factura.Empresa.InicioActividades 
        ? factura.Empresa.InicioActividades
        : "No especificado",
      title: "A",
      documentType: "A",
      documentNumber: `${factura.DocumentoSucursal}-${factura.DocumentoNumero}`,
      logoPath: finalLogoPath,
      isNotaCredito: false, // Indicar que es una factura
      typography,
    });

    // Agregar indicador de original o duplicado
/*
doc.fontSize(26).text(title, doc.page.width / 2 - 14, 26, {
    width: 12,
    align: "center",
    height: 7,
  });
*/

   
    doc.fontSize(typography.originalDuplicado || 12).font("Helvetica-Bold");
    if (isOriginal) {
      doc.text("ORIGINAL", 40, 2, { align: "center" });
    } else {
      doc.text("DUPLICADO", 36, 2, { align: "center" });
    }
    doc.font("Helvetica");

    // Información del cliente
    y += 8;
    y = renderClienteInfo(doc, factura, y, { fontSize: typography.cliente });

    const exacto = usaMatematicaExacta(factura.Fecha);

    // Tabla de items
    y = renderItemsList(doc, items, y, {
      showIva: true,
      exacto,
      typography,
    });

    y = 660;
    let yTotales = y;
    const cols = columnasPie(doc);
    const anchoLeyendaIzq = Math.max(200, cols.xLabel - 28);
    const convertirNumeroAPalabras = require("../../utils/convertirNumeroAPalabras");

    let yZonaElectronica = resolverYInicioQr(doc, yTotales, 8);

    if (exacto) {
      renderPieExactoDiscriminado(doc, { items, documento: factura, y });
      const TotalEnPalabras = convertirNumeroAPalabras(factura.ImporteTotal);
      yZonaElectronica = renderPieLeyendaIzquierda(doc, {
        y: yTotales,
        width: anchoLeyendaIzq,
        totalEnPalabras: TotalEnPalabras,
        fontSize: typography.pie?.leyenda ?? 10,
        mostrarDevoluciones: true,
      });
    } else {
      doc.font("Helvetica-Bold");
      const hayBonificacion = Number(factura.ImporteBonificado) > 0;
      const subtotalA = hayBonificacion ? factura.ImporteBruto : factura.ImporteNeto;
      y = filaPie(
        doc,
        cols,
        y,
        "Subtotal:",
        subtotalA ? Number(subtotalA).toFixed(2) : "0.00"
      );

      if (hayBonificacion) {
        y = filaPie(
          doc,
          cols,
          y,
          etiquetaBonificacion(factura.PorcentajeBonificacion),
          importeBonificadoSolo(factura.ImporteBonificado)
        );
        y = filaPie(
          doc,
          cols,
          y,
          "Importe neto:",
          factura.ImporteNeto ? Number(factura.ImporteNeto).toFixed(2) : "0.00"
        );
      }

      lineasIvaDiscriminado(factura).forEach((iva) => {
        y = filaPie(
          doc,
          cols,
          y,
          `IVA ${iva.porcentaje}%:`,
          iva.importe.toFixed(2)
        );
      });

      if (factura.ImportePercepcionIIBB && factura.ImportePercepcionIIBB > 0) {
        y = filaPie(doc, cols, y, "Perc. IIBB:", factura.ImportePercepcionIIBB.toFixed(2));
      }

      doc.strokeColor("#000000").moveTo(20, 650).lineTo(580, 650).stroke();
      y += 10;

      const TotalEnPalabras = convertirNumeroAPalabras(factura.ImporteTotal);
      yZonaElectronica = renderPieLeyendaIzquierda(doc, {
        y: yTotales,
        width: anchoLeyendaIzq,
        totalEnPalabras: TotalEnPalabras,
        fontSize: typography.pie?.leyenda ?? 10,
        mostrarDevoluciones: true,
      });

      doc.fontSize(typography.pie?.total ?? 12);
      filaPie(
        doc,
        cols,
        y,
        "TOTAL:",
        factura.ImporteTotal ? factura.ImporteTotal.toFixed(2) : "0.00"
      );
    }

    // Renderizar información electrónica (QR, CAE, logo ARCA, etc.)
    await renderElectronicInfo(doc, factura, yZonaElectronica);
  };

  // Renderizar página original
  await renderPage(true);
  
  // Agregar nueva página para el duplicado
  doc.addPage();
  
  // Renderizar página duplicado
  await renderPage(false);
}

module.exports = renderFacturaA;
