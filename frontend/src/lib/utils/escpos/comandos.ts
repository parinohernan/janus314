import { codificar1252 } from './codificacion';

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

export type Alineacion = 'izquierda' | 'centro' | 'derecha';

/** Imagen monocroma lista para GS v 0: cada byte son 8 puntos horizontales, 1 = negro. */
export type ImagenRaster = {
	anchoBytes: number;
	alto: number;
	datos: Uint8Array;
};

const ALINEACION: Record<Alineacion, number> = { izquierda: 0, centro: 1, derecha: 2 };

/** Página de códigos WPC1252 en impresoras Epson TM. */
export const CODE_PAGE_WPC1252 = 16;

export type LineaImpresa = { texto: string; ancho: number };

export class EscPos {
	private buffer: number[] = [];
	private anchoActual = 1;
	/** Texto de cada renglón con su multiplicador de ancho, para validar que entre en el papel. */
	readonly lineas: LineaImpresa[] = [];

	private push(...bytes: number[]): this {
		for (const byte of bytes) this.buffer.push(byte & 0xff);
		return this;
	}

	init(): this {
		this.anchoActual = 1;
		return this.push(ESC, 0x40);
	}

	codePage(pagina = CODE_PAGE_WPC1252): this {
		return this.push(ESC, 0x74, pagina);
	}

	align(alineacion: Alineacion): this {
		return this.push(ESC, 0x61, ALINEACION[alineacion]);
	}

	bold(activo: boolean): this {
		return this.push(ESC, 0x45, activo ? 1 : 0);
	}

	/** Multiplicador de ancho y alto, de 1 a 8. */
	size(ancho = 1, alto = 1): this {
		const w = Math.min(8, Math.max(1, ancho)) - 1;
		const h = Math.min(8, Math.max(1, alto)) - 1;
		this.anchoActual = w + 1;
		return this.push(GS, 0x21, (w << 4) | h);
	}

	text(texto: string): this {
		return this.push(...codificar1252(texto));
	}

	line(texto = ''): this {
		this.lineas.push({ texto, ancho: this.anchoActual });
		return this.text(texto).push(LF);
	}

	feed(lineas = 1): this {
		return this.push(ESC, 0x64, Math.min(255, Math.max(0, lineas)));
	}

	/** QR modelo 2 nativo de la impresora. */
	qr(datos: string, modulo = 6, correccion: 'L' | 'M' | 'Q' | 'H' = 'M'): this {
		const contenido = codificar1252(datos);
		const largo = contenido.length + 3;
		const nivel = { L: 48, M: 49, Q: 50, H: 51 }[correccion];
		return this.push(GS, 0x28, 0x6b, 4, 0, 0x31, 0x41, 0x32, 0x00)
			.push(GS, 0x28, 0x6b, 3, 0, 0x31, 0x43, Math.min(16, Math.max(1, modulo)))
			.push(GS, 0x28, 0x6b, 3, 0, 0x31, 0x45, nivel)
			.push(GS, 0x28, 0x6b, largo & 0xff, (largo >> 8) & 0xff, 0x31, 0x50, 0x30, ...contenido)
			.push(GS, 0x28, 0x6b, 3, 0, 0x31, 0x51, 0x30);
	}

	raster(imagen: ImagenRaster): this {
		const { anchoBytes, alto, datos } = imagen;
		this.push(GS, 0x76, 0x30, 0, anchoBytes & 0xff, (anchoBytes >> 8) & 0xff, alto & 0xff, (alto >> 8) & 0xff);
		for (const byte of datos) this.buffer.push(byte);
		return this;
	}

	/** Corte parcial después de avanzar el papel hasta la cuchilla. */
	cut(): this {
		return this.push(GS, 0x56, 66, 0);
	}

	drawer(): this {
		return this.push(ESC, 0x70, 0, 25, 250);
	}

	bytes(): Uint8Array {
		return Uint8Array.from(this.buffer);
	}
}

export function bytesABase64(bytes: Uint8Array): string {
	let binario = '';
	const bloque = 0x8000;
	for (let i = 0; i < bytes.length; i += bloque) {
		binario += String.fromCharCode(...bytes.subarray(i, i + bloque));
	}
	if (typeof btoa === 'function') return btoa(binario);
	return Buffer.from(bytes).toString('base64');
}
