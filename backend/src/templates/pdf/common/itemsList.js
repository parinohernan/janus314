/**
 * Renderiza la lista de items en el documento PDF
 * @param {PDFDocument} doc - Documento PDF
 * @param {Array} items - Array de items a mostrar
 * @param {number} y - Posición Y inicial
 * @param {Object} options - Opciones de configuración
 * @returns {number} - Posición Y final
 */
const renderTable = require("./table");
const { resolverPrecioLista, renglonPdfSinIva } = require("./precioItem");

function formatearPorcentaje(value) {
  const n = Number(value) || 0;
  if (Number.isInteger(n)) return `${n}%`;
  return `${parseFloat(n.toFixed(2))}%`;
}

function formatearCantidad(value) {
  const n = Number(value) || 0;
  if (Number.isInteger(n)) return String(n);
  return String(parseFloat(n.toFixed(2)));
}

function renderItemsList(doc, items, y, options = {}) {
  const exacto = Boolean(options.exacto);

  const itemsConSubtotal = items.map((item) => {
    if (exacto) {
      const renglon = renglonPdfSinIva(item);
      return {
        ...item,
        Cantidad: renglon.cantidad,
        PrecioLista: renglon.precioLista,
        PrecioUnitario: renglon.precioUnitario,
        Descuento: renglon.descuento,
        Subtotal: renglon.subtotal,
        PorcentajeIvaPrincipal: renglon.porcentajeIva,
      };
    }

    const cantidad = item.Cantidad || 0;
    const precioLista = resolverPrecioLista(item);
    const descuento = item.PorcentajeBonificado || 0;
    const subtotal = cantidad * precioLista * (1 - descuento / 100);

    const porcentajeIva1 = item.PorcentajeIVA1 || 0;
    const porcentajeIva2 = item.PorcentajeIVA2 || 0;
    const porcentajeIvaPrincipal = porcentajeIva1 > 0 ? porcentajeIva1 : porcentajeIva2;

    return {
      ...item,
      Cantidad: cantidad,
      PrecioLista: precioLista,
      PrecioUnitario: item.PrecioUnitario || 0,
      Descuento: descuento,
      Subtotal: subtotal,
      PorcentajeIvaPrincipal: porcentajeIvaPrincipal
    };
  });

  // Ancho útil ~555. La descripción se lleva el resto para no recortar nombres.
  const columns = exacto
    ? [
        { header: "Código", property: "CodigoArticulo", width: 38, align: "left" },
        {
          header: "Cant.",
          property: "Cantidad",
          width: 34,
          align: "right",
          format: formatearCantidad,
        },
        {
          header: "Descripción",
          property: "Descripcion",
          width: 254,
          align: "left",
          extraWidth: 0,
          offset: 8,
        },
        {
          header: "P. Lista",
          property: "PrecioLista",
          width: 48,
          align: "right",
          format: (value) => Number(value || 0).toFixed(2),
        },
        {
          header: "Desc.",
          property: "Descuento",
          width: 28,
          align: "right",
          format: formatearPorcentaje,
        },
        {
          header: "Precio U.",
          property: "PrecioUnitario",
          width: 48,
          align: "right",
          format: (value) => Number(value || 0).toFixed(2),
        },
        {
          header: "% IVA",
          property: "PorcentajeIvaPrincipal",
          width: 30,
          align: "right",
          format: formatearPorcentaje,
        },
        {
          header: "Subt. s/IVA",
          property: "Subtotal",
          width: 54,
          align: "right",
          format: (value) => Number(value || 0).toFixed(2),
        },
      ]
    : [
        { header: "Código", property: "CodigoArticulo", width: 40, align: "left" },
        { header: "Cant.", property: "Cantidad", width: 30, align: "left" },
        { header: "Descripción", property: "Descripcion", width: 280, align: "left" },
        {
          header: "Precio U.",
          property: "PrecioLista",
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
        },
      ];

  // Posicionar el cursor
  doc.y = y;
  doc.x = 0;

  // Renderizar tabla de ítems con columnas personalizadas
  y = renderTable(doc, itemsConSubtotal, {
    columns,
    headerFontSize: exacto ? 8 : 10,
    fontSize: exacto ? 8 : 10,
  });

  return y;
}

module.exports = renderItemsList; 