const {
  yMaxContenido,
  yLeyendaLegal,
  yMaxInicioQr,
  resolverYInicioQr,
} = require("../templates/pdf/common/piePageBounds");

const docA4 = {
  page: { height: 841.89, margins: { bottom: 42.5 } },
};

describe("piePageBounds", () => {
  test("leyenda legal queda dentro del margen inferior A4", () => {
    expect(yMaxContenido(docA4)).toBeCloseTo(799.39, 1);
    expect(yLeyendaLegal(docA4)).toBeLessThan(yMaxContenido(docA4));
    expect(yLeyendaLegal(docA4) + 10).toBeLessThanOrEqual(yMaxContenido(docA4));
  });

  test("QR + leyenda legal caben en una hoja", () => {
    const yQr = yMaxInicioQr(docA4);
    expect(yQr + 80 + 6 + 11).toBeLessThanOrEqual(yMaxContenido(docA4) + 0.5);
    expect(resolverYInicioQr(docA4, 720, 8)).toBe(yQr);
    expect(resolverYInicioQr(docA4, 680, 8)).toBe(688);
  });
});
