const renderHeader = require("./common/header");
const renderFooter = require("./common/footer");
const renderTable = require("./common/table");
const path = require("path");
const { generarDatosQR, generarQR } = require("../../utils/qrAfip");

/**
 * Genera un PDF para una Factura A
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} data - Datos de la factura
 */
async function renderFacturaA(doc, data) {
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
    .text(`Cliente: ${factura.Cliente ? factura.Cliente.Descripcion : "N/A"}`);
  doc.text(`Domicilio: ${factura.Cliente ? factura.Cliente.Calle : "N/A"}`);
  doc.text(
    `Categoria IVA: ${
      factura.Cliente.CategoriaIva === "I"
        ? "Responsable Inscrito"
        : factura.Cliente.CategoriaIva === "M"
        ? "Monotributista"
        : factura.Cliente.CategoriaIva === "E"
        ? "Exento"
        : "N/A"
    }`
  );
  //   doc.moveDown();
  doc.strokeColor("#000000").moveTo(20, doc.y).lineTo(580, doc.y).stroke();
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
  doc.text(`Localidad: ${factura.Cliente ? factura.Cliente.Localidad : "N/A"}`);

  doc.x = 440;
  doc.y = yCliente;
  doc
    .fontSize(12)
    .text(
      `Pago: ${
        factura.PagoTipo === "CO"
          ? "Contado"
          : factura.PagoTipo === "CC"
          ? "Cta. Cte."
          : "N/A"
      }`
    );
  doc.text(`Lista: ${factura.ListaNumero}`);

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

  // Renderizar tabla de ítems
  y = renderTable(doc, itemsConSubtotal, {
    showIva: true, // Mostrar columna de IVA en facturas A
  });

  // Espacio después de la tabla
  //   y += 10;
  y = 660;
  let yTotales = y;
  let xTotales = 420;

  doc.x = xTotales;

  // Totales
  doc.font("Helvetica-Bold");
  doc.text("Subtotal:", xTotales, y, { width: 90, align: "right" });
  doc.text(
    factura.ImporteNeto ? factura.ImporteNeto.toFixed(2) : "0.00",
    xTotales + 90,
    y,
    { width: 70, align: "right" }
  );
  y += 20;

  doc.text("IVA 21%:", xTotales, y, { width: 90, align: "right" });
  doc.text(
    factura.ImporteIva1 ? factura.ImporteIva1.toFixed(2) : "0.00",
    xTotales + 90,
    y,
    { width: 70, align: "right" }
  );
  y += 20;

  if (factura.ImporteIva2 && factura.ImporteIva2 > 0) {
    doc.text("IVA 10.5%:", xTotales, y, { width: 90, align: "right" });
    doc.text(factura.ImporteIva2.toFixed(2), xTotales + 90, y, {
      width: 70,
      align: "right",
    });
    y += 20;
  }

  if (factura.ImportePercepcionIIBB && factura.ImportePercepcionIIBB > 0) {
    doc.text("Perc. IIBB:", xTotales, y, { width: 90, align: "right" });
    doc.text(factura.ImportePercepcionIIBB.toFixed(2), xTotales + 90, y, {
      width: 70,
      align: "right",
    });
    y += 20;
  }

  //   // Línea antes de los TOTALES
  doc.strokeColor("#000000").moveTo(20, 650).lineTo(580, 650).stroke();
  y += 10;
  // texto no se aceptan deboluciones despues le las 48hs

  doc.fontSize(10);
  const convertirNumeroAPalabras = require("../../utils/convertirNumeroAPalabras");

  const TotalEnPalabras = convertirNumeroAPalabras(factura.ImporteTotal);
  console.log("Total", factura.ImporteTotal);
  doc.text(`Son ${TotalEnPalabras}`, 20, yTotales);
  doc.text("No se aceptan devoluciones después de las 48hs", 20, yTotales + 12);

  doc.fontSize(12).text("TOTAL:", xTotales, y, { width: 90, align: "right" });
  doc.text(
    factura.ImporteTotal ? factura.ImporteTotal.toFixed(2) : "0.00",
    xTotales + 90,
    y,
    { width: 70, align: "right" }
  );

  // Código QR en el pie de página (solo para comprobantes electrónicos)
  if (
    (factura.DocumentoTipo === "FCA" || factura.DocumentoTipo === "FCB") &&
    factura.afip_cae
  ) {
    // Zona para el QR
    doc.y = yTotales;
    doc.x = 20;

    try {
      // Generar datos del QR
      const datosQR = await generarDatosQR(factura);

      if (datosQR) {
        // Generar imagen QR
        const qrImage = await generarQR(datosQR);

        if (qrImage) {
          // Dibujar el QR
          doc.image(qrImage, doc.x, doc.y + 24, { width: 80, height: 80 });

          // Agregar leyenda debajo del QR
          //   doc
          //     .fontSize(8)
          // .text("Código QR - Verificación AFIP", doc.x, doc.y + 105, {
          //   width: 100,
          //   align: "center",
          // });
        } else {
          // Si no se pudo generar el QR, mostrar un marco vacío
          doc.rect(doc.x, doc.y, 100, 100).strokeColor("#202020").stroke();
        }
      } else {
        // Si no hay datos para el QR, mostrar un marco vacío
        doc.rect(doc.x, doc.y, 100, 100).strokeColor("#202020").stroke();
      }
    } catch (error) {
      console.error("Error generando QR para factura:", error);
      // Mostrar un marco vacío en caso de error
      doc.rect(doc.x, doc.y, 100, 100).strokeColor("#202020").stroke();
    }
  } else {
    // Si no es un comprobante electrónico o no tiene CAE, mostrar un marco vacío
    doc.rect(doc.x, doc.y, 100, 100).strokeColor("#000000").stroke();
  }

  // Información del CAE a la derecha del QR

  if (factura.DocumentoTipo === "FCA" || factura.DocumentoTipo === "FCB") {
    doc.x = 140;
    doc.y = yTotales + 80;
    doc.fontSize(8);
    doc.text(
      factura.afip_cae
        ? `CAE: ${factura.afip_cae} - Vto: ${new Date(
            factura.afip_cae_vencimiento
          ).toLocaleDateString("es-AR")}`
        : null
    );
    doc.x = 140;
    doc.y = yTotales + 10;

    // Modificar esta parte para verificar si el archivo existe
    const logoARCA = path.join(__dirname, "./common/logos/ARCA.png");
    try {
      // Verificar si el archivo existe antes de intentar cargarlo
      const fs = require("fs");
      if (fs.existsSync(logoARCA)) {
        doc.image(logoARCA, doc.x, doc.y + 10, { width: 80, height: 40 });
      } else {
        console.warn(`Logo ARCA no encontrado en: ${logoARCA}`);
        // Opcional: Dibujar un rectángulo o texto alternativo
        doc.rect(doc.x, doc.y, 60, 100).strokeColor("#cccccc").stroke();
        doc.text("Logo no disponible", doc.x + 10, doc.y + 40, {
          width: 80,
          align: "center",
        });
      }
    } catch (error) {
      console.error(`Error al cargar el logo ARCA: ${error.message}`);
    }
  }
  doc.fontSize(8);
  doc.y = y + 40;
  doc.text(
    "Esta Agencia no se responsabiliza por los datos ingresados en el detalle de la operación"
  );
}

module.exports = renderFacturaA;
