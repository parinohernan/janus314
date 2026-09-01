export function porcentajeBonificacionDesdeFactura(encabezado?: {
	PorcentajeBonificacion?: number | string | null;
	ImporteBonificado?: number | string | null;
	ImporteBruto?: number | string | null;
} | null): number {
	const pct = Number(encabezado?.PorcentajeBonificacion);
	if (Number.isFinite(pct) && pct > 0) {
		return pct;
	}

	const bruto = Number(encabezado?.ImporteBruto);
	const bonificado = Number(encabezado?.ImporteBonificado);
	if (bruto > 0 && bonificado > 0) {
		return parseFloat(((bonificado / bruto) * 100).toFixed(2));
	}

	return 0;
}

type ItemTotales = {
	Cantidad?: number;
	PrecioUnitario?: number;
	PorcentajeIva?: number;
} | null;

export function calcularTotalesNotaCredito(
	items: ItemTotales[],
	porcentajeBonificacion: number = 0
) {
	const pct = Number(porcentajeBonificacion) || 0;
	let importeBruto = 0;
	let baseImponible1 = 0;
	let baseImponible2 = 0;

	for (const item of items) {
		if (!item) continue;
		const importeItem = (Number(item.Cantidad) || 0) * (Number(item.PrecioUnitario) || 0);
		importeBruto += importeItem;
		const importeConBonificacion = importeItem * (1 - pct / 100);
		if (item.PorcentajeIva === 21) {
			baseImponible1 += importeConBonificacion;
		} else if (item.PorcentajeIva === 10.5) {
			baseImponible2 += importeConBonificacion;
		}
	}

	const ImporteBruto = parseFloat(importeBruto.toFixed(2));
	const ImporteBonificado = parseFloat((ImporteBruto * (pct / 100)).toFixed(2));
	const ImporteNeto = parseFloat((ImporteBruto - ImporteBonificado).toFixed(2));
	const ImporteIva1 = parseFloat((baseImponible1 * 0.21).toFixed(2));
	const ImporteIva2 = parseFloat((baseImponible2 * 0.105).toFixed(2));

	return {
		ImporteBruto,
		ImporteBonificado,
		ImporteNeto,
		BaseImponible1: parseFloat(baseImponible1.toFixed(2)),
		BaseImponible2: parseFloat(baseImponible2.toFixed(2)),
		ImporteIva1,
		ImporteIva2,
		ImporteTotal: parseFloat((ImporteNeto + ImporteIva1 + ImporteIva2).toFixed(2))
	};
}
