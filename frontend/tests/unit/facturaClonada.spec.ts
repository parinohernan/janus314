import { describe, it, expect } from 'vitest';
import {
	mapearItemFacturaClonada,
	porcentajeBonificacionEncabezado,
	precioListaItemClonado
} from '../../src/lib/utils/facturaClonada';

describe('clonar factura: descuentos y bonificaciones', () => {
	it('copia el descuento de renglón y el precio de lista', () => {
		const item = mapearItemFacturaClonada({
			CodigoArticulo: 'HARINA',
			Descripcion: 'Harina 000',
			Cantidad: 6,
			PrecioLista: 4199.43,
			PrecioUnitario: 3989.46,
			PorcentajeBonificado: 5,
			ImporteBonificado: 209.97,
			PorcentajeIva: 10.5
		});

		expect(item.PorcentajeBonificado).toBe(5);
		expect(item.PrecioLista).toBe(4199.43);
		expect(item.PrecioUnitario).toBe(3989.46);
	});

	it('reconstruye P. Lista si el API no lo manda', () => {
		expect(
			precioListaItemClonado({
				PrecioUnitario: 95,
				PorcentajeBonificado: 5
			})
		).toBeCloseTo(100);
	});

	it('no pisa el descuento a 0', () => {
		expect(mapearItemFacturaClonada({ PorcentajeBonificado: 8 }).PorcentajeBonificado).toBe(8);
	});

	it('copia la bonificación general del encabezado', () => {
		expect(porcentajeBonificacionEncabezado({ PorcentajeBonificacion: 8 })).toBe(8);
		expect(porcentajeBonificacionEncabezado({})).toBe(0);
	});

	it('conserva IVA 0% al clonar el renglón', () => {
		expect(mapearItemFacturaClonada({ PorcentajeIva: 0 }).PorcentajeIva).toBe(0);
		expect(mapearItemFacturaClonada({ PorcentajeIva: '0' }).PorcentajeIva).toBe(0);
	});
});
