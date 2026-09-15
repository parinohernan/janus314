export function normalizarPermiso(permisos: string | null | undefined): string {
  return String(permisos || '').trim().toLowerCase();
}

export function esContador(user: { permisos?: string | null } | null | undefined): boolean {
  return normalizarPermiso(user?.permisos) === 'contador';
}

export const RUTA_INICIO_CONTADOR = '/ventas/informes/facturacion';
