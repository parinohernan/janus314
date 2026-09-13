import { describe, expect, it } from 'vitest';
import { calcularTotalesComprobante, redondear2 } from '../src/lib/utils/comprobanteTotales';

describe('calcularTotalesComprobante', () => {
	it('FCB con 5% cierra pie con IVA y Neto+IVA = Total', () => {
		const t = calcularTotalesComprobante({
			items: [
				{ Cantidad: 10, PrecioUnitario: 2068.98, PorcentajeIva: 21 },
				{ Cantidad: 4, PrecioUnitario: 800, PorcentajeIva: 10.5 }
			],
			tipo: 'FCB',
			porcentajeBonificacion: 5
		});
		expect(t.ImporteTotal).toBe(redondear2(t.subtotalConIva - t.bonificacionConIva));
		expect(redondear2(t.ImporteNeto + t.ImporteIva1 + t.ImporteIva2)).toBe(t.ImporteTotal);
	});

	it('FCA con bonificación cierra neto + IVA', () => {
		const t = calcularTotalesComprobante({
			items: [{ Cantidad: 2, PrecioUnitario: 1000, PorcentajeIva: 21 }],
			tipo: 'FCA',
			porcentajeBonificacion: 10
		});
		expect(t.ImporteBruto).toBe(2000);
		expect(t.ImporteNeto).toBe(1800);
		expect(t.ImporteTotal).toBe(redondear2(1800 + 1800 * 0.21));
	});
});
