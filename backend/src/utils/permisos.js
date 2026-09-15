function normalizarPermiso(permisos) {
  return String(permisos || "").trim().toLowerCase();
}

function puedeAccederErp(permisos) {
  const valor = normalizarPermiso(permisos);
  return valor === "admin" || valor === "contador";
}

function esContador(permisos) {
  return normalizarPermiso(permisos) === "contador";
}

module.exports = {
  normalizarPermiso,
  puedeAccederErp,
  esContador,
};
