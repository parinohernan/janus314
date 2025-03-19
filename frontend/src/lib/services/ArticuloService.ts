import type { Articulo, ItemFactura } from '$lib/types';
import { PUBLIC_API_URL } from '$env/static/public';
import { FacturaCalculator } from './FacturaCalculator';

export class ArticuloService {
	/**
	 * Busca artículos según un término de búsqueda
	 */
	public static async buscarArticulos(busqueda: string): Promise<Articulo[]> {
		try {
			if (!busqueda || busqueda.length < 3) {
				return [];
			}

			const response = await fetch(
				`${PUBLIC_API_URL}/articulos?search=${encodeURIComponent(busqueda)}&limit=10`
			);

			if (!response.ok) {
				throw new Error('Error al buscar artículos');
			}

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

			const response = await fetch(`${PUBLIC_API_URL}/articulos/${codigo}`);

			if (!response.ok) {
				throw new Error('Error al obtener artículo');
			}

			return await response.json();
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
			PorcentajeDescuento: 0,
			PrecioUnitario: precioLista,
			PorcentajeIva: articulo.PorcentajeIva1 || 21, // Valor por defecto 21% si no hay
			PrecioUnitarioConIva: 0,
			Total: 0
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
}
