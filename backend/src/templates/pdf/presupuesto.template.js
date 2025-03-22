const renderHeader = require("./common/header");
const renderFooter = require("./common/footer");
const renderTable = require("./common/table");
const path = require("path");

/**
 * Genera un PDF para un Presupuesto
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} data - Datos del presupuesto
 */
function renderPresupuesto(doc, data) {
  const { factura, items } = data;
  const logoPath = path.join(__dirname, "../../../assets/logo.png");

  // Encabezado
  let y = renderHeader(doc, {
    title: "PRESUPUESTO",
    documentType: "PRESUPUESTO",
    documentNumber: `${factura.DocumentoSucursal}-${factura.DocumentoNumero}`,
    logoPath: logoPath,
  });

  // Información del cliente
  doc.fontSize(12).text("DATOS DEL CLIENTE", { align: "left" });
  doc
    .fontSize(10)
    .text(`Cliente: ${factura.Cliente ? factura.Cliente.Descripcion : "N/A"}`);
  doc.text(`CUIT/DNI: ${factura.Cliente ? factura.Cliente.Cuit : "N/A"}`);
  doc.text(
    `Domicilio: ${
      factura.Cliente
        ? factura.Cliente.Domicilio || factura.Cliente.Calle
        : "N/A"
    }`
  );
  doc.text(`Localidad: ${factura.Cliente ? factura.Cliente.Localidad : "N/A"}`);
  doc.moveDown();

  // Fecha y validez
  doc
    .fontSize(10)
    .text(`Fecha: ${new Date(factura.Fecha).toLocaleDateString("es-AR")}`);
  doc.text("Validez: 15 días");
  doc.moveDown();

  // Tabla de items
  const itemsConSubtotal = items.map((item) => {
    const articulo = item.Articulo || {};
    return {
      ...item,
      Descripcion: articulo.Descripcion || "Artículo no encontrado",
      Subtotal: (item.Cantidad || 0) * (item.PrecioUnitario || 0),
    };
  });

  y = renderTable(doc, itemsConSubtotal, {
    startY: doc.y,
    columns: [
      {
        header: "Código",
        property: "CodigoArticulo",
        width: 80,
        align: "left",
      },
      {
        header: "Descripción",
        property: "Descripcion",
        width: 200,
        align: "left",
      },
      { header: "Cant.", property: "Cantidad", width: 40, align: "right" },
      {
        header: "Precio",
        property: "PrecioUnitario",
        width: 70,
        align: "right",
        format: (value) => value.toFixed(2),
      },
      {
        header: "Subtotal",
        property: "Subtotal",
        width: 70,
        align: "right",
        format: (value) => value.toFixed(2),
      },
    ],
  });

  // Espacio después de la tabla
  y += 20;

  // Totales
  doc.font("Helvetica-Bold");

  if (factura.ImporteBonificado && factura.ImporteBonificado > 0) {
    doc.text("Subtotal:", 350, y, { width: 90, align: "right" });
    doc.text(
      factura.ImporteBruto ? factura.ImporteBruto.toFixed(2) : "0.00",
      440,
      y,
      { width: 70, align: "right" }
    );
    y += 20;

    doc.text("Bonificación:", 350, y, { width: 90, align: "right" });
    doc.text(factura.ImporteBonificado.toFixed(2), 440, y, {
      width: 70,
      align: "right",
    });
    y += 20;
  }

  // Línea antes del total
  doc.strokeColor("#000000").moveTo(350, y).lineTo(510, y).stroke();
  y += 10;

  doc.fontSize(12).text("TOTAL:", 350, y, { width: 90, align: "right" });
  doc.text(
    factura.ImporteTotal ? factura.ImporteTotal.toFixed(2) : "0.00",
    440,
    y,
    { width: 70, align: "right" }
  );

  // Condiciones
  y += 40;
  doc.fontSize(10).font("Helvetica");
  doc.text("CONDICIONES:", 50, y);
  y += 15;
  doc.text("- Los precios pueden variar sin previo aviso.", 50, y);
  y += 15;
  doc.text("- Forma de pago: Contado / Transferencia bancaria.", 50, y);
  y += 15;
  doc.text("- Tiempo de entrega: A convenir.", 50, y);

  // Pie de página
  renderFooter(doc, {
    legalText: "Este presupuesto no tiene validez como factura",
  });
}

module.exports = renderPresupuesto;
