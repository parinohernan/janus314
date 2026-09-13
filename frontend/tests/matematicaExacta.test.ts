import { describe, expect, it } from 'vitest';
import {
	CORTE_MATEMATICA_EXACTA,
	esComprobanteAnteriorAlCorte,
	fechaDesdeComprobante,
	usaMatematicaExacta
} from '../src/lib/utils/matematicaExacta';

describe('matematicaExacta', () => {
	it('corta el 11/09/2026', () => {
		expect(CORTE_MATEMATICA_EXACTA).toBe('2026-09-11');
		expect(usaMatematicaExacta('2026-09-10')).toBe(false);
		expect(esComprobanteAnteriorAlCorte('2026-09-10')).toBe(true);
		expect(usaMatematicaExacta('2026-09-11')).toBe(true);
		expect(esComprobanteAnteriorAlCorte('2026-09-11')).toBe(false);
	});

	it('lee la fecha del detalle de factura', () => {
		expect(fechaDesdeComprobante({ data: { encabezado: { Fecha: '2026-09-12' } } })).toBe(
			'2026-09-12'
		);
		expect(fechaDesdeComprobante({ Fecha: '2026-08-01T00:00:00.000Z' })).toBe('2026-08-01');
	});
});
