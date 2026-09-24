import { redondear2 } from './comprobanteTotales';
import { esArticuloPosVarios, type PosRubro } from '$lib/constants/posVarios';
import type { Articulo } from '$lib/types/articulo';
import { alicuotaIvaArticulo } from './ivaArticulo';

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
	esBalanza?: boolean;
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
	const factor = 1 + iva / 100;
	const puIvaIngresado = redondear2(Number(linea.PrecioUnitarioConIva) || 0);

	if ((linea.esVarios || linea.esBalanza) && puIvaIngresado > 0) {
		const pu = redondear2(puIvaIngresado / factor);
		return {
			...linea,
			PrecioUnitario: pu,
			PrecioLista: redondear2(Number(linea.PrecioLista) || pu),
			PrecioUnitarioConIva: puIvaIngresado,
			Total: redondear2(puIvaIngresado * cantidad)
		};
	}

	const pu = redondear2(Number(linea.PrecioUnitario) || 0);
	const puIva = redondear2(pu * factor);
	return {
		...linea,
		PrecioUnitario: pu,
		PrecioLista: redondear2(Number(linea.PrecioLista) || pu),
		PrecioUnitarioConIva: puIva,
		Total: redondear2(puIva * cantidad)
	};
}

function valorListaDeArticulo(articulo: Articulo, listaId: string): number {
	const listas: Record<string, number | undefined> = {
		'1': articulo.Lista1,
		'2': articulo.Lista2,
		'3': articulo.Lista3,
		'4': articulo.Lista4,
		'5': articulo.Lista5
	};
	const crudo = listas[listaId] ?? articulo.Lista1;
	const valor = Number(crudo);
	return Number.isFinite(valor) ? valor : 0;
}

function resolverValorLista(precioCosto: number, valorLista: number): number {
	if (valorLista === 0) return redondear2(precioCosto);
	if (precioCosto > 0) {
		if (valorLista > precioCosto * 1.05) return redondear2(valorLista);
		if (Math.abs(valorLista) <= 1000) return redondear2(precioCosto * (1 + valorLista / 100));
		return redondear2(valorLista);
	}
	return redondear2(valorLista);
}

export function precioListaSinIva(articulo: Articulo, listaId = '1'): number {
	const precioCosto = Math.max(Number(articulo.PrecioCosto) || 0, 0);
	let precio = resolverValorLista(precioCosto, valorListaDeArticulo(articulo, listaId));
	if (precio > 0) return precio;

	if (listaId !== '1') {
		precio = resolverValorLista(precioCosto, valorListaDeArticulo(articulo, '1'));
		if (precio > 0) return precio;
	}

	return redondear2(precioCosto);
}

export function ivaDeArticulo(articulo: Articulo): number {
	return alicuotaIvaArticulo(articulo);
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

function precioDeLista(articulo: Articulo, listaId: string): number {
	const lista = valorListaDeArticulo(articulo, listaId);
	if (!(lista > 0)) return 0;
	const costo = Math.max(Number(articulo.PrecioCosto) || 0, 0);
	const factor = 1 + ivaDeArticulo(articulo) / 100;
	if (costo === 0 || lista > costo * 1.05) return redondear2(lista);
	if (Math.abs(lista) <= 1000) return redondear2(costo * (1 + lista / 100) * factor);
	return redondear2(lista);
}

function precioKgConIva(articulo: Articulo, listaId: string): number {
	const deLista = precioDeLista(articulo, listaId);
	if (deLista > 0) return deLista;
	if (listaId !== '1') {
		const principal = precioDeLista(articulo, '1');
		if (principal > 0) return principal;
	}
	const costo = Math.max(Number(articulo.PrecioCosto) || 0, 0);
	if (costo > 0) return redondear2(costo * (1 + ivaDeArticulo(articulo) / 100));
	return 0;
}

export function lineaDesdeBalanza(articulo: Articulo, kg: number, listaId = '1'): PosLinea | null {
	const precioKg = precioKgConIva(articulo, listaId);
	if (!(precioKg > 0)) return null;
	const kilos = Math.round(Number(kg) * 1000) / 1000;
	if (!(kilos > 0)) return null;
	return completarImportes({
		lineId: nuevaLineaId(),
		ArticuloCodigo: articulo.Codigo,
		Descripcion: articulo.Descripcion,
		Cantidad: kilos,
		PrecioLista: 0,
		PrecioUnitario: 0,
		PorcentajeIva: ivaDeArticulo(articulo),
		PrecioUnitarioConIva: redondear2(precioKg),
		Total: 0,
		esVarios: false,
		esBalanza: true
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
		PrecioUnitarioConIva: conIva,
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
	return lineas.map((l) => {
		if (l.lineId !== lineId) return l;
		const qty = l.esBalanza
			? Math.max(0.001, Math.round(Number(cantidad) * 1000) / 1000)
			: Math.max(0.001, redondear2(cantidad));
		return completarImportes({ ...l, Cantidad: qty });
	});
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
		if (actual.esBalanza && linea.esBalanza) {
			const cantidad = Math.round((Number(actual.Cantidad) + Number(linea.Cantidad)) * 1000) / 1000;
			map.set(
				key,
				completarImportes({
					...actual,
					Cantidad: cantidad,
					PrecioUnitarioConIva: actual.PrecioUnitarioConIva
				})
			);
			continue;
		}
		const descripcion = [actual.Descripcion, linea.Descripcion].filter(Boolean).join(' / ').slice(0, 100);
		const totalNeto =
			actual.PrecioUnitario * actual.Cantidad + linea.PrecioUnitario * linea.Cantidad;
		const totalConIva = redondear2((Number(actual.Total) || 0) + (Number(linea.Total) || 0));
		map.set(
			key,
			completarImportes({
				...actual,
				Descripcion: descripcion,
				DescripcionLibre: descripcion,
				Cantidad: 1,
				PrecioLista: redondear2(totalNeto),
				PrecioUnitario: redondear2(totalNeto),
				PrecioUnitarioConIva: totalConIva
			})
		);
	}
	return [...map.values()];
}
