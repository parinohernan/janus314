/**
 * Interfaz para usuarios del sistema
 */
export interface Usuario {
	id: string;
	nombre: string;
	apellido: string;
	usuario: string;
	rol: string;
	activo: boolean;
	fechaCreacion: string;
	ultimoAcceso?: string | null;
	codigoVendedor?: string;
}

/**
 * Interfaz para credenciales de inicio de sesión
 */
export interface Credenciales {
	usuario: string;
	password: string;
	empresa?: string;
}

/**
 * Interfaz para filtros de búsqueda de usuarios
 */
export interface UsuarioFiltros {
	nombre?: string;
	usuario?: string;
	rol?: string;
	activo?: boolean;
}
