const PDFDocument = require("pdfkit");
const FacturaCabeza = require("../models/facturaCabeza.model");
const FacturaItem = require("../models/facturaItem.model");
const Cliente = require("../models/cliente.model");
const Articulo = require("../models/articulo.model");
const fs = require("fs");
const path = require("path");

// Función para generar PDF de factura
exports.generarFacturaPDF = async (req, res) => {
  try {
    const { tipo, sucursal, numero } = req.params;

    // Obtener datos de la factura
    const factura = await FacturaCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      include: [
        {
          model: Cliente,
          attributes: [
            "Codigo",
            "Descripcion",
            "CategoriaIva",
            "Calle",
            "Localidad",
            "Cuit",
          ],
        },
      ],
    });

    if (!factura) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      });
    }

    // Obtener items
    const items = await FacturaItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      raw: true,
    });

    // Obtener los códigos de artículos para buscarlos
    const codigosArticulos = items.map((item) => item.CodigoArticulo);

    // Buscar los artículos correspondientes
    const articulos = await Articulo.findAll({
      where: {
        Codigo: codigosArticulos,
      },
      raw: true,
    });

    // Crear un mapa de artículos por código para facilitar la búsqueda
    const articulosPorCodigo = {};
    articulos.forEach((articulo) => {
      articulosPorCodigo[articulo.Codigo] = articulo;
    });

    // Combinar los items con la información de artículos
    const itemsConArticulos = items.map((item) => {
      const articulo = articulosPorCodigo[item.CodigoArticulo] || null;
      return {
        ...item,
        Articulo: articulo,
      };
    });

    // Crear un nuevo documento PDF
    const doc = new PDFDocument({ margin: 50 });

    // Configurar la respuesta HTTP
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=factura-${tipo}-${sucursal}-${numero}.pdf`
    );

    // Pipe el PDF a la respuesta HTTP
    doc.pipe(res);

    // Agregar contenido al PDF
    generarContenidoPDF(doc, factura, itemsConArticulos);

    // Finalizar el documento
    doc.end();
  } catch (error) {
    console.error("Error al generar PDF:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar PDF",
      error: error.message,
    });
  }
};

// Función para generar el contenido del PDF
function generarContenidoPDF(doc, factura, items) {
  // Encabezado
  doc.fontSize(20).text("FACTURA", { align: "center" });
  doc.moveDown();

  // Tipo de factura
  let tipoFactura = "";
  switch (factura.DocumentoTipo) {
    case "FCA":
      tipoFactura = "FACTURA A";
      break;
    case "FCB":
      tipoFactura = "FACTURA B";
      break;
    case "FCC":
      tipoFactura = "FACTURA C";
      break;
    default:
      tipoFactura = `FACTURA ${factura.DocumentoTipo}`;
  }

  doc
    .fontSize(16)
    .text(
      `${tipoFactura} N° ${factura.DocumentoSucursal}-${factura.DocumentoNumero}`,
      { align: "center" }
    );
  doc.moveDown();

  // Información de la empresa
  doc.fontSize(12).text("EMPRESA S.A.", { align: "left" });
  doc.fontSize(10).text("CUIT: 30-12345678-9");
  doc.text("Dirección: Calle Principal 123, Ciudad");
  doc.text("Tel: (123) 456-7890");
  doc.moveDown();

  // Información del cliente
  doc.fontSize(12).text("DATOS DEL CLIENTE", { align: "left" });
  doc
    .fontSize(10)
    .text(`Cliente: ${factura.Cliente ? factura.Cliente.Descripcion : "N/A"}`);
  doc.text(`CUIT: ${factura.Cliente ? factura.Cliente.Cuit : "N/A"}`);
  doc.text(`Calle: ${factura.Cliente ? factura.Cliente.Calle : "N/A"}`);
  doc.text(`Localidad: ${factura.Cliente ? factura.Cliente.Localidad : "N/A"}`);
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
  doc.fontSize(10);
  const tableTop = doc.y;
  const itemsTableTop = tableTop + 20;

  // Encabezados de la tabla
  doc.font("Helvetica-Bold");
  doc.text("Código", 50, tableTop, { width: 80 });
  doc.text("Descripción", 130, tableTop, { width: 200 });
  doc.text("Cant.", 330, tableTop, { width: 40, align: "right" });
  doc.text("Precio", 370, tableTop, { width: 70, align: "right" });
  doc.text("Subtotal", 440, tableTop, { width: 70, align: "right" });
  doc.font("Helvetica");

  // Línea horizontal
  doc
    .moveTo(50, tableTop + 15)
    .lineTo(510, tableTop + 15)
    .stroke();

  // Items
  let y = itemsTableTop;
  items.forEach((item, i) => {
    const articulo = item.Articulo || { Descripcion: "Artículo no encontrado" };
    const cantidad = item.Cantidad || 0;
    const precioUnitario = item.PrecioUnitario || 0;
    const subtotal = cantidad * precioUnitario;

    // Si no hay suficiente espacio en la página, crear una nueva
    if (y > 700) {
      doc.addPage();
      y = 50;

      // Repetir encabezados en la nueva página
      doc.font("Helvetica-Bold");
      doc.text("Código", 50, y - 20, { width: 80 });
      doc.text("Descripción", 130, y - 20, { width: 200 });
      doc.text("Cant.", 330, y - 20, { width: 40, align: "right" });
      doc.text("Precio", 370, y - 20, { width: 70, align: "right" });
      doc.text("Subtotal", 440, y - 20, { width: 70, align: "right" });
      doc.font("Helvetica");

      // Línea horizontal
      doc
        .moveTo(50, y - 5)
        .lineTo(510, y - 5)
        .stroke();
    }

    doc.text(item.CodigoArticulo || "", 50, y, { width: 80 });
    doc.text(articulo.Descripcion || "", 130, y, { width: 200 });
    doc.text(cantidad.toString(), 330, y, { width: 40, align: "right" });
    doc.text(precioUnitario.toFixed(2), 370, y, { width: 70, align: "right" });
    doc.text(subtotal.toFixed(2), 440, y, { width: 70, align: "right" });

    y += 20;
  });

  // Línea horizontal
  doc.moveTo(50, y).lineTo(510, y).stroke();
  y += 10;

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

  doc.text("IVA:", 350, y, { width: 90, align: "right" });
  const iva = (factura.ImporteIva1 || 0) + (factura.ImporteIva2 || 0);
  doc.text(iva.toFixed(2), 440, y, { width: 70, align: "right" });
  y += 20;

  doc.text("TOTAL:", 350, y, { width: 90, align: "right" });
  doc.text(
    factura.ImporteTotal ? factura.ImporteTotal.toFixed(2) : "0.00",
    440,
    y,
    { width: 70, align: "right" }
  );

  // Pie de página
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);

    // Agregar número de página
    doc
      .fontSize(8)
      .text(`Página ${i + 1} de ${pageCount}`, 50, doc.page.height - 50, {
        align: "center",
        width: doc.page.width - 100,
      });

    // Agregar información legal
    if (i === pageCount - 1) {
      doc
        .fontSize(8)
        .text("Documento no válido como factura", 50, doc.page.height - 30, {
          align: "center",
          width: doc.page.width - 100,
        });
    }
  }
}
