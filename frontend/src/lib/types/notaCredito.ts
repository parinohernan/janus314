import type { Cliente } from './cliente';

export interface ItemNotaCredito {
	CodigoArticulo: string;
	Descripcion: string;
	Cantidad: number;
	PrecioUnitario: number;
	PorcentajeIva: number;
	PrecioUnitarioConIva: number;
	Total: number;
	TotalConIva: number;
	enEdicion?: boolean;
}

export interface ClienteNotaCredito {
	Codigo: string;
	Descripcion: string;
	CategoriaIva: string;
	// Agrega cualquier otro campo que realmente necesites
}

export interface NotaCredito {
	DocumentoTipo: string;
	DocumentoSucursal: string;
	DocumentoNumero: string;
	Fecha: string;
	CodigoCliente: string;
	Cliente: ClienteNotaCredito | null;
	CodigoVendedor?: string;
	ListaNumero: string;
	ImporteBruto: number;
	ImporteBonificado: number;
	ImporteNeto: number;
	ImporteIva1: number;
	ImporteIva2: number;
	BaseImponible1: number;
	BaseImponible2: number;
	PorcentajeIva1: number;
	PorcentajeIva2: number;
	ImporteTotal: number;
	ImporteUtilizado: number;
	Observacion: string;
	PorStock: boolean;
	FacturaReferencia?: {
		tipo: string;
		sucursal: string;
		numero: string;
	};
	Items: ItemNotaCredito[];
	FormaPagoCodigo: string;
}
