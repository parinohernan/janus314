const renderFacturaA = require("./facturaA.template");
const { TYPOGRAPHY_LEGIBLE } = require("./facturaA.typography");

/** Factura A con preset legible (delega en la plantilla estándar). */
async function renderFacturaALegible(doc, data) {
  return renderFacturaA(doc, {
    ...data,
    typography: TYPOGRAPHY_LEGIBLE,
  });
}

module.exports = renderFacturaALegible;
