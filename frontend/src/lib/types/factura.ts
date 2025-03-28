import type { Cliente } from './cliente';

export interface ItemFactura {
	ArticuloCodigo: string;
	Descripcion: string;
	Cantidad: number;
	PrecioLista: number;
	PorcentajeBonificacion: number;
	PrecioUnitario: number;
	PorcentajeIva: number;
	PrecioUnitarioConIva: number;
	Total: number;
	enEdicion?: boolean;
}

export interface Factura {
	DocumentoTipo: string;
	DocumentoSucursal: string;
	DocumentoNumero: string;
	Fecha: string;
	ClienteCodigo: string;
	Cliente: Cliente | null;
	VendedorCodigo?: string;
	ListaPrecio: string;
	ImporteBruto: number;
	PorcentajeDescuento: number;
	ImporteDescuento: number;
	ImporteNeto: number;
	ImporteIva1: number;
	ImporteIva2: number;
	BaseImponible1: number;
	BaseImponible2: number;
	PorcentajeIngresosBrutos: number;
	ImporteIngresosBrutos: number;
	ImporteIva: number;
	ImporteTotal: number;
	Observacion: string;
	FormaPagoCodigo: string;
	FormaPago: string;
	Items: ItemFactura[];
}
