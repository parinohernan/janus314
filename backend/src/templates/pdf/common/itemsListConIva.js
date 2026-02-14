/**
 * Renderiza la lista de ítems con IVA individual para facturas B
 * Misma lógica que Factura A (PrecioLista, descuento) pero con IVA incluido en Precio Unit. y Total
 * @param {PDFDocument} doc - Documento PDF
 * @param {Array} items - Lista de ítems
 * @param {number} startY - Posición Y inicial
 * @returns {number} - Posición Y final
 */
function renderItemsListConIva(doc, items, startY, interlineado = 10) {
  const tableTop = startY + 20;
  const tableLeft = 20;
  const tableWidth = doc.page.width - 40;
  const columnWidth = {
    codigo: 40,
    cantidad: 26,
    descripcion: 280,
    // iva: 40,
    precioUnitario: 70,
    descuento: 45,
    total: 70
  };

  const itemsConSubtotal = items.map((item) => {
    const cantidad = item.Cantidad || 0;
    const precioLista = item.PrecioLista || 0;
    const descuento = item.PorcentajeBonificado || 0;
    const porcentajeIva = item.PorcentajeIVA1 || item.PorcentajeIVA2 || 0;

    // Precio unitario sin IVA (lista con descuento aplicado)
    const precioUnitarioSinIva = precioLista * (1 - descuento / 100);
    // Precio unitario con IVA
    const precioUnitarioConIva = precioUnitarioSinIva * (1 + porcentajeIva / 100);
    // Total línea = cantidad × precio unitario con IVA
    const totalConIva = cantidad * precioUnitarioConIva;

    return {
      ...item,
      Cantidad: cantidad,
      PrecioLista: precioLista,
      Descuento: descuento,
      PorcentajeIva: porcentajeIva,
      PrecioUnitarioConIva: precioUnitarioConIva,
      TotalConIva: totalConIva
    };
  });

  doc.font("Helvetica-Bold");
  doc.fontSize(10);

  let x = tableLeft;
  doc.text("Código", x, tableTop, { width: columnWidth.codigo });
  x += columnWidth.codigo;

  doc.text("Cant.", x, tableTop, { width: columnWidth.cantidad, align: "right" });
  x += columnWidth.cantidad;

  doc.text("Descripción", x + 4, tableTop, { width: columnWidth.descripcion });
  x += columnWidth.descripcion;

  // doc.text("% IVA", x, tableTop, { width: columnWidth.iva, align: "right" });
  // x += columnWidth.iva;

  doc.text("Precio U.", x + 6, tableTop, { width: columnWidth.precioUnitario, align: "right" });
  x += columnWidth.precioUnitario + 6;

  doc.text("Desc.", x, tableTop, { width: columnWidth.descuento, align: "right" });
  x += columnWidth.descuento;

  doc.text("Total", x, tableTop, { width: columnWidth.total, align: "right" });

  doc.moveTo(tableLeft, tableTop + interlineado).lineTo(tableLeft + tableWidth, tableTop + interlineado).stroke();
  doc.font("Helvetica");

  let y = tableTop + interlineado + interlineado / 2;
  let maxY = y;

  itemsConSubtotal.forEach((item) => {
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = 50;

      doc.font("Helvetica-Bold");
      doc.fontSize(10);
      x = tableLeft;
      doc.text("Código", x, y, { width: columnWidth.codigo });
      x += columnWidth.codigo;
      doc.text("Cant.", x, y, { width: columnWidth.cantidad, align: "right" });
      x += columnWidth.cantidad;
      doc.text("Descripción", x + 4, y, { width: columnWidth.descripcion + 20 });
      x += columnWidth.descripcion;
      // doc.text("% IVA", x, y, { width: columnWidth.iva, align: "right" });
      // x += columnWidth.iva;
      doc.text("Precio U.", x + 6, y, { width: columnWidth.precioUnitario, align: "right" });
      x += columnWidth.precioUnitario + 6;
      doc.text("Desc.", x, y, { width: columnWidth.descuento, align: "right" });
      x += columnWidth.descuento;
      doc.text("Total", x, y, { width: columnWidth.total, align: "right" });
      doc.moveTo(tableLeft, y + 10).lineTo(tableLeft + tableWidth, y + 10).stroke();
      doc.font("Helvetica");
      y += interlineado;
    }

    x = tableLeft;
    doc.text(item.CodigoArticulo || "", x, y, { width: columnWidth.codigo });
    x += columnWidth.codigo;

    doc.text(item.Cantidad.toString(), x, y, { width: columnWidth.cantidad, align: "right" });
    x += columnWidth.cantidad;

    doc.text(item.Descripcion || "", x + 4, y, { width: columnWidth.descripcion + 20 });
    x += columnWidth.descripcion;

    // doc.text(
    //   item.PorcentajeIva > 0 ? `${item.PorcentajeIva}%` : "0%",
    //   x,
    //   y,
    //   { width: columnWidth.iva, align: "right" }
    // );
    // x += columnWidth.iva;

    doc.text(item.PrecioUnitarioConIva.toFixed(2), x + 6, y, { width: columnWidth.precioUnitario, align: "right" });
    x += columnWidth.precioUnitario + 6;

    doc.text(item.Descuento.toFixed(2), x, y, { width: columnWidth.descuento, align: "right" });
    x += columnWidth.descuento;

    doc.text(item.TotalConIva.toFixed(2), x, y, { width: columnWidth.total, align: "right" });

    y += interlineado;
    maxY = Math.max(maxY, y);
  });

  doc.moveTo(tableLeft, maxY).lineTo(tableLeft + tableWidth, maxY).stroke();
  return maxY + 10;
}

module.exports = renderItemsListConIva;