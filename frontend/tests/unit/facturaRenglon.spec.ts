import { describe, expect, it } from 'vitest';
import {
	aplicarImportesDesdeDescuento,
	aplicarImportesDesdePrecio,
	aplicarImportesDesdePrecioConIva,
	descuentoDesdePrecios,
	precioUnitarioDesdeDescuento
} from '../../src/lib/utils/facturaRenglon';

describe('facturaRenglon', () => {
	it('calcula descuento positivo si el unitario es menor a la lista', () => {
		expect(descuentoDesdePrecios(100, 80)).toBe(20);
	});

	it('calcula descuento negativo si el unitario es mayor a la lista', () => {
		expect(descuentoDesdePrecios(100, 110)).toBe(-10);
	});

	it('deriva el unitario desde un descuento negativo', () => {
		expect(precioUnitarioDesdeDescuento(100, -10)).toBe(110);
	});

	it('al editar el precio, deja el % y los importes alineados', () => {
		const item = aplicarImportesDesdePrecio({
			PrecioLista: 100,
			PorcentajeBonificado: 0,
			ImporteBonificado: 0,
			PrecioUnitario: 90,
			PorcentajeIva: 21,
			PrecioUnitarioConIva: 0,
			Total: 0,
			Cantidad: 2
		});
		expect(item.PorcentajeBonificado).toBe(10);
		expect(item.ImporteBonificado).toBe(10);
		expect(item.PrecioUnitarioConIva).toBe(108.9);
		expect(item.Total).toBe(217.8);
	});

	it('al editar el %, recalcula el unitario (también recargo)', () => {
		const item = aplicarImportesDesdeDescuento({
			PrecioLista: 100,
			PorcentajeBonificado: -5,
			ImporteBonificado: 0,
			PrecioUnitario: 100,
			PorcentajeIva: 21,
			PrecioUnitarioConIva: 0,
			Total: 0,
			Cantidad: 1
		});
		expect(item.PrecioUnitario).toBe(105);
		expect(item.ImporteBonificado).toBe(-5);
	});

	it('al editar precio c/IVA, saca el neto y el %', () => {
		const item = aplicarImportesDesdePrecioConIva({
			PrecioLista: 100,
			PorcentajeBonificado: 0,
			ImporteBonificado: 0,
			PrecioUnitario: 100,
			PorcentajeIva: 21,
			PrecioUnitarioConIva: 108.9,
			Total: 0,
			Cantidad: 2
		});
		expect(item.PrecioUnitario).toBe(90);
		expect(item.PorcentajeBonificado).toBe(10);
		expect(item.PrecioUnitarioConIva).toBe(108.9);
		expect(item.Total).toBe(217.8);
	});
});
