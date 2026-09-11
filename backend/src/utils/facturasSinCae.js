const { Op } = require("sequelize");

const TIPOS_FACTURA_CON_CAE = ["FCA", "FCB", "FCC"];

function whereFacturasSinCae() {
  return {
    DocumentoTipo: { [Op.in]: TIPOS_FACTURA_CON_CAE },
    FechaAnulacion: null,
    [Op.or]: [{ afip_cae: null }, { afip_cae: "" }],
  };
}

module.exports = {
  TIPOS_FACTURA_CON_CAE,
  whereFacturasSinCae,
};
