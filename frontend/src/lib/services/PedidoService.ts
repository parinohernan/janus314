import { PUBLIC_API_URL } from '$env/static/public';
import type { Pedido, PedidoCabeza, PedidoItem, PedidoFiltros } from '$lib/types';

/**
 * Servicio para gestionar operaciones con pedidos
 */
export class PedidoService {
	/**
	 * Obtiene un listado de pedidos con paginación y filtros
	 */
	public static async listarPedidos(page = 1, limit = 10, filtros?: PedidoFiltros) {
		try {
			// Construir URL con parámetros de paginación y filtros
			let url = `${PUBLIC_API_URL}/pedidos?page=${page}&limit=${limit}`;

			if (filtros) {
				if (filtros.cliente) url += `&cliente=${filtros.cliente}`;
				if (filtros.tipo) url += `&tipo=${filtros.tipo}`;
				if (filtros.fechaDesde) url += `&fechaDesde=${filtros.fechaDesde}`;
				if (filtros.fechaHasta) url += `&fechaHasta=${filtros.fechaHasta}`;
				if (filtros.pendientes) url += `&pendientes=true`;
			}

			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Error al obtener pedidos: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Error en PedidoService.listarPedidos:', error);
			throw error;
		}
	}

	/**
	 * Obtiene el detalle de un pedido específico
	 */
	public static async obtenerPedido(
		tipo: string,
		sucursal: string,
		numero: string
	): Promise<Pedido> {
		try {
			const response = await fetch(`${PUBLIC_API_URL}/pedidos/${tipo}/${sucursal}/${numero}`);

			if (!response.ok) {
				throw new Error(`Error al obtener detalle del pedido: ${response.statusText}`);
			}

			const result = await response.json();
			return result.data;
		} catch (error) {
			console.error('Error en PedidoService.obtenerPedido:', error);
			throw error;
		}
	}

	/**
	 * Crea un nuevo pedido
	 */
	public static async crearPedido(pedido: PedidoCabeza, items: PedidoItem[]) {
		try {
			const pedidoData = {
				...pedido,
				Items: items
			};

			const response = await fetch(`${PUBLIC_API_URL}/pedidos`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(pedidoData)
			});

			if (!response.ok) {
				throw new Error(`Error al crear pedido: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Error en PedidoService.crearPedido:', error);
			throw error;
		}
	}

	/**
	 * Actualiza el estado de un pedido
	 */
	public static async actualizarEstado(
		tipo: string,
		sucursal: string,
		numero: string,
		estado: 'enviado' | 'anulado' | 'programado',
		fecha?: string
	) {
		try {
			const response = await fetch(
				`${PUBLIC_API_URL}/pedidos/estado/${tipo}/${sucursal}/${numero}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						estado,
						fecha
					})
				}
			);

			if (!response.ok) {
				throw new Error(`Error al actualizar estado del pedido: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Error en PedidoService.actualizarEstado:', error);
			throw error;
		}
	}
}
