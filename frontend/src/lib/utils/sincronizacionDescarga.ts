export function cantidadPreventasDesdeRespuesta(payload: unknown): number {
	const data = (payload as { data?: Record<string, unknown> } | null)?.data;
	const raw = data?.preventasProcesadas ?? data?.cantidad;
	const n = Number(raw);
	return Number.isFinite(n) && n > 0 ? n : 0;
}

export function mensajeDescargaPreventas(cantidad: number, duration: string): string {
	if (cantidad > 0) {
		return `Descarga completada en ${duration}s. Se procesaron ${cantidad} preventas.`;
	}
	return `Descarga completada en ${duration}s.`;
}
