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
		const precioLista = this.obtenerPrecioPorLista(articulo, listaPrecio);

		// Crear ítem de factura
		const item: ItemFactura = {
			ArticuloCodigo: articulo.Codigo,
			Descripcion: articulo.Descripcion,
			Cantidad: cantidad,
			PrecioLista: precioLista,
			PorcentajeBonificado: 0,
			ImporteBonificado: 0,
			PrecioUnitario: precioLista,
			PorcentajeIva: articulo.PorcentajeIVA1 || 21, // Valor por defecto 21% si no hay
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
	 * Obtiene el precio de un artículo según la lista seleccionada
	 * Detecta automáticamente si el valor es precio directo o porcentaje
	 */
	private static obtenerPrecioPorLista(articulo: Articulo, listaPrecio: string): number {
		const precioCosto = articulo.PrecioCosto || 0;
		let valorLista = 0;
		
		// Obtener el valor de la lista seleccionada
		switch (listaPrecio) {
			case '1':
				valorLista = articulo.Lista1 || 0;
				break;
			case '2':
				valorLista = articulo.Lista2 || 0;
				break;
			case '3':
				valorLista = articulo.Lista3 || 0;
				break;
			case '4':
				valorLista = articulo.Lista4 || 0;
				break;
			case '5':
				valorLista = articulo.Lista5 || 0;
				break;
			default:
				valorLista = articulo.Lista1 || 0;
				break;
		}
		
		// Si el valor de lista es 0, usar el precio de costo
		if (valorLista === 0) {
			return precioCosto;
		}
		
		// Detectar automáticamente si es precio directo o porcentaje
		if (precioCosto > 0) {
			// Si el valor es significativamente mayor que el costo, es precio directo
			if (valorLista > precioCosto * 1.05) {
				return valorLista;
			} 
			// Si el valor es menor o igual al costo pero razonable como porcentaje (0-1000), es porcentaje
			else if (valorLista <= 1000 && valorLista > 0) {
				// Es porcentaje: calcular precio = costo * (1 + porcentaje/100)
				return precioCosto * (1 + valorLista / 100);
			}
			// Caso especial: valor muy grande pero menor que costo*1.05, usar como precio directo
			else {
				return valorLista;
			}
		} else {
			// Si no hay precio de costo, usar el valor directamente
			return valorLista;
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

	/**
	 * Obtiene todos los artículos para listado de precios (sin paginación)
	 */
	public static async obtenerArticulosParaListadoPrecios(activo: boolean = true): Promise<Articulo[]> {
		try {
			const response = await fetchWithAuth('/articulos/listado-precios', {
				params: {
					activo: activo ? 1 : 0
				}
			});
			
			const data = await response.json();
			return data.items || [];
		} catch (error) {
			console.error('Error al obtener artículos para listado de precios:', error);
			throw new Error('Error al cargar los artículos');
		}
	}
}
