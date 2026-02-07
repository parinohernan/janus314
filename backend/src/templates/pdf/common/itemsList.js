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
    // Determinar el porcentaje de IVA principal del item
    const porcentajeIva1 = item.PorcentajeIVA1 || 0;
    const porcentajeIva2 = item.PorcentajeIVA2 || 0;
    const porcentajeIvaPrincipal = porcentajeIva1 > 0 ? porcentajeIva1 : porcentajeIva2;
    
    return {
      ...item,
      PrecioUnitario: item.PrecioUnitario || 0,
      Cantidad: item.Cantidad || 0,
      Descuento: item.PorcentajeBonificado || 0,
      Subtotal: item.Subtotal || (item.Cantidad * item.PrecioUnitario) || 0,
      PorcentajeIvaPrincipal: porcentajeIvaPrincipal
    };
  });

  // Configurar columnas según si se muestra IVA o no
  let columns = [
    {
      header: "Código",
      property: "CodigoArticulo",
      width: 40,
      align: "left",
    },
    { header: "Cant.", property: "Cantidad", width: 30, align: "left" },
    {
      header: "Descripción",
      property: "Descripcion",
      width: options.showIva ? 230 : 280, // Ajustar ancho si mostramos IVA
      align: "left",
    },
  ];

  // Si mostramos IVA, agregar columna de % IVA
  if (options.showIva) {
    columns.push({
      header: "% IVA",
      property: "PorcentajeIvaPrincipal",
      width: 45,
      align: "right",
      format: (value) => value > 0 ? `${value}%` : "0%",
    });
  }

  // Agregar columnas comunes
  columns.push(
    {
      header: "Precio U.",
      property: "PrecioUnitario",
      width: 70,
      align: "right",
      format: (value) => value.toFixed(2),
      offset: 6,
    },
    {
      header: "Desc.",
      property: "Descuento",
      width: 70,
      align: "right",
      format: (value) => value.toFixed(2),
    },
    {
      header: "Subtotal",
      property: "Subtotal",
      width: 70,
      align: "right",
      format: (value) => value.toFixed(2),
    }
  );

  // Posicionar el cursor
  doc.y = y;
  doc.x = 0;

  // Renderizar tabla de ítems con columnas personalizadas
  y = renderTable(doc, itemsConSubtotal, {
    columns: columns,
  });

  return y;
}

// Importar la función renderTable
const renderTable = require("./table");

module.exports = renderItemsList; 