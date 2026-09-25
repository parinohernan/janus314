export const COLUMNAS_STORAGE_KEY = 'precios-stock-columnas';
export const CACHE_INFORME_ID = 'actualizacion-precios-stock';

export type ColumnaId =
	| 'Codigo'
	| 'Descripcion'
	| 'Rubro'
	| 'Proveedor'
	| 'PrecioCosto'
	| 'PrecioCostoMasImp'
	| 'Lista1'
	| 'Lista2'
	| 'Lista3'
	| 'Lista4'
	| 'Lista5'
	| 'PrecioAnterior'
	| 'Fecha'
	| 'Existencia';

export type CampoEditable =
	| 'PrecioCosto'
	| 'PrecioCostoMasImp'
	| 'Lista1'
	| 'Lista2'
	| 'Lista3'
	| 'Lista4'
	| 'Lista5'
	| 'Existencia';

export interface ColumnaGrilla {
	id: ColumnaId;
	label: string;
	editable: boolean;
}

export const COLUMNAS: ColumnaGrilla[] = [
	{ id: 'Codigo', label: 'Código', editable: false },
	{ id: 'Descripcion', label: 'Descripción', editable: false },
	{ id: 'Rubro', label: 'Rubro', editable: false },
	{ id: 'Proveedor', label: 'Proveedor', editable: false },
	{ id: 'PrecioCosto', label: 'Precio costo', editable: true },
	{ id: 'PrecioCostoMasImp', label: 'Costo + IVA', editable: true },
	{ id: 'Lista1', label: 'Lista 1', editable: true },
	{ id: 'Lista2', label: 'Lista 2', editable: true },
	{ id: 'Lista3', label: 'Lista 3', editable: true },
	{ id: 'Lista4', label: 'Lista 4', editable: true },
	{ id: 'Lista5', label: 'Lista 5', editable: true },
	{ id: 'PrecioAnterior', label: 'Precio anterior', editable: false },
	{ id: 'Fecha', label: 'Fecha', editable: false },
	{ id: 'Existencia', label: 'Existencia', editable: true }
];

export const CAMPOS_EDITABLES: CampoEditable[] = [
	'PrecioCosto',
	'PrecioCostoMasImp',
	'Lista1',
	'Lista2',
	'Lista3',
	'Lista4',
	'Lista5',
	'Existencia'
];

export const CAMPOS_PRECIO: CampoEditable[] = CAMPOS_EDITABLES.filter((c) => c !== 'Existencia');

export interface SnapshotFila {
	PrecioCosto: number;
	PrecioCostoMasImp: number;
	Lista1: number;
	Lista2: number;
	Lista3: number;
	Lista4: number;
	Lista5: number;
	Existencia: number;
}

export interface CambioCampo {
	campo: CampoEditable;
	label: string;
	anterior: number;
	nuevo: number;
}

export interface CambioFila {
	codigo: string;
	descripcion: string;
	cambios: CambioCampo[];
	cambiaPrecio: boolean;
	cambiaExistencia: boolean;
}

function esColumnaId(valor: string): valor is ColumnaId {
	return COLUMNAS.some((columna) => columna.id === valor);
}

export function columnasPorDefecto(): ColumnaId[] {
	return COLUMNAS.map((columna) => columna.id);
}

export function parseColumnasVisibles(raw: string | null): ColumnaId[] {
	if (!raw) return columnasPorDefecto();
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return columnasPorDefecto();
		const ids = parsed.filter((id): id is ColumnaId => typeof id === 'string' && esColumnaId(id));
		return ids.length > 0 ? ids : columnasPorDefecto();
	} catch {
		return columnasPorDefecto();
	}
}

export function leerColumnasVisibles(storage: Pick<Storage, 'getItem'>): ColumnaId[] {
	return parseColumnasVisibles(storage.getItem(COLUMNAS_STORAGE_KEY));
}

export function guardarColumnasVisibles(
	ids: ColumnaId[],
	storage: Pick<Storage, 'setItem'>
): void {
	const validos = ids.filter(esColumnaId);
	storage.setItem(COLUMNAS_STORAGE_KEY, JSON.stringify(validos.length > 0 ? validos : columnasPorDefecto()));
}

export function redondear2(valor: unknown): number {
	const n = Number(valor);
	if (!Number.isFinite(n)) return 0;
	return Number(n.toFixed(2));
}

export function snapshotDesdeArticulo(articulo: {
	PrecioCosto?: number | null;
	PrecioCostoMasImp?: number | null;
	Lista1?: number | null;
	Lista2?: number | null;
	Lista3?: number | null;
	Lista4?: number | null;
	Lista5?: number | null;
	Existencia?: number | null;
	PorcentajeIVA1?: number | null;
}): SnapshotFila {
	const costo = redondear2(articulo.PrecioCosto);
	const iva = Number(articulo.PorcentajeIVA1) || 0;
	const costoMasImp =
		articulo.PrecioCostoMasImp === undefined || articulo.PrecioCostoMasImp === null
			? redondear2(costo * (1 + iva / 100))
			: redondear2(articulo.PrecioCostoMasImp);
	return {
		PrecioCosto: costo,
		PrecioCostoMasImp: costoMasImp,
		Lista1: redondear2(articulo.Lista1),
		Lista2: redondear2(articulo.Lista2),
		Lista3: redondear2(articulo.Lista3),
		Lista4: redondear2(articulo.Lista4),
		Lista5: redondear2(articulo.Lista5),
		Existencia: redondear2(articulo.Existencia)
	};
}

