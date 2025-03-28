import type { Configuracion, ApiResponse } from '$lib/types';
import { PUBLIC_API_URL } from '$env/static/public';

/**
 * Servicio para gestionar operaciones con configuraciones del sistema
 */
export class ConfiguracionService {
	/**
	 * Obtiene todas las configuraciones
	 */
	public static async obtenerConfiguraciones(): Promise<Configuracion[]> {
		try {
			const response = await fetch(`${PUBLIC_API_URL}/configuraciones`);

			if (!response.ok) {
				throw new Error('Error al obtener configuraciones');
			}

			const resultado: ApiResponse<Configuracion[]> = await response.json();
			return resultado.data || [];
		} catch (error) {
			console.error('Error en ConfiguracionService.obtenerConfiguraciones:', error);
			return [];
		}
	}

	/**
	 * Obtiene una configuración específica por su código
	 */
	public static async obtenerConfiguracion(codigo: string): Promise<Configuracion | null> {
		try {
			const response = await fetch(`${PUBLIC_API_URL}/configuraciones/${codigo}`);

			if (!response.ok) {
				throw new Error(`Error al obtener configuración: ${codigo}`);
			}

			const resultado: ApiResponse<Configuracion> = await response.json();
			return resultado.data || null;
		} catch (error) {
			console.error(`Error en ConfiguracionService.obtenerConfiguracion(${codigo}):`, error);
			return null;
		}
	}

	/**
	 * Actualiza el valor de una configuración específica
	 */
	public static async actualizarConfiguracion(codigo: string, valor: string): Promise<boolean> {
		try {
			const response = await fetch(`${PUBLIC_API_URL}/configuraciones/${codigo}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ valor })
			});

			if (!response.ok) {
				throw new Error(`Error al actualizar configuración: ${codigo}`);
			}

			const resultado: ApiResponse<any> = await response.json();
			return resultado.success;
		} catch (error) {
			console.error(`Error en ConfiguracionService.actualizarConfiguracion(${codigo}):`, error);
			return false;
		}
	}
}
