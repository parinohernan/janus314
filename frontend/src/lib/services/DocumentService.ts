import { PUBLIC_API_URL } from '$env/static/public';
import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

export class DocumentService {
	/**
	 * Genera un PDF para un documento específico (factura, nota de crédito o nota de débito)
	 */
	static async generarPDF(tipo: string, sucursal: string, numero: string): Promise<string> {
		try {
			// Determinar el endpoint según el tipo de documento
			let endpoint = '/facturas/pdf';
			
			// Si es nota de crédito (tipos que empiezan con NC)
			if (tipo.startsWith('NC')) {
				endpoint = '/notascredito/pdf';
			}
			// Si es nota de débito (tipos que empiezan con ND)
			else if (tipo.startsWith('ND')) {
				endpoint = '/notasdebito/pdf';
			}
			// Si es orden de compra (OC)
			else if (tipo === 'OC') {
				endpoint = '/ordenes-compra/pdf';
			}
			
			const url = `${endpoint}/${tipo}/${sucursal}/${numero}`;
			console.log('URL PDF:', url);
			
			const response = await fetchWithAuth(
				url,
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
