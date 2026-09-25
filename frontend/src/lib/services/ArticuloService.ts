import type { Articulo, ItemFactura } from '$lib/types';
import { PUBLIC_API_URL } from '$env/static/public';
import { FacturaCalculator } from './FacturaCalculator';
import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
import { alicuotaIvaArticulo } from '$lib/utils/ivaArticulo';
import { precioListaSinIva } from '$lib/utils/posTicket';

export interface ArticulosResponse {
	items: Articulo[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

interface ListarArticulosParams {
	page?: number;
	limit?: number;
	search?: string;
	field?: string;
	order?: 'ASC' | 'DESC';
	activo?: boolean;
}

export class ArticuloService {
	/**
	 * Busca artículos según un término de búsqueda
	 */
	public static async buscarArticulos(busqueda: string): Promise<Articulo[]> {
		try {
			if (!busqueda || busqueda.length < 3) {
				return [];
			}

			const response = await fetchWithAuth('/articulos', {
				params: {
					search: busqueda,
					limit: 10
				}
			});

			const data = await response.json();
			return data.items || [];
		} catch (error) {
			console.error('Error al buscar artículos:', error);
			return [];
		}
	}

	/**
	 * Obtiene un artículo por su código
	 */
	public static async obtenerArticuloPorCodigo(codigo: string): Promise<Articulo | null> {
		try {
			if (!codigo) {
				return null;
			}

			const response = await fetchWithAuth(`/articulos/${codigo}`);

			const data = await response.json();
			return data;
		} catch (error) {
			console.error(`Error al obtener artículo ${codigo}:`, error);
			return null;
		}
	}

	/**
	 * Actualiza un artículo existente
	 */
	public static async actualizarArticulo(codigo: string, articulo: Partial<Articulo>): Promise<Articulo | null> {
		try {
			if (!codigo) {
				return null;
			}

			const response = await fetchWithAuth(`/articulos/${codigo}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(articulo)
			});

			const data = await response.json();
			return data;
		} catch (error: any) {
			console.error(`Error al actualizar artículo ${codigo}:`, error);
			throw new Error(`Error al actualizar el artículo: ${error.message || 'Error desconocido'}`);
		}
	}

	/**
	 * Convierte un artículo a un ítem de factura
	 */
	public static convertirAItemFactura(
		articulo: Articulo,
		cantidad: number,
		listaPrecio: string = '1'
	): ItemFactura {
		// Obtener el precio según la lista seleccionada
		const precioLista = precioListaSinIva(articulo, listaPrecio);

		// Crear ítem de factura
		const item: ItemFactura = {
			ArticuloCodigo: articulo.Codigo,
			Descripcion: articulo.Descripcion,
			Cantidad: cantidad,
			PrecioLista: precioLista,
			PorcentajeBonificado: 0,
			ImporteBonificado: 0,
			PrecioUnitario: precioLista,
			PorcentajeIva: alicuotaIvaArticulo(articulo),
			PrecioUnitarioConIva: 0,
			Total: 0,
			enEdicion: false
		};

		// Calcular precio con IVA
		item.PrecioUnitarioConIva = FacturaCalculator.calcularPrecioConIva(
			item.PrecioUnitario,
			item.PorcentajeIva
		);

		// Calcular total
		item.Total = item.PrecioUnitarioConIva * item.Cantidad;

		return item;
	}

	/**
	 * Obtiene la lista de artículos con paginación y filtros
	 */
	public static async listarArticulos(params: ListarArticulosParams = {}): Promise<ArticulosResponse> {
		try {
			const defaultParams = {
				page: 1,
				limit: 10,
				search: '',
				field: 'Descripcion',
				order: 'ASC' as const,
				activo: 1
			};

			const queryParams = { ...defaultParams, ...params };

			const response = await fetchWithAuth('/articulos', {
				params: queryParams
			});
			
			const data = await response.json();
			return data;
		} catch (error) {
			console.error('Error al obtener artículos:', error);
			throw new Error('Error al cargar los artículos');
		}
	}

	/**
	 * Obtiene todos los artículos para listado de precios (sin paginación)
	 */
	public static async obtenerArticulosParaListadoPrecios(
		activo: boolean = true,
		filtros: { proveedores?: string; rubros?: string } = {}
	): Promise<Articulo[]> {
		try {
			const params: Record<string, string | number> = {
				activo: activo ? 1 : 0
			};
			if (filtros.proveedores) params.proveedores = filtros.proveedores;
			if (filtros.rubros) params.rubros = filtros.rubros;

			const response = await fetchWithAuth('/articulos/listado-precios', {
				params
			});
			
			const data = await response.json();
			return data.items || [];
		} catch (error) {
			console.error('Error al obtener artículos para listado de precios:', error);
			throw new Error('Error al cargar los artículos');
		}
	}

	public static async actualizarPreciosStock(
		articulos: Array<Record<string, string | number>>
	): Promise<{
		actualizados: number;
		movimientosCreados: number;
		errores: Array<{ codigo: string; mensaje: string }>;
	}> {
		const response = await fetchWithAuth('/articulos/actualizar-precios-stock', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ articulos })
		});
		const data = await response.json();
		if (!response.ok) {
			throw new Error(data.message || 'Error al actualizar precios y stock');
		}
		return {
			actualizados: data.actualizados ?? 0,
			movimientosCreados: data.movimientosCreados ?? 0,
			errores: data.errores ?? []
		};
	}
}
