import { describe, it, expect } from 'vitest';
import {
	normalizarListaPrecio,
	datosComercialesDesdeCliente
} from '../../src/lib/utils/facturaClienteDefaults';

describe('datos comerciales del cliente en factura nueva', () => {
	it('normaliza ListaPrecio a un dígito 1-5', () => {
		expect(normalizarListaPrecio('3')).toBe('3');
		expect(normalizarListaPrecio('LISTA2')).toBe('2');
		expect(normalizarListaPrecio(null)).toBe('1');
		expect(normalizarListaPrecio('')).toBe('1');
	});

	it('copia lista y bonificación general del cliente', () => {
		expect(
			datosComercialesDesdeCliente({
				ListaPrecio: '4',
				PorcentajeBonificacionGeneral: 12.5
			})
		).toEqual({ listaPrecio: '4', porcentajeBonificacion: 12.5 });
	});

	it('deja lista 1 y bonificación 0 si el cliente no tiene valores', () => {
		expect(datosComercialesDesdeCliente({})).toEqual({
			listaPrecio: '1',
			porcentajeBonificacion: 0
		});
	});
});
