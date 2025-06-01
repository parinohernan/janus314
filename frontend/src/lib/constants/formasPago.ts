export interface FormaPago {
  codigo: string;
  descripcion: string;
  banco?: string | null;
  numero?: string;
  fecha?: string;
  importe: number;
  aplicaSaldo?: boolean;
}

export interface Banco {
  codigo: string;
  descripcion: string;
}

export const BANCOS: Banco[] = [
  { codigo: 'BNA', descripcion: 'Banco de la Nación Argentina' },
  { codigo: 'BBVA', descripcion: 'Banco BBVA' },
  { codigo: 'GAL', descripcion: 'Banco Galicia' },
  { codigo: 'SAN', descripcion: 'Banco Santander' }
];

export const FORMAS_PAGO: FormaPago[] = [
  {
    codigo: 'EFE',
    descripcion: 'Efectivo $',
    banco: null,
    importe: 0
  },
  {
    codigo: 'TRA',
    descripcion: 'Transferencia',
    banco: '',
    numero: '',
    fecha: '',
    importe: 0
  },
  {
    codigo: 'TAR',
    descripcion: 'Tarjeta',
    banco: '',
    numero: '',
    fecha: '',
    importe: 0
  }
]; 