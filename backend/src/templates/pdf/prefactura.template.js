const renderClienteInfo = require("./common/clienteInfo.js");
const renderItemsListConIva = require("./common/itemsListConIva.js");
const { renderPiePrefactura } = require("./common/piePrefactura");
const path = require("path");

/**
 * Genera un PDF para una Prefactura
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} data - Datos de la prefactura
 */
async function renderPrefactura(doc, data) {
  const { prefactura, items, logoPath } = data;
  // Si no se proporciona logoPath, usar el por defecto
  const finalLogoPath = logoPath || path.join(__dirname, "./common/logos/logoempresa.png");
  //prefactura.DocumentoNumero = "1234567890";
  // Establecer la fuente Helvetica para todo el documento
  doc.font("Helvetica");
  const interlineado = 10; //10 media pagina y 20 A4

  // Función para renderizar una página
  const renderPage = async () => {
    // Agregar logo de la empresa si está disponible
    if (finalLogoPath) {
      try {
        doc.image(finalLogoPath, 20, 20, {
          width: 60,
          height: 60,
          resolution: 300
        });
      } catch (error) {
        console.error("Error al cargar el logo en prefactura:", error);
      }
    }
    
    // Encabezado simple con solo la leyenda "Prefactura Nº:" y el número
    doc.fontSize(14).font("Helvetica-Bold");
    doc.text(`Remito Nº: ${prefactura.DocumentoSucursal} - ${prefactura.DocumentoNumero}`, 40, 40, { align: "center" });
    
    // Agregar fecha en la parte superior derecha
    const fecha = new Date(prefactura.Fecha).toLocaleDateString('es-AR');
    doc.fontSize(12).font("Helvetica");
    doc.text(`Fecha: ${fecha}`, 450, 40, { align: "right" });
    
    // Restaurar fuente normal
    doc.font("Helvetica");
    
    // Información del cliente
    let y = 80;
    y = renderClienteInfo(doc, prefactura, y);
    
        // Tabla de ítems con IVA (igual que Factura B)
        y = 110;
        y = renderItemsListConIva(doc, items, y, interlineado);
    renderPiePrefactura(doc, {
      items,
      prefactura,
      y,
      xTotales: 370,
      interlineado,
    });
  };

  // Renderizar solo una página (sin duplicado)
  await renderPage();
}

module.exports = renderPrefactura; 