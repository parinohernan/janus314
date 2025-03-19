import type { Vendedor } from '$lib/types';
import { PUBLIC_API_URL } from '$env/static/public';

export class VendedorService {
	/**
	 * Obtiene todos los vendedores activos
	 */
	public static async obtenerVendedores(): Promise<{ value: string; label: string }[]> {
		try {
			const response = await fetch(`${PUBLIC_API_URL}/vendedores?activo=true`);

			if (!response.ok) {
				throw new Error('Error al obtener vendedores');
			}

			const data = await response.json();

			// Transformar la respuesta al formato de selector
			return (data.data || []).map((vendedor: Vendedor) => ({
				value: vendedor.Codigo,
				label: `${vendedor.Codigo} - ${vendedor.Descripcion}`
			}));
		} catch (error) {
			console.error('Error al cargar vendedores:', error);
			return [];
		}
	}
}
