import { describe, expect, it } from 'vitest';
import { POS_RUBROS, esCodigoBalanza } from '../src/lib/constants/posVarios';
import {
	agregarOIncrementar,
	labelTicketFiscal,
	lineaDesdeRubro,
	mergeLineasParaPersistir,
	tipoTicketFiscal,
	totalTicket
} from '../src/lib/utils/posTicket';
import type { Articulo } from '../src/lib/types/articulo';

const articulo: Articulo = {
	Codigo: '388',
	Descripcion: 'DES AER GLADE',
	PrecioCosto: 100,
	Lista1: 200,
	PorcentajeIVA1: 21,
	Existencia: 10,
	Activo: 1
};

describe('POS ticket', () => {
	it('suma cantidad si el mismo SKU ya está en el ticket', () => {
		const una = agregarOIncrementar([], articulo);
		const dos = agregarOIncrementar(una, articulo);
		expect(dos).toHaveLength(1);
		expect(dos[0].Cantidad).toBe(2);
	});

	it('detecta prefijo de balanza 5000', () => {
		expect(esCodigoBalanza('5000123456789')).toBe(true);
		expect(esCodigoBalanza('7791234567890')).toBe(false);
	});

	it('arma una línea de rubro con IVA y descripción libre', () => {
		const verdura = POS_RUBROS.find((r) => r.id === 'verduleria')!;
		const linea = lineaDesdeRubro(verdura, 'Tomate x kg', 110.5);
		expect(linea.ArticuloCodigo).toBe('VAR-VER');
		expect(linea.DescripcionLibre).toBe('Tomate x kg');
		expect(linea.PorcentajeIva).toBe(10.5);
		expect(linea.PrecioUnitarioConIva).toBeCloseTo(110.5, 1);
	});

	it('elige FCA para RI y FCB para consumidor final', () => {
		expect(tipoTicketFiscal('I')).toBe('FCA');
		expect(tipoTicketFiscal('F')).toBe('FCB');
		expect(labelTicketFiscal('F')).toBe('Ticket B');
		expect(labelTicketFiscal('I')).toBe('Factura A');
	});

	it('fusiona dos renglones Varios del mismo código al persistir', () => {
		const almacen = POS_RUBROS.find((r) => r.id === 'almacen')!;
		const a = lineaDesdeRubro(almacen, 'Tomate', 100);
		const b = lineaDesdeRubro(almacen, 'Papa', 50);
		const merged = mergeLineasParaPersistir([a, b]);
		expect(merged).toHaveLength(1);
		expect(merged[0].Descripcion).toContain('Tomate');
		expect(merged[0].Descripcion).toContain('Papa');
		expect(totalTicket(merged)).toBeCloseTo(150, 1);
	});
});
