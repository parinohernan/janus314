const renderHeader = require("./common/header");
const path = require("path");

/**
 * Genera un PDF para una Cuenta Corriente
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} data - Datos de la cuenta corriente
 */
async function renderCuentaCorriente(doc, data) {
  const { cliente, comprobantes, datosEmpresa, logoPath } = data;
  
  // Si no se proporciona logoPath, usar el por defecto
  const finalLogoPath = logoPath || path.join(__dirname, "./common/logos/logoempresa.png");

  // Establecer la fuente Helvetica para todo el documento
  doc.font("Helvetica");

  // Encabezado simplificado: solo logo, nombre de empresa y fecha
  let y = 50;
  
  // Logo de la empresa (izquierda)
  if (finalLogoPath) {
    try {
      doc.image(finalLogoPath, 50, y, { width: 80, height: 80 });
    } catch (error) {
      console.warn('⚠️ Error cargando logo:', error);
    }
  }
  
  // Nombre de la empresa (centro)
  doc.fontSize(16).font("Helvetica-Bold");
  doc.text(datosEmpresa.RazonSocial || 'Empresa', doc.page.width / 2 - 50, y + 40);
  doc.font("Helvetica");
  
  // Fecha actual (derecha)
  const fechaActual = new Date().toLocaleDateString("es-AR");
  doc.fontSize(12);
  doc.text(`Fecha: ${fechaActual}`, doc.page.width - 150, y + 10, { align: "right" });

  // Título del documento
  // y += 100;
  // doc.fontSize(18).font("Helvetica-Bold");
  // doc.text("CUENTA CORRIENTE", doc.page.width / 2 - 60, y, { align: "center" });
  // doc.font("Helvetica");

  // Información del cliente en una sola línea
  y += 100;
  doc.fontSize(12);
  
  // Calcular saldo actual
  const saldoActual = comprobantes.length > 0 ? comprobantes[comprobantes.length - 1].Saldo : 0;
  
  // Cliente y saldo en la misma línea
  const clienteInfo = `${cliente.Codigo} - ${cliente.Descripcion}`;
  doc.text(clienteInfo, 50, y);
  doc.font("Helvetica-Bold");
  doc.text(`Saldo: ${saldoActual.toFixed(2)}`, doc.page.width - 150, y, { align: "right" });
  doc.font("Helvetica");

  // Tabla de comprobantes
  y += 30;
  doc.fontSize(12).font("Helvetica-Bold");
  doc.text("DETALLE DE CUENTA CORRIENTE", 50, y);
  doc.font("Helvetica");

  y += 20;

  // Encabezados de la tabla
  const xInicio = 50;
  const anchoFecha = 80;
  const anchoDetalle = 150;
  const anchoDebito = 80;
  const anchoCredito = 80;
  const anchoSaldo = 80;

  doc.fontSize(9).font("Helvetica-Bold");
  doc.text("Fecha", xInicio, y);
  doc.text("Detalle", xInicio + anchoFecha, y);
  doc.text("Débito", xInicio + anchoFecha + anchoDetalle, y);
  doc.text("Crédito", xInicio + anchoFecha + anchoDetalle + anchoDebito, y);
  doc.text("Saldo", xInicio + anchoFecha + anchoDetalle + anchoDebito + anchoCredito, y);
  doc.font("Helvetica");

  y += 15;

  // Línea separadora
  doc.moveTo(xInicio, y).lineTo(xInicio + anchoFecha + anchoDetalle + anchoDebito + anchoCredito + anchoSaldo, y).stroke();
  y += 5;

  // Datos de la tabla
  doc.fontSize(8);
  
  if (comprobantes.length === 0) {
    doc.text("No hay comprobantes registrados", xInicio, y);
  } else {
    for (let i = 0; i < comprobantes.length; i++) {
      const comprobante = comprobantes[i];
      
      // Verificar si necesitamos una nueva página
      if (y > 700) {
        doc.addPage();
        y = 50;
        
        // Repetir encabezados en nueva página
        doc.fontSize(9).font("Helvetica-Bold");
        doc.text("Fecha", xInicio, y);
        doc.text("Detalle", xInicio + anchoFecha, y);
        doc.text("Débito", xInicio + anchoFecha + anchoDetalle, y);
        doc.text("Crédito", xInicio + anchoFecha + anchoDetalle + anchoDebito, y);
        doc.text("Saldo", xInicio + anchoFecha + anchoDetalle + anchoDebito + anchoCredito, y);
        doc.font("Helvetica");
        
        y += 15;
        doc.moveTo(xInicio, y).lineTo(xInicio + anchoFecha + anchoDetalle + anchoDebito + anchoCredito + anchoSaldo, y).stroke();
        y += 5;
      }

      // Formatear fecha
      const fecha = new Date(comprobante.Fecha);
      const fechaFormateada = fecha.toLocaleDateString("es-AR");

      // Fecha
      doc.text(fechaFormateada, xInicio, y);
      
      // Detalle (truncar si es muy largo)
      const detalle = comprobante.Detalle.length > 35 ? 
        comprobante.Detalle.substring(0, 35) + "..." : 
        comprobante.Detalle;
      doc.text(detalle, xInicio + anchoFecha, y);
      
      // Débito
      if (comprobante.Debitos > 0) {
        doc.text(comprobante.Debitos.toFixed(2), xInicio + anchoFecha + anchoDetalle, y);
      } else {
        doc.text("", xInicio + anchoFecha + anchoDetalle, y);
      }
      
      // Crédito
      if (comprobante.Creditos > 0) {
        doc.text(comprobante.Creditos.toFixed(2), xInicio + anchoFecha + anchoDetalle + anchoDebito, y);
      } else {
        doc.text("", xInicio + anchoFecha + anchoDetalle + anchoDebito, y);
      }
      
      // Saldo
      doc.font("Helvetica-Bold");
      doc.text(comprobante.Saldo.toFixed(2), xInicio + anchoFecha + anchoDetalle + anchoDebito + anchoCredito, y);
      doc.font("Helvetica");

      y += 12;
    }
  }

  // Resumen final
  y += 20;
  doc.moveTo(xInicio, y).lineTo(xInicio + anchoFecha + anchoDetalle + anchoDebito + anchoCredito + anchoSaldo, y).stroke();
  y += 10;

  // Calcular totales
  const totalDebitos = comprobantes.reduce((sum, c) => sum + (c.Debitos || 0), 0);
  const totalCreditos = comprobantes.reduce((sum, c) => sum + (c.Creditos || 0), 0);

  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("Total Débitos:", xInicio + anchoFecha + anchoDetalle, y);
  doc.text(totalDebitos.toFixed(2), xInicio + anchoFecha + anchoDetalle + anchoDebito, y);
  
  y += 15;
  doc.text("Total Créditos:", xInicio + anchoFecha + anchoDetalle, y);
  doc.text(totalCreditos.toFixed(2), xInicio + anchoFecha + anchoDetalle + anchoDebito, y);
  
  y += 15;
  doc.text("Saldo Final:", xInicio + anchoFecha + anchoDetalle, y);
  doc.text(saldoActual.toFixed(2), xInicio + anchoFecha + anchoDetalle + anchoDebito + anchoCredito, y);
  doc.font("Helvetica");

  // Pie de página con firmas
  // y += 40;
  // const xFirma1 = 100;
  // const xFirma2 = 350;
  
  // doc.fontSize(10).font("Helvetica-Bold");
  // doc.text("Firma del Cliente", xFirma1, y, { align: "center" });
  // doc.text("Firma del Empleado", xFirma2, y, { align: "center" });
  // doc.font("Helvetica");

  // y += 30;
  // doc.moveTo(xFirma1 - 30, y).lineTo(xFirma1 + 30, y).stroke();
  // doc.moveTo(xFirma2 - 30, y).lineTo(xFirma2 + 30, y).stroke();
}

module.exports = renderCuentaCorriente;
