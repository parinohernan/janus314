const fs = require("fs");
const path = require("path");

const CODIGO_CONFIG = "PDF_PLANTILLA_FCA";
const CUSTOM_DIR = path.join(__dirname, "custom", "fca");

const BUILTIN = [
  { id: "default", label: "Estándar (actual)", tipo: "builtin" },
  { id: "legible", label: "Legible (tipografía más grande)", tipo: "builtin" },
];

function normalizePlantillaId(valor) {
  const v = String(valor ?? "").trim().toLowerCase();
  if (!v || v === "default") return "default";
  return v.replace(/[^a-z0-9_-]/g, "");
}

async function leerPlantillaConfig(Configuracion) {
  if (!Configuracion) return "default";
  try {
    const cfg = await Configuracion.findOne({
      where: { Codigo: CODIGO_CONFIG },
      attributes: ["ValorConfig"],
    });
    return normalizePlantillaId(cfg?.ValorConfig);
  } catch (e) {
    console.warn("[PDF FCA] No se pudo leer PDF_PLANTILLA_FCA:", e.message);
    return "default";
  }
}

function listCustomPlantillaIds() {
  if (!fs.existsSync(CUSTOM_DIR)) return [];
  return fs
    .readdirSync(CUSTOM_DIR)
    .filter((name) => name.endsWith(".template.js") && name !== "ejemplo.template.js")
    .map((name) => name.replace(/\.template\.js$/, ""))
    .filter(Boolean);
}

function listFacturaAPlantillas() {
  const custom = listCustomPlantillaIds().map((id) => ({
    id,
    label: `Personalizada: ${id}`,
    tipo: "custom",
  }));
  return [...BUILTIN, ...custom];
}

function loadRendererById(plantillaId) {
  if (plantillaId === "legible") {
    return require("./facturaA.legible.template");
  }

  if (plantillaId !== "default") {
    const customPath = path.join(CUSTOM_DIR, `${plantillaId}.template.js`);
    if (fs.existsSync(customPath)) {
      return require(customPath);
    }
    console.warn(
      `[PDF FCA] Plantilla "${plantillaId}" no encontrada en custom/fca; se usa default.`
    );
  }

  return require("./facturaA.template");
}

async function getFacturaARenderer(Configuracion) {
  const plantillaId = await leerPlantillaConfig(Configuracion);
  return loadRendererById(plantillaId);
}

function getFacturaARendererSync(plantillaId) {
  return loadRendererById(normalizePlantillaId(plantillaId));
}

module.exports = {
  CODIGO_CONFIG,
  normalizePlantillaId,
  leerPlantillaConfig,
  listFacturaAPlantillas,
  getFacturaARenderer,
  getFacturaARendererSync,
};
