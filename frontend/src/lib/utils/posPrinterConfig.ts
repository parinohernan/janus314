const STORAGE_KEY = 'janus314_pos_terminal';

export type PosPrinterConfig = {
	terminalId: string;
	terminalName: string;
	printerName: string;
	anchoMm: number;
	copias: number;
};

function nuevoId(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `caja-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultPosPrinterConfig(): PosPrinterConfig {
	return {
		terminalId: nuevoId(),
		terminalName: 'Caja 1',
		printerName: '',
		anchoMm: 80,
		copias: 1
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
			copias: Math.max(1, Number(parsed.copias) || 1)
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
		copias: Math.max(1, Number(partial.copias ?? current.copias) || 1)
	};
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	}
	return next;
}

export { STORAGE_KEY as POS_PRINTER_STORAGE_KEY };
