import type { Cliente } from './cliente';
import type { Articulo } from './articulo';
import type { Vendedor } from './vendedor';

/**
 * Interfaz para la cabecera de una preventa
 */
export interface PreventaCabeza {
	DocumentoTipo: string;
	DocumentoSucursal: string;
	DocumentoNumero: string;
	Fecha: string;
	ClienteCodigo: string;
	VendedorCodigo?: string;
	PagoTipo?: string;
	ImporteBruto?: number;
	PorcentajeBonificacion?: number;
	ImporteBonificado?: number;
	ImporteNeto?: number;
	ImporteAdicional?: number;
	ImporteIva1?: number;
	ImporteIva2?: number;
	ImporteTotal?: number;
	ImportePagado?: number;
	PorcentajeIva1?: number;
	PorcentajeIva2?: number;
	ListaNumero?: number;
	FechaAnulacion?: string | null;
	Observacion?: string | null;
	FacturaTipo?: string | null;
	FacturaSucursal?: string | null;
	FacturaNumero?: string | null;
	FechaEntrega?: string | null;
	FechaHoraEnvio?: string | null;

	// Relaciones con otros modelos
	Cliente?: Cliente;
	Vendedor?: Vendedor;
}

/**
 * Interfaz para un ítem de preventa
 */
export interface PreventaItem {
	DocumentoTipo: string;
	DocumentoSucursal: string;
	DocumentoNumero: string;
	CodigoArticulo: string;
	Cantidad?: number;
	PrecioUnitario?: number;
	DocumentoLiqTipo?: string;
	DocumentoLiqSucursal?: string;
	DocumentoLiqNumero?: string;
	LiqFecha?: string;
	PrecioLista?: number;
	PorcentajeBonificacion?: number;

	// Relación con artículo
	Articulo?: Articulo;
}

/**
 * Interfaz para una preventa completa (cabecera + ítems)
 */
export interface Preventa {
	preventa: PreventaCabeza;
	items: PreventaItem[];
}

/**
 * Interfaz para filtros de búsqueda de preventas
 */
export interface PreventaFiltros {
	cliente?: string;
	tipo?: string;
	vendedor?: string;
	fechaDesde?: string;
	fechaHasta?: string;
	pendientes?: boolean;
}
