const CORTE_MATEMATICA_EXACTA = "2026-09-11";

function fechaAISO(fecha) {
  if (!fecha) return "";
  if (typeof fecha === "string") {
    return fecha.slice(0, 10);
  }
  if (fecha instanceof Date && !Number.isNaN(fecha.getTime())) {
    return fecha.toISOString().slice(0, 10);
  }
  return String(fecha).slice(0, 10);
}

function usaMatematicaExacta(fecha) {
  const iso = fechaAISO(fecha);
  return Boolean(iso) && iso >= CORTE_MATEMATICA_EXACTA;
}

function esComprobanteAnteriorAlCorte(fecha) {
  const iso = fechaAISO(fecha);
  return Boolean(iso) && iso < CORTE_MATEMATICA_EXACTA;
}

function esFamiliaConIva(tipo) {
  return tipo === "FCB" || tipo === "PRF" || tipo === "NCB" || tipo === "NCF";
}

module.exports = {
  CORTE_MATEMATICA_EXACTA,
  fechaAISO,
  usaMatematicaExacta,
  esComprobanteAnteriorAlCorte,
  esFamiliaConIva,
};
