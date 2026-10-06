export const CODIGO_CONFIG_MODO_LISTA = 'ART';

export type ModoIngresoLista = 'PorcentajeDeGanancia' | 'PrecioSinIva' | 'PrecioConIva';

export const MODO_LISTA_POR_DEFECTO: ModoIngresoLista = 'PorcentajeDeGanancia';

const MODOS_VALIDOS: ModoIngresoLista[] = ['PorcentajeDeGanancia', 'PrecioSinIva', 'PrecioConIva'];

export function parseModoIngresoLista(valor: unknown): ModoIngresoLista {
	const texto = String(valor ?? '').trim().toLowerCase();
	return MODOS_VALIDOS.find((modo) => modo.toLowerCase() === texto) ?? MODO_LISTA_POR_DEFECTO;
}

/**
 * Decimales con que se guarda el % de ganancia (t_articulos.ListaN es DOUBLE).
 * Con 2 decimales un precio ingresado no se reconstruye exacto (1000 → 1000,11).
 */
export const DECIMALES_PORCENTAJE_LISTA = 6;

function redondear2(valor: number): number {
	if (!Number.isFinite(valor)) return 0;
	return Number(valor.toFixed(2));
}

export function redondearPorcentajeLista(valor: unknown): number {
	const n = Number(valor);
	if (!Number.isFinite(n)) return 0;
	return Number(n.toFixed(DECIMALES_PORCENTAJE_LISTA));
}

function aNumero(valor: unknown): number {
	const n = Number(valor);
	return Number.isFinite(n) ? n : 0;
}

export function preciosDesdePorcentaje(
	costo: unknown,
	iva: unknown,
	porcentaje: unknown
): { sinIva: number; conIva: number } {
	const c = aNumero(costo);
	if (c <= 0) return { sinIva: 0, conIva: 0 };
	const sinIva = c * (1 + aNumero(porcentaje) / 100);
	const conIva = sinIva * (1 + aNumero(iva) / 100);
	return { sinIva: redondear2(sinIva), conIva: redondear2(conIva) };
}

/** Devuelve null si no hay costo: sin costo no se puede derivar el porcentaje. */
export function porcentajeDesdePrecio(
	costo: unknown,
	iva: unknown,
	precio: unknown,
	modo: ModoIngresoLista
): number | null {
	if (modo === 'PorcentajeDeGanancia') return redondearPorcentajeLista(aNumero(precio));
	const c = aNumero(costo);
	if (c <= 0) return null;
	const p = aNumero(precio);
	const sinIva = modo === 'PrecioConIva' ? p / (1 + aNumero(iva) / 100) : p;
	return redondearPorcentajeLista((sinIva / c - 1) * 100);
}

export function valorVisibleLista(
	costo: unknown,
	iva: unknown,
	porcentaje: unknown,
	modo: ModoIngresoLista
): number {
	if (modo === 'PorcentajeDeGanancia') return redondear2(aNumero(porcentaje));
	const precios = preciosDesdePorcentaje(costo, iva, porcentaje);
	return modo === 'PrecioConIva' ? precios.conIva : precios.sinIva;
}

export type NumeroLista = 1 | 2 | 3 | 4 | 5;
export type CampoListaPrecio = `Lista${NumeroLista}`;
export const NUMEROS_LISTA: NumeroLista[] = [1, 2, 3, 4, 5];

export type PreciosArticulo = {
	PrecioCosto?: number | null;
	PorcentajeIVA1?: number | null;
} & Partial<Record<CampoListaPrecio, number | null>>;

export interface ListaDesactualizada {
	numero: NumeroLista;
	campo: CampoListaPrecio;
	/** Precio final en la unidad del modo (sin o con IVA). */
	anterior: number;
	nuevo: number;
}

/**
 * Con ART en PrecioSinIva / PrecioConIva el usuario piensa en precios finales, pero se guarda el %.
 * Si cambia el costo o el IVA sin tocar una lista, su precio final cambia solo: esto detecta esos casos.
 */
export function listasDesactualizadasPorCosto(
	original: PreciosArticulo | null | undefined,
	actual: PreciosArticulo,
	modo: ModoIngresoLista
): ListaDesactualizada[] {
	if (!original || modo === 'PorcentajeDeGanancia') return [];
	const costoAnterior = redondear2(aNumero(original.PrecioCosto));
	const costoNuevo = redondear2(aNumero(actual.PrecioCosto));
	const cambiaIva = aNumero(original.PorcentajeIVA1) !== aNumero(actual.PorcentajeIVA1);
	if (costoAnterior <= 0 || costoNuevo <= 0 || (costoAnterior === costoNuevo && !cambiaIva)) return [];

	const resultado: ListaDesactualizada[] = [];
	for (const numero of NUMEROS_LISTA) {
		const campo: CampoListaPrecio = `Lista${numero}`;
		const pctAnterior = redondearPorcentajeLista(original[campo]);
		const pctNuevo = redondearPorcentajeLista(actual[campo]);
		// 0 % es el valor de las listas sin cargar: avisar por ellas solo sería ruido
		if (pctAnterior !== pctNuevo || pctAnterior === 0) continue;
		const anterior = valorVisibleLista(original.PrecioCosto, original.PorcentajeIVA1, pctAnterior, modo);
		const nuevo = valorVisibleLista(actual.PrecioCosto, actual.PorcentajeIVA1, pctNuevo, modo);
		if (anterior !== nuevo) resultado.push({ numero, campo, anterior, nuevo });
	}
	return resultado;
}

/** Porcentajes que, con el costo nuevo, conservan los precios finales anteriores. */
export function porcentajesParaMantenerPrecios(
	actual: PreciosArticulo,
	desactualizadas: ListaDesactualizada[],
	modo: ModoIngresoLista
): Partial<Record<CampoListaPrecio, number>> {
	const porcentajes: Partial<Record<CampoListaPrecio, number>> = {};
	for (const lista of desactualizadas) {
		const pct = porcentajeDesdePrecio(actual.PrecioCosto, actual.PorcentajeIVA1, lista.anterior, modo);
		if (pct !== null) porcentajes[lista.campo] = pct;
	}
	return porcentajes;
}

export function textoListasDesactualizadas(desactualizadas: ListaDesactualizada[]): string {
	return desactualizadas
		.map((l) => `Lista ${l.numero}: ${l.anterior.toFixed(2)} → ${l.nuevo.toFixed(2)}`)
		.join(' · ');
}

export function etiquetaLista(numero: number, modo: ModoIngresoLista): string {
	switch (modo) {
		case 'PrecioSinIva':
			return `Lista ${numero} s/IVA`;
		case 'PrecioConIva':
			return `Lista ${numero} c/IVA`;
		default:
			return `Lista ${numero} (%)`;
	}
}

export function descripcionModoLista(modo: ModoIngresoLista): string {
	switch (modo) {
		case 'PrecioSinIva':
			return 'precio sin IVA';
		case 'PrecioConIva':
			return 'precio con IVA';
		default:
			return 'porcentaje de ganancia';
	}
}
