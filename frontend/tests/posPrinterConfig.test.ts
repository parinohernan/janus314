import { describe, expect, it, beforeEach } from 'vitest';
import {
	POS_PRINTER_STORAGE_KEY,
	loadPosPrinterConfig,
	savePosPrinterConfig
} from '../src/lib/utils/posPrinterConfig';

describe('posPrinterConfig', () => {
	beforeEach(() => {
		localStorage.removeItem(POS_PRINTER_STORAGE_KEY);
	});

	it('crea una terminal con impresora vacía y 80 mm', () => {
		const config = loadPosPrinterConfig();
		expect(config.terminalName).toBe('Caja 1');
		expect(config.printerName).toBe('');
		expect(config.anchoMm).toBe(80);
		expect(config.terminalId.length).toBeGreaterThan(4);
	});

	it('persiste la impresora elegida', () => {
		savePosPrinterConfig({ printerName: 'PDF', terminalName: 'Caja 2' });
		const config = loadPosPrinterConfig();
		expect(config.printerName).toBe('PDF');
		expect(config.terminalName).toBe('Caja 2');
	});
});
