import { redondear2 } from './comprobanteTotales';

export function descuentoDesdePrecios(precioLista: number, precioUnitario: number): number {
	const lista = Number(precioLista);
	const unitario = Number(precioUnitario);
	if (!Number.isFinite(lista) || lista === 0 || !Number.isFinite(unitario)) return 0;
	return redondear2((1 - unitario / lista) * 100);
}

export function precioUnitarioDesdeDescuento(precioLista: number, porcentajeBonificado: number): number {
	const lista = Number(precioLista) || 0;
	const desc = Number(porcentajeBonificado) || 0;
	return redondear2(lista * (1 - desc / 100));
}

export function aplicarImportesDesdeDescuento<T extends {
	PrecioLista: number;
	PorcentajeBonificado: number;
	ImporteBonificado: number;
	PrecioUnitario: number;
	PorcentajeIva: number;
	PrecioUnitarioConIva: number;
	Total: number;
	Cantidad: number;
}>(item: T): T {
	const lista = Number(item.PrecioLista) || 0;
	const desc = Number(item.PorcentajeBonificado) || 0;
	item.PorcentajeBonificado = redondear2(desc);
	item.ImporteBonificado = redondear2(lista * (desc / 100));
	item.PrecioUnitario = precioUnitarioDesdeDescuento(lista, desc);
	item.PrecioUnitarioConIva = redondear2(item.PrecioUnitario * (1 + (Number(item.PorcentajeIva) || 0) / 100));
	item.Total = redondear2(item.PrecioUnitarioConIva * (Number(item.Cantidad) || 0));
	return item;
}

export function aplicarImportesDesdePrecio<T extends {
	PrecioLista: number;
	PorcentajeBonificado: number;
	ImporteBonificado: number;
	PrecioUnitario: number;
	PorcentajeIva: number;
	PrecioUnitarioConIva: number;
	Total: number;
	Cantidad: number;
}>(item: T): T {
	const lista = Number(item.PrecioLista) || 0;
	item.PrecioUnitario = redondear2(Number(item.PrecioUnitario) || 0);
	item.PorcentajeBonificado = descuentoDesdePrecios(lista, item.PrecioUnitario);
	item.ImporteBonificado = redondear2(lista - item.PrecioUnitario);
	item.PrecioUnitarioConIva = redondear2(item.PrecioUnitario * (1 + (Number(item.PorcentajeIva) || 0) / 100));
	item.Total = redondear2(item.PrecioUnitarioConIva * (Number(item.Cantidad) || 0));
	return item;
}

export function aplicarImportesDesdePrecioConIva<T extends {
	PrecioLista: number;
	PorcentajeBonificado: number;
	ImporteBonificado: number;
	PrecioUnitario: number;
	PorcentajeIva: number;
	PrecioUnitarioConIva: number;
	Total: number;
	Cantidad: number;
}>(item: T): T {
	const lista = Number(item.PrecioLista) || 0;
	const iva = Number(item.PorcentajeIva) || 0;
	const factor = 1 + iva / 100;
	item.PrecioUnitarioConIva = redondear2(Number(item.PrecioUnitarioConIva) || 0);
	item.PrecioUnitario = factor > 0 ? redondear2(item.PrecioUnitarioConIva / factor) : 0;
	item.PorcentajeBonificado = descuentoDesdePrecios(lista, item.PrecioUnitario);
	item.ImporteBonificado = redondear2(lista - item.PrecioUnitario);
	item.Total = redondear2(item.PrecioUnitarioConIva * (Number(item.Cantidad) || 0));
	return item;
}
