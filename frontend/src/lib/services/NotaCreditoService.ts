import type { NotaCredito, ItemNotaCredito, Cliente } from '$lib/types';
import { PUBLIC_API_URL } from '$env/static/public';

export class NotaCreditoService {
	/**
	 * Crea una nueva nota de crédito en el servidor
	 */
	public static async crearNotaCredito(
		notaCredito: NotaCredito
	): Promise<{ success: boolean; data?: any; error?: string }> {
		try {
			const response = await fetch(`${PUBLIC_API_URL}/notascredito`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(notaCredito)
			});

			if (!response.ok) {
				const errorData = await response.json();
				return {
					success: false,
					error: errorData.message || 'Error al crear la nota de crédito'
				};
			}

			const data = await response.json();
			return {
				success: true,
				data
			};
		} catch (error) {
			console.error('Error al crear nota de crédito:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Error desconocido'
			};
		}
	}

	/**
	 * Obtiene el próximo número de nota de crédito disponible
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
	 * Inicializa una nueva nota de crédito con valores predeterminados
	 */
	public static inicializarNotaCredito(): NotaCredito {
		return {
			DocumentoTipo: 'NCA',
			DocumentoSucursal: '0001',
			DocumentoNumero: '',
			Fecha: new Date().toISOString().substring(0, 10),
			CodigoCliente: '',
			Cliente: null,
			CodigoVendedor: '1',
			ListaNumero: '1',
			ImporteBruto: 0,
			ImporteBonificado: 0,
			ImporteNeto: 0,
			ImporteIva1: 0,
			ImporteIva2: 0,
			BaseImponible1: 0,
			BaseImponible2: 0,
			PorcentajeIva1: 21,
			PorcentajeIva2: 10.5,
			ImporteTotal: 0,
			ImporteUtilizado: 0,
			Observacion: '',
			PorStock: true,
			Items: []
		};
	}

	/**
	 * Obtiene una lista de notas de crédito con paginación
	 */
	public static async obtenerNotasCredito(
		pagina: number = 1,
		limite: number = 10,
		filtros: any = {}
	): Promise<{ success: boolean; data?: any; error?: string }> {
		try {
			let url = `${PUBLIC_API_URL}/notascredito?page=${pagina}&limit=${limite}`;

			// Agregar filtros a la URL si existen
			if (filtros.tipo) url += `&tipo=${filtros.tipo}`;
			if (filtros.cliente) url += `&cliente=${filtros.cliente}`;
			if (filtros.fechaDesde) url += `&fechaDesde=${filtros.fechaDesde}`;
			if (filtros.fechaHasta) url += `&fechaHasta=${filtros.fechaHasta}`;

			const response = await fetch(url);

			if (!response.ok) {
				throw new Error('Error al obtener notas de crédito');
			}

			const data = await response.json();
			return {
				success: true,
				data
			};
		} catch (error) {
			console.error('Error al obtener notas de crédito:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Error desconocido'
			};
		}
	}

	/**
	 * Obtiene el detalle de una nota de crédito específica
	 */
	public static async obtenerDetalleNotaCredito(
		tipo: string,
		sucursal: string,
		numero: string
	): Promise<{ success: boolean; data?: any; error?: string }> {
		try {
			const response = await fetch(`${PUBLIC_API_URL}/notascredito/${tipo}/${sucursal}/${numero}`);

			if (!response.ok) {
				throw new Error('Error al obtener detalle de nota de crédito');
			}

			const data = await response.json();
			return {
				success: true,
				data
			};
		} catch (error) {
			console.error('Error al obtener detalle de nota de crédito:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Error desconocido'
			};
		}
	}

	/**
	 * Anula una nota de crédito existente
	 */
	public static async anularNotaCredito(
		tipo: string,
		sucursal: string,
		numero: string
	): Promise<{ success: boolean; data?: any; error?: string }> {
		try {
			const response = await fetch(
				`${PUBLIC_API_URL}/notascredito/anular/${tipo}/${sucursal}/${numero}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				return {
					success: false,
					error: errorData.message || 'Error al anular la nota de crédito'
				};
			}

			const data = await response.json();
			return {
				success: true,
				data
			};
		} catch (error) {
			console.error('Error al anular nota de crédito:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Error desconocido'
			};
		}
	}
}
