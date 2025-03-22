const renderHeader = require("./common/header");
const renderFooter = require("./common/footer");
const renderTable = require("./common/table");
const path = require("path");

/**
 * Genera un PDF para una Factura A
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} data - Datos de la factura
 */
function renderFacturaA(doc, data) {
  const { factura, items } = data;
  const logoPath = path.join(__dirname, "../../../assets/logo.png");

  // Encabezado
  let y = renderHeader(doc, {
    title: "FACTURA",
    documentType: "FACTURA A",
    documentNumber: `${factura.DocumentoSucursal}-${factura.DocumentoNumero}`,
    logoPath: logoPath,
  });

  // Información del cliente
  doc.fontSize(12).text("DATOS DEL CLIENTE", { align: "left" });
  doc
    .fontSize(10)
    .text(`Cliente: ${factura.Cliente ? factura.Cliente.Descripcion : "N/A"}`);
  doc.text(`CUIT: ${factura.Cliente ? factura.Cliente.Cuit : "N/A"}`);
  doc.text(
    `Domicilio: ${
      factura.Cliente
        ? factura.Cliente.Domicilio || factura.Cliente.Calle
        : "N/A"
    }`
  );
  doc.text(`Localidad: ${factura.Cliente ? factura.Cliente.Localidad : "N/A"}`);
  doc.text(
    `Categoría IVA: ${factura.Cliente ? factura.Cliente.CategoriaIva : "N/A"}`
  );
  doc.moveDown();

  // Fecha y CAE
  doc
    .fontSize(10)
    .text(`Fecha: ${new Date(factura.Fecha).toLocaleDateString("es-AR")}`);
  if (factura.afip_cae) {
    doc.text(`CAE: ${factura.afip_cae}`);
    doc.text(
      `Vencimiento CAE: ${new Date(
        factura.afip_cae_vencimiento
      ).toLocaleDateString("es-AR")}`
    );
  }
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
  doc.text("Subtotal:", 350, y, { width: 90, align: "right" });
  doc.text(
    factura.ImporteNeto ? factura.ImporteNeto.toFixed(2) : "0.00",
    440,
    y,
    { width: 70, align: "right" }
  );
  y += 20;

  doc.text("IVA 21%:", 350, y, { width: 90, align: "right" });
  doc.text(
    factura.ImporteIva1 ? factura.ImporteIva1.toFixed(2) : "0.00",
    440,
    y,
    { width: 70, align: "right" }
  );
  y += 20;

  if (factura.ImporteIva2 && factura.ImporteIva2 > 0) {
    doc.text("IVA 10.5%:", 350, y, { width: 90, align: "right" });
    doc.text(factura.ImporteIva2.toFixed(2), 440, y, {
      width: 70,
      align: "right",
    });
    y += 20;
  }

  if (factura.ImportePercepcionIIBB && factura.ImportePercepcionIIBB > 0) {
    doc.text("Perc. IIBB:", 350, y, { width: 90, align: "right" });
    doc.text(factura.ImportePercepcionIIBB.toFixed(2), 440, y, {
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

  // Pie de página
  renderFooter(doc, {
    legalText: "Documento válido como factura",
    additionalText: factura.afip_cae
      ? `CAE: ${factura.afip_cae} - Vto: ${new Date(
          factura.afip_cae_vencimiento
        ).toLocaleDateString("es-AR")}`
      : null,
  });
}

module.exports = renderFacturaA;
