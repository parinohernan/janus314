/** Presets de tipografía para Factura A (PDF). */

const TYPOGRAPHY_DEFAULT = {
  header: {
    infoEmpresa: 12,
    fecha: 12,
    documentMeta: 12,
    companyName: 16,
    titleLetter: 26,
  },
  cliente: 12,
  originalDuplicado: 12,
  items: {
    fontSize: null,
    headerFontSize: null,
    fontSizeExacto: 8,
    headerFontSizeExacto: 8,
    fontSizeNormal: 10,
    headerFontSizeNormal: 10,
  },
  pie: {
    leyenda: 10,
    total: 12,
  },
};

/** Misma cabecera/cliente/pie que estándar; solo la grilla de ítems es legible. */
const TYPOGRAPHY_LEGIBLE = {
  header: { ...TYPOGRAPHY_DEFAULT.header },
  cliente: TYPOGRAPHY_DEFAULT.cliente,
  originalDuplicado: TYPOGRAPHY_DEFAULT.originalDuplicado,
  pie: { ...TYPOGRAPHY_DEFAULT.pie },
  items: {
    layout: "legible",
    tableMargin: 12,
    fontSize: null,
    headerFontSize: null,
    fontSizeExacto: 10,
    headerFontSizeExacto: 10,
    fontSizeNormal: 10,
    headerFontSizeNormal: 10,
  },
};

function getTypographyPreset(name) {
  if (name === "legible") return TYPOGRAPHY_LEGIBLE;
  return TYPOGRAPHY_DEFAULT;
}

module.exports = {
  TYPOGRAPHY_DEFAULT,
  TYPOGRAPHY_LEGIBLE,
  getTypographyPreset,
};
