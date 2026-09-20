import { describe, expect, it } from 'vitest';
import {
	armarPosTicketDto,
	escapeHtml,
	extraerCae,
	renderPosTicketHtml,
	ticketPrueba
} from '../src/lib/utils/posTicketHtml';

describe('posTicketHtml', () => {
	it('arma el DTO con descripción libre y totales', () => {
		const dto = armarPosTicketDto({
			tipo: 'PRF',
			sucursal: '1',
			numero: '21',
			fecha: '2026-09-20',
			empresa: { Nombre: 'Super Test', Cuit: '20123456789' },
			cliente: { Codigo: 'CF', Descripcion: 'Consumidor Final' },
			items: [{ Cantidad: 2, Descripcion: 'VAR-VER', DescripcionLibre: 'Tomate x kg', Total: 110.5 }],
			totales: { ImporteNeto: 100, ImporteIva1: 10.5, ImporteIva2: 0, ImporteTotal: 110.5 }
		});

		expect(dto.sucursal).toBe('0001');
		expect(dto.items[0].descripcion).toBe('Tomate x kg');
		expect(dto.totales.iva).toBe(10.5);
		expect(dto.totales.total).toBe(110.5);
	});

	it('marca el PRF como no fiscal y escapa HTML', () => {
		const html = renderPosTicketHtml({
			...ticketPrueba(),
			items: [{ cantidad: 1, descripcion: '<script>x</script>', total: 1 }]
		});
		expect(html).toContain('Documento no válido como factura');
		expect(html).toContain('PREFACTURA');
		expect(html).not.toContain('<script>x</script>');
		expect(html).toContain(escapeHtml('<script>x</script>'));
	});

	it('incluye CAE en tickets fiscales', () => {
		const html = renderPosTicketHtml({
			...ticketPrueba(),
			tipo: 'FCB',
			cae: '12345678901234'
		});
		expect(html).toContain('TICKET B');
		expect(html).toContain('CAE 12345678901234');
		expect(html).not.toContain('Documento no válido como factura');
	});

	it('extrae CAE de payloads anidados', () => {
		expect(extraerCae({ cae: 'AAA' })).toBe('AAA');
		expect(extraerCae({ data: { CAE: 'BBB' } })).toBe('BBB');
		expect(extraerCae(null)).toBeUndefined();
	});
});
