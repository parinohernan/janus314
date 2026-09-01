import { describe, it, expect } from 'vitest';
import {
	porcentajeBonificacionDesdeFactura,
	calcularTotalesNotaCredito
} from '../../src/lib/utils/notaCreditoTotales';

describe('bonificación general en nota de crédito', () => {
	it('copia el porcentaje de la factura relacionada', () => {
		expect(
			porcentajeBonificacionDesdeFactura({
				PorcentajeBonificacion: 10,
				ImporteBruto: 1000,
				ImporteBonificado: 100
			})
		).toBe(10);
	});

	it('deriva el porcentaje si la factura solo trae importes', () => {
		expect(
			porcentajeBonificacionDesdeFactura({
				ImporteBruto: 1000,
				ImporteBonificado: 150
			})
		).toBe(15);
	});

	it('queda en 0 si la factura no tiene bonificación', () => {
		expect(porcentajeBonificacionDesdeFactura({})).toBe(0);
		expect(porcentajeBonificacionDesdeFactura(null)).toBe(0);
	});

	it('aplica la bonificación general a neto, IVA y total', () => {
		const totales = calcularTotalesNotaCredito(
			[{ Cantidad: 2, PrecioUnitario: 100, PorcentajeIva: 21 }],
			10
		);

		expect(totales.ImporteBruto).toBe(200);
		expect(totales.ImporteBonificado).toBe(20);
		expect(totales.ImporteNeto).toBe(180);
		expect(totales.ImporteIva1).toBe(37.8);
		expect(totales.ImporteTotal).toBe(217.8);
	});

	it('sin bonificación el neto coincide con el bruto', () => {
		const totales = calcularTotalesNotaCredito(
			[{ Cantidad: 1, PrecioUnitario: 100, PorcentajeIva: 21 }],
			0
		);

		expect(totales.ImporteBonificado).toBe(0);
		expect(totales.ImporteNeto).toBe(100);
		expect(totales.ImporteIva1).toBe(21);
		expect(totales.ImporteTotal).toBe(121);
	});
});
