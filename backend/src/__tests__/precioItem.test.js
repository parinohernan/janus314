const {
  resolverPrecioLista,
  renglonPdfConIva,
  totalesPieConIva,
} = require('../templates/pdf/common/precioItem');

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

describe('renglonPdfConIva', () => {
  it('multiplica cantidad por el Precio U. ya redondeado a 2 decimales', () => {
    expect(
      renglonPdfConIva({
        Cantidad: 12,
        PrecioUnitario: 1802.1 / 1.21,
        PrecioLista: 1802.1 / 1.21,
        PorcentajeIVA1: 21,
      }).totalConIva
    ).toBe(21625.2);

    expect(
      renglonPdfConIva({
        Cantidad: 2,
        PrecioUnitario: 11163.27 / 1.21,
        PrecioLista: 11163.27 / 1.21,
        PorcentajeIVA1: 21,
      }).totalConIva
    ).toBe(22326.54);

    expect(
      renglonPdfConIva({
        Cantidad: 36,
        PrecioUnitario: 2068.98 / 1.21,
        PrecioLista: 2068.98 / 1.21,
        PorcentajeIVA1: 21,
      }).totalConIva
    ).toBe(74483.28);

    expect(
      renglonPdfConIva({
        Cantidad: 36,
        PrecioUnitario: 2069.96 / 1.21,
        PrecioLista: 2069.96 / 1.21,
        PorcentajeIVA1: 21,
      }).totalConIva
    ).toBe(74518.56);
  });
});

describe('totalesPieConIva', () => {
  it('el subtotal es la suma de renglones y la bonificación es el % de ese subtotal', () => {
    const items = [
      { Cantidad: 1, PrecioUnitario: 1000 / 1.21, PrecioLista: 1000 / 1.21, PorcentajeIVA1: 21 },
      { Cantidad: 1, PrecioUnitario: 210 / 1.21, PrecioLista: 210 / 1.21, PorcentajeIVA1: 21 },
    ];
    const pie = totalesPieConIva(items, 10);
    expect(pie.subtotal).toBe(1210);
    expect(pie.bonificacion).toBe(121);
    expect(pie.total).toBe(1089);
  });

  it('el TOTAL cierra con Subtotal menos Bonificación (no usa importes de cabecera)', () => {
    const items = [
      { Cantidad: 12, PrecioUnitario: 1489.34, PrecioLista: 1489.34, PorcentajeIVA1: 21 },
      { Cantidad: 2, PrecioUnitario: 9225.84, PrecioLista: 9225.84, PorcentajeIVA1: 21 },
    ];
    const pie = totalesPieConIva(items, 10);
    expect(pie.bonificacion).toBe(Number((pie.subtotal * 0.1).toFixed(2)));
    expect(pie.total).toBe(Number((pie.subtotal - pie.bonificacion).toFixed(2)));
  });

  it('el descuento de renglón no se copia al pie: la bonificación es solo la general', () => {
    const items = [
      {
        Cantidad: 10,
        PrecioLista: 1798.99 / 1.21,
        PrecioUnitario: 1655.07 / 1.21,
        PorcentajeBonificado: 8,
        PorcentajeIVA1: 21,
      },
    ];
    const sinGeneral = totalesPieConIva(items, 0);
    expect(sinGeneral.bonificacion).toBe(0);
    expect(sinGeneral.subtotal).toBe(16550.7);
    expect(sinGeneral.total).toBe(16550.7);

    const conGeneral = totalesPieConIva(items, 10);
    expect(conGeneral.subtotal).toBe(16550.7);
    expect(conGeneral.bonificacion).toBe(1655.07);
    expect(conGeneral.total).toBe(14895.63);
  });
});
