// Configuración del entorno
export const environment = {
	// Verificar si estamos en desarrollo
	isDevelopment: import.meta.env.DEV,
	
	// Verificar si estamos en producción
	isProduction: import.meta.env.PROD,
	
	// Verificar si estamos en el navegador
	isBrowser: typeof window !== 'undefined',
	
	// Verificar si estamos en el servidor
	isServer: typeof window === 'undefined',
	
	// Configuración específica del entorno
	config: {
		// Habilitar navegación del lado del cliente
		enableClientSideNavigation: true,
		
		// Habilitar preloading de datos
		enableDataPreloading: true,
		
		// Habilitar logging en desarrollo
		enableLogging: import.meta.env.DEV,
		
		// Configuración de caché
		cache: {
			enabled: true,
			maxAge: 5 * 60 * 1000 // 5 minutos
		}
	}
};

// Función para verificar si la navegación del lado del cliente está disponible
export const isClientSideNavigationAvailable = (): boolean => {
	return environment.isBrowser && 
		   environment.config.enableClientSideNavigation && 
		   'history' in window;
};

// Función para obtener la configuración del entorno actual
export const getEnvironmentConfig = () => {
	return {
		...environment,
		clientSideNavigation: isClientSideNavigationAvailable()
	};
}; 