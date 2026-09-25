import { describe, expect, it } from 'vitest';
import {
	COLUMNAS_STORAGE_KEY,
	filaEstaSucia,
	guardarColumnasVisibles,
	leerColumnasVisibles,
	parseColumnasVisibles,
	payloadDesdeCambios,
	resumenCambios,
	snapshotDesdeArticulo,
	aplicarFiltrosYOrden,
	coincideFiltroNumero,
	siguienteOrden,
	type SnapshotFila
} from '../src/lib/utils/preciosStockGrilla';

function storageFake(inicial: Record<string, string> = {}) {
	const data = { ...inicial };
	return {
		getItem: (key: string) => data[key] ?? null,
		setItem: (key: string, value: string) => {
			data[key] = value;
		},
		data
	};
}

const snapshot: SnapshotFila = {
	PrecioCosto: 10,
	PrecioCostoMasImp: 12.1,
	Lista1: 20,
	Lista2: 30,
	Lista3: 0,
	Lista4: 0,
	Lista5: 0,
	Existencia: 8
};

describe('columnas visibles', () => {
	it('usa todas las columnas si no hay preferencia guardada', () => {
		expect(parseColumnasVisibles(null)).toContain('Existencia');
		expect(leerColumnasVisibles(storageFake())).toEqual(parseColumnasVisibles(null));
	});

	it('persiste y recupera las columnas visibles', () => {
		const storage = storageFake();
		guardarColumnasVisibles(['Codigo', 'Descripcion', 'Existencia'], storage);
		expect(storage.data[COLUMNAS_STORAGE_KEY]).toContain('Existencia');
		expect(leerColumnasVisibles(storage)).toEqual(['Codigo', 'Descripcion', 'Existencia']);
	});

	it('ignora ids inválidos y no deja la lista vacía', () => {
		expect(parseColumnasVisibles('["Nope"]')).toEqual(parseColumnasVisibles(null));
		const storage = storageFake();
		guardarColumnasVisibles([], storage);
		expect(leerColumnasVisibles(storage).length).toBeGreaterThan(0);
	});
});

describe('dirty vs snapshot', () => {
	it('no marca sucia una fila igual al snapshot', () => {
		expect(filaEstaSucia(snapshot, snapshot)).toBe(false);
	});

	it('detecta cambios de precio y existencia', () => {
		const actual = { ...snapshot, PrecioCosto: 15, Existencia: 3 };
		expect(filaEstaSucia(actual, snapshot)).toBe(true);
		const resumen = resumenCambios(
			[{ Codigo: 'A1', Descripcion: 'Aceite', ...actual }],
			{ A1: snapshot }
		);
		expect(resumen.precios).toBe(1);
		expect(resumen.existencias).toBe(1);
		expect(payloadDesdeCambios(resumen.filas)).toEqual([
			{ Codigo: 'A1', PrecioCosto: 15, Existencia: 3 }
		]);
	});

	it('arma el snapshot con costo + IVA derivado si falta el campo', () => {
		const snap = snapshotDesdeArticulo({
			PrecioCosto: 10,
			PorcentajeIVA1: 21,
			Existencia: 1
		});
		expect(snap.PrecioCostoMasImp).toBe(12.1);
	});
});

const catalogo = [
	{
		Codigo: 'B2',
		Descripcion: 'Harina',
		PrecioCosto: 20,
		Existencia: 2,
		RubroCodigo: 'R1',
		ProveedorCodigo: 'P1',
		Rubro: { Descripcion: 'Almacén' },
		Proveedor: { Descripcion: 'Molino' }
	},
	{
		Codigo: 'A1',
		Descripcion: 'Aceite',
		PrecioCosto: 10,
		Existencia: 8,
		RubroCodigo: 'R1',
		ProveedorCodigo: 'P2',
		Rubro: { Descripcion: 'Almacén' },
		Proveedor: { Descripcion: 'Aceitera' }
	}
];

describe('filtros y ordenamiento de grilla', () => {
	it('filtra números con operadores y texto por contención', () => {
		expect(coincideFiltroNumero(8, '>5')).toBe(true);
		expect(coincideFiltroNumero(8, '<=3')).toBe(false);
		expect(coincideFiltroNumero(10, '10')).toBe(true);
		const filtrados = aplicarFiltrosYOrden(catalogo, {
			filtros: { Descripcion: 'ace', Existencia: '>=8' }
		});
		expect(filtrados.map((a) => a.Codigo)).toEqual(['A1']);
	});

	it('ordena por columna y cicla asc / desc / sin orden', () => {
		expect(siguienteOrden(null, 'Codigo')).toEqual({ columna: 'Codigo', direccion: 'asc' });
		expect(siguienteOrden({ columna: 'Codigo', direccion: 'asc' }, 'Codigo')).toEqual({
			columna: 'Codigo',
			direccion: 'desc'
		});
		expect(siguienteOrden({ columna: 'Codigo', direccion: 'desc' }, 'Codigo')).toBeNull();
		const asc = aplicarFiltrosYOrden(catalogo, { orden: { columna: 'PrecioCosto', direccion: 'asc' } });
		expect(asc.map((a) => a.Codigo)).toEqual(['A1', 'B2']);
		const desc = aplicarFiltrosYOrden(catalogo, { orden: { columna: 'Descripcion', direccion: 'desc' } });
		expect(desc.map((a) => a.Descripcion)).toEqual(['Harina', 'Aceite']);
	});
});
