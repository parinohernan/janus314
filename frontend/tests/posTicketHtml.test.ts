import { describe, expect, it } from 'vitest';
import {
	armarPosTicketDto,
	escapeHtml,
	extraerCae,
	extraerFiscal,
	renderPosTicketHtml,
	ticketPrueba,
	urlQrArca
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

	it('muestra el logo y los datos de datosempresa en la cabecera', () => {
		const dto = armarPosTicketDto({
			tipo: 'FCB',
			sucursal: '1',
			numero: '8',
			fecha: '2026-10-01',
			empresa: {
				RazonSocial: 'Super Test',
				Domicilio: 'Calle 1',
				DomicilioComercial: 'Av. San Martín 100',
				Localidad: 'Rosario',
				Telefono: '3410000000',
				Cuit: '20-12345678-9',
				CategoriaIva: 'I',
				IngresosBrutos: '20123456789',
				InicioActividades: '2010-05-03',
				LogoURL: 'https://cdn.ejemplo/logo.png'
			},
			cliente: { Codigo: 'CF', Descripcion: 'Consumidor Final' },
			items: [{ Cantidad: 1, Descripcion: 'Pan', Total: 100 }],
			totales: { ImporteNeto: 90, ImporteIva: 10, ImporteTotal: 100 }
		});
		const html = renderPosTicketHtml(dto);
		expect(html).toContain('https://cdn.ejemplo/logo.png');
		expect(html).toContain('Super Test');
		expect(html).toContain('Av. San Martín 100');
		expect(html).not.toContain('Calle 1');
		expect(html).toContain('Rosario');
		expect(html).toContain('CUIT: 20-12345678-9');
		expect(html).toContain('IVA: Responsable Inscrito');
		expect(html).toContain('Ingresos Brutos: 20123456789');
		expect(html).toContain('Inicio de Actividades: 03/05/2010');
	});

	it('incluye CAE en tickets fiscales', () => {
		const html = renderPosTicketHtml({
			...ticketPrueba(),
			tipo: 'FCB',
			cae: '12345678901234'
		});
		expect(html).toContain('TICKET B');
		expect(html).toContain('CAE N°: 12345678901234');
		expect(html).toContain('Esta Agencia no se responsabiliza');
		expect(html).not.toContain('Documento no válido como factura');
	});

	it('arma el QR de ARCA con CAE, vencimiento visible y CUIT', () => {
		const dto = {
			...ticketPrueba(),
			tipo: 'FCA' as const,
			sucursal: '0001',
			numero: '00000015',
			fecha: '2026-10-01',
			cae: '12345678901234',
			caeVencimiento: '2026-10-11',
			empresa: { nombre: 'Super Test', cuit: '20-12345678-9' },
			cliente: { codigo: '1', descripcion: 'Inscripto', cuit: '27-11111111-2', categoriaIva: 'I' },
			totales: { neto: 100, iva: 21, total: 121 }
		};
		const html = renderPosTicketHtml({ ...dto, qr: 'data:image/png;base64,QQ' });
		expect(html).toContain('FACTURA A');
		expect(html).toContain('Fecha Vto. CAE: 11/10/2026');
		expect(html).toContain('data:image/png;base64,QQ');

		const url = urlQrArca(dto);
		expect(url?.startsWith('https://www.arca.gob.ar/fe/qr/?p=')).toBe(true);
		const payload = JSON.parse(Buffer.from(url!.split('p=')[1], 'base64').toString('utf8'));
		expect(payload).toMatchObject({
			ver: 1,
			fecha: '2026-10-01',
			cuit: '20123456789',
			ptoVta: 1,
			tipoCmp: 1,
			nroCmp: 15,
			importe: 121,
			moneda: 'PES',
			ctz: 1,
			tipoDocRec: 80,
			nroDocRec: '27111111112',
			tipoCodAut: 'E',
			codAut: '12345678901234'
		});
		expect(urlQrArca({ ...dto, tipo: 'PRF' })).toBeNull();
		expect(extraerFiscal({ cae: 'AAA', fechaVencimiento: '2026-10-11' })).toEqual({
			cae: 'AAA',
			vencimiento: '2026-10-11'
		});
	});

	it('extrae CAE de payloads anidados', () => {
		expect(extraerCae({ cae: 'AAA' })).toBe('AAA');
		expect(extraerCae({ data: { CAE: 'BBB' } })).toBe('BBB');
		expect(extraerCae(null)).toBeUndefined();
	});
});
