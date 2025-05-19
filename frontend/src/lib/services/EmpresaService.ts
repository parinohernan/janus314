import { PUBLIC_API_URL } from '$env/static/public';
import { auth } from '$lib/stores/authStore';
import { get } from 'svelte/store';
import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

// Interfaz para los datos de la empresa que coincide con tu API
export interface DatosEmpresa {
	Nombre?: string;
	RazonSocial?: string;
	Domicilio?: string;
	Direccion?: string;
	Telefono?: string;
	EMail?: string;
	Cuit?: string;
	Localidad?: string;
	Sucursal: string; // La API devuelve "Sucursal", no "SucursalPredeterminada"
	LogoURL?: string;
	IngresosBrutos?: string;
	InicioActividades?: string;
	Timezone?: string;
}

export class EmpresaService {
	// Cache para datos de empresa
	private static datosCache: DatosEmpresa | null = null;

	/**
	 * Obtiene los datos de la empresa desde el servidor
	 */
	public static async obtenerDatos(): Promise<DatosEmpresa> {
		try {
			console.log('Iniciando obtenerDatos...');
			
			if (this.datosCache) {
				console.log('Retornando datos desde caché:', this.datosCache);
				return this.datosCache;
			}

			console.log('Realizando petición a:', `/datos-empresa`);
			
			// Usar fetchWithAuth en lugar de fetch directo
			const response = await fetchWithAuth('/datos-empresa');

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Error en la respuesta:', {
					status: response.status,
					statusText: response.statusText,
					body: errorText
				});
				throw new Error(`Error al obtener datos de empresa: ${response.status} ${response.statusText}`);
			}

			const responseData = await response.json();
			console.log('Datos recibidos:', responseData);

			this.datosCache = responseData.data || responseData;

			if (!this.datosCache || !this.datosCache.Sucursal) {
				console.warn('Datos inválidos recibidos, usando predeterminados');
				return this.getDatosPredeterminados();
			}

			console.log('Datos válidos obtenidos:', this.datosCache);
			return this.datosCache;
		} catch (error) {
			console.error('Error en obtenerDatos:', error);
			return this.getDatosPredeterminados();
		}
	}

	/**
	 * Proporciona datos predeterminados de la empresa
	 * cuando no se pueden obtener del servidor
	 */
	private static getDatosPredeterminados(): DatosEmpresa {
		const datosPredeterminados = {
			Nombre: 'Mi Empresa',
			Direccion: 'Dirección no disponible',
			Telefono: 'Teléfono no disponible',
			EMail: 'email@empresa.com',
			Cuit: '00-00000000-0',
			Localidad: 'Ciudad no disponible',
			Sucursal: '0001',
			RazonSocial: 'Mi Empresa S.A.',
			IngresosBrutos: 'No disponible',
			InicioActividades: '',
			Timezone: 'America/Argentina/Buenos_Aires'
		};
		
		console.log('Retornando datos predeterminados:', datosPredeterminados);
		return datosPredeterminados;
	}

	/**
	 * Obtiene solo la sucursal predeterminada
	 */
	public static async obtenerSucursal(): Promise<string> {
		try {
			const datos = await this.obtenerDatos();
			return datos.Sucursal;
		} catch (error) {
			console.error('Error al obtener sucursal:', error);
			return '0001'; // Valor predeterminado en caso de error
		}
	}

	/**
	 * Limpia la caché de datos
	 */
	public static limpiarCache(): void {
		console.log('Limpiando caché de datos de empresa');
		this.datosCache = null;
	}
}
