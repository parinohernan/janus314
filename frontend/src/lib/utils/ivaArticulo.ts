export function alicuotaIvaValor(valor: unknown, fallback = 21): number {
	if (valor === null || valor === undefined || valor === '') return fallback;
	const iva = Number(valor);
	return Number.isFinite(iva) ? iva : fallback;
}

export function alicuotaIvaArticulo(
	articulo?: {
		PorcentajeIVA1?: number | string | null;
		PorcentajeIva1?: number | string | null;
		PorcentajeIva?: number | string | null;
		iva?: number | string | null;
	} | null,
	fallback = 21
): number {
	const raw =
		articulo?.PorcentajeIVA1 ??
		articulo?.PorcentajeIva1 ??
		articulo?.PorcentajeIva ??
		articulo?.iva;
	return alicuotaIvaValor(raw, fallback);
}
