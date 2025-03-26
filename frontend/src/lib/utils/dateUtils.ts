/**
 * Formatea una fecha en formato legible
 * @param dateString Fecha en formato ISO o string de fecha
 * @returns Fecha formateada en formato local
 */
export function formatDate(dateString: string): string {
	if (!dateString) return 'N/A';

	try {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-AR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	} catch (error) {
		console.error('Error al formatear fecha:', error);
		return 'Fecha inválida';
	}
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
