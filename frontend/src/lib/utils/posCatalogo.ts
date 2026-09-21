import { esArticuloPosVarios } from '$lib/constants/posVarios';
import type { Articulo } from '$lib/types/articulo';

export type PosCatalogo = {
	items: Articulo[];
	porCodigo: Map<string, Articulo>;
	porBarras: Map<string, Articulo>;
};

export function catalogoVacio(): PosCatalogo {
	return { items: [], porCodigo: new Map(), porBarras: new Map() };
}

function clave(valor: unknown): string {
	return String(valor ?? '').trim().toUpperCase();
}

export function indexarPosCatalogo(articulos: Articulo[]): PosCatalogo {
	const porCodigo = new Map<string, Articulo>();
	const porBarras = new Map<string, Articulo>();
	const items: Articulo[] = [];

	for (const articulo of articulos) {
		if (!articulo?.Codigo) continue;
		const activo = articulo.Activo;
		if (activo === 0) continue;
		items.push(articulo);
		porCodigo.set(clave(articulo.Codigo), articulo);
		const barras = clave(articulo.CodigoBarras);
		if (barras) porBarras.set(barras, articulo);
	}

	return { items, porCodigo, porBarras };
}

export function resolverPosCatalogo(catalogo: PosCatalogo, code: string): Articulo | null {
	const valor = clave(code);
	if (!valor) return null;
	return catalogo.porBarras.get(valor) || catalogo.porCodigo.get(valor) || null;
}

export function incorporarPosCatalogo(catalogo: PosCatalogo, articulo: Articulo): PosCatalogo {
	const resto = catalogo.items.filter((item) => clave(item.Codigo) !== clave(articulo.Codigo));
	return indexarPosCatalogo([...resto, articulo]);
}

export function filtrarPosCatalogo(articulos: Articulo[], busqueda: string, limite = 30): Articulo[] {
	const q = busqueda.trim().toLowerCase();
	if (q.length < 2) return [];

	const coincidencias: Articulo[] = [];
	for (const articulo of articulos) {
		if (esArticuloPosVarios(articulo.Codigo)) continue;
		const descripcion = String(articulo.Descripcion || '').toLowerCase();
		const codigo = String(articulo.Codigo || '').toLowerCase();
		const barras = String(articulo.CodigoBarras || '').toLowerCase();
		if (descripcion.includes(q) || codigo.includes(q) || barras.includes(q)) {
			coincidencias.push(articulo);
			if (coincidencias.length >= limite) break;
		}
	}
	return coincidencias;
}
