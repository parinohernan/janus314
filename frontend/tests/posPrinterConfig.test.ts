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

	it('arranca en modo QZ con opciones ESC/POS por defecto', () => {
		const config = loadPosPrinterConfig();
		expect(config.modo).toBe('qz');
		expect(config.columnas).toBe(48);
		expect(config.cortarPapel).toBe(true);
		expect(config.abrirCajon).toBe(false);
	});

	it('completa los campos nuevos en una configuración guardada antes del cambio', () => {
		localStorage.setItem(
			POS_PRINTER_STORAGE_KEY,
			JSON.stringify({ terminalId: 'caja-x', terminalName: 'Caja 3', printerName: 'EPSON TM-T20II Receipt', anchoMm: 80, copias: 1 })
		);
		const config = loadPosPrinterConfig();
		expect(config.printerName).toBe('EPSON TM-T20II Receipt');
		expect(config.modo).toBe('qz');
		expect(config.columnas).toBe(48);
		expect(config.cortarPapel).toBe(true);
	});

	it('persiste el modo ESC/POS y sus opciones', () => {
		savePosPrinterConfig({ modo: 'escpos', columnas: 42, cortarPapel: false, abrirCajon: true });
		const config = loadPosPrinterConfig();
		expect(config.modo).toBe('escpos');
		expect(config.columnas).toBe(42);
		expect(config.cortarPapel).toBe(false);
		expect(config.abrirCajon).toBe(true);
	});

	it('persiste la impresora elegida', () => {
		savePosPrinterConfig({ printerName: 'PDF', terminalName: 'Caja 2' });
		const config = loadPosPrinterConfig();
		expect(config.printerName).toBe('PDF');
		expect(config.terminalName).toBe('Caja 2');
	});
});
