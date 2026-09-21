import { esFamiliaConIva } from './matematicaExacta';

export function redondear2(n: number): number {
	return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

type ItemCalculo = {
	Cantidad?: number;
	PrecioUnitario?: number;
	PrecioLista?: number;
	PrecioBase?: number;
	PorcentajeIva?: number;
	PorcentajeIVA1?: number;
	PorcentajeIVA2?: number;
	PorcentajeBonificado?: number;
	PrecioUnitarioConIva?: number;
	Total?: number;
} | null;

function alicuotaIva(item: ItemCalculo): number {
	const iva1 = Number(item?.PorcentajeIva ?? item?.PorcentajeIVA1);
	if (Number.isFinite(iva1) && iva1 > 0) return iva1;
	const iva2 = Number(item?.PorcentajeIVA2);
	if (Number.isFinite(iva2) && iva2 > 0) return iva2;
	return 0;
}

function es21(n: number): boolean {
	return Math.abs(n - 21) < 0.01;
}

function es105(n: number): boolean {
	return Math.abs(n - 10.5) < 0.01;
}

function precioNeto(item: ItemCalculo): number {
	const base = Number(item?.PrecioBase);
	if (Number.isFinite(base) && base > 0) return base;
	const unitario = Number(item?.PrecioUnitario);
	if (Number.isFinite(unitario) && unitario > 0) return unitario;
	return Number(item?.PrecioLista) || 0;
}

export function calcularTotalesComprobante({
	items = [],
	tipo,
	porcentajeBonificacion = 0,
	percepcion = 0
}: {
	items?: ItemCalculo[];
	tipo?: string;
	porcentajeBonificacion?: number;
	percepcion?: number;
}) {
	const pct = Number(porcentajeBonificacion) || 0;
	const perc = redondear2(percepcion);
	let importeBruto = 0;
	let base21 = 0;
	let base105 = 0;
	let subtotalConIva = 0;

	for (const item of items) {
		if (!item) continue;
		const cantidad = Number(item.Cantidad) || 0;
		const neto = precioNeto(item);
		const iva = alicuotaIva(item);
		const subtotalNeto = redondear2(cantidad * neto);
		importeBruto = redondear2(importeBruto + subtotalNeto);
		const netoBonif = subtotalNeto * (1 - pct / 100);
		if (es21(iva)) base21 += netoBonif;
		else if (es105(iva)) base105 += netoBonif;

		const precioConIvaInformado = Number(item.PrecioUnitarioConIva);
		const precioConIva =
			Number.isFinite(precioConIvaInformado) && precioConIvaInformado > 0
				? redondear2(precioConIvaInformado)
				: redondear2(neto * (1 + iva / 100));
		subtotalConIva = redondear2(subtotalConIva + redondear2(cantidad * precioConIva));
	}

	const ImporteBruto = redondear2(importeBruto);
	const ImporteBonificado = redondear2(ImporteBruto * (pct / 100));
	const ImporteNeto = redondear2(ImporteBruto - ImporteBonificado);
	const BaseImponible1 = redondear2(base21);
	const BaseImponible2 = redondear2(base105);
	let ImporteIva1 = redondear2(BaseImponible1 * 0.21);
	let ImporteIva2 = redondear2(BaseImponible2 * 0.105);

	const bonificacionConIva = redondear2(subtotalConIva * (pct / 100));
	const totalConIva = redondear2(subtotalConIva - bonificacionConIva);

	let ImporteTotal: number;
	if (esFamiliaConIva(tipo)) {
		ImporteTotal = redondear2(totalConIva + perc);
		const suma = redondear2(ImporteNeto + ImporteIva1 + ImporteIva2 + perc);
		const diff = redondear2(ImporteTotal - suma);
		if (diff !== 0) {
			if (ImporteIva1 > 0 || ImporteIva2 === 0) ImporteIva1 = redondear2(ImporteIva1 + diff);
			else ImporteIva2 = redondear2(ImporteIva2 + diff);
		}
	} else {
		ImporteTotal = redondear2(ImporteNeto + ImporteIva1 + ImporteIva2 + perc);
	}

	return {
		ImporteBruto,
		ImporteBonificado,
		ImporteNeto,
		BaseImponible1,
		BaseImponible2,
		ImporteIva1,
		ImporteIva2,
		ImporteIva: redondear2(ImporteIva1 + ImporteIva2),
		ImporteTotal,
		subtotalConIva,
		bonificacionConIva
	};
}
