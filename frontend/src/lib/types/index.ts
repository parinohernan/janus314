export * from './articulo';
export * from './cliente';
export * from './common';
export * from './vendedor';
export * from './tipoDePago';
export * from './articulo';
export * from './cliente';
export * from './factura';
export * from './pedido.types';
export * from './unidadMovil.types';
export * from './usuario.types';
export * from './preventa.types';
export * from './configuracion';
export * from './notaCredito';

export interface ItemFactura {
  ArticuloCodigo: string;
  Descripcion: string;
  Cantidad: number;
  PrecioLista: number;
  PorcentajeBonificacion: number;
  PrecioUnitario: number;
  PorcentajeIva: number;
  PrecioUnitarioConIva: number;
  Total: number;
  enEdicion: boolean;
  Existencia?: number; // Campo opcional para almacenar la existencia del artículo
}
