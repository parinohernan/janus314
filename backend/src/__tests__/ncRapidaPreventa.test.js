const {
  mapearItemPreventaANotaCredito,
  porcentajeBonificacionNcRapida,
} = require("../utils/ncRapidaPreventa");

describe("ncRapidaPreventa", () => {
  test("usa el neto de la preventa y conserva el %", () => {
    const item = mapearItemPreventaANotaCredito({
      CodigoArticulo: "X",
      Cantidad: 2,
      PrecioLista: 100,
      PrecioUnitario: 80,
      PorcentajeBonificacion: 20,
      Articulo: { Descripcion: "Item", PorcentajeIVA1: 21 },
    });
    expect(item.PrecioUnitario).toBe(80);
    expect(item.PorcentajeBonificacion).toBe(20);
    expect(item.PorcentajeIva).toBe(21);
  });

  test("toma el % pedido y no el de la factura asociada", () => {
    expect(
      porcentajeBonificacionNcRapida({ solicitado: 15, preventa: { PorcentajeBonificacion: 5 } })
    ).toBe(15);
    expect(
      porcentajeBonificacionNcRapida({ solicitado: undefined, preventa: { PorcentajeBonificacion: 5 } })
    ).toBe(5);
    expect(porcentajeBonificacionNcRapida({ solicitado: undefined, preventa: {} })).toBe(0);
  });
});
