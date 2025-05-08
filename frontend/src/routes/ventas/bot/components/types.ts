export interface Articulo {
  Codigo: string;
  Descripcion: string;
  PrecioVenta?: number;
  PrecioCosto?: number;
  Lista1?: number;
  Lista2?: number;
  Lista3?: number;
  Lista4?: number;
  Lista5?: number;
  Existencia?: number;
  PorcentajeIVA1?: number;
}

export interface Cliente {
  Codigo: string;
  Descripcion: string;
}

export interface ArticuloSeleccionado extends Articulo {
  cantidadEntera: number;
  cantidadDecimal: number;
} 