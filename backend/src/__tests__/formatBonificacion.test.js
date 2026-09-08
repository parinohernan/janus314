const {
  textoImporteBonificado,
  subtotalConIvaDesdeItems,
  lineasIvaDiscriminado,
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

describe('lineasIvaDiscriminado', () => {
  it('incluye 21% y 10.5% cuando ambos tienen importe', () => {
    expect(
      lineasIvaDiscriminado({ ImporteIva1: 1512, ImporteIva2: 189 })
    ).toEqual([
      { porcentaje: 21, importe: 1512 },
      { porcentaje: 10.5, importe: 189 },
    ]);
  });

  it('omite la alícuota en cero', () => {
    expect(lineasIvaDiscriminado({ ImporteIva1: 0, ImporteIva2: 189 })).toEqual([
      { porcentaje: 10.5, importe: 189 },
    ]);
  });
});
