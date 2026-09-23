const NotaCreditoValidator = require("../services/notaCreditoValidator.service");

const base = {
  DocumentoTipo: "NCB",
  DocumentoSucursal: "0004",
  CodigoCliente: "1",
  Fecha: "2026-09-23",
};

describe("NotaCreditoValidator", () => {
  test("acepta PrecioUnitario negativo para anular una factura mal cargada", () => {
    const { isValid, errors } = NotaCreditoValidator.validarNotaCredito({
      ...base,
      Items: [
        { CodigoArticulo: "30028", Cantidad: 10, PrecioUnitario: -1.51 },
        { CodigoArticulo: "30059", Cantidad: 16, PrecioUnitario: 793.39 },
      ],
    });
    expect(isValid).toBe(true);
    expect(errors).toEqual([]);
  });

  test("rechaza PrecioUnitario ausente o no numérico", () => {
    const { isValid, errors } = NotaCreditoValidator.validarNotaCredito({
      ...base,
      Items: [{ CodigoArticulo: "30028", Cantidad: 10 }],
    });
    expect(isValid).toBe(false);
    expect(errors.some((e) => e.includes("precio unitario"))).toBe(true);
  });
});
