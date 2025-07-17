/**
 * Renderiza la lista de ítems para prefacturas con descuentos
 * @param {PDFDocument} doc - Documento PDF
 * @param {Array} items - Lista de ítems
 * @param {number} startY - Posición Y inicial
 * @returns {number} - Posición Y final
 */
function renderItemsListPrefactura(doc, items, startY, interlineado=20) {
  // Configuración de la tabla
  const tableTop = startY + 20;
  const tableLeft = 20;
  const tableWidth = doc.page.width - 40;
  const columnWidth = {
    codigo: 40,
    cantidad: 26, // Reducido de 30 a 26 (quitar 4 caracteres)
    descripcion: 210, // Aumentado de 200 a 210 (agregar 10 caracteres)
    precioLista: 70,
    descuento: 40,
    precioUnitario: 70,
    total: 70
  };

  // Preparar los items con la información necesaria
  const itemsConSubtotal = items.map((item) => {
    const cantidad = item.Cantidad || 0;
    const precioListaSinIva = item.PrecioLista || 0; // Viene sin IVA de la BD
    const porcentajeBonificado = item.PorcentajeBonificado || 0; // Viene de la BD
    const precioUnitarioSinIva = item.PrecioUnitario || 0; // Viene sin IVA de la BD
    const porcentajeIva = item.PorcentajeIVA1 || 21;
    
    // Calcular precio de lista CON IVA incluido
    const precioListaConIva = precioListaSinIva * (1 + porcentajeIva / 100);
    
    // Calcular precio unitario CON IVA incluido
    const precioUnitarioConIva = precioUnitarioSinIva * (1 + porcentajeIva / 100);
    
    // Calcular total: P. Unit × Cantidad
    const total = cantidad * precioUnitarioConIva;
    
    return {
      ...item,
      Cantidad: cantidad,
      PrecioLista: precioListaConIva,
      PorcentajeBonificacion: Number(porcentajeBonificado).toFixed(2),
      PrecioUnitario: precioUnitarioConIva,
      TotalConIva: total
    };
  });

  // Encabezados de la tabla
  doc.font("Helvetica-Bold");
  doc.fontSize(9);
  
  let x = tableLeft;
  doc.text("Código", x, tableTop, { width: columnWidth.codigo });
  x += columnWidth.codigo;
  
  doc.text("Cant.", x, tableTop, { width: columnWidth.cantidad, align: "right" });
  x += columnWidth.cantidad;
  
  doc.text("Descripción", x+2, tableTop, { width: columnWidth.descripcion });
  x += columnWidth.descripcion;
  
  doc.text("P. Lista", x + 6, tableTop, { width: columnWidth.precioLista, align: "right" });
  x += columnWidth.precioLista + 6;
  
  doc.text("% Desc.", x, tableTop, { width: columnWidth.descuento, align: "right" });
  x += columnWidth.descuento;
  
  doc.text("P. Unit.", x, tableTop, { width: columnWidth.precioUnitario, align: "right" });
  x += columnWidth.precioUnitario;
  
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
      doc.fontSize(9);
      
      x = tableLeft;
      doc.text("Código", x, y, { width: columnWidth.codigo });
      x += columnWidth.codigo;
      
      doc.text("Cant.", x, y, { width: columnWidth.cantidad, align: "right" });
      x += columnWidth.cantidad;
      
      doc.text("Descripción", x+2, y, { width: columnWidth.descripcion });
      x += columnWidth.descripcion;
      
      doc.text("P. Lista", x + 6, y, { width: columnWidth.precioLista, align: "right" });
      x += columnWidth.precioLista + 6;
      
      doc.text("% Desc.", x, y, { width: columnWidth.descuento, align: "right" });
      x += columnWidth.descuento;
      
      doc.text("P. Unit.", x, y, { width: columnWidth.precioUnitario, align: "right" });
      x += columnWidth.precioUnitario;
      
      doc.text("Total", x, y, { width: columnWidth.total, align: "right" });
      
      // Línea horizontal debajo de los encabezados
      doc.moveTo(tableLeft, y + 15).lineTo(tableLeft + tableWidth, y + 15).stroke();
      
      // Restaurar fuente normal
      doc.font("Helvetica");
      
      y += interlineado;
    }
    
    // Calcular altura necesaria para la descripción
    const descripcionText = item.Descripcion || "";
    
    // Calcular altura basada en la longitud del texto y el ancho de la columna
    // Aproximadamente 50 caracteres por línea con fuente de 9pt (más realista)
    const charsPerLine = Math.floor(columnWidth.descripcion / 4.5); // 4.5 puntos por carácter (más realista)
    const estimatedLines = Math.ceil(descripcionText.length / charsPerLine);
    const lineHeight = 12; // Altura por línea en puntos
    const descripcionHeight = Math.max(interlineado, estimatedLines * lineHeight);
    
    // Renderizar fila
    x = tableLeft;
    doc.text(item.CodigoArticulo || "", x, y, { width: columnWidth.codigo });
    x += columnWidth.codigo;
    
    doc.text(item.Cantidad.toString(), x, y, { width: columnWidth.cantidad, align: "right" });
    x += columnWidth.cantidad;
    
    // Renderizar descripción
    doc.text(descripcionText, x+2, y, { 
      width: columnWidth.descripcion + 20,
      ellipsis: false
    });
    x += columnWidth.descripcion;
    
    doc.text(item.PrecioLista.toFixed(2), x + 6, y, { width: columnWidth.precioLista, align: "right" });
    x += columnWidth.precioLista + 6;
    
    // Mostrar descuento solo si es mayor a 0
    const descuentoText = item.PorcentajeBonificacion > 0 ? `${item.PorcentajeBonificacion}%` : "0%";
    doc.text(descuentoText, x, y, { width: columnWidth.descuento, align: "right" });
    x += columnWidth.descuento;
    
    // Mostrar precio unitario calculado
    doc.text(item.PrecioUnitario.toFixed(2), x, y, { width: columnWidth.precioUnitario, align: "right" });
    x += columnWidth.precioUnitario;
    
    doc.text(item.TotalConIva.toFixed(2), x, y, { width: columnWidth.total, align: "right" });
    
    // Avanzar Y según la altura real de la descripción
    y += descripcionHeight;
    maxY = Math.max(maxY, y);
  });
  
  // Línea horizontal debajo de la tabla
  doc.moveTo(tableLeft, maxY).lineTo(tableLeft + tableWidth, maxY).stroke();
  
  return maxY + 10;
}

module.exports = renderItemsListPrefactura; 