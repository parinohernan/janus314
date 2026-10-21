const {
  normalizePlantillaId,
  getFacturaARendererSync,
  listFacturaAPlantillas,
} = require("../templates/pdf/resolveFacturaA");
const { TYPOGRAPHY_DEFAULT, TYPOGRAPHY_LEGIBLE } = require("../templates/pdf/facturaA.typography");

describe("resolveFacturaA", () => {
  it("normaliza ids de plantilla", () => {
    expect(normalizePlantillaId("")).toBe("default");
    expect(normalizePlantillaId("DEFAULT")).toBe("default");
    expect(normalizePlantillaId(" legible ")).toBe("legible");
    expect(normalizePlantillaId("Mi-Empresa_1")).toBe("mi-empresa_1");
  });

  it("lista builtin y custom conocidas", () => {
    const ids = listFacturaAPlantillas().map((p) => p.id);
    expect(ids).toContain("default");
    expect(ids).toContain("legible");
  });

  it("resuelve legible y default", () => {
    const legible = getFacturaARendererSync("legible");
    const def = getFacturaARendererSync("default");
    expect(typeof legible).toBe("function");
    expect(typeof def).toBe("function");
    expect(legible).not.toBe(def);
  });

  it("fallback a default si el slug custom no existe", () => {
    const def = getFacturaARendererSync("default");
    const missing = getFacturaARendererSync("no-existe-en-repo-xyz");
    expect(missing).toBe(def);
  });
});

describe("facturaA.typography", () => {
  it("legible aumenta tamaños de ítems exactos", () => {
    expect(TYPOGRAPHY_LEGIBLE.items.fontSizeExacto).toBeGreaterThan(
      TYPOGRAPHY_DEFAULT.items.fontSizeExacto
    );
    expect(TYPOGRAPHY_LEGIBLE.cliente).toBe(TYPOGRAPHY_DEFAULT.cliente);
    expect(TYPOGRAPHY_LEGIBLE.header.companyName).toBe(
      TYPOGRAPHY_DEFAULT.header.companyName
    );
  });
});
