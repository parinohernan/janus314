import type { ImagenRaster } from './comandos';

export const LOGO_ANCHO_MAXIMO = 384;
export const LOGO_ALTO_MAXIMO = 160;

/** Convierte RGBA a monocromo con difuminado Floyd-Steinberg; lo transparente se toma como papel blanco. */
export function rasterDesdeRgba(rgba: Uint8ClampedArray, ancho: number, alto: number): ImagenRaster {
	const gris = new Float32Array(ancho * alto);
	for (let i = 0; i < ancho * alto; i++) {
		const alfa = rgba[i * 4 + 3] / 255;
		const luz = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
		gris[i] = luz * alfa + 255 * (1 - alfa);
	}

	const anchoBytes = Math.ceil(ancho / 8);
	const datos = new Uint8Array(anchoBytes * alto);
	for (let y = 0; y < alto; y++) {
		for (let x = 0; x < ancho; x++) {
			const i = y * ancho + x;
			const viejo = gris[i];
			const negro = viejo < 128;
			const error = viejo - (negro ? 0 : 255);
			if (negro) datos[y * anchoBytes + (x >> 3)] |= 0x80 >> (x & 7);
			if (x + 1 < ancho) gris[i + 1] += (error * 7) / 16;
			if (y + 1 < alto) {
				if (x > 0) gris[i + ancho - 1] += (error * 3) / 16;
				gris[i + ancho] += (error * 5) / 16;
				if (x + 1 < ancho) gris[i + ancho + 1] += error / 16;
			}
		}
	}
	return { anchoBytes, alto, datos };
}

export function medidaLogo(ancho: number, alto: number): { ancho: number; alto: number } {
	const escala = Math.min(1, LOGO_ANCHO_MAXIMO / ancho, LOGO_ALTO_MAXIMO / alto);
	return {
		ancho: Math.max(1, Math.round(ancho * escala)),
		alto: Math.max(1, Math.round(alto * escala))
	};
}

const cache = new Map<string, Promise<ImagenRaster | null>>();

function cargarImagen(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const imagen = new Image();
		imagen.crossOrigin = 'anonymous';
		imagen.onload = () => resolve(imagen);
		imagen.onerror = () => reject(new Error('No se pudo cargar el logo'));
		imagen.src = src;
	});
}

/** Bajar el archivo y usar un blob evita que el canvas quede bloqueado por CORS al leer los píxeles. */
async function cargarLogo(src: string): Promise<HTMLImageElement> {
	if (src.startsWith('data:')) return cargarImagen(src);
	const response = await fetch(src);
	if (!response.ok) throw new Error('No se pudo descargar el logo');
	const url = URL.createObjectURL(await response.blob());
	try {
		return await cargarImagen(url);
	} finally {
		URL.revokeObjectURL(url);
	}
}

async function convertir(src: string): Promise<ImagenRaster | null> {
	const imagen = await cargarLogo(src);
	const { ancho, alto } = medidaLogo(imagen.naturalWidth || imagen.width, imagen.naturalHeight || imagen.height);
	const canvas = document.createElement('canvas');
	canvas.width = ancho;
	canvas.height = alto;
	const contexto = canvas.getContext('2d');
	if (!contexto) return null;
	contexto.fillStyle = '#ffffff';
	contexto.fillRect(0, 0, ancho, alto);
	contexto.drawImage(imagen, 0, 0, ancho, alto);
	return rasterDesdeRgba(contexto.getImageData(0, 0, ancho, alto).data, ancho, alto);
}

/** Logo listo para GS v 0, cacheado por origen durante la sesión. Si falla, devuelve null y el ticket sale sin logo. */
export function logoRaster(src: string | undefined): Promise<ImagenRaster | null> {
	const origen = String(src || '').trim();
	if (!origen || typeof document === 'undefined') return Promise.resolve(null);
	let pendiente = cache.get(origen);
	if (!pendiente) {
		pendiente = convertir(origen).catch(() => {
			cache.delete(origen);
			return null;
		});
		cache.set(origen, pendiente);
	}
	return pendiente;
}
