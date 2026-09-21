import { describe, expect, it } from 'vitest';
import type { Articulo } from '../src/lib/types/articulo';
import {
	filtrarPosCatalogo,
	incorporarPosCatalogo,
	indexarPosCatalogo,
	resolverPosCatalogo
} from '../src/lib/utils/posCatalogo';

function articulo(parcial: Partial<Articulo> & Pick<Articulo, 'Codigo' | 'Descripcion'>): Articulo {
	return {
		PrecioCosto: 10,
		Existencia: 1,
		Activo: 1,
		PorcentajeIVA1: 21,
		Lista1: 20,
		...parcial
	};
}

describe('catálogo POS', () => {
	const leche = articulo({
		Codigo: '100',
		CodigoBarras: '7790001',
		Descripcion: 'Leche entera'
	});
	const pan = articulo({
		Codigo: 'VAR-PAN',
		Descripcion: 'VARIOS PANADERIA',
		PorcentajeIVA1: 10.5
	});

	it('resuelve por código de barras y por código interno', () => {
		const catalogo = indexarPosCatalogo([leche, pan]);
		expect(resolverPosCatalogo(catalogo, '7790001')?.Codigo).toBe('100');
		expect(resolverPosCatalogo(catalogo, '100')?.Descripcion).toBe('Leche entera');
		expect(resolverPosCatalogo(catalogo, 'no-esta')).toBeNull();
	});

	it('filtra por descripción sin incluir los Varios', () => {
		const catalogo = indexarPosCatalogo([leche, pan]);
		expect(filtrarPosCatalogo(catalogo.items, 'lec').map((item) => item.Codigo)).toEqual(['100']);
		expect(filtrarPosCatalogo(catalogo.items, 'pan')).toEqual([]);
	});

	it('incorpora un artículo que no estaba en la carga inicial', () => {
		const catalogo = incorporarPosCatalogo(indexarPosCatalogo([leche]), pan);
		expect(resolverPosCatalogo(catalogo, 'VAR-PAN')?.Descripcion).toBe('VARIOS PANADERIA');
	});
});
