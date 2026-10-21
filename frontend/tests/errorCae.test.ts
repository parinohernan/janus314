import { describe, expect, it } from 'vitest';
import {
	extraerErrorCae,
	requiereComprobanteAsociadoAfip,
	tipoFacturaAsociadaPorNc
} from '../src/lib/utils/errorCae';

describe('extraerErrorCae', () => {
	it('usa error y detalle cuando AFIP responde así', () => {
		expect(
			extraerErrorCae({
				error: 'Error al procesar el documento',
				detalle:
					'Error de AFIP: Código 10197: Si el comprobante es Debito o Credito, enviar estructura CbteAsoc o PeriodoAsoc.'
			})
		).toEqual({
			error: 'Error al procesar el documento',
			detalle:
				'Error de AFIP: Código 10197: Si el comprobante es Debito o Credito, enviar estructura CbteAsoc o PeriodoAsoc.'
		});
	});

	it('acepta message si no hay error', () => {
		expect(extraerErrorCae({ message: 'Faltan datos obligatorios para solicitar CAE' })).toEqual({
			error: 'Faltan datos obligatorios para solicitar CAE'
		});
	});

	it('cae al fallback si el cuerpo no trae texto útil', () => {
		expect(extraerErrorCae({})).toEqual({ error: 'Error al solicitar CAE' });
		expect(extraerErrorCae(null)).toEqual({ error: 'Error al solicitar CAE' });
	});

	it('detecta error AFIP 10197 / CbteAsoc', () => {
		expect(
			requiereComprobanteAsociadoAfip(
				null,
				'Error de AFIP: Código 10197: Si el comprobante es Debito o Credito, enviar estructura CbteAsoc o PeriodoAsoc.'
			)
		).toBe(true);
		expect(requiereComprobanteAsociadoAfip('Otro error')).toBe(false);
	});

	it('sugiere tipo de factura según NC', () => {
		expect(tipoFacturaAsociadaPorNc('NCB')).toBe('FCB');
		expect(tipoFacturaAsociadaPorNc('NCA')).toBe('FCA');
	});
});
