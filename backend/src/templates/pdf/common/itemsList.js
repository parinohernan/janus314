/**
 * Renderiza la lista de items en el documento PDF
 * @param {PDFDocument} doc - Documento PDF
 * @param {Array} items - Array de items a mostrar
 * @param {number} y - Posición Y inicial
 * @param {Object} options - Opciones de configuración
 * @returns {number} - Posición Y final
 */
function renderItemsList(doc, items, y, options = {}) {
  // Preparar los items con la información necesaria
  const itemsConSubtotal = items.map((item) => {
    const articulo = item.Articulo || {};
    return {
      ...item,
      Descripcion: articulo.Descripcion || "Artículo no encontrado",
      PrecioUnitario: item.PrecioUnitario || 0,
      Cantidad: item.Cantidad || 0,
      Descuento: item.PorcentajeBonificado || 0,
      Subtotal: item.Total,
    };
  });

  // Posicionar el cursor
  doc.y = y;
  doc.x = 0;

  // Renderizar tabla de ítems
  y = renderTable(doc, itemsConSubtotal, {
    showIva: options.showIva || false, // Mostrar columna de IVA
  });

  return y;
}

// Importar la función renderTable
const renderTable = require("./table");

module.exports = renderItemsList; 