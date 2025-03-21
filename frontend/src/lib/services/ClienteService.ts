import type { Cliente } from '$lib/types';
import { PUBLIC_API_URL } from '$env/static/public';

export class ClienteService {
	/**
	 * Busca clientes según un término de búsqueda
	 */
	public static async buscarClientes(busqueda: string): Promise<Cliente[]> {
		try {
			if (!busqueda || busqueda.length < 3) {
				return [];
			}

			const response = await fetch(
				`${PUBLIC_API_URL}/clientes?search=${encodeURIComponent(busqueda)}&limit=10`
			);

			if (!response.ok) {
				throw new Error('Error al buscar clientes');
			}

			const data = await response.json();
			return data.items || [];
		} catch (error) {
			console.error('Error al buscar clientes:', error);
			return [];
		}
	}

	/**
	 * Obtiene un cliente por su código
	 */
	public static async obtenerClientePorCodigo(codigo: string): Promise<Cliente | null> {
		try {
			if (!codigo) {
				return null;
			}

			const response = await fetch(`${PUBLIC_API_URL}/clientes/${codigo}`);

			if (!response.ok) {
				throw new Error('Error al obtener cliente');
			}
			console.log('obtenerClientePorCodigo response. services', await response.json());
			return await response.json();
		} catch (error) {
			console.error(`Error al obtener cliente ${codigo}:`, error);
			return null;
		}
	}
}
