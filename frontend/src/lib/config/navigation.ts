// Configuración para navegación del lado del cliente
export const navigationConfig = {
	// Habilitar preloading de datos
	preloadData: true,
	
	// Configuración para navegación programática
	programmaticNavigation: {
		replaceState: false,
		noScroll: false
	},
	
	// Configuración para manejo de estado
	stateManagement: {
		saveScrollPosition: true,
		restoreScrollPosition: true
	}
};

// Función para verificar si la navegación del lado del cliente está habilitada
export const isClientSideNavigationEnabled = (): boolean => {
	return typeof window !== 'undefined' && 'history' in window;
};

// Función para verificar si estamos en el navegador
export const isBrowser = (): boolean => {
	return typeof window !== 'undefined';
}; 