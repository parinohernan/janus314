/**
 * Renderiza la lista de ítems con IVA individual para facturas B
 * @param {PDFDocument} doc - Documento PDF
 * @param {Array} items - Lista de ítems
 * @param {number} startY - Posición Y inicial
 * @returns {number} - Posición Y final
 */
function renderItemsListConIva(doc, items, startY, interlineado=10) { // Reducido de 20 a 10
  // Configuración de la tabla
  const tableTop = startY + 20;
  const tableLeft = 20;
  const tableWidth = doc.page.width - 40;
  const columnWidth = {
    codigo: 40,
    cantidad: 30,
    descripcion: 260,
    precioUnitario: 90,
    total: 90
  };

  // Preparar los items con la información necesaria
  // Los precios ya vienen calculados con IVA desde el controlador
  const itemsConSubtotal = items.map((item) => {
    const cantidad = item.Cantidad || 0;
    // PrecioUnitario y Subtotal ya vienen con IVA incluido desde el controlador
    const precioConIva = item.PrecioUnitario || 0;
    const totalConIva = item.Subtotal || (cantidad * precioConIva);
    
    return {
      ...item,
      Cantidad: cantidad,
      PrecioConIva: precioConIva,
      TotalConIva: totalConIva
    };
  });

  // Encabezados de la tabla
  doc.font("Helvetica-Bold");
  doc.fontSize(10);
  
  let x = tableLeft;
  doc.text("Código", x, tableTop, { width: columnWidth.codigo });
  x += columnWidth.codigo;
  
  doc.text("Cant.", x, tableTop, { width: columnWidth.cantidad, align: "right" });
  x += columnWidth.cantidad;
  
  doc.text("Descripción", x+4, tableTop, { width: columnWidth.descripcion });
  x += columnWidth.descripcion;
  
  doc.text("Precio Unit.", x + 6, tableTop, { width: columnWidth.precioUnitario, align: "right" });
  x += columnWidth.precioUnitario + 6;
  
  doc.text("Total", x, tableTop, { width: columnWidth.total, align: "right" });
  
  // Línea horizontal debajo de los encabezados
  doc.moveTo(tableLeft, tableTop + (interlineado)).lineTo(tableLeft + tableWidth, tableTop + interlineado).stroke();
  
  // Restaurar fuente normal
  doc.font("Helvetica");
  
  // Renderizar ítems
  let y = tableTop + interlineado + interlineado/2;
  let maxY = y;
  
  itemsConSubtotal.forEach((item, i) => {
    // Verificar si necesitamos una nueva página
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = 50;
      
      // Repetir encabezados en la nueva página
      doc.font("Helvetica-Bold");
      doc.fontSize(10);
      
      x = tableLeft;
      doc.text("Código", x, y, { width: columnWidth.codigo });
      x += columnWidth.codigo;
      
      doc.text("Cant.", x, y, { width: columnWidth.cantidad, align: "right" });
      x += columnWidth.cantidad;
      
      doc.text("Descripción", x+4, y, { width: columnWidth.descripcion + 20 });
      x += columnWidth.descripcion;
      
      doc.text("Precio Unit.", x + 6, y, { width: columnWidth.precioUnitario, align: "right" });
      x += columnWidth.precioUnitario + 6;
      
      doc.text("Total", x, y, { width: columnWidth.total, align: "right" });
      
      // Línea horizontal debajo de los encabezados
      doc.moveTo(tableLeft, y + 10).lineTo(tableLeft + tableWidth, y + 10).stroke(); // Reducido de 15 a 10
      
      // Restaurar fuente normal
      doc.font("Helvetica");
      
      y += interlineado;
    }
    
    // Renderizar fila
    x = tableLeft;
    doc.text(item.CodigoArticulo || "", x, y, { width: columnWidth.codigo });
    x += columnWidth.codigo;
    
    doc.text(item.Cantidad.toString(), x, y, { width: columnWidth.cantidad, align: "right" });
    x += columnWidth.cantidad;
    
    doc.text(item.Descripcion || "", x+4, y, { width: columnWidth.descripcion + 20 });
    x += columnWidth.descripcion;
    
    doc.text(item.PrecioConIva.toFixed(2), x + 6, y, { width: columnWidth.precioUnitario, align: "right" });
    x += columnWidth.precioUnitario + 6;
    
    doc.text(item.TotalConIva.toFixed(2), x, y, { width: columnWidth.total, align: "right" });
    
    y += interlineado;
    maxY = Math.max(maxY, y);
  });
  
  // Línea horizontal debajo de la tabla
  doc.moveTo(tableLeft, maxY).lineTo(tableLeft + tableWidth, maxY).stroke();
  
  return maxY + 10;
}

module.exports = renderItemsListConIva; 