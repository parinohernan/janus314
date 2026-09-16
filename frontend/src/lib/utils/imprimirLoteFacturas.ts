import { PDFDocument } from 'pdf-lib';
import { DocumentService } from '$lib/services/DocumentService';

export interface ComprobanteLote {
	tipo: string;
	sucursal: string;
	numero: string;
}

function etiqueta(item: ComprobanteLote): string {
	return `${item.tipo} ${item.sucursal}-${item.numero}`;
}

/** Hay que llamarla en el mismo tick del click; después de await el navegador bloquea popups. */
export function abrirVentanaImpresionLote(): Window | null {
	const printWindow = window.open('about:blank', '_blank');
	if (!printWindow) return null;
	try {
		printWindow.document.write(
			'<!doctype html><title>Preparando lote…</title><p style="font-family:sans-serif;padding:2rem">Preparando lote para imprimir…</p>'
		);
		printWindow.document.close();
	} catch {
		// Si el documento aún no está listo, igual conservamos la ventana.
	}
	return printWindow;
}

function imprimirUrl(url: string, printWindow: Window | null) {
	if (printWindow) {
		try {
			printWindow.location.replace(url);
			setTimeout(() => {
				try {
					printWindow.focus();
					printWindow.print();
				} catch (err) {
					console.error('No se pudo disparar print()', err);
				}
			}, 1200);
			return;
		} catch (err) {
			console.error('No se pudo usar la ventana de impresión, se usa iframe', err);
			try {
				printWindow.close();
			} catch {
				// ignore
			}
		}
	}

	const iframe = document.createElement('iframe');
	iframe.setAttribute('title', 'Imprimir lote de facturas');
	iframe.style.position = 'fixed';
	iframe.style.right = '0';
	iframe.style.bottom = '0';
	iframe.style.width = '0';
	iframe.style.height = '0';
	iframe.style.border = '0';
	iframe.src = url;
	document.body.appendChild(iframe);
	setTimeout(() => {
		try {
			iframe.contentWindow?.focus();
			iframe.contentWindow?.print();
		} catch (err) {
			console.error('No se pudo disparar print() en iframe', err);
		}
	}, 1200);
}

/**
 * Descarga los PDF de cada comprobante, los une en uno solo y abre un único diálogo de impresión.
 * Si alguno falla, no imprime el lote a medias.
 *
 * `printWindow` debe abrirse en el click (ver abrirVentanaImpresionLote), no después de bajar los PDF.
 */
export async function imprimirLoteFacturas(
	comprobantes: ComprobanteLote[],
	printWindow: Window | null = null
): Promise<void> {
	if (comprobantes.length === 0) {
		printWindow?.close();
		throw new Error('No hay comprobantes seleccionados');
	}

	const pdfs: Uint8Array[] = [];
	const fallidos: string[] = [];

	for (const item of comprobantes) {
		try {
			const bytes = await DocumentService.generarPDFBytes(item.tipo, item.sucursal, item.numero);
			pdfs.push(new Uint8Array(bytes));
		} catch {
			fallidos.push(etiqueta(item));
		}
	}

	if (fallidos.length > 0) {
		printWindow?.close();
		throw new Error(`No se pudieron obtener los PDF: ${fallidos.join(', ')}`);
	}

	try {
		const merged = await PDFDocument.create();
		for (const bytes of pdfs) {
			const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
			const pages = await merged.copyPages(src, src.getPageIndices());
			for (const page of pages) {
				merged.addPage(page);
			}
		}

		const out = await merged.save();
		const blob = new Blob([new Uint8Array(out)], { type: 'application/pdf' });
		const url = URL.createObjectURL(blob);
		imprimirUrl(url, printWindow);
	} catch (err) {
		printWindow?.close();
		throw err instanceof Error ? err : new Error('No se pudieron unir los PDF del lote');
	}
}
