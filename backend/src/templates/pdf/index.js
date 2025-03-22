const renderFacturaA = require("./facturaA.template");
const renderFacturaB = require("./facturaB.template");
const renderFacturaC = require("./facturaC.template");
const renderRemito = require("./remito.template");
const renderPresupuesto = require("./presupuesto.template");

/**
 * Factory para seleccionar la plantilla adecuada según el tipo de documento
 * @param {string} documentType - Tipo de documento
 * @returns {Function} - Función de renderizado para el tipo de documento
 */
function getTemplateRenderer(documentType) {
  switch (documentType) {
    case "FCA":
      return renderFacturaA;
    case "FCB":
      return renderFacturaB;
    case "FCC":
      return renderFacturaC;
    case "REM":
      return renderRemito;
    case "PRE":
      return renderPresupuesto;
    default:
      // Plantilla por defecto
      return renderFacturaA;
  }
}

module.exports = {
  getTemplateRenderer,
};
