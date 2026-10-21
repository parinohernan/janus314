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

/** AFIP 10197: NC/ND sin CbteAsoc en la base al solicitar CAE. */
export function requiereComprobanteAsociadoAfip(...textos: (string | null | undefined)[]): boolean {
	const unido = textos.filter(Boolean).join(' ');
	return /10197|CbteAsoc|PeriodoAsoc/i.test(unido);
}

const FACTURA_POR_NC: Record<string, string> = {
	NCA: 'FCA',
	NCB: 'FCB',
	NCC: 'FCC'
};

export function tipoFacturaAsociadaPorNc(documentoTipo?: string): string {
	const t = String(documentoTipo || '').toUpperCase();
	return FACTURA_POR_NC[t] || 'FCB';
}
