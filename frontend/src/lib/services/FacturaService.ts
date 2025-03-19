import type { Factura, ItemFactura, Cliente } from '$lib/types';
import { PUBLIC_API_URL } from '$env/static/public';

export class FacturaService {
	/**
	 * Crea una nueva factura en el servidor
	 */
	public static async crearFactura(
		factura: Factura
	): Promise<{ success: boolean; data?: any; error?: string }> {
		try {
			const response = await fetch(`${PUBLIC_API_URL}/facturas`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(factura)
			});

			if (!response.ok) {
				const errorData = await response.json();
				return {
					success: false,
					error: errorData.message || 'Error al crear la factura'
				};
			}

			const data = await response.json();
			return {
				success: true,
				data
			};
		} catch (error) {
			console.error('Error al crear factura:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Error desconocido'
			};
		}
	}

	/**
	 * Obtiene el próximo número de factura disponible
	 */
	public static async obtenerProximoNumero(tipo: string, sucursal: string): Promise<string> {
		try {
			const response = await fetch(`${PUBLIC_API_URL}/numeros-control/${tipo}/${sucursal}`);

			if (!response.ok) {
				throw new Error('Error al obtener próximo número');
			}

			const data = await response.json();
			return data.data.numeroProximo.toString().padStart(8, '0');
		} catch (error) {
			console.error('Error al obtener próximo número:', error);
			return '00000000';
		}
	}

	/**
	 * Inicializa una nueva factura con valores predeterminados
	 */
	public static inicializarFactura(): Factura {
		return {
			DocumentoTipo: 'FCB',
			DocumentoSucursal: '0001',
			DocumentoNumero: '',
			Fecha: new Date().toISOString().substring(0, 10),
			ClienteCodigo: '',
			Cliente: null,
			ListaPrecio: '1',
			ImporteBruto: 0,
			PorcentajeDescuento: 0,
			ImporteDescuento: 0,
			ImporteNeto: 0,
			ImporteIva1: 0,
			ImporteIva2: 0,
			PorcentajeIngresosBrutos: 0,
			ImporteIngresosBrutos: 0,
			ImporteIva: 0,
			ImporteTotal: 0,
			Observacion: '',
			FormaPagoCodigo: '',
			FormaPago: '',
			Items: []
		};
	}
}
