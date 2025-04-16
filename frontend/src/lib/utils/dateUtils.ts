/**
 * Formatea una fecha en formato legible
 * @param dateString Fecha en formato ISO o string de fecha
 * @returns Fecha formateada en formato local
 */
export function formatDate(dateString: string): string {
	// Asegurarse de que la fecha se interprete en la zona horaria local
	console.log("dateString",dateString);
	const [year, month, day] = dateString.split('-');
	return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString();
}

/**
 * Formatea una fecha para mostrarse en un input date
 * @param dateString Fecha en formato ISO o string de fecha
 * @returns Fecha en formato YYYY-MM-DD
 */
export function formatDateForInput(dateString: string): string {
	if (!dateString) return '';

	try {
		const date = new Date(dateString);
		return date.toISOString().split('T')[0];
	} catch (error) {
		console.error('Error al formatear fecha para input:', error);
		return '';
	}
}

/**
 * Parsea una fecha en formato YYYY-MM-DD a objeto Date
 * @param dateString Fecha en formato YYYY-MM-DD
 * @returns Objeto Date
 */
export function parseDate(dateString: string): Date {
	const [year, month, day] = dateString.split('-');
	return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

/**
 * Formatea un número como moneda en pesos argentinos
 * @param amount Monto a formatear
 * @returns String formateado como moneda
 */
export const formatCurrency = (amount: number): string => {
	return new Intl.NumberFormat('es-AR', {
		style: 'currency',
		currency: 'ARS',
		minimumFractionDigits: 2
	}).format(amount);
}