export function snapshotsDesdeCatalogo<T extends { Codigo: string }>(
	articulos: T[]
): Record<string, SnapshotFila> {
	const snapshots: Record<string, SnapshotFila> = {};
	for (const articulo of articulos) {
		snapshots[articulo.Codigo] = snapshotDesdeArticulo(articulo);
	}
	return snapshots;
}

export function cambiosDeFila(
	actual: SnapshotFila,
	snapshot: SnapshotFila | undefined
): CambioCampo[] {
	if (!snapshot) return [];
	const cambios: CambioCampo[] = [];
	for (const campo of CAMPOS_EDITABLES) {
		const anterior = redondear2(snapshot[campo]);
		const nuevo = redondear2(actual[campo]);
		if (anterior !== nuevo) {
			const columna = COLUMNAS.find((c) => c.id === campo);
			cambios.push({
				campo,
				label: columna?.label ?? campo,
				anterior,
				nuevo
			});
		}
	}
	return cambios;
}

export function filaEstaSucia(actual: SnapshotFila, snapshot: SnapshotFila | undefined): boolean {
	return cambiosDeFila(actual, snapshot).length > 0;
}

export function resumenCambios<T extends { Codigo: string; Descripcion: string }>(
	articulos: T[],
	snapshots: Record<string, SnapshotFila>
): { filas: CambioFila[]; precios: number; existencias: number } {
	const filas: CambioFila[] = [];
	for (const articulo of articulos) {
		const actual = snapshotDesdeArticulo(articulo);
		const cambios = cambiosDeFila(actual, snapshots[articulo.Codigo]);
		if (cambios.length === 0) continue;
		const cambiaPrecio = cambios.some((c) => c.campo !== 'Existencia');
		const cambiaExistencia = cambios.some((c) => c.campo === 'Existencia');
		filas.push({
			codigo: articulo.Codigo,
			descripcion: articulo.Descripcion,
			cambios,
			cambiaPrecio,
			cambiaExistencia
		});
	}
	return {
		filas,
		precios: filas.filter((f) => f.cambiaPrecio).length,
		existencias: filas.filter((f) => f.cambiaExistencia).length
	};
}

export function payloadDesdeCambios(filas: CambioFila[]) {
	return filas.map((fila) => {
		const item: Record<string, string | number> = { Codigo: fila.codigo };
		for (const cambio of fila.cambios) {
			item[cambio.campo] = cambio.nuevo;
		}
		return item;
	});
}

export function formatearFechaCosto(valor: string | Date | null | undefined): string {
	if (!valor) return '—';
	const fecha = valor instanceof Date ? valor : new Date(valor);
	if (Number.isNaN(fecha.getTime())) return '—';
	const dia = String(fecha.getDate()).padStart(2, '0');
	const mes = String(fecha.getMonth() + 1).padStart(2, '0');
	return `${dia}/${mes}/${fecha.getFullYear()}`;
}

export function coincideBusqueda(
	articulo: { Codigo?: string; Descripcion?: string },
	termino: string
): boolean {
	const q = termino.trim().toLowerCase();
	if (!q) return true;
	return (
		String(articulo.Codigo ?? '')
			.toLowerCase()
			.includes(q) ||
		String(articulo.Descripcion ?? '')
			.toLowerCase()
			.includes(q)
	);
}

export type TipoFiltroColumna = 'texto' | 'numero';
export type DireccionOrden = 'asc' | 'desc';
export type OrdenGrilla = { columna: ColumnaId; direccion: DireccionOrden };
export type FiltrosColumnas = Partial<Record<ColumnaId, string>>;

export interface ArticuloGrilla {
	Codigo: string;
	Descripcion: string;
	PrecioCosto?: number | null;
	PrecioCostoMasImp?: number | null;
	Lista1?: number | null;
	Lista2?: number | null;
	Lista3?: number | null;
	Lista4?: number | null;
	Lista5?: number | null;
	Existencia?: number | null;
	ProveedorCodigo?: string | null;
	RubroCodigo?: string | null;
	FechaActualizacionCosto?: string | Date | null;
	Proveedor?: { Codigo?: string; Descripcion?: string };
	Rubro?: { Codigo?: string; Descripcion?: string };
}

const COLUMNAS_NUMERO: ColumnaId[] = [
	'PrecioCosto',
	'PrecioCostoMasImp',
	'Lista1',
	'Lista2',
	'Lista3',
	'Lista4',
	'Lista5',
	'PrecioAnterior',
	'Existencia'
];

