import { PUBLIC_API_URL } from '$env/static/public';
import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

export class DocumentService {
	/**
	 * Genera un PDF para una factura específica
	 */
	static async generarPDF(tipo: string, sucursal: string, numero: string): Promise<string> {
		try {
			console.log('URL', `${PUBLIC_API_URL}/facturas/pdf/${tipo}/${sucursal}/${numero}`);
			const response = await fetchWithAuth(
				`/facturas/pdf/${tipo}/${sucursal}/${numero}`,
				{
					method: 'GET',
					headers: {
						Accept: 'application/pdf'
					}
				}
			);

			if (!response.ok) {
				throw new Error('Error al generar el PDF', { cause: response.statusText });
			}

			// Crear URL del blob para mostrar el PDF
			const blob = await response.blob();
			return URL.createObjectURL(blob);
		} catch (error) {
			console.error('Error generando PDF:', error);
			throw error;
		}
	}

	/**
	 * Imprime un documento PDF
	 */
	static imprimirPDF(pdfUrl: string): void {
		const printWindow = window.open(pdfUrl, '_blank');
		if (printWindow) {
			printWindow.addEventListener('load', () => {
				printWindow.print();
			});
		}
	}

	/**
	 * Descarga un documento PDF
	 */
	static descargarPDF(pdfUrl: string, nombreArchivo: string): void {
		const a = document.createElement('a');
		a.href = pdfUrl;
		a.download = nombreArchivo;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	/**
	 * Comparte un documento PDF usando Web Share API
	 */
	static async compartirPDF(
		pdfUrl: string,
		titulo: string,
		nombreArchivo: string
	): Promise<boolean> {
		if (!navigator.share) {
			return false;
		}

		try {
			const response = await fetchWithAuth(pdfUrl);
			const blob = await response.blob();
			const file = new File([blob], nombreArchivo, { type: 'application/pdf' });

			await navigator.share({
				title: titulo,
				text: 'Compartir documento',
				files: [file]
			});

			return true;
		} catch (error) {
			console.error('Error compartiendo:', error);
			return false;
		}
	}
}
