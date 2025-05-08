import { writable } from 'svelte/store';
import type { Cliente, ArticuloSeleccionado } from './types';

export const cliente = writable<Cliente>({ Codigo: 'CF', Descripcion: 'Consumidor Final' });
export const selectedArticulos = writable<ArticuloSeleccionado[]>([]);
export const montoPagado = writable<number>(0);
export const cambio = writable<number>(0); 