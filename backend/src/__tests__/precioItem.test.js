const { resolverPrecioLista } = require('../templates/pdf/common/precioItem');

describe('resolverPrecioLista', () => {
  it('usa PrecioLista cuando existe', () => {
    expect(resolverPrecioLista({ PrecioLista: 100, PrecioUnitario: 80 })).toBe(100);
  });

  it('cae a PrecioBase o PrecioUnitario si no hay lista (notas de crédito)', () => {
    expect(resolverPrecioLista({ PrecioBase: 18223.15 })).toBe(18223.15);
    expect(resolverPrecioLista({ PrecioUnitario: 150 })).toBe(150);
  });

  it('devuelve 0 si no hay precios', () => {
    expect(resolverPrecioLista({})).toBe(0);
  });
});
