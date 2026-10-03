import { describe, expect, it } from 'vitest';
import {
	itemNcDesdeLinea,
	lineaDesdePreventaItem,
	precioNetoLinea
} from '../../src/lib/utils/ncRapidaPreventa';

describe('ncRapidaPreventa', () => {
	it('trae el % de la preventa y recalcula el neto desde la lista', () => {
		const linea = lineaDesdePreventaItem({
			CodigoArticulo: 'X',
			Cantidad: 2,
			PrecioLista: 100,
			PrecioUnitario: 80,
			PorcentajeBonificacion: 20,
			Articulo: { Descripcion: 'Item', PorcentajeIVA1: 21 }
		});
		expect(linea.PorcentajeBonificacion).toBe(20);
		expect(precioNetoLinea(linea)).toBe(80);
		expect(itemNcDesdeLinea(linea).PrecioUnitario).toBe(80);
	});

	it('reconstruye la lista si solo vienen neto y %', () => {
		const linea = lineaDesdePreventaItem({
			CodigoArticulo: 'Y',
			Cantidad: 1,
			PrecioUnitario: 90,
			PorcentajeBonificacion: 10
		});
		expect(linea.PrecioLista).toBe(100);
		expect(precioNetoLinea(linea)).toBe(90);
	});

	it('permite 100% de descuento (sin cargo)', () => {
		expect(precioNetoLinea({ PrecioLista: 250, PorcentajeBonificacion: 100 })).toBe(0);
	});
});
