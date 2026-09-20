import { redondear2 } from './comprobanteTotales';
import { esArticuloPosVarios, type PosRubro } from '$lib/constants/posVarios';
import type { Articulo } from '$lib/types/articulo';

export type PosLinea = {
	lineId: string;
	ArticuloCodigo: string;
	Descripcion: string;
	DescripcionLibre?: string;
	Cantidad: number;
	PrecioLista: number;
	PrecioUnitario: number;
	PorcentajeIva: number;
	PrecioUnitarioConIva: number;
	Total: number;
	esVarios: boolean;
};

export function formatMoneyAR(n: number): string {
	return Number(n || 0).toLocaleString('es-AR', {
		style: 'currency',
		currency: 'ARS'
	});
}

export function nuevaLineaId(): string {
	return `L${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function completarImportes(linea: PosLinea): PosLinea {
	const iva = Number(linea.PorcentajeIva) || 0;
	const cantidad = Number(linea.Cantidad) || 0;
	const pu = redondear2(Number(linea.PrecioUnitario) || 0);
	const puIva = redondear2(pu * (1 + iva / 100));
	return {
		...linea,
		PrecioUnitario: pu,
		PrecioLista: redondear2(Number(linea.PrecioLista) || pu),
		PrecioUnitarioConIva: puIva,
		Total: redondear2(puIva * cantidad)
	};
}

export function precioListaSinIva(articulo: Articulo, listaId = '1'): number {
	const precioCosto = Number(articulo.PrecioCosto) || 0;
	const listas: Record<string, number | undefined> = {
		'1': articulo.Lista1,
		'2': articulo.Lista2,
		'3': articulo.Lista3,
		'4': articulo.Lista4,
		'5': articulo.Lista5
	};
	const valorLista = Number(listas[listaId] ?? articulo.Lista1) || 0;

	if (valorLista === 0) return redondear2(precioCosto);
	if (precioCosto > 0) {
		if (valorLista > precioCosto * 1.05) return redondear2(valorLista);
		if (valorLista <= 1000) return redondear2(precioCosto * (1 + valorLista / 100));
		return redondear2(valorLista);
	}
	return redondear2(valorLista);
}

export function ivaDeArticulo(articulo: Articulo): number {
	const iva = Number(articulo.PorcentajeIVA1 ?? articulo.PorcentajeIva1 ?? articulo.PorcentajeIva);
	return Number.isFinite(iva) && iva > 0 ? iva : 21;
}

export function lineaDesdeArticulo(articulo: Articulo, listaId = '1'): PosLinea {
	const iva = ivaDeArticulo(articulo);
	const precioLista = precioListaSinIva(articulo, listaId);
	return completarImportes({
		lineId: nuevaLineaId(),
		ArticuloCodigo: articulo.Codigo,
		Descripcion: articulo.Descripcion,
		Cantidad: 1,
		PrecioLista: precioLista,
		PrecioUnitario: precioLista,
		PorcentajeIva: iva,
		PrecioUnitarioConIva: 0,
		Total: 0,
		esVarios: esArticuloPosVarios(articulo.Codigo)
	});
}

export function lineaDesdeRubro(rubro: PosRubro, descripcion: string, precioConIva: number): PosLinea {
	const iva = rubro.iva;
	const texto = descripcion.trim().slice(0, 100) || rubro.descripcionDefault;
	const conIva = redondear2(precioConIva);
	const sinIva = redondear2(conIva / (1 + iva / 100));
	return completarImportes({
		lineId: nuevaLineaId(),
		ArticuloCodigo: rubro.codigo,
		Descripcion: texto,
		DescripcionLibre: texto,
		Cantidad: 1,
		PrecioLista: sinIva,
		PrecioUnitario: sinIva,
		PorcentajeIva: iva,
		PrecioUnitarioConIva: 0,
		Total: 0,
		esVarios: true
	});
}

export function agregarOIncrementar(lineas: PosLinea[], articulo: Articulo, listaId = '1'): PosLinea[] {
	const existente = lineas.find((l) => !l.esVarios && l.ArticuloCodigo === articulo.Codigo);
	if (existente) {
		return lineas.map((l) =>
			l.lineId === existente.lineId ? completarImportes({ ...l, Cantidad: l.Cantidad + 1 }) : l
		);
	}
	return [...lineas, lineaDesdeArticulo(articulo, listaId)];
}

export function cambiarCantidad(lineas: PosLinea[], lineId: string, cantidad: number): PosLinea[] {
	const qty = Math.max(0.001, redondear2(cantidad));
	return lineas.map((l) => (l.lineId === lineId ? completarImportes({ ...l, Cantidad: qty }) : l));
}

export function quitarLinea(lineas: PosLinea[], lineId: string): PosLinea[] {
	return lineas.filter((l) => l.lineId !== lineId);
}

export function totalTicket(lineas: PosLinea[]): number {
	return redondear2(lineas.reduce((sum, l) => sum + (l.Total || 0), 0));
}

export function tipoTicketFiscal(categoriaIva?: string | null): 'FCA' | 'FCB' {
	if (categoriaIva === 'I' || categoriaIva === 'M') return 'FCA';
	return 'FCB';
}

export function labelTicketFiscal(categoriaIva?: string | null): string {
	return tipoTicketFiscal(categoriaIva) === 'FCA' ? 'Factura A' : 'Ticket B';
}

export function mergeLineasParaPersistir(lineas: PosLinea[]): PosLinea[] {
	const map = new Map<string, PosLinea>();
	for (const linea of lineas) {
		const key = linea.ArticuloCodigo;
		const actual = map.get(key);
		if (!actual) {
			map.set(key, { ...linea });
			continue;
		}
		const descripcion = [actual.Descripcion, linea.Descripcion].filter(Boolean).join(' / ').slice(0, 100);
		const totalNeto =
			actual.PrecioUnitario * actual.Cantidad + linea.PrecioUnitario * linea.Cantidad;
		map.set(
			key,
			completarImportes({
				...actual,
				Descripcion: descripcion,
				DescripcionLibre: descripcion,
				Cantidad: 1,
				PrecioLista: redondear2(totalNeto),
				PrecioUnitario: redondear2(totalNeto)
			})
		);
	}
	return [...map.values()];
}
