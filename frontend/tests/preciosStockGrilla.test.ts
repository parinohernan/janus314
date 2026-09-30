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
	etiquetaColumna,
	siguienteOrden,
	COLUMNAS,
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

describe('modo de ingreso de listas (ART)', () => {
	const articulo = {
		Codigo: 'A1',
		Descripcion: 'Aceite',
		PorcentajeIVA1: 21,
		...snapshot
	};

	it('etiqueta las columnas de lista según el modo', () => {
		const lista1 = COLUMNAS.find((c) => c.id === 'Lista1')!;
		const costo = COLUMNAS.find((c) => c.id === 'PrecioCosto')!;
		expect(etiquetaColumna(lista1, 'PorcentajeDeGanancia')).toBe('Lista 1 (%)');
		expect(etiquetaColumna(lista1, 'PrecioSinIva')).toBe('Lista 1 s/IVA');
		expect(etiquetaColumna(lista1, 'PrecioConIva')).toBe('Lista 1 c/IVA');
		expect(etiquetaColumna(costo, 'PrecioConIva')).toBe('Precio costo');
	});

	it('el payload sigue enviando porcentajes y el resumen muestra la unidad del modo', () => {
		const actual = { ...articulo, Lista1: 50 };
		for (const modo of ['PorcentajeDeGanancia', 'PrecioSinIva', 'PrecioConIva'] as const) {
			const resumen = resumenCambios([actual], { A1: snapshot }, modo);
			expect(payloadDesdeCambios(resumen.filas)).toEqual([{ Codigo: 'A1', Lista1: 50 }]);
			const [cambio] = resumen.filas[0].cambios;
			const esperado = {
				PorcentajeDeGanancia: [20, 50],
				PrecioSinIva: [12, 15],
				PrecioConIva: [14.52, 18.15]
			}[modo];
			expect([cambio.anteriorVisible, cambio.nuevoVisible]).toEqual(esperado);
		}
	});

	it('marca filas con costo cambiado y listas sin actualizar (también si solo cambió Costo + IVA)', () => {
		const porCosto = resumenCambios([{ ...articulo, PrecioCosto: 20 }], { A1: snapshot }, 'PrecioConIva');
		expect(porCosto.filas[0].listasDesactualizadas.map((l) => l.numero)).toEqual([1, 2]);

		const porMasImp = resumenCambios(
			[{ ...articulo, PrecioCostoMasImp: 24.2 }],
			{ A1: snapshot },
			'PrecioSinIva'
		);
		expect(porMasImp.filas[0].listasDesactualizadas[0]).toMatchObject({ numero: 1, anterior: 12, nuevo: 24 });

		const enPorcentaje = resumenCambios([{ ...articulo, PrecioCosto: 20 }], { A1: snapshot });
		expect(enPorcentaje.filas[0].listasDesactualizadas).toEqual([]);
	});

	it('filtra y ordena las listas por el valor visible', () => {
		const items = [
			{ ...articulo, Codigo: 'A1', PrecioCosto: 10, Lista1: 50 },
			{ ...articulo, Codigo: 'B2', PrecioCosto: 100, Lista1: 10 }
		];
		const porPct = aplicarFiltrosYOrden(items, {
			orden: { columna: 'Lista1', direccion: 'asc' },
			modo: 'PorcentajeDeGanancia'
		});
		expect(porPct.map((a) => a.Codigo)).toEqual(['B2', 'A1']);
		const porPrecio = aplicarFiltrosYOrden(items, {
			orden: { columna: 'Lista1', direccion: 'asc' },
			modo: 'PrecioSinIva'
		});
		expect(porPrecio.map((a) => a.Codigo)).toEqual(['A1', 'B2']);
		const filtrados = aplicarFiltrosYOrden(items, {
			filtros: { Lista1: '>100' },
			modo: 'PrecioSinIva'
		});
		expect(filtrados.map((a) => a.Codigo)).toEqual(['B2']);
	});
});

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