export function tipoFiltroColumna(id: ColumnaId): TipoFiltroColumna {
	return COLUMNAS_NUMERO.includes(id) ? 'numero' : 'texto';
}

export function siguienteOrden(
	actual: OrdenGrilla | null,
	columna: ColumnaId
): OrdenGrilla | null {
	if (actual?.columna !== columna) return { columna, direccion: 'asc' };
	if (actual.direccion === 'asc') return { columna, direccion: 'desc' };
	return null;
}

export function valorCeldaFiltro(
	articulo: ArticuloGrilla,
	columna: ColumnaId,
	snapshots: Record<string, SnapshotFila> = {}
): string | number {
	switch (columna) {
		case 'Codigo':
			return articulo.Codigo ?? '';
		case 'Descripcion':
			return articulo.Descripcion ?? '';
		case 'Rubro':
			return articulo.Rubro?.Descripcion || articulo.RubroCodigo || '';
		case 'Proveedor':
			return articulo.Proveedor?.Descripcion || articulo.ProveedorCodigo || '';
		case 'PrecioAnterior':
			return snapshots[articulo.Codigo]?.PrecioCosto ?? 0;
		case 'Fecha':
			return formatearFechaCosto(articulo.FechaActualizacionCosto);
		default:
			return redondear2((articulo as Record<string, unknown>)[columna]);
	}
}

export function coincideFiltroNumero(valor: number, filtro: string): boolean {
	const texto = filtro.trim().replace(',', '.');
	if (!texto) return true;
	const match = texto.match(/^(>=|<=|!=|<>|>|<|=)?\s*(-?\d+(?:\.\d+)?)$/);
	if (!match) return String(valor).includes(texto);
	const op = match[1] || '=';
	const n = Number(match[2]);
	if (!Number.isFinite(n)) return true;
	switch (op) {
		case '>':
			return valor > n;
		case '>=':
			return valor >= n;
		case '<':
			return valor < n;
		case '<=':
			return valor <= n;
		case '!=':
		case '<>':
			return valor !== n;
		default:
			return valor === n;
	}
}

export function coincideFiltroTexto(valor: string, filtro: string): boolean {
	const q = filtro.trim().toLowerCase();
	if (!q) return true;
	return String(valor).toLowerCase().includes(q);
}

export function coincideFiltroColumna(
	articulo: ArticuloGrilla,
	columna: ColumnaId,
	filtro: string,
	snapshots: Record<string, SnapshotFila> = {}
): boolean {
	if (!filtro.trim()) return true;
	const valor = valorCeldaFiltro(articulo, columna, snapshots);
	if (tipoFiltroColumna(columna) === 'numero') {
		return coincideFiltroNumero(Number(valor), filtro);
	}
	return coincideFiltroTexto(String(valor), filtro);
}

export function hayFiltrosActivos(filtros: FiltrosColumnas = {}, orden: OrdenGrilla | null = null): boolean {
	return Boolean(orden) || Object.values(filtros).some((valor) => String(valor ?? '').trim() !== '');
}

export function aplicarFiltrosYOrden<T extends ArticuloGrilla>(
	articulos: T[],
	opciones: {
		busqueda?: string;
		proveedores?: string[];
		rubros?: string[];
		filtros?: FiltrosColumnas;
		orden?: OrdenGrilla | null;
		snapshots?: Record<string, SnapshotFila>;
	} = {}
): T[] {
	const {
		busqueda = '',
		proveedores = [],
		rubros = [],
		filtros = {},
		orden = null,
		snapshots = {}
	} = opciones;

	const filtrados = articulos.filter((articulo) => {
		if (!coincideBusqueda(articulo, busqueda)) return false;
		if (proveedores.length > 0 && !proveedores.includes(articulo.ProveedorCodigo || '')) {
			return false;
		}
		if (rubros.length > 0 && !rubros.includes(articulo.RubroCodigo || '')) {
			return false;
		}
		for (const [columna, filtro] of Object.entries(filtros) as [ColumnaId, string][]) {
			if (!coincideFiltroColumna(articulo, columna, filtro ?? '', snapshots)) return false;
		}
		return true;
	});

	if (!orden) return filtrados;

	return [...filtrados].sort((a, b) => {
		const va = valorCeldaOrden(a, orden.columna, snapshots);
		const vb = valorCeldaOrden(b, orden.columna, snapshots);
		const cmp =
			typeof va === 'number' && typeof vb === 'number'
				? va - vb
				: String(va).localeCompare(String(vb), 'es', { numeric: true, sensitivity: 'base' });
		return orden.direccion === 'asc' ? cmp : -cmp;
	});
}

export function valorCeldaOrden(
	articulo: ArticuloGrilla,
	columna: ColumnaId,
	snapshots: Record<string, SnapshotFila> = {}
): string | number {
	if (columna === 'Fecha') {
		const valor = articulo.FechaActualizacionCosto;
		if (!valor) return 0;
		const tiempo = new Date(valor).getTime();
		return Number.isNaN(tiempo) ? 0 : tiempo;
	}
	return valorCeldaFiltro(articulo, columna, snapshots);
}
