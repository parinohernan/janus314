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
 * Formatea una fecha en formato legible sin hora
 * @param dateString Fecha en formato ISO o string de fecha
 * @returns Fecha formateada en formato local (DD/MM/YYYY)
 */
export function formatDateOnly(dateString: string): string {
	if (!dateString) return '';
	try {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-AR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	} catch (error) {
		console.error('Error al formatear fecha:', error);
		return '';
	}
}

/**
 * Obtiene la fecha actual en formato ISO para Argentina (GMT-3)
 * @returns Fecha en formato YYYY-MM-DD
 */
export function getTodayISOArgentina(): string {
	const now = new Date();
	// Ajustar a la zona horaria de Argentina (GMT-3)
	const argentinaTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
	return argentinaTime.toISOString().split('T')[0];
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
