const { Op } = require("sequelize");
const {
  TIPOS_FACTURA_CON_CAE,
  TIPOS_NC_CON_CAE,
  whereFacturasSinCae,
  whereNotasCreditoSinCae,
  mapearComprobanteSinCae,
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

describe("whereNotasCreditoSinCae", () => {
  it("solo incluye NC A/B vigentes sin CAE", () => {
    const where = whereNotasCreditoSinCae();
    expect(TIPOS_NC_CON_CAE).toEqual(["NCA", "NCB"]);
    expect(where.DocumentoTipo).toEqual({ [Op.in]: TIPOS_NC_CON_CAE });
    expect(where.FechaAnulacion).toBeNull();
  });
});

describe("mapearComprobanteSinCae", () => {
  it("arma la fila del widget con cliente e importe", () => {
    expect(
      mapearComprobanteSinCae(
        {
          DocumentoTipo: "NCA",
          DocumentoSucursal: "0001",
          DocumentoNumero: "00000012",
          Fecha: "2026-09-13",
          ImporteTotal: 1500,
          Cliente: { Descripcion: "Cliente 1" },
        },
        "notaCredito"
      )
    ).toEqual({
      clase: "notaCredito",
      tipo: "NCA",
      sucursal: "0001",
      numero: "00000012",
      fecha: "2026-09-13",
      importe: 1500,
      cliente: "Cliente 1",
    });
  });
});
