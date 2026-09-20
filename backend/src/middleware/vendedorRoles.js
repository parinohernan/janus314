const CODIGO_ADMIN = 'admin';
const CODIGO_SUPERADM = 'superadm';

function codigoVendedor(req) {
  return String(req.userData?.userId || '').trim().toLowerCase();
}

function permisosDe(req) {
  return String(req.userData?.permisos || '').trim().toLowerCase();
}

function esAdmin(req) {
  return codigoVendedor(req) === CODIGO_ADMIN;
}

function esSuperadm(req) {
  return codigoVendedor(req) === CODIGO_SUPERADM || permisosDe(req) === CODIGO_SUPERADM;
}

function esAdminOSuperadm(req) {
  return esAdmin(req) || esSuperadm(req) || permisosDe(req) === CODIGO_ADMIN;
}

module.exports = {
  CODIGO_ADMIN,
  CODIGO_SUPERADM,
  codigoVendedor,
  permisosDe,
  esAdmin,
  esSuperadm,
  esAdminOSuperadm
};
