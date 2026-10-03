import { formatMoneyAR } from '../posTicket';
import {
	LABEL_TIPO,
	LEYENDA_ARCA,
	LEYENDA_PRF,
	fechaVisible,
	urlQrArca,
	type PosTicketDto
} from '../posTicketHtml';
import { normalizarTexto } from './codificacion';
import { EscPos, type ImagenRaster } from './comandos';

export type OpcionesTicketEscPos = {
	columnas: number;
	cortarPapel: boolean;
	abrirCajon: boolean;
	logo?: ImagenRaster | null;
};

const ANCHO_CANTIDAD = 6;

/** Parte el texto en renglones de hasta `ancho` caracteres; corta palabras más largas que el renglón. */
export function envolver(texto: string, ancho: number): string[] {
	const limpio = normalizarTexto(texto).replace(/\s+/g, ' ').trim();
	if (!limpio) return [];
	if (ancho < 1) return [limpio];
	const renglones: string[] = [];
	let actual = '';
	for (const palabra of limpio.split(' ')) {
		let resto = palabra;
		while (resto.length > ancho) {
			if (actual) {
				renglones.push(actual);
				actual = '';
			}
			renglones.push(resto.slice(0, ancho));
			resto = resto.slice(ancho);
		}
		if (!resto) continue;
		if (!actual) actual = resto;
		else if (actual.length + 1 + resto.length <= ancho) actual += ` ${resto}`;
		else {
			renglones.push(actual);
			actual = resto;
		}
	}
	if (actual) renglones.push(actual);
	return renglones;
}

function dinero(valor: number): string {
	return normalizarTexto(formatMoneyAR(valor));
}

function izquierdaDerecha(izquierda: string, derecha: string, ancho: number): string[] {
	const espacio = ancho - derecha.length - 1;
	if (espacio < 1) return [...envolver(izquierda, ancho), derecha.slice(-ancho).padStart(ancho)];
	const renglones = envolver(izquierda, espacio);
	if (!renglones.length) return [derecha.padStart(ancho)];
	const ultimo = renglones.pop() as string;
	return [...renglones, `${ultimo.padEnd(espacio)} ${derecha}`];
}

export function renglonesItem(item: PosTicketDto['items'][number], columnas: number): string[] {
	const cantidad = Number(item.cantidad)
		.toLocaleString('es-AR', { maximumFractionDigits: 3 })
		.slice(0, ANCHO_CANTIDAD);
	const importe = dinero(item.total);
	const anchoDescripcion = Math.max(4, columnas - ANCHO_CANTIDAD - importe.length - 2);
	const descripcion = envolver(item.descripcion, anchoDescripcion);
	if (!descripcion.length) descripcion.push('');
	const sangria = ' '.repeat(ANCHO_CANTIDAD + 1);
	return descripcion.map((parte, indice) =>
		indice === 0
			? `${cantidad.padEnd(ANCHO_CANTIDAD)} ${parte.padEnd(anchoDescripcion)} ${importe}`
			: `${sangria}${parte}`
	);
}

function centrado(p: EscPos, texto: string | undefined, columnas: number) {
	for (const renglon of envolver(texto || '', columnas)) p.line(renglon);
}

export function armarTicketEscPos(dto: PosTicketDto, opciones: OpcionesTicketEscPos): EscPos {
	const columnas = Math.max(16, opciones.columnas || 48);
	const p = new EscPos().init().codePage().align('centro');

	if (opciones.logo) p.raster(opciones.logo).feed(1);

	p.bold(true).size(1, 2);
	centrado(p, dto.empresa.nombre, columnas);
	p.size(1, 1).bold(false);

	const empresa = dto.empresa;
	centrado(p, empresa.domicilio, columnas);
	centrado(p, empresa.localidad, columnas);
	centrado(p, empresa.telefono ? `Teléfono: ${empresa.telefono}` : '', columnas);
	centrado(p, empresa.cuit ? `CUIT: ${empresa.cuit}` : '', columnas);
	centrado(p, empresa.condicionIva ? `IVA: ${empresa.condicionIva}` : '', columnas);
	centrado(p, empresa.ingresosBrutos ? `Ingresos Brutos: ${empresa.ingresosBrutos}` : '', columnas);
	centrado(
		p,
		empresa.inicioActividades ? `Inicio de Actividades: ${fechaVisible(empresa.inicioActividades)}` : '',
		columnas
	);

	p.feed(1).bold(true);
	centrado(p, `${LABEL_TIPO[dto.tipo]} ${dto.sucursal}-${dto.numero}`, columnas);
	p.bold(false);
	centrado(p, dto.fecha, columnas);
	centrado(p, `${dto.cliente.descripcion} (${dto.cliente.codigo})`, columnas);

	p.align('izquierda').line('-'.repeat(columnas));
	for (const item of dto.items) {
		for (const renglon of renglonesItem(item, columnas)) p.line(renglon);
	}
	p.line('-'.repeat(columnas));

	for (const renglon of izquierdaDerecha('Neto', dinero(dto.totales.neto), columnas)) p.line(renglon);
	for (const renglon of izquierdaDerecha('IVA', dinero(dto.totales.iva), columnas)) p.line(renglon);
	p.bold(true).size(2, 2);
	for (const renglon of izquierdaDerecha('Total', dinero(dto.totales.total), Math.floor(columnas / 2))) {
		p.line(renglon);
	}
	p.size(1, 1).bold(false).align('centro');

	if (dto.tipo === 'PRF') {
		p.feed(1).bold(true);
		centrado(p, LEYENDA_PRF, columnas);
		p.bold(false);
	} else if (dto.cae) {
		p.feed(1);
		const url = urlQrArca(dto);
		if (url) p.qr(url).feed(1);
		p.bold(true);
		centrado(p, `CAE N°: ${dto.cae}`, columnas);
		if (dto.caeVencimiento) centrado(p, `Fecha Vto. CAE: ${fechaVisible(dto.caeVencimiento)}`, columnas);
		p.bold(false);
		centrado(p, LEYENDA_ARCA, columnas);
	}

	p.align('izquierda').feed(4);
	if (opciones.abrirCajon) p.drawer();
	if (opciones.cortarPapel) p.cut();
	return p;
}

export function renderPosTicketEscPos(dto: PosTicketDto, opciones: OpcionesTicketEscPos): Uint8Array {
	return armarTicketEscPos(dto, opciones).bytes();
}
