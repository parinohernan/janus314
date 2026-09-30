import { describe, expect, it } from 'vitest';
import { extraerErrorCae } from '../src/lib/utils/errorCae';

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
});
