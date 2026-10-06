import { describe, expect, it } from 'vitest';
import {
	listasDesactualizadasPorCosto,
	porcentajesParaMantenerPrecios,
	etiquetaLista,
	parseModoIngresoLista,
	porcentajeDesdePrecio,
	preciosDesdePorcentaje,
	valorVisibleLista
} from '../src/lib/utils/modoListaPrecios';

describe('parseModoIngresoLista', () => {
	it('reconoce los tres modos sin importar mayúsculas ni espacios', () => {
		expect(parseModoIngresoLista('PrecioConIva')).toBe('PrecioConIva');
		expect(parseModoIngresoLista(' preciosiniva ')).toBe('PrecioSinIva');
		expect(parseModoIngresoLista('PorcentajeDeGanancia')).toBe('PorcentajeDeGanancia');
	});

	it('usa porcentaje de ganancia si falta o es desconocido', () => {
		expect(parseModoIngresoLista(undefined)).toBe('PorcentajeDeGanancia');
		expect(parseModoIngresoLista('')).toBe('PorcentajeDeGanancia');
		expect(parseModoIngresoLista('Otro')).toBe('PorcentajeDeGanancia');
	});
});

describe('conversiones entre porcentaje y precio', () => {
	it('calcula precios sin y con IVA desde el porcentaje', () => {
		expect(preciosDesdePorcentaje(100, 21, 30)).toEqual({ sinIva: 130, conIva: 157.3 });
		expect(preciosDesdePorcentaje(0, 21, 30)).toEqual({ sinIva: 0, conIva: 0 });
	});

	it('deriva el porcentaje desde el precio según el modo', () => {
		expect(porcentajeDesdePrecio(100, 21, 130, 'PrecioSinIva')).toBe(30);
		expect(porcentajeDesdePrecio(100, 21, 157.3, 'PrecioConIva')).toBe(30);
		expect(porcentajeDesdePrecio(100, 21, 45, 'PorcentajeDeGanancia')).toBe(45);
	});

	it('con IVA 0 el precio con IVA equivale al sin IVA', () => {
		expect(porcentajeDesdePrecio(50, 0, 75, 'PrecioConIva')).toBe(50);
	});

	it('sin costo no puede derivar el porcentaje', () => {
		expect(porcentajeDesdePrecio(0, 21, 100, 'PrecioConIva')).toBeNull();
		expect(porcentajeDesdePrecio(0, 21, 100, 'PrecioSinIva')).toBeNull();
		expect(porcentajeDesdePrecio(0, 21, 30, 'PorcentajeDeGanancia')).toBe(30);
	});

	it('precios redondos se reconstruyen exactos (porcentaje con 6 decimales)', () => {
		for (const precio of [1000, 2000, 3000, 4000, 5000]) {
			const pct = porcentajeDesdePrecio(3400, 10.5, precio, 'PrecioConIva');
			expect(valorVisibleLista(3400, 10.5, pct, 'PrecioConIva')).toBe(precio);
		}
		for (const precio of [905.1, 1234.56]) {
			const pct = porcentajeDesdePrecio(3400, 10.5, precio, 'PrecioSinIva');
			expect(valorVisibleLista(3400, 10.5, pct, 'PrecioSinIva')).toBe(precio);
		}
	});

	it('ida y vuelta mantiene el precio', () => {
		const pct = porcentajeDesdePrecio(80, 10.5, 132.6, 'PrecioConIva');
		expect(valorVisibleLista(80, 10.5, pct, 'PrecioConIva')).toBe(132.6);
	});

	it('muestra el valor según el modo', () => {
		expect(valorVisibleLista(100, 21, 30, 'PorcentajeDeGanancia')).toBe(30);
		expect(valorVisibleLista(100, 21, 30, 'PrecioSinIva')).toBe(130);
		expect(valorVisibleLista(100, 21, 30, 'PrecioConIva')).toBe(157.3);
	});

	it('etiqueta la columna según el modo', () => {
		expect(etiquetaLista(1, 'PorcentajeDeGanancia')).toBe('Lista 1 (%)');
		expect(etiquetaLista(2, 'PrecioSinIva')).toBe('Lista 2 s/IVA');
		expect(etiquetaLista(3, 'PrecioConIva')).toBe('Lista 3 c/IVA');
	});
});

describe('aviso de cambio de costo sin actualizar listas', () => {
	const pct1000 = porcentajeDesdePrecio(3400, 10.5, 1000, 'PrecioConIva')!;
	const pct2000 = porcentajeDesdePrecio(3400, 10.5, 2000, 'PrecioConIva')!;
	const original = { PrecioCosto: 3400, PorcentajeIVA1: 10.5, Lista1: pct1000, Lista2: pct2000 };

	it('avisa cuando cambia el costo y las listas conservan el porcentaje', () => {
		const actual = { ...original, PrecioCosto: 3740 };
		const avisos = listasDesactualizadasPorCosto(original, actual, 'PrecioConIva');
		expect(avisos.map((a) => [a.numero, a.anterior, a.nuevo])).toEqual([
			[1, 1000, 1100],
			[2, 2000, 2200]
		]);
	});

	it('no avisa las listas que el usuario actualizó', () => {
		const actual = {
			...original,
			PrecioCosto: 3740,
			Lista1: porcentajeDesdePrecio(3740, 10.5, 1050, 'PrecioConIva')!
		};
		const avisos = listasDesactualizadasPorCosto(original, actual, 'PrecioConIva');
		expect(avisos.map((a) => a.numero)).toEqual([2]);
	});

	it('no avisa en modo porcentaje, sin cambio de costo ni sin costo anterior', () => {
		const actual = { ...original, PrecioCosto: 3740 };
		expect(listasDesactualizadasPorCosto(original, actual, 'PorcentajeDeGanancia')).toEqual([]);
		expect(listasDesactualizadasPorCosto(original, original, 'PrecioConIva')).toEqual([]);
		expect(listasDesactualizadasPorCosto({ ...original, PrecioCosto: 0 }, actual, 'PrecioConIva')).toEqual([]);
		expect(listasDesactualizadasPorCosto(null, actual, 'PrecioConIva')).toEqual([]);
	});

	it('avisa cuando cambia el IVA y la lista se ingresa con IVA', () => {
		const actual = { ...original, PorcentajeIVA1: 21 };
		const avisos = listasDesactualizadasPorCosto(original, actual, 'PrecioConIva');
		expect(avisos.map((a) => [a.numero, a.anterior, a.nuevo])).toEqual([
			[1, 1000, 1095.02],
			[2, 2000, 2190.05]
		]);
		expect(listasDesactualizadasPorCosto(original, actual, 'PrecioSinIva')).toEqual([]);
		const corregido = { ...actual, ...porcentajesParaMantenerPrecios(actual, avisos, 'PrecioConIva') };
		expect(valorVisibleLista(3400, 21, corregido.Lista1, 'PrecioConIva')).toBe(1000);
	});

	it('mantener precios recalcula el porcentaje con el costo nuevo', () => {
		const actual = { ...original, PrecioCosto: 3740 };
		const avisos = listasDesactualizadasPorCosto(original, actual, 'PrecioSinIva');
		const porcentajes = porcentajesParaMantenerPrecios(actual, avisos, 'PrecioSinIva');
		const corregido = { ...actual, ...porcentajes };
		expect(listasDesactualizadasPorCosto(original, corregido, 'PrecioSinIva')).toEqual([]);
		expect(valorVisibleLista(3740, 10.5, corregido.Lista1, 'PrecioSinIva')).toBe(
			valorVisibleLista(3400, 10.5, pct1000, 'PrecioSinIva')
		);
	});
});
