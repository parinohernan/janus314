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
			BaseImponible1: 0,
			BaseImponible2: 0,
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

	/**
	 * Obtiene las últimas facturas de un cliente
	 * @param codigoCliente Código del cliente
	 * @param limite Cantidad de facturas a obtener (por defecto 5)
	 */
	public static async obtenerUltimasFacturasCliente(
		codigoCliente: string,
		limite: number = 5
	): Promise<{ success: boolean; data?: any; error?: string }> {
		try {
			console.log('obtener ultimas facturas codigoCliente', codigoCliente);
			console.log('obtener ultimas facturas limite', limite);
			const url = `${PUBLIC_API_URL}/facturas/cliente/${codigoCliente}?limit=${limite}&sort=fecha:desc`;

			const response = await fetch(url);

			if (!response.ok) {
				throw new Error('Error al obtener facturas del cliente');
			}

			const data = await response.json();
			console.log('data', data);
			return {
				success: true,
				data: data.items.map((factura: any) => ({
					tipo: factura.tipo,
					sucursal: factura.sucursal,
					numero: factura.numero,
					fecha: factura.fecha,
					total: factura.total,
					label: `${factura.tipo}-${factura.sucursal}-${factura.numero} (${new Date(factura.fecha).toLocaleDateString()})`
				}))
			};
		} catch (error) {
			console.error('Error al obtener facturas del cliente:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Error desconocido'
			};
		}
	}

	/**
	 * Obtiene el detalle completo de una factura
	 * @param tipo Tipo de factura (FCA, FCB, etc)
	 * @param sucursal Número de sucursal
	 * @param numero Número de factura
	 */
	public static async obtenerDetalleFactura(
		tipo: string,
		sucursal: string,
		numero: string
	): Promise<{ success: boolean; data?: any; error?: string }> {
		try {
			console.log('obtener detalle tipo', tipo);
			console.log('obtener detalle sucursal', sucursal);
			console.log('obtener detalle numero', numero);
			const response = await fetch(`${PUBLIC_API_URL}/facturas/${tipo}/${sucursal}/${numero}`);

			if (!response.ok) {
				throw new Error('Error al obtener detalle de factura');
			}

			const responseData = await response.json();
			// console.log('responseData', responseData);
			// Verificar que la respuesta tenga la estructura esperada
			if (!responseData.success || !responseData.data) {
				throw new Error('Respuesta del servidor inválida');
			}

			return {
				success: true,
				data: responseData.data
			};
		} catch (error) {
			console.error('Error al obtener detalle de factura:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Error desconocido'
			};
		}
	}
}
