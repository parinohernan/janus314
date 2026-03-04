const renderHeader = require("./common/header");
const { formatearFecha } = require("../../utils/formatters");
const path = require("path");

async function renderOrdenCompra(doc, { orden, items, logoPath }) {
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
  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("Código", 20, y, { width: 80 });
  doc.text("Descripción", 100, y, { width: 340 });
  doc.text("Cant.", 450, y, { width: 80, align: "right" });
  y += 12;
  doc.moveTo(20, y).lineTo(540, y).stroke();
  y += 10;

  doc.font("Helvetica").fontSize(10);
  items.forEach((item) => {
    if (y > 640) {
      doc.addPage();
      y = 50;
      doc.font("Helvetica-Bold");
      doc.text("Código", 20, y, { width: 80 });
      doc.text("Descripción", 100, y, { width: 340 });
      doc.text("Cant.", 450, y, { width: 80, align: "right" });
      y += 12;
      doc.moveTo(20, y).lineTo(540, y).stroke();
      y += 10;
      doc.font("Helvetica");
    }
    const descripcion = item.Descripcion || item.Articulo?.Descripcion || "";
    const cantidad = parseFloat(item.Cantidad) || 0;
    doc.text(item.CodigoArticulo || "", 20, y, { width: 80 });
    doc.text(descripcion.substring(0, 55), 100, y, { width: 340 });
    doc.text(cantidad.toString(), 450, y, { width: 80, align: "right" });
    y += 14;
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
