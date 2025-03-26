/**
 * Interfaz para usuarios del sistema
 */
export interface Usuario {
	id: string;
	nombre: string;
	apellido: string;
	email: string;
	rol: string;
	activo: boolean;
	fechaCreacion: string;
	ultimoAcceso?: string | null;
}

/**
 * Interfaz para credenciales de inicio de sesión
 */
export interface Credenciales {
	email: string;
	password: string;
}

/**
 * Interfaz para filtros de búsqueda de usuarios
 */
export interface UsuarioFiltros {
	nombre?: string;
	email?: string;
	rol?: string;
	activo?: boolean;
}
