/**
 * Renderiza la lista de ítems con IVA individual para facturas B
 * @param {PDFDocument} doc - Documento PDF
 * @param {Array} items - Lista de ítems
 * @param {number} startY - Posición Y inicial
 * @returns {number} - Posición Y final
 */
function renderItemsListConIva(doc, items, startY) {
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
  const itemsConSubtotal = items.map((item) => {
    const articulo = item.Articulo || {};
    const cantidad = item.Cantidad || 0;
    const precioBase = item.PrecioUnitario || 0;
    const porcentajeIva = articulo.PorcentajeIVA1 || 0;
    
    // Calcular precio unitario con IVA incluido
    const precioConIva = precioBase * (1 + porcentajeIva / 100);
    
    // Calcular total con IVA incluido
    const totalConIva = cantidad * precioConIva;
    
    return {
      ...item,
      Descripcion: articulo.Descripcion || "Artículo no encontrado",
      Cantidad: cantidad,
      PrecioBase: precioBase,
      PorcentajeIVA1: porcentajeIva,
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
  
  doc.text("Precio Unit.", x, tableTop, { width: columnWidth.precioUnitario, align: "right" });
  x += columnWidth.precioUnitario;
  
  doc.text("Total", x, tableTop, { width: columnWidth.total, align: "right" });
  
  // Línea horizontal debajo de los encabezados
  doc.moveTo(tableLeft, tableTop + 15).lineTo(tableLeft + tableWidth, tableTop + 15).stroke();
  
  // Restaurar fuente normal
  doc.font("Helvetica");
  
  // Renderizar ítems
  let y = tableTop + 20;
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
      
      doc.text("Descripción", x+4, y, { width: columnWidth.descripcion });
      x += columnWidth.descripcion;
      
      doc.text("Precio Unit.", x, y, { width: columnWidth.precioUnitario, align: "right" });
      x += columnWidth.precioUnitario;
      
      doc.text("Total", x, y, { width: columnWidth.total, align: "right" });
      
      // Línea horizontal debajo de los encabezados
      doc.moveTo(tableLeft, y + 15).lineTo(tableLeft + tableWidth, y + 15).stroke();
      
      // Restaurar fuente normal
      doc.font("Helvetica");
      
      y += 20;
    }
    
    // Renderizar fila
    x = tableLeft;
    doc.text(item.CodigoArticulo || "", x, y, { width: columnWidth.codigo });
    x += columnWidth.codigo;
    
    doc.text(item.Cantidad.toString(), x, y, { width: columnWidth.cantidad, align: "right" });
    x += columnWidth.cantidad;
    
    doc.text(item.Descripcion || "", x+4, y, { width: columnWidth.descripcion });
    x += columnWidth.descripcion;
    
    doc.text(item.PrecioConIva.toFixed(2), x, y, { width: columnWidth.precioUnitario, align: "right" });
    x += columnWidth.precioUnitario;
    
    doc.text(item.TotalConIva.toFixed(2), x, y, { width: columnWidth.total, align: "right" });
    
    y += 20;
    maxY = Math.max(maxY, y);
  });
  
  // Línea horizontal debajo de la tabla
  doc.moveTo(tableLeft, maxY).lineTo(tableLeft + tableWidth, maxY).stroke();
  
  return maxY + 10;
}

module.exports = renderItemsListConIva; 