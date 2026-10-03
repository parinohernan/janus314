import { redondear2 } from './comprobanteTotales';
import { alicuotaIvaArticulo } from './ivaArticulo';

export type ItemPreventaDesc = {
	CodigoArticulo?: string;
	Cantidad?: number;
	PrecioUnitario?: number;
	PrecioLista?: number;
	PorcentajeBonificacion?: number;
	Articulo?: {
		Descripcion?: string;
		PorcentajeIVA1?: number | string | null;
		PorcentajeIva1?: number | string | null;
		PorcentajeIva?: number | string | null;
	};
};

export type LineaNcRapida = {
	CodigoArticulo: string;
	Descripcion: string;
	Cantidad: number;
	PrecioLista: number;
	PorcentajeBonificacion: number;
	PorcentajeIva: number;
};

export function acotarPorcentaje(valor: unknown): number {
	const n = Number(valor);
	if (!Number.isFinite(n)) return 0;
	return Math.min(100, Math.max(0, n));
}

export function precioListaDesdePreventa(item: ItemPreventaDesc): number {
	const lista = Number(item.PrecioLista);
	if (Number.isFinite(lista) && lista > 0) return redondear2(lista);

	const neto = Number(item.PrecioUnitario);
	const pct = acotarPorcentaje(item.PorcentajeBonificacion);
	if (pct > 0 && pct < 100 && Number.isFinite(neto)) {
		return redondear2(neto / (1 - pct / 100));
	}
	return redondear2(Number.isFinite(neto) ? neto : 0);
}

export function precioNetoLinea(linea: Pick<LineaNcRapida, 'PrecioLista' | 'PorcentajeBonificacion'>): number {
	return redondear2(Number(linea.PrecioLista) * (1 - acotarPorcentaje(linea.PorcentajeBonificacion) / 100));
}

export function subtotalLinea(linea: LineaNcRapida): number {
	return redondear2((Number(linea.Cantidad) || 0) * precioNetoLinea(linea));
}

export function lineaDesdePreventaItem(item: ItemPreventaDesc): LineaNcRapida {
	return {
		CodigoArticulo: item.CodigoArticulo || '',
		Descripcion: item.Articulo?.Descripcion || item.CodigoArticulo || '',
		Cantidad: Number(item.Cantidad) || 0,
		PrecioLista: precioListaDesdePreventa(item),
		PorcentajeBonificacion: acotarPorcentaje(item.PorcentajeBonificacion),
		PorcentajeIva: alicuotaIvaArticulo(item.Articulo)
	};
}

export function itemNcDesdeLinea(linea: LineaNcRapida) {
	const precioUnitario = precioNetoLinea(linea);
	return {
		CodigoArticulo: linea.CodigoArticulo,
		Descripcion: linea.Descripcion,
		Cantidad: Number(linea.Cantidad) || 0,
		PrecioUnitario: precioUnitario,
		PorcentajeIva: linea.PorcentajeIva,
		PorcentajeBonificacion: acotarPorcentaje(linea.PorcentajeBonificacion)
	};
}
