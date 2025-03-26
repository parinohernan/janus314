import type { Cliente } from './cliente';
import type { Articulo } from './articulo';
import type { UnidadMovil } from './unidadMovil.types';

/**
 * Interfaz para la cabecera de un pedido
 */
export interface PedidoCabeza {
	DocumentoTipo: string;
	DocumentoSucursal: string;
	DocumentoNumero: string;
	CodigoCliente: string;
	CodigoUMovil: string;
	FechaEmicion: string;
	FechaEntrega?: string | null;
	FechaEnviado?: string | null;
	CantidadArticulos?: number | null;
	PesoDeCarga?: number | null;
	Observacion?: string | null;
	FechaAnulacion?: string | null;

	// Relaciones con otros modelos
	Cliente?: Cliente;
	UnidadMovil?: UnidadMovil;
}

/**
 * Interfaz para un ítem de pedido
 */
export interface PedidoItem {
	DocumentoTipo: string;
	DocumentoSucursal: string;
	DocumentoNumero: string;
	CodigoArticulo: string;
	Cantidad: number;

	// Relación con artículo
	Articulo?: Articulo;
}

/**
 * Interfaz para un pedido completo (cabecera + ítems)
 */
export interface Pedido {
	pedido: PedidoCabeza;
	items: PedidoItem[];
}

/**
 * Interfaz para filtros de búsqueda de pedidos
 */
export interface PedidoFiltros {
	cliente?: string;
	tipo?: string;
	fechaDesde?: string;
	fechaHasta?: string;
	pendientes?: boolean;
}
