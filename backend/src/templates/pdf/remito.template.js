const renderHeader = require("./common/header");
const renderFooter = require("./common/footer");
const renderTable = require("./common/table");
const path = require("path");

/**
 * Genera un PDF para un Remito
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} data - Datos del remito
 */
function renderRemito(doc, data) {
  const { factura, items } = data;
  const logoPath = path.join(__dirname, "../../../assets/logo.png");

  // Encabezado
  let y = renderHeader(doc, {
    title: "REMITO",
    documentType: "REMITO",
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

  // Fecha
  doc
    .fontSize(10)
    .text(`Fecha: ${new Date(factura.Fecha).toLocaleDateString("es-AR")}`);
  doc.moveDown();

  // Tabla de items
  const itemsConSubtotal = items.map((item) => {
    const articulo = item.Articulo || {};
    return {
      ...item,
      Descripcion: articulo.Descripcion || "Artículo no encontrado",
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
        width: 300,
        align: "left",
      },
      { header: "Cant.", property: "Cantidad", width: 80, align: "right" },
    ],
  });

  // Espacio después de la tabla
  y += 40;

  // Firmas
  doc
    .fontSize(10)
    .text("Firma del Transportista: _______________________", 50, y);
  doc.text("Firma del Cliente: _______________________", 300, y);

  // Pie de página
  renderFooter(doc, {
    legalText: "Documento no válido como factura",
  });
}

module.exports = renderRemito;
