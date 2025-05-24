export interface Articulo {
	Codigo: string;
	Descripcion: string;
	PrecioCosto: number;
	PrecioVenta?: number;
	PorcentajeIva?: number;
	PorcentajeIva1?: number;
	Existencia: number;
	ExistenciaMinima?: number;
	ExistenciaMaxima?: number;
	ProveedorCodigo?: string;
	RubroCodigo?: string;
	Activo: number;
	Lista1?: number;
	Lista2?: number;
	Lista3?: number;
	Lista4?: number;
	Lista5?: number;
}
