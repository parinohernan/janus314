const STORAGE_KEY = 'janus314_pos_terminal';

export type PosModoImpresion = 'qz' | 'escpos';

export const COLUMNAS_ESCPOS = [48, 42, 32] as const;

export type PosPrinterConfig = {
	terminalId: string;
	terminalName: string;
	printerName: string;
	anchoMm: number;
	copias: number;
	modo: PosModoImpresion;
	columnas: number;
	cortarPapel: boolean;
	abrirCajon: boolean;
};

function nuevoId(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `caja-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function modoValido(valor: unknown): PosModoImpresion {
	return valor === 'escpos' ? 'escpos' : 'qz';
}

function columnasValidas(valor: unknown): number {
	const n = Number(valor);
	return (COLUMNAS_ESCPOS as readonly number[]).includes(n) ? n : 48;
}

function booleano(valor: unknown, porDefecto: boolean): boolean {
	return typeof valor === 'boolean' ? valor : porDefecto;
}

export function defaultPosPrinterConfig(): PosPrinterConfig {
	return {
		terminalId: nuevoId(),
		terminalName: 'Caja 1',
		printerName: '',
		anchoMm: 80,
		copias: 1,
		modo: 'qz',
		columnas: 48,
		cortarPapel: true,
		abrirCajon: false
	};
}

export function loadPosPrinterConfig(): PosPrinterConfig {
	const base = defaultPosPrinterConfig();
	if (typeof localStorage === 'undefined') return base;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
			return base;
		}
		const parsed = JSON.parse(raw) as Partial<PosPrinterConfig>;
		const config: PosPrinterConfig = {
			terminalId: String(parsed.terminalId || base.terminalId),
			terminalName: String(parsed.terminalName || base.terminalName),
			printerName: String(parsed.printerName || ''),
			anchoMm: Number(parsed.anchoMm) > 0 ? Number(parsed.anchoMm) : 80,
			copias: Math.max(1, Number(parsed.copias) || 1),
			modo: modoValido(parsed.modo),
			columnas: columnasValidas(parsed.columnas),
			cortarPapel: booleano(parsed.cortarPapel, base.cortarPapel),
			abrirCajon: booleano(parsed.abrirCajon, base.abrirCajon)
		};
		if (!parsed.terminalId) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
		}
		return config;
	} catch {
		return base;
	}
}

export function savePosPrinterConfig(partial: Partial<PosPrinterConfig>): PosPrinterConfig {
	const current = loadPosPrinterConfig();
	const next: PosPrinterConfig = {
		...current,
		...partial,
		terminalId: partial.terminalId || current.terminalId,
		anchoMm: Number(partial.anchoMm ?? current.anchoMm) || 80,
		copias: Math.max(1, Number(partial.copias ?? current.copias) || 1),
		modo: modoValido(partial.modo ?? current.modo),
		columnas: columnasValidas(partial.columnas ?? current.columnas),
		cortarPapel: booleano(partial.cortarPapel, current.cortarPapel),
		abrirCajon: booleano(partial.abrirCajon, current.abrirCajon)
	};
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	}
	return next;
}

export { STORAGE_KEY as POS_PRINTER_STORAGE_KEY };
