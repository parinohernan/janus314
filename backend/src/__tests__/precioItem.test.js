const {
  redondear2,
  renglonPdfConIva,
  renglonPdfSinIva,
  totalesPieConIva,
  totalesPieDiscriminado,
  calcularTotalesComprobante,
  ajustarIvaATotal,
} = require("../templates/pdf/common/precioItem");

describe("renglonPdfConIva", () => {
  test("Precio U. redondeado y Total = cantidad × Precio U.", () => {
    const r = renglonPdfConIva({
      Cantidad: 10,
      PrecioUnitario: 2068.98,
      PrecioLista: 2068.98,
      PorcentajeIVA1: 21,
      PorcentajeBonificado: 0,
    });
    expect(r.precioUnitarioConIva).toBe(redondear2(2068.98 * 1.21));
    expect(r.totalConIva).toBe(redondear2(10 * r.precioUnitarioConIva));
  });

  test("en NC usa PrecioBase neto si PrecioUnitario ya trae IVA", () => {
    const r = renglonPdfConIva({
      Cantidad: 1,
      PrecioBase: 100,
      PrecioLista: 100,
      PrecioUnitario: 121,
      PorcentajeIVA1: 21,
    });
    expect(r.precioUnitarioConIva).toBe(121);
    expect(r.totalConIva).toBe(121);
  });
});

describe("renglonPdfSinIva", () => {
  test("usa PrecioUnitario y no recalcula desde lista", () => {
    const r = renglonPdfSinIva({
      Cantidad: 3,
      PrecioLista: 100,
      PrecioUnitario: 93.33,
      PorcentajeBonificado: 7,
      PorcentajeIVA1: 21,
    });
    expect(r.precioLista).toBe(100);
    expect(r.precioUnitario).toBe(93.33);
    expect(r.subtotal).toBe(redondear2(3 * 93.33));
  });
});

describe("totalesPieConIva", () => {
  test("con 5% cierra Subtotal − Bonif = Total", () => {
    const items = [
      { Cantidad: 2, PrecioUnitario: 100, PrecioLista: 100, PorcentajeIVA1: 21 },
      { Cantidad: 1, PrecioUnitario: 200, PrecioLista: 200, PorcentajeIVA1: 10.5 },
    ];
    const pie = totalesPieConIva(items, 5);
    const suma = redondear2(pie.renglones.reduce((s, r) => s + r.totalConIva, 0));
    expect(pie.subtotal).toBe(suma);
    expect(pie.bonificacion).toBe(redondear2(pie.subtotal * 0.05));
    expect(pie.total).toBe(redondear2(pie.subtotal - pie.bonificacion));
  });

  test("sin bonificación el total es la suma de renglones", () => {
    const items = [
      { Cantidad: 1, PrecioUnitario: 100, PrecioLista: 100, PorcentajeIVA1: 21 },
    ];
    const pie = totalesPieConIva(items, 0);
    expect(pie.bonificacion).toBe(0);
    expect(pie.total).toBe(pie.subtotal);
  });
});

describe("totalesPieDiscriminado", () => {
  test("Factura A con bonificación cierra las tres identidades", () => {
    const items = [
      { Cantidad: 2, PrecioUnitario: 1000, PorcentajeIVA1: 21 },
      { Cantidad: 1, PrecioUnitario: 500, PorcentajeIVA1: 10.5 },
    ];
    const pie = totalesPieDiscriminado(items, 5);
    const suma = redondear2(pie.renglones.reduce((s, r) => s + r.subtotal, 0));
    expect(pie.subtotal).toBe(suma);
    expect(pie.neto).toBe(redondear2(pie.subtotal - pie.bonificacion));
    expect(pie.total).toBe(redondear2(pie.neto + pie.iva21 + pie.iva105));
  });
});

describe("calcularTotalesComprobante", () => {
  test("FCB: ImporteTotal = pie con IVA y Neto + IVA = Total", () => {
    const items = [
      { Cantidad: 10, PrecioUnitario: 2068.98, PrecioLista: 2068.98, PorcentajeIVA1: 21 },
      { Cantidad: 4, PrecioUnitario: 800, PrecioLista: 800, PorcentajeIVA1: 10.5 },
    ];
    const t = calcularTotalesComprobante({
      items,
      tipo: "FCB",
      porcentajeBonificacion: 5,
    });
    expect(t.ImporteTotal).toBe(t.pieConIva.total);
    expect(redondear2(t.ImporteNeto + t.ImporteIva1 + t.ImporteIva2)).toBe(t.ImporteTotal);
    expect(t.pieConIva.total).toBe(
      redondear2(t.pieConIva.subtotal - t.pieConIva.bonificacion)
    );
  });

  test("FCA: ImporteTotal = neto + IVA", () => {
    const items = [{ Cantidad: 2, PrecioUnitario: 1000, PorcentajeIVA1: 21 }];
    const t = calcularTotalesComprobante({
      items,
      tipo: "FCA",
      porcentajeBonificacion: 10,
    });
    expect(t.ImporteBruto).toBe(2000);
    expect(t.ImporteBonificado).toBe(200);
    expect(t.ImporteNeto).toBe(1800);
    expect(t.ImporteTotal).toBe(redondear2(1800 + 1800 * 0.21));
  });
});

describe("ajustarIvaATotal", () => {
  test("ajusta 1 centavo en IVA 21%", () => {
    const r = ajustarIvaATotal({
      ImporteNeto: 100,
      ImporteIva1: 21,
      ImporteIva2: 0,
      percepcion: 0,
      ImporteTotal: 121.01,
    });
    expect(r.ImporteIva1).toBe(21.01);
    expect(redondear2(100 + r.ImporteIva1)).toBe(121.01);
  });
});
