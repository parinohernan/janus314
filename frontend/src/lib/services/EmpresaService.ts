import { PUBLIC_API_URL } from '$env/static/public';

// Interfaz para los datos de la empresa
export interface DatosEmpresa {
	Nombre: string;
	Direccion: string;
	Telefono: string;
	Email: string;
	CUIT: string;
	SucursalPredeterminada: string;
	LogoURL?: string;
	IngresosBrutos?: string;
	InicioActividades?: string;
	// Agrega más campos según necesites
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

			// Hacemos la petición al servidor
			const response = await fetch(`${PUBLIC_API_URL}/empresa/datos`);

			if (!response.ok) {
				throw new Error('Error al obtener datos de empresa');
			}

			const data = await response.json();

			// Guardamos en cache
			this.datosCache = data.data;

			return this.datosCache;
		} catch (error) {
			console.error('Error en obtenerDatos:', error);

			// Si hay error, devolvemos datos predeterminados
			const datosPredeterminados: DatosEmpresa = {
				Nombre: 'Mi Empresa',
				Direccion: 'Dirección no disponible',
				Telefono: 'Teléfono no disponible',
				Email: 'email@empresa.com',
				CUIT: '00-00000000-0',
				SucursalPredeterminada: '0001'
			};

			return datosPredeterminados;
		}
	}

	/**
	 * Obtiene solo la sucursal predeterminada
	 */
	public static async obtenerSucursalPredeterminada(): Promise<string> {
		try {
			const datos = await this.obtenerDatos();
			return datos.SucursalPredeterminada;
		} catch (error) {
			console.error('Error al obtener sucursal predeterminada:', error);
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
