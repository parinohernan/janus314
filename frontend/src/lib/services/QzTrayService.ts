import { writable } from 'svelte/store';
import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
import { loadPosPrinterConfig, type PosPrinterConfig } from '$lib/utils/posPrinterConfig';
import { renderPosTicketHtml, type PosTicketDto } from '$lib/utils/posTicketHtml';

export type QzStatus = 'desconectado' | 'conectado' | 'imprimiendo' | 'error';

export class QzPrintError extends Error {
	code: 'QZ_DISCONNECTED' | 'NO_PRINTER' | 'PRINT_FAILED';

	constructor(message: string, code: QzPrintError['code']) {
		super(message);
		this.name = 'QzPrintError';
		this.code = code;
	}
}

type QzClient = {
	websocket: {
		connect: (opts?: object) => Promise<void>;
		disconnect: () => Promise<void>;
		isActive: () => boolean;
	};
	printers: { find: () => Promise<string[]> };
	configs: { create: (printer: string, opts?: object) => unknown };
	print: (config: unknown, data: unknown[]) => Promise<void>;
	security: {
		setCertificatePromise: (
			fn: (resolve: (v: string) => void, reject?: (e?: unknown) => void) => void
		) => void;
		setSignaturePromise: (
			fn: (toSign: string) => (resolve: (v: string) => void, reject: (e?: unknown) => void) => void
		) => void;
		setSignatureAlgorithm: (alg: string) => void;
	};
};

export const qzStatus = writable<QzStatus>('desconectado');

let qzRef: QzClient | null = null;
let securityReady = false;
let connectPromise: Promise<QzClient> | null = null;

async function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: () => Error): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => reject(onTimeout()), ms);
	});
	try {
		return await Promise.race([promise, timeout]);
	} finally {
		if (timer) clearTimeout(timer);
	}
}

async function loadQz(): Promise<QzClient> {
	if (qzRef) return qzRef;
	const mod = await import('qz-tray');
	qzRef = (mod.default || mod) as QzClient;
	return qzRef;
}

async function configureSecurity(qz: QzClient): Promise<void> {
	if (securityReady) return;
	try {
		const response = await fetchWithAuth('/pos/qz-cert');
		if (!response.ok) {
			securityReady = true;
			return;
		}
		const payload = await response.json();
		const certificado = payload.configurado && payload.certificado;
		if (!certificado) {
			securityReady = true;
			return;
		}

		qz.security.setCertificatePromise((resolve) => resolve(certificado));
		qz.security.setSignatureAlgorithm('SHA512');
		qz.security.setSignaturePromise((toSign) => (resolve, reject) => {
			fetchWithAuth('/pos/qz-sign', {
				method: 'POST',
				body: JSON.stringify({ request: toSign })
			})
				.then((res) => res.json())
				.then((data) => {
					if (data?.firma) resolve(data.firma);
					else reject(data?.message || 'Sin firma QZ');
				})
				.catch(reject);
		});
		securityReady = true;
	} catch {
		securityReady = true;
	}
}

export async function connectQz(): Promise<QzClient> {
	if (typeof window === 'undefined') {
		throw new QzPrintError('Abrí QZ Tray', 'QZ_DISCONNECTED');
	}
	if (connectPromise) return connectPromise;

	connectPromise = (async () => {
		const qz = await loadQz();
		await configureSecurity(qz);
		if (!qz.websocket.isActive()) {
			await withTimeout(
				qz.websocket.connect({ retries: 0, delay: 0 }),
				2500,
				() => new QzPrintError('Abrí QZ Tray', 'QZ_DISCONNECTED')
			);
		}
		qzStatus.set('conectado');
		return qz;
	})();

	try {
		return await connectPromise;
	} catch {
		qzStatus.set('desconectado');
		throw new QzPrintError('Abrí QZ Tray', 'QZ_DISCONNECTED');
	} finally {
		connectPromise = null;
	}
}

export async function disconnectQz(): Promise<void> {
	try {
		if (qzRef?.websocket.isActive()) {
			await qzRef.websocket.disconnect();
		}
	} catch {
		// ignore
	} finally {
		qzStatus.set('desconectado');
	}
}

export async function listQzPrinters(): Promise<string[]> {
	const qz = await connectQz();
	const printers = await qz.printers.find();
	return Array.isArray(printers) ? printers : [];
}

export async function printPixelHtml(
	html: string,
	config: PosPrinterConfig = loadPosPrinterConfig()
): Promise<void> {
	if (!config.printerName) {
		throw new QzPrintError('Elegí la impresora de esta caja', 'NO_PRINTER');
	}

	const qz = await connectQz();
	qzStatus.set('imprimiendo');
	try {
		const qzConfig = qz.configs.create(config.printerName, {
			copies: config.copias || 1,
			units: 'mm',
			size: { width: config.anchoMm || 80 },
			margins: 0,
			interpolation: 'nearest-neighbor',
			scaleContent: true,
			rasterize: true,
			colorType: 'grayscale',
			density: 203,
			jobName: 'POS Janus314'
		});
		await qz.print(qzConfig, [
			{
				type: 'pixel',
				format: 'html',
				flavor: 'plain',
				data: html,
				options: {
					pageWidth: Math.max(58, (config.anchoMm || 80) - 8),
					units: 'mm'
				}
			}
		]);
		qzStatus.set('conectado');
	} catch (error) {
		qzStatus.set('error');
		if (error instanceof QzPrintError) throw error;
		throw new QzPrintError(
			error instanceof Error ? error.message : 'No se pudo imprimir el ticket',
			'PRINT_FAILED'
		);
	}
}

export async function printTicket(
	dto: PosTicketDto,
	config: PosPrinterConfig = loadPosPrinterConfig()
): Promise<void> {
	await printPixelHtml(renderPosTicketHtml(dto), config);
}

export function mensajeErrorImpresion(error: unknown): string {
	if (error instanceof QzPrintError) return error.message;
	if (error instanceof Error && /websocket|qz/i.test(error.message)) return 'Abrí QZ Tray';
	return error instanceof Error ? error.message : 'No se pudo imprimir el ticket';
}
