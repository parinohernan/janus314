import type { Articulo, ItemFactura } from '$lib/types';
import { PUBLIC_API_URL } from '$env/static/public';
import { FacturaCalculator } from './FacturaCalculator';
import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

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
	 * Convierte un artículo a un ítem de factura
	 */
	public static convertirAItemFactura(
		articulo: Articulo,
		cantidad: number,
		listaPrecio: string = '1'
	): ItemFactura {
		// Obtener el precio según la lista seleccionada
		const precioLista = this.obtenerPrecioPorLista(articulo, listaPrecio);

		// Crear ítem de factura
		const item: ItemFactura = {
			ArticuloCodigo: articulo.Codigo,
			Descripcion: articulo.Descripcion,
			Cantidad: cantidad,
			PrecioLista: precioLista,
			PorcentajeBonificacion: 0,
			PrecioUnitario: precioLista,
			PorcentajeIva: articulo.PorcentajeIva1 || 21, // Valor por defecto 21% si no hay
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
		item.Total = item.PrecioUnitario * item.Cantidad;

		return item;
	}

	/**
	 * Obtiene el precio de un artículo según la lista seleccionada
	 */
	private static obtenerPrecioPorLista(articulo: Articulo, listaPrecio: string): number {
		switch (listaPrecio) {
			case '1':
				return articulo.Lista1 || 0;
			case '2':
				return articulo.Lista2 || 0;
			case '3':
				return articulo.Lista3 || 0;
			case '4':
				return articulo.Lista4 || 0;
			case '5':
				return articulo.Lista5 || 0;
			default:
				return articulo.Lista1 || 0;
		}
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
}
