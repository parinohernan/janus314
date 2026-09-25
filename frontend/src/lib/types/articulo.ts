export interface Articulo {
	Codigo: string;
	Descripcion: string;
	PrecioCosto: number;
	PrecioCostoMasImp?: number;
	FechaActualizacionCosto?: string | Date | null;
	PrecioVenta?: number;
	PorcentajeIva?: number;
	PorcentajeIva1?: number;
	PorcentajeIVA1?: number; // Campo real de la base de datos
	CodigoBarras?: string;
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
	Proveedor?: { Codigo?: string; Descripcion?: string };
	Rubro?: { Codigo?: string; Descripcion?: string };
}
