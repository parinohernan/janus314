import { describe, expect, it } from 'vitest';
import {
	POS_RUBROS,
	decodificarCodigoBalanza,
	esCodigoBalanza,
	etiquetaAtajoRubro,
	rubroPorAtajo
} from '../src/lib/constants/posVarios';
import {
	agregarOIncrementar,
	labelTicketFiscal,
	lineaDesdeBalanza,
	lineaDesdeRubro,
	mergeLineasParaPersistir,
	tipoTicketFiscal,
	totalTicket,
	ivaDeArticulo,
	precioListaSinIva
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

	it('agrega el producto nuevo arriba y sube el que se vuelve a escanear', () => {
		const otro: Articulo = { ...articulo, Codigo: '999', Descripcion: 'OTRO' };
		const conDos = agregarOIncrementar(agregarOIncrementar([], articulo), otro);
		expect(conDos.map((l) => l.ArticuloCodigo)).toEqual(['999', '388']);
		const reescaneado = agregarOIncrementar(conDos, articulo);
		expect(reescaneado.map((l) => l.ArticuloCodigo)).toEqual(['388', '999']);
		expect(reescaneado[0].Cantidad).toBe(2);
	});

	it('detecta prefijo de balanza 5000', () => {
		expect(esCodigoBalanza('5000123456789')).toBe(true);
		expect(esCodigoBalanza('7791234567890')).toBe(false);
	});

	it('lee carnicería, corte y kilos del código de balanza', () => {
		const leido = decodificarCodigoBalanza('5000010005052');
		expect(leido).toEqual({
			ok: true,
			datos: { prefijo: '5000', plu: '01', codigoBarras: '500001', kg: 0.505 }
		});
	});

	it('rechaza un verificador de balanza inválido', () => {
		expect(decodificarCodigoBalanza('5000010005053')).toEqual({
			ok: false,
			mensaje: 'El código de balanza no es válido'
		});
	});

	it('arma la línea con los kilos y el precio por kilo con IVA', () => {
		const picada: Articulo = {
			Codigo: 'CAR01',
			Descripcion: 'PICADA',
			CodigoBarras: '500001',
			PrecioCosto: 0,
			Lista1: 599.98,
			PorcentajeIVA1: 10.5,
			Existencia: 0,
			Activo: 1
		};
		const linea = lineaDesdeBalanza(picada, 0.505);
		expect(linea?.Cantidad).toBe(0.505);
		expect(linea?.PrecioUnitarioConIva).toBe(599.98);
		expect(linea?.Total).toBe(302.99);
		expect(linea?.esBalanza).toBe(true);
	});

	it('toma el precio con IVA del costo cuando la lista está en cero', () => {
		const articulo: Articulo = {
			Codigo: 'VER02',
			Descripcion: 'TOMATE',
			CodigoBarras: '600002',
			PrecioCosto: 543,
			Lista1: 0,
			PorcentajeIVA1: 10.5,
			Existencia: 0,
			Activo: 1
		};
		const linea = lineaDesdeBalanza(articulo, 1.2);
		expect(linea?.PrecioUnitarioConIva).toBe(600.02);
		expect(linea?.Total).toBe(720.02);
	});

	it('arma una línea de rubro con IVA y descripción libre', () => {
		const verdura = POS_RUBROS.find((r) => r.id === 'verduleria')!;
		const linea = lineaDesdeRubro(verdura, 'Tomate x kg', 110.5);
		expect(linea.ArticuloCodigo).toBe('VAR-VER');
		expect(linea.DescripcionLibre).toBe('Tomate x kg');
		expect(linea.PorcentajeIva).toBe(10.5);
		expect(linea.PrecioUnitarioConIva).toBe(110.5);
	});

	it('conserva el precio con IVA que cargó el cajero en Varios', () => {
		const almacen = POS_RUBROS.find((r) => r.id === 'almacen')!;
		const panaderia = POS_RUBROS.find((r) => r.id === 'panaderia')!;
		const cuatro = lineaDesdeRubro(almacen, 'VARIOS ALMACEN', 4);
		const cinco = lineaDesdeRubro(panaderia, 'VARIOS PANADERIA', 5);
		expect(cuatro.PorcentajeIva).toBe(21);
		expect(cuatro.PrecioUnitarioConIva).toBe(4);
		expect(cuatro.Total).toBe(4);
		expect(cinco.PorcentajeIva).toBe(10.5);
		expect(cinco.PrecioUnitarioConIva).toBe(5);
		expect(cinco.Total).toBe(5);
	});

	it('elige FCA para RI y FCB para consumidor final', () => {
		expect(tipoTicketFiscal('I')).toBe('FCA');
		expect(tipoTicketFiscal('F')).toBe('FCB');
		expect(labelTicketFiscal('F')).toBe('Ticket B');
		expect(labelTicketFiscal('I')).toBe('Factura A');
	});

	it('mantiene separados los Varios del mismo rubro, cada uno con su descripción y precio', () => {
		const almacen = POS_RUBROS.find((r) => r.id === 'almacen')!;
		const a = lineaDesdeRubro(almacen, 'Manzanas', 200);
		const b = lineaDesdeRubro(almacen, 'Fruta', 400);
		const items = mergeLineasParaPersistir([a, b]);
		expect(items).toHaveLength(2);
		expect(items.map((i) => i.ArticuloCodigo)).toEqual(['VAR-ALM', 'VAR-ALM']);
		expect(items.map((i) => i.DescripcionLibre)).toEqual(['Manzanas', 'Fruta']);
		expect(items.map((i) => i.Total)).toEqual([200, 400]);
		expect(totalTicket(items)).toBeCloseTo(600, 2);
	});

	it('conserva IVA 0% al armar una línea', () => {
		const exento: Articulo = { ...articulo, PorcentajeIVA1: 0 };
		expect(ivaDeArticulo(exento)).toBe(0);
		const linea = agregarOIncrementar([], exento)[0];
		expect(linea.PorcentajeIva).toBe(0);
		expect(linea.PrecioUnitarioConIva).toBeCloseTo(linea.PrecioUnitario, 2);
	});

	it('trata ListaN negativa chica como porcentaje sobre costo', () => {
		expect(precioListaSinIva({ ...articulo, Lista2: -1.51 }, '2')).toBe(98.49);
	});

	it('si el porcentaje deja el precio en 0 o menos, usa Lista1', () => {
		expect(precioListaSinIva({ ...articulo, Lista2: -200 }, '2')).toBe(200);
	});
});

