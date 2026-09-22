function normalizarPermiso(permisos) {
  return String(permisos || "").trim().toLowerCase();
}

function normalizarCodigo(codigo) {
  return String(codigo || "").trim().toLowerCase();
}

function esCodigoReservadoErp(codigo) {
  const valor = normalizarCodigo(codigo);
  return valor === "admin" || valor === "superadm";
}

function puedeAccederErp(permisos, codigo) {
  const valor = normalizarPermiso(permisos);
  if (valor === "admin" || valor === "contador" || valor === "superadm") {
    return true;
  }
  return esCodigoReservadoErp(codigo);
}

function puedeIniciarSesion(permisos, codigo) {
  if (normalizarPermiso(permisos) === "cajero") return true;
  return puedeAccederErp(permisos, codigo);
}

function esContador(permisos) {
  return normalizarPermiso(permisos) === "contador";
}

module.exports = {
  normalizarPermiso,
  normalizarCodigo,
  esCodigoReservadoErp,
  puedeAccederErp,
  puedeIniciarSesion,
  esContador,
};
