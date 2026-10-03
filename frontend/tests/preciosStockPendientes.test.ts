import { describe, expect, it } from 'vitest';
import {
	aplicarPendientes,
	snapshotDesdeArticulo,
	valorCeldaFiltro
} from '../src/lib/utils/preciosStockGrilla';

describe('aplicarPendientes', () => {
	it('superpone solo los campos pendientes y deja el snapshot en el valor de origen', () => {
		const base = [
			{
				Codigo: 'A1',
				PrecioCosto: 10,
				PrecioCostoMasImp: 12.1,
				Lista1: 20,
				Existencia: 4,
				PorcentajeIVA1: 21
			}
		];
		const conPendiente = aplicarPendientes(base, [
			{ Codigo: 'A1', PrecioCosto: 15, Existencia: 9 }
		]);

		expect(snapshotDesdeArticulo(base[0]).PrecioCosto).toBe(10);
		expect(snapshotDesdeArticulo(base[0]).Existencia).toBe(4);
		expect(conPendiente[0].PrecioCosto).toBe(15);
		expect(conPendiente[0].Existencia).toBe(9);
		expect(conPendiente[0].Lista1).toBe(20);
		expect(base[0].PrecioCosto).toBe(10);
	});

	it('el precio anterior es el costo previo al último cambio, no el costo vigente', () => {
		const articulo = {
			Codigo: 'A1',
			Descripcion: 'Leche',
			PrecioCosto: 20,
			PrecioAnterior: 15,
			Existencia: 1
		};
		const conPendiente = aplicarPendientes([articulo], [{ Codigo: 'A1', PrecioCosto: 25 }]);

		expect(valorCeldaFiltro(articulo, 'PrecioAnterior', { A1: snapshotDesdeArticulo(articulo) })).toBe(15);
		expect(conPendiente[0].PrecioAnterior).toBe(15);
		expect(valorCeldaFiltro({ ...articulo, PrecioAnterior: null }, 'PrecioAnterior')).toBeNaN();
	});
});
