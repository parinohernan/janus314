const FacturaValidator = require("../services/facturaValidator.service");

const base = {
  DocumentoTipo: "FCB",
  DocumentoSucursal: "0004",
  Fecha: "2026-09-23",
  ClienteCodigo: "1",
};

describe("FacturaValidator", () => {
  test("rechaza PrecioUnitario negativo", () => {
    const { isValid, errors } = FacturaValidator.validarFactura({
      ...base,
      Items: [
        { ArticuloCodigo: "30028", Cantidad: 10, PrecioUnitario: -1.51 },
      ],
    });
    expect(isValid).toBe(false);
    expect(errors.some((e) => e.includes("mayor a cero"))).toBe(true);
  });

  test("acepta ítem con CodigoArticulo y precio positivo", () => {
    const { isValid } = FacturaValidator.validarFactura({
      ...base,
      Items: [
        { CodigoArticulo: "30059", Cantidad: 16, PrecioUnitario: 793.39 },
      ],
    });
    expect(isValid).toBe(true);
  });
});
