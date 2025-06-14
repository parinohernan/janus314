/**
 * Formatea una fecha en formato legible
 * @param dateString Fecha en formato ISO o string de fecha
 * @returns Fecha formateada en formato local
 */
export function formatDate(dateString: string): string {
	if (!dateString) return '';
	try {
		// Crear una fecha y ajustar a GMT-3
		const [year, month, day] = dateString.split('-').map(Number);
		const date = new Date(year, month - 1, day);
		return date.toLocaleDateString('es-AR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	} catch (error) {
		console.error('Error al formatear fecha:', error);
		return dateString;
	}
}

/**
 * Formatea una fecha en formato legible sin hora
 * @param dateString Fecha en formato ISO o string de fecha
 * @returns Fecha formateada en formato local (DD/MM/YYYY)
 */
export function formatDateOnly(dateString: string): string {
	if (!dateString) return '';
	try {
		// Crear una fecha en GMT
		const date = new Date(dateString);
		// Ajustar a GMT-3
		const localDate = new Date(date.getTime() - (3 * 60 * 60 * 1000));
		return localDate.toLocaleDateString('es-AR', {
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
	// Ajustar a GMT-3
	const argentinaTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
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
		// Crear una fecha en GMT
		const date = new Date(dateString);
		// Ajustar a GMT-3
		const localDate = new Date(date.getTime() - (3 * 60 * 60 * 1000));
		return localDate.toISOString().split('T')[0];
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
	// Crear fecha en GMT-3
	const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
	return new Date(date.getTime() - (3 * 60 * 60 * 1000));
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

/**
 * Formatea una fecha y hora en formato legible
 * @param dateString Fecha en formato ISO o string de fecha
 * @returns Fecha y hora formateada en formato DD-MM-YYYY HH:mm
 */
export function formatDateTime(dateString: string): string {
	if (!dateString) return '';
	// console.log("dateString", dateString);
	try {
		// Crear una fecha
		const date = new Date(dateString);
		
		// Formatear fecha
		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const year = date.getFullYear();
		
		// Formatear hora
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		
		return `${day}-${month}-${year} ${hours}:${minutes}`;
	} catch (error) {
		console.error('Error al formatear fecha y hora:', error);
		return dateString;
	}
}
