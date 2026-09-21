import { alicuotaIvaValor } from './ivaArticulo';

export function precioListaItemClonado(item: {
	PrecioLista?: number | string | null;
	PrecioUnitario?: number | string | null;
	PorcentajeBonificado?: number | string | null;
}): number {
	const lista = Number(item.PrecioLista);
	if (Number.isFinite(lista) && lista > 0) return lista;

	const unitario = Number(item.PrecioUnitario) || 0;
	const descuento = Number(item.PorcentajeBonificado) || 0;
	if (descuento > 0 && descuento < 100) {
		return unitario / (1 - descuento / 100);
	}
	return unitario;
}

export function mapearItemFacturaClonada(item: {
	CodigoArticulo?: string;
	Descripcion?: string;
	Cantidad?: number | string | null;
	PrecioLista?: number | string | null;
	PrecioUnitario?: number | string | null;
	PorcentajeBonificado?: number | string | null;
	ImporteBonificado?: number | string | null;
	PorcentajeIva?: number | string | null;
	PrecioUnitarioConIva?: number | string | null;
	Total?: number | string | null;
}) {
	return {
		ArticuloCodigo: item.CodigoArticulo || '',
		Descripcion: item.Descripcion || '',
		Cantidad: Number(item.Cantidad) || 0,
		PrecioLista: precioListaItemClonado(item),
		PorcentajeBonificado: Number(item.PorcentajeBonificado) || 0,
		ImporteBonificado: Number(item.ImporteBonificado) || 0,
		PrecioUnitario: Number(item.PrecioUnitario) || 0,
		PorcentajeIva: alicuotaIvaValor(item.PorcentajeIva),
		PrecioUnitarioConIva: Number(item.PrecioUnitarioConIva) || 0,
		Total: Number(item.Total) || 0,
		enEdicion: false
	};
}

export function porcentajeBonificacionEncabezado(encabezado: {
	PorcentajeBonificacion?: number | string | null;
} | null | undefined): number {
	return Number(encabezado?.PorcentajeBonificacion) || 0;
}
