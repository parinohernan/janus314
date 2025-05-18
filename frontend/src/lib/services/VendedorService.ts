import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

export interface Vendedor {
	Codigo: string;
	Descripcion: string;
	Activo: number;
	Permisos?: string;
}

export interface VendedorOption {
	value: string;
	label: string;
}

export class VendedorService {
	/**
	 * Obtiene todos los vendedores activos como opciones para select
	 */
	public static async obtenerVendedoresActivos(): Promise<VendedorOption[]> {
		try {
			// Primero intenta con el parámetro activo=true
			let response = await fetchWithAuth('/vendedores?activo=true');
			
			// Si falla, intenta sin parámetros
			if (!response.ok && response.status === 500) {
				console.warn('Error con parámetro activo=true, intentando sin parámetros');
				response = await fetchWithAuth('/vendedores');
			}
			
			if (!response.ok) {
				const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
				throw new Error(error.message || 'Error al cargar los vendedores');
			}
			
			const result = await response.json();
			const vendedores = result.data || [];
			
			if (Array.isArray(vendedores)) {
				return vendedores
					.filter((item: Vendedor) => item.Activo === 1)
					.map((item: Vendedor) => ({
						value: item.Codigo || '',
						label: item.Descripcion || 'Sin nombre'
					}));
			}
			
			return [];
		} catch (error) {
			console.error('Error cargando vendedores:', error);
			// Proporcionar algunos vendedores predeterminados para que la aplicación pueda continuar
			console.warn('Usando lista de vendedores vacía como fallback');
			return [];
		}
	}
}
