/**
 * Formatea una fecha en formato legible
 * @param {string} dateString Fecha en formato ISO o string de fecha
 * @returns {string} Fecha formateada en formato local
 */
export function formatDate(dateString) {
	// Asegurarse de que la fecha se interprete en la zona horaria local
	console.log("dateString", dateString);
	const [year, month, day] = dateString.split('-');
	return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString();
}

/**
 * Formatea una fecha para mostrarse en un input date
 * @param {string} dateString Fecha en formato ISO o string de fecha
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function formatDateForInput(dateString) {
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
 * @param {string} dateString Fecha en formato YYYY-MM-DD
 * @returns {Date} Objeto Date
 */
export function parseDate(dateString) {
	const [year, month, day] = dateString.split('-');
	return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

/**
 * Formatea un número como moneda en pesos argentinos
 * @param {number} amount Monto a formatear
 * @returns {string} String formateado como moneda
 */
export const formatCurrency = (amount) => {
	return new Intl.NumberFormat('es-AR', {
		style: 'currency',
		currency: 'ARS',
		minimumFractionDigits: 2
	}).format(amount);
};

// Formatear fecha para mostrar en zona horaria argentina
export const formatDateArgentina = (dateString) => {
	const options = {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		timeZone: 'America/Argentina/Buenos_Aires'
	};

	return new Date(dateString).toLocaleString('es-AR', options);
};

// Formatear solo fecha (sin hora)
export const formatDateOnly = (dateString) => {
	const options = {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		timeZone: 'America/Argentina/Buenos_Aires'
	};

	return new Date(dateString).toLocaleString('es-AR', options);
};

// Obtener fecha actual en formato ISO pero en zona horaria argentina
export const getTodayISOArgentina = () => {
	const now = new Date();
	// Ajustar a GMT-3
	const argentinaTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
	return argentinaTime.toISOString().split('T')[0];
};
