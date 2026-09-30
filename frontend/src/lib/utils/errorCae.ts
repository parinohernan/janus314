export interface ErrorCae {
	error: string;
	detalle?: string;
}

function texto(valor: unknown): string | undefined {
	return typeof valor === 'string' && valor.trim() ? valor.trim() : undefined;
}

/** Toma el resumen y el detalle de AFIP/ARCA, que suelen venir como error + detalle. */
export function extraerErrorCae(cuerpo: unknown, fallback = 'Error al solicitar CAE'): ErrorCae {
	if (!cuerpo || typeof cuerpo !== 'object') {
		return { error: fallback };
	}

	const data = cuerpo as Record<string, unknown>;
	const error = texto(data.error) || texto(data.message) || fallback;
	const detalle = texto(data.detalle) || texto(data.details);

	if (detalle && detalle !== error) {
		return { error, detalle };
	}
	return { error };
}
