const logoManager = require('../../utils/logoManager');

/**
 * PDF detalle cliente (facturas + NC).
 *
 * Importante (PDFKit): si text() recibe `width`, usa LineWrapper y puede
 * insertar páginas solas. Por eso no pasamos width; alineamos a mano.
 */
async function renderInformeClienteDetalle(doc, data, datosEmpresa = {}) {
  const { cliente, periodo, facturas, totales } = data;
  const notasCredito = data.notasCredito || [];
  const margin = 50;
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const contentWidth = pageWidth - margin * 2;
  // Dejar margen inferior generoso (margins del doc + pie)
  const bottomLimit = pageHeight - 70;
  let yPos = 40;
  let pageNumber = 1;

  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(Number(amount) || 0);
  }

  function formatDate(value) {
    if (!value) return '—';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) {
      return String(value).slice(0, 10);
    }
    return d.toLocaleDateString('es-AR');
  }

  /** Texto sin width => no LineWrapper => no addPage automático */
  function drawText(str, x, y, { align = 'left', boxWidth = null } = {}) {
    const text = String(str ?? '');
    let drawX = x;
    if (align === 'right' && boxWidth != null) {
      const tw = doc.widthOfString(text);
      drawX = x + boxWidth - tw;
      if (drawX < x) drawX = x;
    }
    doc.text(text, drawX, y, { lineBreak: false });
  }

  function renderFooter() {
    const bottom = pageHeight - 40;
    doc.font('Helvetica').fontSize(8).fillColor('#6b7280');
    drawText(
      `Generado el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')}`,
      margin,
      bottom
    );
    const pageLabel = `Página ${pageNumber}`;
    drawText(pageLabel, margin, bottom, {
      align: 'right',
      boxWidth: contentWidth
    });
  }

  function newPage() {
    renderFooter();
    doc.addPage();
    pageNumber += 1;
    yPos = 50;
    doc.x = margin;
    doc.y = yPos;
  }

  function ensureSpace(needed) {
    if (yPos + needed > bottomLimit) {
      newPage();
      return true;
    }
    return false;
  }

  // Header
  try {
    const logoPath = datosEmpresa.LogoURL
      ? await logoManager.getLogoPath(datosEmpresa.LogoURL)
      : null;
    if (logoPath) {
      doc.image(logoPath, margin, 28, { width: 72, height: 52 });
    }
  } catch (error) {
    console.log('No se pudo cargar el logo:', error.message);
  }

  doc.font('Helvetica-Bold').fontSize(16).fillColor('#111827');
  drawText('DETALLE DE VENTAS POR CLIENTE', margin + 90, 34);

  doc.font('Helvetica').fontSize(9).fillColor('#374151');
  drawText(datosEmpresa.RazonSocial || 'Empresa', margin + 90, 54);
  drawText(`CUIT: ${datosEmpresa.Cuit || 'N/A'}`, margin + 90, 66);

  yPos = 100;
  doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).strokeColor('#d1d5db').stroke();
  yPos += 14;

  // Bloque cliente
  doc.roundedRect(margin, yPos, contentWidth, 72, 6).fillAndStroke('#f8fafc', '#e2e8f0');

  doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a');
  drawText(cliente.descripcion || 'Cliente', margin + 12, yPos + 10);

  doc.font('Helvetica').fontSize(9).fillColor('#475569');
  drawText(`Código: ${cliente.codigo || '—'}`, margin + 12, yPos + 32);
  drawText(`CUIT: ${cliente.cuit || 'N/A'}`, margin + 170, yPos + 32);
  drawText(`Localidad: ${cliente.localidad || 'Sin localidad'}`, margin + 330, yPos + 32);
  drawText(`Vendedor: ${cliente.vendedorDescripcion || 'Sin vendedor'}`, margin + 12, yPos + 48);
  drawText(`Cat. IVA: ${cliente.categoriaIvaDescripcion || 'Sin categoría'}`, margin + 280, yPos + 48);

  yPos += 86;

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827');
  drawText('Período:', margin, yPos);
  doc.font('Helvetica').fontSize(11);
  drawText(`${periodo.fechaDesde} — ${periodo.fechaHasta}`, margin + 70, yPos);
  yPos += 20;

  // Resumen
  const boxGap = 8;
  const boxWidth = (contentWidth - boxGap * 3) / 4;
  const boxHeight = 54;
  const boxes = [
    {
      label: 'TOTAL FACTURAS',
      value: formatCurrency(totales.totalVentas),
      sub: `${totales.cantidadFacturas || 0} comp.`,
      bg: '#eff6ff',
      border: '#3b82f6',
      color: '#1e40af'
    },
    {
      label: 'TOTAL NC',
      value: formatCurrency(totales.totalNotasCredito || 0),
      sub: `${totales.cantidadNotasCredito || 0} comp.`,
      bg: '#fef2f2',
      border: '#ef4444',
      color: '#991b1b'
    },
    {
      label: 'TOTAL NETO',
      value: formatCurrency(
        totales.totalNeto ?? (totales.totalVentas || 0) - (totales.totalNotasCredito || 0)
      ),
      sub: 'Ventas - NC',
      bg: '#f0fdf4',
      border: '#22c55e',
      color: '#166534'
    },
    {
      label: 'TOTAL IVA',
      value: formatCurrency(totales.totalIva),
      sub: 'Facturas',
      bg: '#fff7ed',
      border: '#f97316',
      color: '#9a3412'
    }
  ];

  boxes.forEach((box, index) => {
    const x = margin + index * (boxWidth + boxGap);
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 4).fillAndStroke(box.bg, box.border);
    doc.font('Helvetica-Bold').fontSize(7).fillColor(box.color);
    drawText(box.label, x + 6, yPos + 8);
    // Montos largos: fuente más chica para que entren sin width/wrap
    doc.fontSize(box.value.length > 14 ? 8 : 10);
    drawText(box.value, x + 6, yPos + 24);
    doc.font('Helvetica').fontSize(7);
    drawText(box.sub, x + 6, yPos + 40);
  });

  yPos += boxHeight + 18;
  doc.x = margin;
  doc.y = yPos;

  // ---- Facturas ----
  const facturaCols = [
    { title: 'Tipo', width: 55 },
    { title: 'Número', width: 120 },
    { title: 'Fecha', width: 90 },
    { title: 'Importe', width: contentWidth - 55 - 120 - 90, align: 'right' }
  ];
  const rowH = 18;
  const headH = 18;

  function renderFacturaHeader() {
    doc.rect(margin, yPos, contentWidth, headH).fill('#1e3a5f');
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
    let x = margin;
    facturaCols.forEach((col) => {
      drawText(col.title, x + 4, yPos + 4, {
        align: col.align || 'left',
        boxWidth: col.width - 8
      });
      x += col.width;
    });
    yPos += headH;
    doc.y = yPos;
  }

  ensureSpace(headH + rowH + 20);
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827');
  drawText('FACTURAS DEL PERÍODO', margin, yPos);
  yPos += 16;
  renderFacturaHeader();

  if (!facturas?.length) {
    ensureSpace(20);
    doc.font('Helvetica').fontSize(10).fillColor('#6b7280');
    drawText('No hay facturas en el período seleccionado.', margin + 4, yPos + 4);
    yPos += 20;
  } else {
    facturas.forEach((factura, index) => {
      if (yPos + rowH > bottomLimit) {
        newPage();
        renderFacturaHeader();
      }

      if (index % 2 === 1) {
        doc.rect(margin, yPos, contentWidth, rowH).fill('#f1f5f9');
      }

      const cells = [
        factura.tipo || '—',
        factura.numero || '—',
        formatDate(factura.fecha),
        formatCurrency(factura.importe)
      ];

      let x = margin;
      doc.font('Helvetica').fontSize(8).fillColor('#111827');
      cells.forEach((cell, i) => {
        drawText(cell, x + 4, yPos + 4, {
          align: facturaCols[i].align || 'left',
          boxWidth: facturaCols[i].width - 8
        });
        x += facturaCols[i].width;
      });

      yPos += rowH;
      doc.y = yPos;
    });
  }

  ensureSpace(26);
  yPos += 4;
  doc.rect(margin, yPos, contentWidth, 22).fill('#1e3a5f');
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
  drawText('TOTAL FACTURAS', margin + 4, yPos + 5);
  drawText(formatCurrency(totales.totalVentas), margin, yPos + 5, {
    align: 'right',
    boxWidth: contentWidth - 8
  });
  yPos += 30;
  doc.y = yPos;

  // ---- NC ----
  const ncCols = [
    { title: 'Tipo', width: 50 },
    { title: 'Número', width: 100 },
    { title: 'Fecha', width: 80 },
    { title: 'Fact. Relac.', width: 130 },
    { title: 'Importe', width: contentWidth - 50 - 100 - 80 - 130, align: 'right' }
  ];

  function renderNcHeader() {
    doc.rect(margin, yPos, contentWidth, headH).fill('#7f1d1d');
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
    let x = margin;
    ncCols.forEach((col) => {
      drawText(col.title, x + 4, yPos + 4, {
        align: col.align || 'left',
        boxWidth: col.width - 8
      });
      x += col.width;
    });
    yPos += headH;
    doc.y = yPos;
  }

  ensureSpace(headH + rowH + 20);
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827');
  drawText('NOTAS DE CRÉDITO DEL PERÍODO', margin, yPos);
  yPos += 16;
  renderNcHeader();

  if (!notasCredito.length) {
    ensureSpace(20);
    doc.font('Helvetica').fontSize(10).fillColor('#6b7280');
    drawText('No hay notas de crédito en el período seleccionado.', margin + 4, yPos + 4);
    yPos += 20;
  } else {
    notasCredito.forEach((nc, index) => {
      if (yPos + rowH > bottomLimit) {
        newPage();
        renderNcHeader();
      }

      if (index % 2 === 1) {
        doc.rect(margin, yPos, contentWidth, rowH).fill('#fef2f2');
      }

      const cells = [
        nc.tipo || '—',
        nc.numero || '—',
        formatDate(nc.fecha),
        nc.facturaRelacionada || '—',
        formatCurrency(-(Number(nc.importe) || 0))
      ];

      let x = margin;
      doc.font('Helvetica').fontSize(8).fillColor('#991b1b');
      cells.forEach((cell, i) => {
        drawText(cell, x + 4, yPos + 4, {
          align: ncCols[i].align || 'left',
          boxWidth: ncCols[i].width - 8
        });
        x += ncCols[i].width;
      });

      yPos += rowH;
      doc.y = yPos;
    });
  }

  ensureSpace(26);
  yPos += 4;
  doc.rect(margin, yPos, contentWidth, 22).fill('#7f1d1d');
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
  drawText('TOTAL NC', margin + 4, yPos + 5);
  drawText(formatCurrency(-(totales.totalNotasCredito || 0)), margin, yPos + 5, {
    align: 'right',
    boxWidth: contentWidth - 8
  });
  yPos += 30;

  ensureSpace(28);
  doc.rect(margin, yPos, contentWidth, 24).fill('#0f172a');
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff');
  drawText('TOTAL NETO', margin + 4, yPos + 6);
  drawText(
    formatCurrency(
      totales.totalNeto ?? (totales.totalVentas || 0) - (totales.totalNotasCredito || 0)
    ),
    margin,
    yPos + 6,
    { align: 'right', boxWidth: contentWidth - 8 }
  );

  renderFooter();
}

module.exports = renderInformeClienteDetalle;
