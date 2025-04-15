/**
 * Renderiza la información del cliente en el documento PDF
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} factura - Datos de la factura
 * @param {number} y - Posición Y inicial
 * @returns {number} - Posición Y final
 */
function renderClienteInfo(doc, factura, y) {
  
  // Columna izquierda
  doc.x = 20;
  doc.y = y;
  doc.fontSize(12)
    .text(`Cliente: ${factura.Cliente ? factura.Cliente.Descripcion : "N/A"}`)
    .text(`Domicilio: ${factura.Cliente ? factura.Cliente.Calle : "N/A"}`)
    .text(`Categoria IVA: ${getCategoriaTxt(factura.Cliente.CategoriaIva)}`);

  // Línea separadora
  doc.strokeColor("#000000").moveTo(20, doc.y).lineTo(580, doc.y).stroke();

  // Columna central
  doc.x = 270;
  doc.y = y;
  doc.fontSize(12)
    .text(formatearCuit(factura.Cliente.Cuit))
    .text(`Localidad: ${factura.Cliente ? factura.Cliente.Localidad : "N/A"}`);

  // Columna derecha  
  doc.x = 440;
  doc.y = y;
  doc.fontSize(12)
    .text(`Pago: ${getTipoPagoTxt(factura.PagoTipo)}`)
    .text(`Lista: ${factura.ListaNumero}`);

  return doc.y;
}

function getCategoriaTxt(categoria) {
  switch(categoria) {
    case "I": return "Responsable Inscrito";
    case "M": return "Monotributista"; 
    case "E": return "Exento";
    default: return "N/A";
  }
}

function getTipoPagoTxt(tipo) {
  switch(tipo) {
    case "CO": return "Contado";
    case "CC": return "Cta. Cte.";
    default: return "N/A";
  }
}

function formatearCuit(cuit) {
  return `CUIT: ${cuit.substring(0,2)}-${cuit.substring(2,10)}-${cuit.substring(10,11)}`;
}

module.exports = renderClienteInfo;