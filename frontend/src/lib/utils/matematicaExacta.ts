export const CORTE_MATEMATICA_EXACTA = '2026-09-11';

export const TEXTO_ADVERTENCIA_COMPROBANTE_ANTERIOR =
	'Este comprobante se emitió antes del 11/09/2026. No se puede corregir. El total y el CAE son los originales. El pie del PDF puede no cerrar porque usa el cálculo anterior.';

export function fechaAISO(fecha?: string | Date | null): string {
	if (!fecha) return '';
	if (typeof fecha === 'string') return fecha.slice(0, 10);
	if (fecha instanceof Date && !Number.isNaN(fecha.getTime())) {
		return fecha.toISOString().slice(0, 10);
	}
	return String(fecha).slice(0, 10);
}

export function usaMatematicaExacta(fecha?: string | Date | null): boolean {
	const iso = fechaAISO(fecha);
	return Boolean(iso) && iso >= CORTE_MATEMATICA_EXACTA;
}

export function esComprobanteAnteriorAlCorte(fecha?: string | Date | null): boolean {
	const iso = fechaAISO(fecha);
	return Boolean(iso) && iso < CORTE_MATEMATICA_EXACTA;
}

export function esFamiliaConIva(tipo?: string | null): boolean {
	return tipo === 'FCB' || tipo === 'PRF' || tipo === 'NCB' || tipo === 'NCF';
}

export function fechaDesdeComprobante(doc: unknown): string {
	if (!doc || typeof doc !== 'object') return '';
	const d = doc as Record<string, any>;
	return fechaAISO(
		d?.data?.encabezado?.Fecha || d?.encabezado?.Fecha || d?.Fecha || d?.notaDebito?.Fecha || ''
	);
}
