import { PUBLIC_API_URL } from '$env/static/public';

// Interfaz para los datos de la empresa que coincide con tu API
export interface DatosEmpresa {
	Nombre?: string;
	Direccion?: string;
	Telefono?: string;
	Email?: string;
	CUIT?: string;
	Sucursal: string; // La API devuelve "Sucursal", no "SucursalPredeterminada"
	LogoURL?: string;
	IngresosBrutos?: string;
	InicioActividades?: string;
}

export class EmpresaService {
	// Cache para datos de empresa
	private static datosCache: DatosEmpresa | null = null;

	/**
	 * Obtiene los datos de la empresa desde el servidor
	 */
	public static async obtenerDatos(): Promise<DatosEmpresa> {
		try {
			// Si ya tenemos los datos en cache, los devolvemos
			if (this.datosCache) {
				return this.datosCache;
			}

			// Hacemos la petición al servidor usando el mismo endpoint que en factura/nueva
			const response = await fetch(`${PUBLIC_API_URL}/datos-empresa`);

			if (!response.ok) {
				throw new Error('Error al obtener datos de empresa');
			}

			const responseData = await response.json();

			// Guardamos en cache - Nota que la API devuelve { data: { ... } }
			this.datosCache = responseData.data;

			// Verificamos que los datos sean válidos
			if (!this.datosCache || !this.datosCache.Sucursal) {
				// Si no lo son, devolvemos datos predeterminados
				return this.getDatosPredeterminados();
			}

			return this.datosCache;
		} catch (error) {
			console.error('Error en obtenerDatos:', error);

			// En caso de error, devolvemos datos predeterminados
			return this.getDatosPredeterminados();
		}
	}

	/**
	 * Proporciona datos predeterminados de la empresa
	 * cuando no se pueden obtener del servidor
	 */
	private static getDatosPredeterminados(): DatosEmpresa {
		return {
			Nombre: 'Mi Empresa',
			Direccion: 'Dirección no disponible',
			Telefono: 'Teléfono no disponible',
			Email: 'email@empresa.com',
			CUIT: '00-00000000-0',
			Sucursal: '0001'
		};
	}

	/**
	 * Obtiene solo la sucursal predeterminada
	 */
	public static async obtenerSucursal(): Promise<string> {
		try {
			const datos = await this.obtenerDatos();
			console.log('datos', datos);
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
		this.datosCache = null;
	}
}
