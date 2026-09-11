const { Op } = require("sequelize");
const {
  TIPOS_FACTURA_CON_CAE,
  whereFacturasSinCae,
} = require("../utils/facturasSinCae");

describe("whereFacturasSinCae", () => {
  it("solo incluye facturas fiscales A/B/C vigentes sin CAE", () => {
    const where = whereFacturasSinCae();
    expect(TIPOS_FACTURA_CON_CAE).toEqual(["FCA", "FCB", "FCC"]);
    expect(where.DocumentoTipo).toEqual({ [Op.in]: TIPOS_FACTURA_CON_CAE });
    expect(where.FechaAnulacion).toBeNull();
    expect(where[Op.or]).toEqual([{ afip_cae: null }, { afip_cae: "" }]);
  });
});
