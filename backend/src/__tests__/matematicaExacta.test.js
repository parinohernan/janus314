const {
  CORTE_MATEMATICA_EXACTA,
  fechaAISO,
  usaMatematicaExacta,
  esComprobanteAnteriorAlCorte,
  esFamiliaConIva,
} = require("../utils/matematicaExacta");

describe("matematicaExacta", () => {
  test("el corte es 11/09/2026", () => {
    expect(CORTE_MATEMATICA_EXACTA).toBe("2026-09-11");
  });

  test.each([
    ["2026-09-10", false, true],
    ["2026-09-11", true, false],
    ["2026-09-12", true, false],
    ["2026-09-10T15:00:00.000Z", false, true],
    [new Date("2026-09-10T00:00:00.000Z"), false, true],
    [new Date("2026-09-11T00:00:00.000Z"), true, false],
    ["", false, false],
    [null, false, false],
  ])("fecha %s → exacta=%s anterior=%s", (fecha, exacta, anterior) => {
    expect(usaMatematicaExacta(fecha)).toBe(exacta);
    expect(esComprobanteAnteriorAlCorte(fecha)).toBe(anterior);
  });

  test("fechaAISO toma los primeros 10 caracteres", () => {
    expect(fechaAISO("2026-09-12T18:00:00")).toBe("2026-09-12");
  });

  test("familia B incluye FCB PRF NCB NCF", () => {
    expect(esFamiliaConIva("FCB")).toBe(true);
    expect(esFamiliaConIva("FCA")).toBe(false);
    expect(esFamiliaConIva("NCA")).toBe(false);
    expect(esFamiliaConIva("NCF")).toBe(true);
  });
});
