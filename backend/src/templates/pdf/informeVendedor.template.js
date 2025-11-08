const PDFDocument = require('pdfkit');
const logoManager = require('../../utils/logoManager');

/**
 * Genera un PDF para el informe de ventas por vendedor
 */
async function renderInformeVendedor(doc, data, datosEmpresa) {
  try {
    const { vendedor, periodo, facturas, notasCredito, totales } = data;
    
    // Configurar el documento
    const pageWidth = doc.page.width;
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 60;

    // Logo de la empresa
    try {
      const logoPath = await logoManager.getLogoPath(datosEmpresa.LogoURL);
      if (logoPath) {
        doc.image(logoPath, margin, 30, { width: 80, height: 60 });
      }
    } catch (error) {
      console.log('No se pudo cargar el logo:', error.message);
    }

    // Título del informe
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text('INFORME DE VENTAS POR VENDEDOR', margin + 100, 40, { align: 'left' });

    // Información de la empresa
    doc.fontSize(9)
       .font('Helvetica')
       .text(datosEmpresa.RazonSocial || 'Empresa', margin + 100, 60)
       .text(`CUIT: ${datosEmpresa.Cuit || 'N/A'}`, margin + 100, 72);

    yPos = 110;

    // Separador
    doc.moveTo(margin, yPos)
       .lineTo(pageWidth - margin, yPos)
       .stroke();

    yPos += 15;

    // Información del vendedor y período
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Vendedor:', margin, yPos);
    
    doc.fontSize(11)
       .font('Helvetica')
       .text(`${vendedor.descripcion} (${vendedor.codigo})`, margin + 80, yPos);

    yPos += 20;

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Período:', margin, yPos);
    
    doc.fontSize(11)
       .font('Helvetica')
       .text(`${periodo.fechaDesde} - ${periodo.fechaHasta}`, margin + 80, yPos);

    yPos += 25;

    // Cuadro de totales
    const boxWidth = (contentWidth - 20) / 3;
    const boxHeight = 60;
    const boxY = yPos;

    // Total Facturas (Verde)
    doc.rect(margin, boxY, boxWidth, boxHeight)
       .fillAndStroke('#f0fdf4', '#22c55e');
    
    doc.fillColor('#166534')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text('TOTAL FACTURAS', margin + 10, boxY + 10, { width: boxWidth - 20 });
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text(formatCurrency(totales.facturas.importe), margin + 10, boxY + 25, { width: boxWidth - 20 });
    
    doc.fontSize(8)
       .font('Helvetica')
       .text(`${totales.facturas.cantidad} comprobante${totales.facturas.cantidad !== 1 ? 's' : ''}`, margin + 10, boxY + 45, { width: boxWidth - 20 });

    // Total Notas de Crédito (Rojo)
    const boxX2 = margin + boxWidth + 10;
    doc.rect(boxX2, boxY, boxWidth, boxHeight)
       .fillAndStroke('#fef2f2', '#ef4444');
    
    doc.fillColor('#991b1b')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text('TOTAL NOTAS CRÉDITO', boxX2 + 10, boxY + 10, { width: boxWidth - 20 });
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text(formatCurrency(totales.notasCredito.importe), boxX2 + 10, boxY + 25, { width: boxWidth - 20 });
    
    doc.fontSize(8)
       .font('Helvetica')
       .text(`${totales.notasCredito.cantidad} comprobante${totales.notasCredito.cantidad !== 1 ? 's' : ''}`, boxX2 + 10, boxY + 45, { width: boxWidth - 20 });

    // Total General (Azul)
    const boxX3 = boxX2 + boxWidth + 10;
    doc.rect(boxX3, boxY, boxWidth, boxHeight)
       .fillAndStroke('#eff6ff', '#3b82f6');
    
    doc.fillColor('#1e40af')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text('TOTAL NETO', boxX3 + 10, boxY + 10, { width: boxWidth - 20 });
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text(formatCurrency(totales.general), boxX3 + 10, boxY + 25, { width: boxWidth - 20 });
    
    doc.fontSize(8)
       .font('Helvetica')
       .text('Total ventas - NC', boxX3 + 10, boxY + 45, { width: boxWidth - 20 });

    yPos = boxY + boxHeight + 25;

    // Tabla de Facturas
    if (facturas.length > 0) {
      yPos = checkPageBreak(doc, yPos, 100);
      
      doc.fillColor('#000000')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('FACTURAS', margin, yPos);

      yPos += 20;

      // Encabezados de tabla
      const colWidths = [45, 70, 70, 200, 85];
      const cols = ['Tipo', 'Número', 'Fecha', 'Cliente', 'Importe'];
      let xPos = margin;

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#ffffff');

      // Fondo de encabezado
      doc.rect(margin, yPos, contentWidth, 20)
         .fill('#374151');

      yPos += 5;

      cols.forEach((col, i) => {
        doc.text(col, xPos + 5, yPos, { width: colWidths[i] - 10, align: i === 4 ? 'right' : 'left' });
        xPos += colWidths[i];
      });

      yPos += 20;

      // Datos de facturas
      doc.fillColor('#000000')
         .font('Helvetica');

      facturas.forEach((factura, index) => {
        yPos = checkPageBreak(doc, yPos, 30);

        const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
        doc.rect(margin, yPos, contentWidth, 25).fill(bgColor);

        xPos = margin;
        const rowData = [
          factura.tipo,
          factura.numero,
          factura.fecha,
          `${factura.clienteDescripcion} (${factura.clienteCodigo})`,
          formatCurrency(factura.importe)
        ];

        doc.fillColor(index % 2 === 0 ? '#000000' : '#111827')
           .fontSize(8);

        rowData.forEach((data, i) => {
          doc.text(data, xPos + 3, yPos + 8, { 
            width: colWidths[i] - 6, 
            align: i === 4 ? 'right' : 'left',
            ellipsis: true
          });
          xPos += colWidths[i];
        });

        yPos += 25;
      });

      yPos += 10;
    }

    // Tabla de Notas de Crédito
    if (notasCredito.length > 0) {
      yPos = checkPageBreak(doc, yPos, 100);
      
      doc.fillColor('#000000')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('NOTAS DE CRÉDITO', margin, yPos);

      yPos += 20;

      // Encabezados de tabla (6 columnas)
      const colWidths = [40, 60, 65, 140, 85, 80];
      const cols = ['Tipo', 'Número', 'Fecha', 'Cliente', 'Fact. Relac.', 'Importe'];
      let xPos = margin;

      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor('#ffffff');

      // Fondo de encabezado
      doc.rect(margin, yPos, contentWidth, 20)
         .fill('#374151');

      yPos += 5;

      cols.forEach((col, i) => {
        doc.text(col, xPos + 3, yPos, { width: colWidths[i] - 6, align: i === 5 ? 'right' : 'left' });
        xPos += colWidths[i];
      });

      yPos += 20;

      // Datos de NC
      doc.fillColor('#000000')
         .font('Helvetica');

      notasCredito.forEach((nc, index) => {
        yPos = checkPageBreak(doc, yPos, 30);

        const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
        doc.rect(margin, yPos, contentWidth, 25).fill(bgColor);

        xPos = margin;
        const rowData = [
          nc.tipo,
          nc.numero,
          nc.fecha,
          `${nc.clienteDescripcion} (${nc.clienteCodigo})`,
          nc.facturaRelacionada,
          formatCurrency(nc.importe)
        ];

        doc.fillColor(index % 2 === 0 ? '#000000' : '#111827')
           .fontSize(7.5); // Fuente más pequeña para mejor ajuste

        rowData.forEach((data, i) => {
          doc.text(data, xPos + 3, yPos + 8, { 
            width: colWidths[i] - 6, 
            align: i === 5 ? 'right' : 'left',
            ellipsis: true
          });
          xPos += colWidths[i];
        });

        yPos += 25;
      });
    }

    // Pie de página con fecha de generación
    const range = doc.bufferedPageRange();
    const pageCount = range.count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(range.start + i);
      
      const bottom = doc.page.height - 40;
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text(
           `Generado el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')}`,
           margin,
           bottom,
           { align: 'left' }
         );
      
      doc.text(
        `Página ${i + 1} de ${pageCount}`,
        margin,
        bottom,
        { align: 'right' }
      );
    }

  } catch (error) {
    console.error('Error al renderizar informe de vendedor:', error);
    throw error;
  }
}

// Función auxiliar para verificar salto de página
function checkPageBreak(doc, yPos, spaceNeeded) {
  const pageHeight = doc.page.height;
  const bottomMargin = 60;
  
  if (yPos + spaceNeeded > pageHeight - bottomMargin) {
    doc.addPage();
    return 60; // Comenzar desde el top de la nueva página
  }
  
  return yPos;
}

// Función auxiliar para formatear moneda
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(amount);
}

module.exports = renderInformeVendedor;

