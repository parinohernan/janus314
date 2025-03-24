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
  const logoPath = path.join(__dirname, "./common/logos/logoempresa.png");

  // Encabezado
  let y = renderHeader(doc, {
    fecha: factura.Fecha,
    companyName: factura.Empresa.RazonSocial,
    companyName2: factura.Empresa.PieCero,
    companyTaxId: factura.Empresa.Cuit,
    companyAddress: factura.Empresa.DomicilioComercial,
    companyPhone: factura.Empresa.Telefono,
    companyEmail: factura.Empresa.Email,
    companyLocalidad: factura.Empresa.Localidad,
    companyIngresosBrutos: factura.Empresa.IngresosBrutos,
    companyInicioActividades:
      factura.Empresa.InicioActividades.toLocaleDateString("es-AR"),
    title: "A",
    documentType: "A",
    documentNumber: `${factura.DocumentoSucursal}-${factura.DocumentoNumero}`,
    logoPath: logoPath,
  });

  // Información del cliente
  let yCliente = y; // marca para saber donde empezar a escribir el cliente
  doc.x = 20;
  doc
    .fontSize(12)
    .text(`CLIENTE: ${factura.Cliente ? factura.Cliente.Descripcion : "N/A"}`);
  doc.text(`DOMICILIO: ${factura.Cliente ? factura.Cliente.Calle : "N/A"}`);
  doc.text(
    `CAT IVA: ${
      factura.Cliente.CategoriaIva === "I"
        ? "RESPONSABLE INSCRIPTO"
        : factura.Cliente.CategoriaIva === "M"
        ? "MONOTRIBUTO"
        : factura.Cliente.CategoriaIva === "E"
        ? "EXENTO"
        : "N/A"
    }`
  );
  //   doc.moveDown();
  let yTablaItems = doc.y;
  console.log("factura", factura);
  doc.x = 270;
  doc.y = yCliente;
  doc
    .fontSize(12)
    .text(
      `CUIT: ${factura.Cliente.Cuit.substring(
        0,
        2
      )}-${factura.Cliente.Cuit.substring(
        2,
        10
      )}-${factura.Cliente.Cuit.substring(10, 11)}`
    ); //se muestran 2 digitos luego un - luego 8 digitos otro - luego 1 digito
  doc.text(`LOCALIDAD: ${factura.Cliente ? factura.Cliente.Localidad : "N/A"}`);

  doc.x = 440;
  doc.y = yCliente;
  doc
    .fontSize(12)
    .text(
      `PAGO: ${
        factura.PagoTipo === "CO"
          ? "CTADO"
          : factura.PagoTipo === "CC"
          ? "CTA CTE"
          : "N/A"
      }`
    );
  doc.text(`LISTA: ${factura.ListaNumero}`);

  // Tabla de items
  const itemsConSubtotal = items.map((item) => {
    const articulo = item.Articulo || {};
    console.log("item", item);
    return {
      ...item,
      Descripcion: articulo.Descripcion || "Artículo no encontrado",
      PrecioUnitario: item.PrecioUnitario || 0,
      Cantidad: item.Cantidad || 0,
      Descuento: item.PorcentajeBonificado || 0,
      Subtotal: item.Total,
    };
  });
  doc.y = yTablaItems;
  doc.x = 0;

  y = renderTable(doc, itemsConSubtotal, {
    startY: doc.y,
    startX: 0,
    columns: [
      {
        header: "Código",
        property: "CodigoArticulo",
        width: 50,
        align: "left",
      },
      {
        header: "Descripción",
        property: "Descripcion",
        width: 300,
        align: "left",
      },
      { header: "Cant.", property: "Cantidad", width: 30, align: "right" },
      {
        header: "Precio U.",
        property: "PrecioUnitario",
        width: 80,
        align: "right",
        format: (value) => value.toFixed(2),
      },
      {
        header: "Desc.",
        property: "Descuento",
        width: 40,
        align: "right",
        format: (value) => value.toFixed(2),
      },
      {
        header: "Subtotal",
        property: "Subtotal",
        width: 80,
        align: "right",
        format: (value) => value.toFixed(2),
      },
    ],
  });

  // Espacio después de la tabla
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

  //   // Fecha y CAE
  //   // Fecha y CAE
  //   doc
  //     .fontSize(10)
  //     .text(`Fecha: ${new Date(factura.Fecha).toLocaleDateString("es-AR")}`);
  //   if (factura.afip_cae) {
  //     doc.text(`CAE: ${factura.afip_cae}`);
  //     doc.text(
  //       `Vencimiento CAE: ${new Date(
  //         factura.afip_cae_vencimiento
  //       ).toLocaleDateString("es-AR")}`
  //     );
  //   }
  //   doc.moveDown();
  // Pie de página
  //   doc.text("Documento válido como factura", 20, 750, {
  //     width: 90,
  //     align: "left",
  //   });
  if (factura.DocumentoTipo === "FCA" || factura.DocumentoTipo === "FCB") {
    doc.x = 20;
    doc.y = 750;
    doc.text(
      factura.afip_cae
        ? `CAE: ${factura.afip_cae} - Vto: ${new Date(
            factura.afip_cae_vencimiento
          ).toLocaleDateString("es-AR")}`
        : null
    );
  }
}

module.exports = renderFacturaA;
