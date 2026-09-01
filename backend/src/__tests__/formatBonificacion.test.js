const {
  textoImporteBonificado,
  subtotalConIvaDesdeItems,
} = require('../templates/pdf/common/formatBonificacion');

describe('textoImporteBonificado', () => {
  it('agrega el porcentaje entre paréntesis junto al importe', () => {
    expect(textoImporteBonificado(2819.83, 10)).toBe('2819.83 (10%)');
  });

  it('omite el porcentaje si es 0 o inválido', () => {
    expect(textoImporteBonificado(100, 0)).toBe('100.00');
    expect(textoImporteBonificado(100, null)).toBe('100.00');
  });

  it('limpia decimales innecesarios del porcentaje', () => {
    expect(textoImporteBonificado(50, '10.50')).toBe('50.00 (10.5%)');
  });
});

describe('subtotalConIvaDesdeItems', () => {
  it('suma los subtotales con IVA de los renglones', () => {
    expect(
      subtotalConIvaDesdeItems([
        { TotalConIva: 5401.69 },
        { Subtotal: 100 },
      ])
    ).toBeCloseTo(5501.69);
  });

  it('usa Subtotal si no hay TotalConIva', () => {
    expect(subtotalConIvaDesdeItems([{ Subtotal: 5401.69 }])).toBe(5401.69);
  });
});
