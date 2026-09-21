const { alicuotaIvaArticulo, alicuotaIvaValor } = require('../utils/ivaArticulo');

describe('alicuotaIvaValor', () => {
  it('conserva IVA 0%', () => {
    expect(alicuotaIvaValor(0)).toBe(0);
    expect(alicuotaIvaValor('0')).toBe(0);
  });

  it('usa 21 solo si falta el valor', () => {
    expect(alicuotaIvaValor(undefined)).toBe(21);
    expect(alicuotaIvaValor(null)).toBe(21);
    expect(alicuotaIvaValor('')).toBe(21);
    expect(alicuotaIvaValor(10.5)).toBe(10.5);
  });
});

describe('alicuotaIvaArticulo', () => {
  it('lee PorcentajeIVA1 aunque sea 0', () => {
    expect(alicuotaIvaArticulo({ PorcentajeIVA1: 0 })).toBe(0);
    expect(alicuotaIvaArticulo({ PorcentajeIVA1: 21 })).toBe(21);
    expect(alicuotaIvaArticulo({})).toBe(21);
  });
});