describe('atajos de rubros', () => {
	const tecla = (code: string, mods: Partial<KeyboardEvent> = {}) => ({
		code,
		shiftKey: true,
		ctrlKey: false,
		altKey: false,
		metaKey: false,
		...mods
	});

	it('Shift + número abre el rubro en esa posición, también desde el teclado numérico', () => {
		expect(rubroPorAtajo(tecla('Digit1'))?.id).toBe('almacen');
		expect(rubroPorAtajo(tecla('Digit5'))?.id).toBe('carniceria');
		expect(rubroPorAtajo(tecla('Numpad4'))?.id).toBe('verduleria');
		expect(etiquetaAtajoRubro(POS_RUBROS[5])).toBe('⇧6');
	});

	it('ignora números solos, otros modificadores y posiciones sin rubro', () => {
		expect(rubroPorAtajo(tecla('Digit1', { shiftKey: false }))).toBeUndefined();
		expect(rubroPorAtajo(tecla('Digit1', { ctrlKey: true }))).toBeUndefined();
		expect(rubroPorAtajo(tecla('Digit0'))).toBeUndefined();
		expect(rubroPorAtajo(tecla('Digit9'))).toBeUndefined();
		expect(rubroPorAtajo(tecla('KeyA'))).toBeUndefined();
	});
});
