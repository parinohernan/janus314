const logoManager = require('../../utils/logoManager');

async function renderInformeRubrosProvincia(doc, data, datosEmpresa = {}) {
  const margin = 22;
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const contentWidth = pageWidth - margin * 2;
  const bottomMargin = 68;
  let yPos = 22;
  let pageNumber = 1;

  function renderFooter() {
    const bottom = doc.page.height - 58;
    const originalX = doc.x;
    const originalY = doc.y;

    doc.font('Helvetica')
      .fontSize(7)
      .fillColor('#6b7280')
      .text(`Generado el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')}`, margin, bottom, {
        width: contentWidth / 2,
        align: 'left',
        lineBreak: false
      })
      .text(`Pagina ${pageNumber}`, margin, bottom, {
        width: contentWidth,
        align: 'right',
        lineBreak: false
      });

    doc.x = originalX;
    doc.y = originalY;
  }

  function checkPageBreak(spaceNeeded) {
    if (yPos + spaceNeeded > pageHeight - bottomMargin) {
      renderFooter();
      doc.addPage();
      pageNumber += 1;
      yPos = 22;
      renderTableHeader();
    }
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value) || 0);
  }

  async function renderHeader() {
    let logoPath = null;
    try {
      logoPath = datosEmpresa.LogoURL ? await logoManager.getLogoPath(datosEmpresa.LogoURL) : null;
    } catch (error) {
      console.log('No se pudo cargar el logo:', error.message);
    }

    if (logoPath) {
      try {
        doc.image(logoPath, margin, 18, { width: 58, height: 38 });
      } catch (error) {
        console.log('No se pudo insertar el logo:', error.message);
      }
    }

    doc.font('Helvetica-Bold')
      .fontSize(13)
      .fillColor('#111827')
      .text((data.titulo || 'INFORME DE VENTAS POR RUBRO Y PROVINCIA').toUpperCase(), margin + 68, 20, {
        width: contentWidth - 68
      });

    doc.font('Helvetica')
      .fontSize(7.5)
      .fillColor('#374151')
      .text(datosEmpresa.RazonSocial || 'Empresa', margin + 68, 38)
      .text(`CUIT: ${datosEmpresa.Cuit || 'N/A'}`, margin + 68, 49)
      .text(`Periodo: ${data.periodo.fechaDesde} - ${data.periodo.fechaHasta}`, margin + 68, 60);

    yPos = 75;
    doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).strokeColor('#d1d5db').stroke();
    yPos += 10;
  }

  const colWidths = [168, 90, 90, 90, 90, 90, 90, 90];
  const headers = ['Provincia / Rubro', 'R.I. 10.5%', 'R.I. 21%', 'R.M. 10.5%', 'R.M. 21%', 'Otros 10.5%', 'Otros 21%', 'Total'];

  function renderTableHeader() {
    let xPos = margin;
    doc.rect(margin, yPos, contentWidth, 16).fill('#374151');
    doc.font('Helvetica-Bold').fontSize(6.6).fillColor('#ffffff');

    headers.forEach((header, index) => {
      doc.text(header, xPos + 3, yPos + 5, {
        width: colWidths[index] - 6,
        align: index === 0 ? 'left' : 'right'
      });
      xPos += colWidths[index];
    });

    yPos += 16;
  }

  function renderValues(row, font = 'Helvetica', fillColor = '#111827', bgColor = null) {
    const rowHeight = 14;
    checkPageBreak(rowHeight);

    if (bgColor) {
      doc.rect(margin, yPos, contentWidth, rowHeight).fill(bgColor);
    }

    const values = [
      row.descripcion,
      formatNumber(row.ri105),
      formatNumber(row.ri21),
      formatNumber(row.rm105),
      formatNumber(row.rm21),
      formatNumber(row.otros105),
      formatNumber(row.otros21),
      formatNumber(row.total)
    ];

    let xPos = margin;
    doc.font(font).fontSize(6.6).fillColor(fillColor);
    values.forEach((value, index) => {
      doc.text(value, xPos + 3, yPos + 4, {
        width: colWidths[index] - 6,
        align: index === 0 ? 'left' : 'right',
        ellipsis: true
      });
      xPos += colWidths[index];
    });

    yPos += rowHeight;
  }

  await renderHeader();

  doc.font('Helvetica-Bold')
    .fontSize(8)
    .fillColor('#111827')
    .text(`Provincias: ${data.provincias.length}   Rubros: ${data.provincias.reduce((sum, p) => sum + p.rubros.length, 0)}   Total: ${formatNumber(data.totalVentas)}`, margin, yPos);
  yPos += 14;

  renderTableHeader();

  for (const provincia of data.provincias) {
    checkPageBreak(36);
    doc.rect(margin, yPos, contentWidth, 16).fill('#e5e7eb');
    doc.font('Helvetica-Bold')
      .fontSize(7.2)
      .fillColor('#111827')
      .text(provincia.descripcion, margin + 4, yPos + 5, { width: contentWidth - 8 });
    yPos += 16;

    provincia.rubros.forEach((rubro, index) => {
      renderValues(
        { ...rubro, descripcion: `${rubro.descripcion} (${rubro.codigo})` },
        'Helvetica',
        '#111827',
        index % 2 === 0 ? '#ffffff' : '#f9fafb'
      );
    });

    renderValues(
      { ...provincia.subtotales, descripcion: 'Sub-Total:' },
      'Helvetica-Bold',
      '#111827',
      '#f3f4f6'
    );
  }

  renderValues(
    { ...data.totales, descripcion: 'Totales:' },
    'Helvetica-Bold',
    '#ffffff',
    '#111827'
  );
  renderFooter();
}

module.exports = renderInformeRubrosProvincia;
