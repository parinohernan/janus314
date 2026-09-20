export function normalizarPermiso(permisos: string | null | undefined): string {
  return String(permisos || '').trim().toLowerCase();
}

export function esContador(user: { permisos?: string | null } | null | undefined): boolean {
  return normalizarPermiso(user?.permisos) === 'contador';
}

export const CODIGO_ADMIN = 'admin';
export const CODIGO_SUPERADM = 'superadm';

type UsuarioMenu = {
  usuario?: string | null;
  id?: string | null;
  codigoVendedor?: string | null;
  permisos?: string | null;
} | null | undefined;

function codigoDe(user: UsuarioMenu): string {
  return String(user?.codigoVendedor || user?.usuario || user?.id || '')
    .trim()
    .toLowerCase();
}

export function esVendedorAdmin(user: UsuarioMenu): boolean {
  return codigoDe(user) === CODIGO_ADMIN;
}

export function esVendedorSuperadm(user: UsuarioMenu): boolean {
  return codigoDe(user) === CODIGO_SUPERADM || normalizarPermiso(user?.permisos) === CODIGO_SUPERADM;
}

export function puedeGestionarBackups(user: UsuarioMenu): boolean {
  const permiso = normalizarPermiso(user?.permisos);
  return (
    esVendedorAdmin(user) ||
    esVendedorSuperadm(user) ||
    permiso === CODIGO_ADMIN
  );
}

export const RUTA_INICIO_CONTADOR = '/ventas/informes/facturacion';
