import { describe, it, expect } from 'vitest';
import {
	cantidadPreventasDesdeRespuesta,
	mensajeDescargaPreventas
} from '../../src/lib/utils/sincronizacionDescarga';

describe('cantidadPreventasDesdeRespuesta', () => {
	it('lee preventasProcesadas del API de sincronización', () => {
		expect(cantidadPreventasDesdeRespuesta({ data: { preventasProcesadas: 7 } })).toBe(7);
	});

	it('acepta cantidad como alias', () => {
		expect(cantidadPreventasDesdeRespuesta({ data: { cantidad: 3 } })).toBe(3);
	});

	it('queda en 0 si el campo no viene o es inválido', () => {
		expect(cantidadPreventasDesdeRespuesta({ data: {} })).toBe(0);
		expect(cantidadPreventasDesdeRespuesta(null)).toBe(0);
	});
});

describe('mensajeDescargaPreventas', () => {
	it('informa cuántas se procesaron cuando hay cantidad', () => {
		expect(mensajeDescargaPreventas(4, '1.20')).toBe(
			'Descarga completada en 1.20s. Se procesaron 4 preventas.'
		);
	});

	it('no dice que no había pendientes si la cantidad es 0', () => {
		expect(mensajeDescargaPreventas(0, '0.80')).toBe('Descarga completada en 0.80s.');
	});
});
