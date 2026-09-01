const {
  porcentajeBonificacionDesdeFactura,
  aplicarBonificacionATotales,
} = require('../utils/bonificacionGeneral');

describe('bonificacionGeneral', () => {
  it('usa el porcentaje de la factura relacionada', () => {
    expect(
      porcentajeBonificacionDesdeFactura({
        PorcentajeBonificacion: 10,
        ImporteBruto: 1000,
        ImporteBonificado: 100,
      })
    ).toBe(10);
  });

  it('deriva el porcentaje desde importes si no viene el campo', () => {
    expect(
      porcentajeBonificacionDesdeFactura({
        ImporteBruto: 200,
        ImporteBonificado: 20,
      })
    ).toBe(10);
  });

  it('aplica la bonificación a neto, IVA y total', () => {
    const totales = aplicarBonificacionATotales(
      { importeBruto: 200, baseImponible1: 200, baseImponible2: 0 },
      10
    );

    expect(totales.ImporteBonificado).toBe(20);
    expect(totales.ImporteNeto).toBe(180);
    expect(totales.ImporteIva1).toBe(37.8);
    expect(totales.ImporteTotal).toBe(217.8);
  });
});
