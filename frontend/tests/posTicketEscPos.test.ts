import { describe, expect, it } from 'vitest';
import { codificar1252 } from '../src/lib/utils/escpos/codificacion';
import { armarTicketEscPos, envolver, renderPosTicketEscPos } from '../src/lib/utils/escpos/ticketEscPos';
import { rasterDesdeRgba } from '../src/lib/utils/escpos/logoRaster';
import { ticketPrueba, urlQrArca, type PosTicketDto } from '../src/lib/utils/posTicketHtml';

const OPCIONES = { columnas: 48, cortarPapel: true, abrirCajon: false };

function contiene(bytes: Uint8Array, secuencia: number[]): number {
	for (let i = 0; i <= bytes.length - secuencia.length; i++) {
		if (secuencia.every((byte, j) => bytes[i + j] === byte)) return i;
	}
	return -1;
}

function ticketB(): PosTicketDto {
	return {
		tipo: 'FCB',
		sucursal: '0001',
		numero: '00000015',
		fecha: '2026-10-02',
		empresa: { nombre: 'Súper Janus', cuit: '20-12345678-9', condicionIva: 'Responsable Inscrito' },
		cliente: { codigo: 'CF', descripcion: 'Consumidor Final' },
		items: [
			{ cantidad: 2, descripcion: 'Leche', total: 2400 },
			{
				cantidad: 1.5,
				descripcion: 'Queso cremoso de campo con descripción muy larga para partir en renglones',
				total: 12345.67
			}
		],
		totales: { neto: 12186.5, iva: 2559.17, total: 14745.67 },
		cae: '76123456789012',
		caeVencimiento: '2026-10-12'
	};
}

describe('codificar1252', () => {
	it('codifica ñ, acentos y ° en WPC1252 y reemplaza el espacio no separable', () => {
		expect(codificar1252('ñáÑ°')).toEqual([0xf1, 0xe1, 0xd1, 0xb0]);
		expect(codificar1252('$\u00a01')).toEqual([0x24, 0x20, 0x31]);
		expect(codificar1252('€✓')).toEqual([0x80, 0x3f]);
	});
});

describe('renderPosTicketEscPos', () => {
	it('inicializa con ESC @ y ESC t 16 y termina con corte parcial', () => {
		const bytes = renderPosTicketEscPos(ticketPrueba(), OPCIONES);
		expect(Array.from(bytes.slice(0, 5))).toEqual([0x1b, 0x40, 0x1b, 0x74, 16]);
		expect(Array.from(bytes.slice(-4))).toEqual([0x1d, 0x56, 66, 0]);
	});

	it('sin corte no manda GS V y con cajón manda ESC p 0', () => {
		const bytes = renderPosTicketEscPos(ticketPrueba(), { ...OPCIONES, cortarPapel: false, abrirCajon: true });
		expect(contiene(bytes, [0x1d, 0x56, 66, 0])).toBe(-1);
		expect(contiene(bytes, [0x1b, 0x70, 0, 25, 250])).toBeGreaterThan(0);
	});

	it('imprime la ñ del ticket de prueba como 0xF1', () => {
		const bytes = renderPosTicketEscPos(ticketPrueba(), OPCIONES);
		expect(contiene(bytes, codificar1252('prueba ñ áéí'))).toBeGreaterThan(0);
	});

	it('ningún renglón supera las columnas, contando el doble ancho', () => {
		for (const columnas of [48, 42, 32]) {
			const { lineas } = armarTicketEscPos(ticketB(), { ...OPCIONES, columnas });
			for (const linea of lineas) {
				expect(linea.texto.length * linea.ancho).toBeLessThanOrEqual(columnas);
			}
		}
	});

	it('parte la descripción larga sin pisar el importe', () => {
		const { lineas } = armarTicketEscPos(ticketB(), OPCIONES);
		const textos = lineas.map((linea) => linea.texto);
		const inicio = textos.findIndex((texto) => texto.includes('Queso cremoso'));
		expect(inicio).toBeGreaterThan(-1);
		expect(textos[inicio].endsWith('12.345,67')).toBe(true);
		expect(textos[inicio + 1].startsWith('       ')).toBe(true);
		expect(textos[inicio + 1]).not.toContain('$');
	});

	it('en FCB con CAE incluye el QR nativo con la URL de ARCA y el CAE', () => {
		const dto = ticketB();
		const bytes = renderPosTicketEscPos(dto, OPCIONES);
		const url = urlQrArca(dto) as string;
		const largo = url.length + 3;
		const inicio = contiene(bytes, [0x1d, 0x28, 0x6b, largo & 0xff, largo >> 8, 0x31, 0x50, 0x30]);
		expect(inicio).toBeGreaterThan(0);
		expect(Array.from(bytes.slice(inicio + 8, inicio + 8 + url.length))).toEqual(codificar1252(url));
		expect(contiene(bytes, [0x1d, 0x28, 0x6b, 3, 0, 0x31, 0x51, 0x30])).toBeGreaterThan(inicio);
		expect(contiene(bytes, codificar1252('CAE N°: 76123456789012'))).toBeGreaterThan(0);
		expect(contiene(bytes, codificar1252('Fecha Vto. CAE: 12/10/2026'))).toBeGreaterThan(0);
	});

	it('PRF no lleva QR y avisa que no es factura', () => {
		const bytes = renderPosTicketEscPos(ticketPrueba(), OPCIONES);
		expect(contiene(bytes, [0x1d, 0x28, 0x6b])).toBe(-1);
		expect(contiene(bytes, codificar1252('Documento no válido como factura'))).toBeGreaterThan(0);
	});

	it('incluye el logo como GS v 0 con su tamaño', () => {
		const logo = { anchoBytes: 2, alto: 3, datos: new Uint8Array(6).fill(0xff) };
		const bytes = renderPosTicketEscPos(ticketPrueba(), { ...OPCIONES, logo });
		expect(contiene(bytes, [0x1d, 0x76, 0x30, 0, 2, 0, 3, 0, 0xff])).toBeGreaterThan(0);
	});
});

describe('envolver', () => {
	it('corta palabras más largas que el renglón', () => {
		expect(envolver('abcdefghij kl', 4)).toEqual(['abcd', 'efgh', 'ij', 'kl']);
	});
});

describe('rasterDesdeRgba', () => {
	it('pasa negro a 1, blanco y transparente a 0', () => {
		const rgba = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0]);
		const imagen = rasterDesdeRgba(rgba, 3, 1);
		expect(imagen.anchoBytes).toBe(1);
		expect(imagen.alto).toBe(1);
		expect(imagen.datos[0]).toBe(0b10000000);
	});
});
