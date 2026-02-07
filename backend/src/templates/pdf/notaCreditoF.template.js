const { formatearNumero, formatearFecha } = require("../../utils/formatters");

async function renderNotaCreditoF(doc, { factura: notaCredito, items, logoPath }) {
  // Configuración inicial
  doc.font("Helvetica");

  // Agregar logo de la empresa si está disponible
  if (logoPath) {
    try {
      doc.image(logoPath, 20, 20, {
        width: 60,
        height: 60,
        resolution: 300
      });
    } catch (error) {
      console.error("Error al cargar el logo en nota de crédito F:", error);
    }
  }

  // Encabezado
  doc.fontSize(20).text("NOTA DE CRÉDITO F", { align: "center" });
  doc.moveDown();

  // Información de la empresa
  doc
    .fontSize(12)
    .text(notaCredito.Empresa.RazonSocial || "EMPRESA S.A.", { align: "left" });
  doc
    .fontSize(10)
    .text(`CUIT: ${notaCredito.Empresa.Cuit || ""}`)
    .text(`Dirección: ${notaCredito.Empresa.Domicilio || ""}`)
    .text(`Condición IVA: Responsable Inscripto`);
  doc.moveDown();

  // Número de comprobante y fecha
  doc
    .fontSize(12)
    .text(
      `Comprobante: ${notaCredito.DocumentoSucursal}-${notaCredito.DocumentoNumero}`
    )
    .text(`Fecha: ${formatearFecha(notaCredito.Fecha)}`);

  // Información del cliente
  doc
    .moveDown()
    .fontSize(12)
    .text("DATOS DEL CLIENTE", { align: "left" })
    .fontSize(10)
    .text(`Cliente: ${notaCredito.Cliente?.Descripcion || "N/A"}`)
    .text(`CUIT/DNI: ${notaCredito.Cliente?.Cuit || "N/A"}`)
    .text(`Dirección: ${notaCredito.Cliente?.Calle || "N/A"}`)
    .text(`Localidad: ${notaCredito.Cliente?.Localidad || "N/A"}`)
    .text(`Condición IVA: ${notaCredito.Cliente?.CategoriaIva || "N/A"}`);

  // Si hay factura de referencia
  if (notaCredito.factura_tipo) {
    doc
      .moveDown()
      .text(
        `Comprobante de Referencia: ${notaCredito.factura_tipo}-${notaCredito.factura_sucursal}-${notaCredito.factura_numero}`
      );
  }

  // Tabla de items
  doc.moveDown();
  let y = doc.y + 20;

  // Encabezados
  doc.font("Helvetica-Bold");
  doc.text("Código", 50, y, { width: 80 });
  doc.text("Descripción", 130, y, { width: 200 });
  doc.text("Cant.", 330, y, { width: 40, align: "right" });
  doc.text("Precio c/IVA", 370, y, { width: 70, align: "right" });
  doc.text("Subtotal c/IVA", 440, y, { width: 70, align: "right" });

  // Línea separadora
  y += 15;
  doc.moveTo(50, y).lineTo(510, y).stroke();
  y += 10;

  // Items (precios CON IVA incluido - usar valores ya calculados del controlador)
  doc.font("Helvetica");
  items.forEach((item) => {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }

    doc.text(item.CodigoArticulo || "", 50, y, { width: 80 });
    doc.text(item.Descripcion || item.Articulo?.Descripcion || "", 130, y, { width: 200 });
    doc.text(item.Cantidad.toString(), 330, y, { width: 40, align: "right" });
    // Precio CON IVA incluido (ya viene calculado del controlador)
    doc.text(formatearNumero(item.PrecioUnitario || 0), 370, y, {
      width: 70,
      align: "right",
    });
    // Subtotal CON IVA incluido (ya viene calculado del controlador)
    doc.text(formatearNumero(item.Subtotal || 0), 440, y, {
      width: 70,
      align: "right",
    });

    y += 20;
  });

  // Totales
  doc.moveDown();
  y = doc.y + 10;
  doc.font("Helvetica-Bold");
  doc.text("TOTAL:", 350, y, { width: 90, align: "right" });
  doc.text(formatearNumero(notaCredito.ImporteTotal), 440, y, {
    width: 70,
    align: "right",
  });
}

module.exports = renderNotaCreditoF; 