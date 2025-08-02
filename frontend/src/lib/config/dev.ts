// Configuración para desarrollo y diagnóstico de navegación
export const devConfig = {
	// Habilitar logs de navegación en desarrollo
	enableNavigationLogs: true,
	
	// Habilitar logs de errores de navegación
	enableErrorLogs: true,
	
	// Configuración para debugging
	debug: {
		navigation: true,
		state: true,
		performance: true
	}
};

// Función para loggear eventos de navegación
export const logNavigation = (event: string, data?: any) => {
	if (devConfig.enableNavigationLogs) {
		console.log(`[Navigation] ${event}`, data);
	}
};

// Función para loggear errores de navegación
export const logNavigationError = (error: Error, context?: string) => {
	if (devConfig.enableErrorLogs) {
		console.error(`[Navigation Error] ${context || 'Unknown context'}:`, error);
	}
}; 