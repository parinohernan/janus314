/**
 * Genera una tabla de items para documentos
 * @param {PDFDocument} doc - Documento PDF
 * @param {Array} items - Array de items a mostrar
 * @param {Object} options - Opciones de configuración
 */
function renderTable(doc, items, options = {}) {
  const {
    startY = doc.y,
    columns = [
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
        width: 280,
        align: "left",
      },
      {
        header: "Precio U.",
        property: "PrecioUnitario",
        width: 70,
        align: "right",
        format: (value) => value.toFixed(2),
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
    ],
    padding = 20,
    margin = 20,
    headerBgColor = "#ffffff",
    rowBgColor = null,
    alternateRowBgColor = null,
    borderColor = "#000000",
    headerTextColor = "#000000",
    textColor = "#000000",
    fontSize = 10,
    headerFontSize = 10,
    font = "Helvetica",
    interlineado = 5,
  } = options;

  // Calcular ancho total y posición inicial
  const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const startX = margin;
  let y = startY;

  // Dibujar encabezados
  doc.font("Helvetica-Bold").fontSize(headerFontSize);

  // Fondo del encabezado si se especifica
  if (headerBgColor) {
    doc.fillColor(headerBgColor).rect(startX, y, tableWidth, 20).fill();
  }

  doc.fillColor(headerTextColor);

  let x = startX;
  columns.forEach((column) => {
    doc.text(column.header, x, y + padding / 2, {
      width: column.width,
      align: column.align || "left",
    });
    x += column.width;
  });

  // Línea después del encabezado
  y += 20;
  doc
    .strokeColor(borderColor)
    .moveTo(startX, y)
    .lineTo(startX + tableWidth, y)
    .stroke();

  // Dibujar filas
  doc.font(font).fontSize(fontSize).fillColor(textColor);

  items.forEach((item, i) => {
    // Calcular subtotal si no existe
    if (!item.Subtotal && item.Cantidad && item.PrecioUnitario) {
      item.Subtotal = item.Cantidad * item.PrecioUnitario;
    }

    // Verificar si hay suficiente espacio en la página
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = margin + 20;

      // Repetir encabezados en la nueva página
      doc.font("Helvetica-Bold").fontSize(headerFontSize);

      if (headerBgColor) {
        doc
          .fillColor(headerBgColor)
          .rect(startX, y - 20, tableWidth, 20)
          .fill();
      }

      doc.fillColor(headerTextColor);

      x = startX;
      columns.forEach((column) => {
        doc.text(column.header, x, y - 20 + padding / 2, {
          width: column.width,
          align: column.align || "left",
        });
        x += column.width;
      });

      // Línea después del encabezado
      doc
        .strokeColor(borderColor)
        .moveTo(startX, y)
        .lineTo(startX + tableWidth, y)
        .stroke();

      doc.font("Helvetica").fontSize(fontSize).fillColor(textColor);
    }

    // Fondo de la fila si se especifica
    if (rowBgColor || (alternateRowBgColor && i % 2 === 1)) {
      const bgColor =
        alternateRowBgColor && i % 2 === 1 ? alternateRowBgColor : rowBgColor;
      if (bgColor) {
        doc.fillColor(bgColor).rect(startX, y, tableWidth, 20).fill();
      }
    }

    // Dibujar celdas
    x = startX;
    columns.forEach((column) => {
      let value = item[column.property];

      // Si la propiedad es anidada (por ejemplo, 'Articulo.Descripcion')
      if (column.property.includes(".")) {
        const props = column.property.split(".");
        let nestedValue = item;
        for (const prop of props) {
          nestedValue = nestedValue ? nestedValue[prop] : null;
        }
        value = nestedValue;
      }

      // Si hay una función de formato, aplicarla
      if (
        column.format &&
        typeof column.format === "function" &&
        value !== null &&
        value !== undefined
      ) {
        value = column.format(value);
      }

      // Si el valor es null o undefined, mostrar un valor por defecto
      if (value === null || value === undefined) {
        value = column.defaultValue || "";
      }

      doc.text(value.toString(), x, y + padding / 2, {
        width: column.width,
        align: column.align || "left",
      });
      x += column.width;
    });

    y += 20;
  });

  // Línea después de las filas
  // doc
  //   .strokeColor(borderColor)
  //   .moveTo(startX, y + 10)
  //   .lineTo(startX + tableWidth, y + 10)
  //   .stroke();

  return y + 10; // Retornar la posición Y actual para saber dónde continuar
}

module.exports = renderTable;
