import type { Factura, ItemFactura } from '$lib/types';

export class FacturaCalculator {
	/**
	 * Recalcula todos los totales de la factura
	 */
	public static recalcularTotales(factura: Factura): Factura {
		// Copia para no mutar el original
		const facturaActualizada = { ...factura };

		// Calcular importe bruto (suma de todos los ítems)
		facturaActualizada.ImporteBruto = this.calcularImporteBruto(facturaActualizada.Items);

		// Calcular descuento
		facturaActualizada.ImporteDescuento =
			(facturaActualizada.ImporteBruto * facturaActualizada.PorcentajeDescuento) / 100;

		// Calcular neto (bruto - descuento)
		facturaActualizada.ImporteNeto =
			facturaActualizada.ImporteBruto - facturaActualizada.ImporteDescuento;

		// Calcular IVA
		const { iva1, iva2 } = this.calcularImpuestos(facturaActualizada.Items);
		facturaActualizada.ImporteIva1 = iva1;
		facturaActualizada.ImporteIva2 = iva2;
		facturaActualizada.ImporteIva = iva1 + iva2;

		// Calcular ingresos brutos si aplica
		facturaActualizada.ImporteIngresosBrutos =
			(facturaActualizada.ImporteNeto * facturaActualizada.PorcentajeIngresosBrutos) / 100;

		// Calcular total final
		facturaActualizada.ImporteTotal =
			facturaActualizada.ImporteNeto +
			facturaActualizada.ImporteIva +
			facturaActualizada.ImporteIngresosBrutos;

		return facturaActualizada;
	}

	/**
	 * Calcula el importe bruto a partir de los ítems
	 */
	private static calcularImporteBruto(items: ItemFactura[]): number {
		return items.reduce((total, item) => {
			return total + item.PrecioUnitario * item.Cantidad;
		}, 0);
	}

	/**
	 * Calcula los impuestos (IVA) para los ítems de la factura
	 */
	private static calcularImpuestos(items: ItemFactura[]): { iva1: number; iva2: number } {
		let iva1 = 0;
		let iva2 = 0;

		items.forEach((item) => {
			// Asumiendo que IVA1 es para ítems con IVA estándar (21%) y IVA2 para otros porcentajes
			if (item.PorcentajeIva === 21) {
				iva1 += item.PrecioUnitario * item.Cantidad * (item.PorcentajeIva / 100);
			} else {
				iva2 += item.PrecioUnitario * item.Cantidad * (item.PorcentajeIva / 100);
			}
		});

		return { iva1, iva2 };
	}

	/**
	 * Calcula el precio con IVA para un ítem
	 */
	public static calcularPrecioConIva(precioUnitario: number, porcentajeIva: number): number {
		return precioUnitario * (1 + porcentajeIva / 100);
	}
}
