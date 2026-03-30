const renderHeader = require("./common/header");
const { formatearFecha } = require("../../utils/formatters");
const path = require("path");

function formatearCantidadPdf(val) {
  if (val == null || Number.isNaN(val)) return "—";
  const v = parseFloat(val);
  if (!Number.isFinite(v)) return "—";
  if (Number.isInteger(v)) return String(v);
  const s = v.toFixed(4).replace(/\.?0+$/, "");
  return s || "0";
}

async function renderOrdenCompra(doc, { orden, items, logoPath, vistaProveedor = false }) {
  const finalLogoPath = logoPath || path.join(__dirname, "./common/logos/logoempresa.png");
  doc.font("Helvetica");

  let y = renderHeader(doc, {
    fecha: orden.Fecha,
    companyName: orden.Empresa.RazonSocial,
    companyName2: orden.Empresa.PieCero,
    companyTaxId: orden.Empresa.Cuit,
    companyAddress: orden.Empresa.DomicilioComercial,
    companyPhone: orden.Empresa.Telefono,
    companyEmail: orden.Empresa.Email,
    companyLocalidad: orden.Empresa.Localidad,
    companyIngresosBrutos: orden.Empresa.IngresosBrutos,
    companyInicioActividades: orden.Empresa.InicioActividades
      ? orden.Empresa.InicioActividades.toLocaleDateString("es-AR")
      : "No especificado",
    title: "OC",
    documentType: "OC",
    documentNumber: `${orden.DocumentoSucursal}-${orden.DocumentoNumero}`,
    logoPath: finalLogoPath,
    isOrdenCompra: true,
  });

  doc.fontSize(12).font("Helvetica-Bold");
  doc.text("Orden de Compra", 30, 2, { align: "center" });
  doc.font("Helvetica");
  if (vistaProveedor) {
    doc.fontSize(9).font("Helvetica-Oblique");
    doc.text("Artículos en códigos y cantidades del proveedor", 30, 16, { align: "center" });
    doc.font("Helvetica");
    y += 12;
  }

  // Información del proveedor
  y += 15;
  doc.x = 20;
  doc.y = y;
  const proveedor = orden.ProveedorRelacion || orden.Proveedor;
  doc.fontSize(11).font("Helvetica-Bold");
  doc.text("Proveedor:", 20, y);
  doc.font("Helvetica");
  doc.text(proveedor?.Descripcion || orden.ProveedorCodigo || "N/A", 90, y);
  y += 15;
  doc.text(`Código: ${orden.ProveedorCodigo || "N/A"}`, 20, y);
  if (proveedor?.Cuit) doc.text(`CUIT: ${proveedor.Cuit}`, 200, y);
  if (proveedor?.Telefono) doc.text(`Tel: ${proveedor.Telefono}`, 380, y);
  y += 15;
  if (orden.FechaDeEntrega) {
    doc.text(`Fecha entrega: ${formatearFecha(orden.FechaDeEntrega)}`, 20, y);
    y += 15;
  }
  doc.strokeColor("#000000").moveTo(20, y).lineTo(580, y).stroke();
  y += 15;

  // Tabla de ítems (sin precios)
  const dibujarCabeceraTablaOc = () => {
    doc.font("Helvetica-Bold").fontSize(9);
    if (vistaProveedor) {
      doc.text("Cód. prov.", 20, y, { width: 72 });
      doc.text("Desc. prov.", 97, y, { width: 235 });
      doc.text("Cant.", 418, y, { width: 78, align: "right" });
    } else {
      doc.text("Código", 20, y, { width: 72 });
      doc.text("Descripción", 97, y, { width: 218 });
      doc.text("Cant.empresa", 318, y, { width: 72, align: "right" });
      doc.text("Cant.proveedor", 398, y, { width: 78, align: "right" });
    }
    y += 11;
    doc.moveTo(20, y).lineTo(500, y).stroke();
    y += 8;
    doc.font("Helvetica").fontSize(9);
  };

  dibujarCabeceraTablaOc();

  items.forEach((item) => {
    if (y > 640) {
      doc.addPage();
      y = 50;
      dibujarCabeceraTablaOc();
    }
    if (vistaProveedor) {
      const codigoCol = item.CodigoArticuloProveedor ? String(item.CodigoArticuloProveedor) : "—";
      const descripcionCol = item.DescripcionProveedor ? String(item.DescripcionProveedor) : "—";
      const cantidadTxt = formatearCantidadPdf(item.CantidadProveedor);
      doc.text(codigoCol, 20, y, { width: 72 });
      doc.text(descripcionCol.substring(0, 42), 97, y, { width: 235 });
      doc.text(cantidadTxt, 418, y, { width: 78, align: "right" });
    } else {
      const codigoCol = item.CodigoArticulo || "";
      const descripcionCol = item.Descripcion || item.Articulo?.Descripcion || "";
      doc.text(codigoCol, 20, y, { width: 72 });
      doc.text(descripcionCol.substring(0, 40), 97, y, { width: 218 });
      doc.text(formatearCantidadPdf(item.Cantidad), 318, y, { width: 72, align: "right" });
      doc.text(formatearCantidadPdf(item.CantidadProveedor), 398, y, { width: 78, align: "right" });
    }
    y += 13;
  });

  y += 10;
  doc.moveTo(20, y).lineTo(540, y).stroke();
  y += 15;

  if (orden.Observacion) {
    doc.fontSize(10);
    doc.text(`Observación: ${orden.Observacion}`, 20, y);
    y += 20;
  }
}

module.exports = renderOrdenCompra;
