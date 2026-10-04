const STORAGE_KEY = 'janus314_pos_pantalla';

export type PosTamanoPantalla = 'normal' | '15' | '14';

export type PosPantallaConfig = {
	tamano: PosTamanoPantalla;
	oscuro: boolean;
};

export const ESCALA_POS: Record<PosTamanoPantalla, number> = {
	normal: 1,
	'15': 0.9,
	'14': 0.8
};

export const TAMANOS_POS: { id: PosTamanoPantalla; titulo: string; detalle: string }[] = [
	{ id: 'normal', titulo: 'Normal', detalle: 'Monitores de 17" o más, 1920 × 1080 (100%)' },
	{ id: '15', titulo: 'Monitor de 15 pulgadas', detalle: '1440 × 900 o 1600 × 900 (90%)' },
	{ id: '14', titulo: 'Monitor de 14 pulgadas', detalle: '1366 × 768 o 1280 × 720 (80%)' }
];

function tamanoValido(valor: unknown): PosTamanoPantalla {
	return valor === '15' || valor === '14' ? valor : 'normal';
}

export function defaultPosPantallaConfig(): PosPantallaConfig {
	return { tamano: 'normal', oscuro: false };
}

export function loadPosPantallaConfig(): PosPantallaConfig {
	const base = defaultPosPantallaConfig();
	if (typeof localStorage === 'undefined') return base;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return base;
		const parsed = JSON.parse(raw) as Partial<PosPantallaConfig>;
		return {
			tamano: tamanoValido(parsed.tamano),
			oscuro: parsed.oscuro === true
		};
	} catch {
		return base;
	}
}

export function savePosPantallaConfig(partial: Partial<PosPantallaConfig>): PosPantallaConfig {
	const current = loadPosPantallaConfig();
	const next: PosPantallaConfig = {
		tamano: tamanoValido(partial.tamano ?? current.tamano),
		oscuro: typeof partial.oscuro === 'boolean' ? partial.oscuro : current.oscuro
	};
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	}
	return next;
}

/** Se decide por el alto, que es lo que falta en los monitores chicos para ver total, cobro y rubros. */
export function tamanoSugerido(_ancho: number, alto: number): PosTamanoPantalla {
	if (alto <= 768) return '14';
	if (alto <= 900) return '15';
	return 'normal';
}

/**
 * Se aplica en <html> para que también alcance a modales y avisos, que se dibujan fuera del POS.
 * El zoom también achica las unidades vh, por eso el alto del POS se divide por --pos-zoom.
 */
export function aplicarPantallaPos(config: PosPantallaConfig): void {
	if (typeof document === 'undefined') return;
	const html = document.documentElement;
	const escala = ESCALA_POS[config.tamano];
	if (escala === 1) {
		html.style.zoom = '';
		html.style.removeProperty('--pos-zoom');
	} else {
		html.style.zoom = String(escala);
		html.style.setProperty('--pos-zoom', String(escala));
	}
	html.classList.toggle('dark', config.oscuro);
}

export function quitarPantallaPos(): void {
	if (typeof document === 'undefined') return;
	const html = document.documentElement;
	html.style.zoom = '';
	html.style.removeProperty('--pos-zoom');
	html.classList.remove('dark');
}

export { STORAGE_KEY as POS_PANTALLA_STORAGE_KEY };
