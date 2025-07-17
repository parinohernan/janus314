import { PUBLIC_API_URL } from '$env/static/public';
import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

export interface UltimoComprobante {
	tipo: string;
	descripcion: string;
	ultimoComprobante: string | number;
	puntoVenta: string;
}

export interface EstadoArca {
	disponible: boolean;
	mensaje: string;
	ultimosComprobantes: UltimoComprobante[];
}

export class AfipService {
	/**
	 * Obtiene el CAE para una factura
	 * @param tipo Tipo de documento
	 * @param puntoVenta Punto de venta (sucursal)
	 * @param numero Número de comprobante
	 * @returns Resultado de la operación con el CAE
	 */
	public static async obtenerCae(tipo: string, puntoVenta: string, numero: string) {
		try {
			// Mapear tipos de documento a los códigos de AFIP si es necesario
			const tipoAfip = this.mapearTipoDocumento(tipo);
			// Llamar al endpoint de nuestro backend (que actúa como proxy)
			console.log('Llamando al endpoint de nuestro backend...');
			const response = await fetchWithAuth(`/afip/grabar-cae`, {
				method: 'POST',
				body: JSON.stringify({
					tipo: tipo,
					puntoVenta,
					numero,
					solicitarCAE: true
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.log('Error al solicitar CAE:', errorData);
				return {
					success: false,
					error: errorData.message || 'Error al solicitar CAE'
				};
			}

			const data = await response.json();
			console.log('Respuesta del servicio de CAE:', data);

			return {
				success: true,
				data
			};
		} catch (error) {
			console.error('Error en servicio AFIP:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Error desconocido en servicio AFIP'
			};
		}
	}

	/**
	 * Mapea los tipos de documento internos a los códigos de AFIP
	 */
	private static mapearTipoDocumento(tipo: string): string {
		// Códigos según documentación de AFIP
		const mapeo: Record<string, string> = {
			FCB: '6', // Factura B
			FCA: '1', // Factura A
			NCB: '8', // Nota de Crédito B
			NCA: '3', // Nota de Crédito A
			NDB: '7', // Nota de Débito B
			NDA: '2' // Nota de Débito A
		};

		return mapeo[tipo] || tipo;
	}

	/**
	 * Verifica el estado del servidor de AFIP y obtiene los últimos comprobantes
	 * @param puntoVenta Punto de venta (sucursal) a consultar
	 * @returns Estado del servidor y últimos comprobantes
	 */
	public static async obtenerEstadoArca(puntoVenta: string): Promise<EstadoArca> {
		try {
			const response = await fetchWithAuth(`/afip/estado-completo?puntoVenta=${puntoVenta}`);

			if (!response.ok) {
				throw new Error('Error al obtener estado de ARCA');
			}

			const data = await response.json();
			return {
				disponible: data.disponible,
				mensaje: data.mensaje || 'Servidor ARCA disponible',
				ultimosComprobantes: data.ultimosComprobantes || []
			};
		} catch (error) {
			console.error('Error al obtener estado de ARCA:', error);
			return {
				disponible: false,
				mensaje: 'Error de conexión con servidor ARCA',
				ultimosComprobantes: []
			};
		}
	}

	/**
	 * Obtiene el último número de comprobante para un tipo específico
	 * @param tipo Tipo de comprobante (FCA, FCB, etc)
	 * @param puntoVenta Punto de venta
	 * @returns Último número de comprobante
	 */
	public static async obtenerUltimoComprobante(tipo: string, puntoVenta: string): Promise<string> {
		try {
			const response = await fetchWithAuth(`/afip/ultimo-comprobante`, {
				method: 'POST',
				body: JSON.stringify({
					tipo,
					puntoVenta
				})
			});

			if (!response.ok) {
				throw new Error('Error al obtener último comprobante');
			}

			const data = await response.json();
			return data.ultimoNumero;
		} catch (error) {
			console.error('Error al obtener último comprobante:', error);
			throw error;
		}
	}

	/**
	 * Coloca CAE manualmente
	 * Permite al usuario ingresar el CAE y vencimiento manualmente
	 * @param tipo Tipo de documento (FCA, FCB, NCA, NCB)
	 * @param puntoVenta Punto de venta (sucursal)
	 * @param numero Número de comprobante
	 * @param cae Número de CAE
	 * @param fechaVencimiento Fecha de vencimiento del CAE (YYYY-MM-DD)
	 * @returns Resultado de la operación
	 */
	public static async colocarCaeManualmente(
		tipo: string, 
		puntoVenta: string, 
		numero: string,
		cae: string,
		fechaVencimiento: string
	): Promise<{
		success: boolean;
		data?: {
			mensaje: string;
			documento: {
				tipo: string;
				puntoVenta: number;
				numero: number;
				cliente: string;
				fecha: string;
				importeNeto: number;
				importeIva: number;
				total: number;
			};
			cae: {
				numero: string;
				fechaVencimiento: string;
				resultado: string;
			};
		};
		error?: string;
	}> {
		try {
			console.log('📝 Colocando CAE manualmente para:', { tipo, puntoVenta, numero, cae, fechaVencimiento });
			
			const response = await fetchWithAuth(`/afip/colocar-cae-manualmente`, {
				method: 'POST',
				body: JSON.stringify({
					tipo,
					puntoVenta,
					numero,
					cae,
					fechaVencimiento
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Error al colocar CAE manualmente:', errorData);
				return {
					success: false,
					error: errorData.message || 'Error al colocar CAE manualmente'
				};
			}

			const data = await response.json();
			console.log('✅ CAE colocado manualmente exitosamente:', data);

			return {
				success: true,
				data
			};
		} catch (error) {
			console.error('Error en servicio AFIP - colocar CAE manualmente:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Error desconocido al colocar CAE manualmente'
			};
		}
	}
}
