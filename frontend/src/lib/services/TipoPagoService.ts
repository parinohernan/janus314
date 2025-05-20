import type { TipoDePago } from '$lib/types';
import { PUBLIC_API_URL } from '$env/static/public';
import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

export class TipoPagoService {
	/**
	 * Obtiene todos los tipos de pago activos
	 */
	public static async obtenerTiposDePago(): Promise<{ value: string; label: string }[]> {
		try {
			const response = await fetchWithAuth('/tipos-pago', {
				params: { activo: 1 }
			});

			if (!response.ok) {
				throw new Error('Error al obtener tipos de pago');
			}

			const data = await response.json();

			// Transformar la respuesta al formato de selector
			return (data.items || []).map((item: TipoDePago) => ({
				value: item.Codigo,
				label: `${item.Codigo} - ${item.Descripcion}`
			}));
		} catch (error) {
			console.error('Error al cargar tipos de pago:', error);
			return [];
		}
	}
}
