/**
 * Interfaz para las configuraciones del sistema
 */
export interface Configuracion {
	Codigo: string;
	Descripcion: string;
	ValorConfig: string;
	Tipo?: string;
	Activo?: number;
}
