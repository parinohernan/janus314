import { PUBLIC_API_URL } from '$env/static/public';
import type { Preventa, PreventaCabeza, PreventaItem, PreventaFiltros } from '$lib/types';
import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

/**
 * Servicio para gestionar operaciones con preventas
 */
export class PreventaService {
	/**
	 * Obtiene un listado de preventas con paginación y filtros
	 */
	public static async listarPreventas(page = 1, limit = 10, filtros?: PreventaFiltros) {
		try {
			// Construir parámetros de consulta
			const params: Record<string, string | number | boolean> = {
				page,
				limit
			};

			if (filtros) {
				if (filtros.cliente) params.cliente = filtros.cliente;
				if (filtros.tipo) params.tipo = filtros.tipo;
				if (filtros.vendedor) params.vendedor = filtros.vendedor;
				if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde;
				if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta;
				if (filtros.pendientes) params.pendientes = true;
			}

			const response = await fetchWithAuth('/preventas', { params });

			if (!response.ok) {
				throw new Error(`Error al obtener preventas: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Error en PreventaService.listarPreventas:', error);
			throw error;
		}
	}

	/**
	 * Obtiene el detalle de una preventa específica
	 */
	public static async obtenerPreventa(
		tipo: string,
		sucursal: string,
		numero: string
	): Promise<Preventa> {
		try {
			const response = await fetchWithAuth(`/preventas/${tipo}/${sucursal}/${numero}`);

			if (!response.ok) {
				throw new Error(`Error al obtener detalle de la preventa: ${response.statusText}`);
			}

			const result = await response.json();
			return result.data;
		} catch (error) {
			console.error('Error en PreventaService.obtenerPreventa:', error);
			throw error;
		}
	}

	/**
	 * Crea una nueva preventa
	 */
	public static async crearPreventa(preventa: PreventaCabeza, items: PreventaItem[]) {
		try {
			const preventaData = {
				...preventa,
				Items: items
			};
			
			const response = await fetchWithAuth('/preventas', {
				method: 'POST',
				body: JSON.stringify(preventaData)
			});

			if (!response.ok) {
				throw new Error(`Error al crear preventa: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Error en PreventaService.crearPreventa:', error);
			throw error;
		}
	}

	/**
	 * Anula una preventa
	 */
	public static async anularPreventa(tipo: string, sucursal: string, numero: string) {
		try {
			const response = await fetchWithAuth(
				`/preventas/anular/${tipo}/${sucursal}/${numero}`,
				{
					method: 'PUT'
				}
			);

			if (!response.ok) {
				throw new Error(`Error al anular preventa: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Error en PreventaService.anularPreventa:', error);
			throw error;
		}
	}

	/**
	 * Factura una preventa existente
	 */
	public static async facturarPreventa(
		tipo: string,
		sucursal: string,
		numero: string,
		facturaTipo: string,
		facturaSucursal: string,
		facturaNumero: string
	) {
		try {
			const response = await fetchWithAuth(
				`/preventas/facturar/${tipo}/${sucursal}/${numero}`,
				{
					method: 'PUT',
					body: JSON.stringify({
						facturaTipo,
						facturaSucursal,
						facturaNumero
					})
				}
			);

			if (!response.ok) {
				throw new Error(`Error al facturar preventa: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Error en PreventaService.facturarPreventa:', error);
			throw error;
		}
	}

	/**
	 * Actualiza una preventa existente
	 */
	public static async actualizarPreventa(preventa: PreventaCabeza, items: PreventaItem[]) {
		try {
			const preventaData = {
				...preventa,
				Items: items
			};

			const response = await fetchWithAuth(
				`/preventas/${preventa.DocumentoTipo}/${preventa.DocumentoSucursal}/${preventa.DocumentoNumero}`,
				{
					method: 'PUT',
					body: JSON.stringify(preventaData)
				}
			);

			if (!response.ok) {
				throw new Error(`Error al actualizar preventa: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Error en PreventaService.actualizarPreventa:', error);
			throw error;
		}
	}
}
