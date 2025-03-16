// Formatear fecha para mostrar en zona horaria argentina
export const formatDate = (dateString) => {
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
