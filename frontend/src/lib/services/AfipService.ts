import { PUBLIC_API_URL } from '$env/static/public';

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
			const response = await fetch(`${PUBLIC_API_URL}/arca/grabar-cae`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					tipo: tipo,
					puntoVenta,
					numero,
					solicitarCAE: true
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
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
	 * Verifica el estado del servidor de AFIP
	 * @returns Estado del servidor
	 */
	public static async verificarEstadoServidor() {
		try {
			const response = await fetch(`${PUBLIC_API_URL}/arca/estado`);

			if (!response.ok) {
				return {
					disponible: false,
					mensaje: 'Error al conectar con el servidor de AFIP'
				};
			}

			const data = await response.json();
			return {
				disponible: data.disponible,
				mensaje: data.mensaje || 'Servidor AFIP disponible'
			};
		} catch (error) {
			return {
				disponible: false,
				mensaje: 'Error de conexión con servidor AFIP'
			};
		}
	}
}
