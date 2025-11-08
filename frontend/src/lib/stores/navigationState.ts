import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

// Interfaz para el estado de navegación
interface PageState {
	scroll: number;
	pagination?: {
		currentPage: number;
		limit: number;
	};
	filters?: Record<string, any>;
}

// Estado de navegación para diferentes rutas
type NavigationState = Record<string, PageState>;

const getInitialState = (): NavigationState => {
	if (!browser) {
		return {};
	}

	try {
		const savedState = localStorage.getItem('navigationState');
		return savedState ? JSON.parse(savedState) : {};
	} catch (error) {
		console.error('Error recuperando estado de navegación:', error);
		return {};
	}
};

export const createNavigationStore = () => {
	const store = writable<NavigationState>(getInitialState());
	const { subscribe, set, update } = store;

	// Guardar en localStorage cuando el store cambia
	if (browser) {
		subscribe((value) => {
			try {
				localStorage.setItem('navigationState', JSON.stringify(value));
			} catch (error) {
				console.error('Error guardando estado de navegación:', error);
			}
		});
	}

	return {
		subscribe,
		saveState: (path: string, state: PageState) => {
			update((states) => {
				const newStates = { ...states, [path]: state };
				// Guardar inmediatamente en localStorage de forma síncrona
				if (browser) {
					try {
						localStorage.setItem('navigationState', JSON.stringify(newStates));
					} catch (error) {
						console.error('Error guardando estado de navegación:', error);
					}
				}
				return newStates;
			});
		},
		getState: (path: string): PageState | null => {
			// Leer directamente desde localStorage para asegurar que tenemos el valor más reciente
			if (browser) {
				try {
					const savedState = localStorage.getItem('navigationState');
					if (savedState) {
						const states = JSON.parse(savedState);
						return states[path] || null;
					}
				} catch (error) {
					console.error('Error recuperando estado de navegación:', error);
				}
			}
			// Fallback al store
			const states = get(store);
			return states[path] || null;
		},
		clearState: (path: string) => {
			update((states) => {
				const newStates = { ...states };
				delete newStates[path];
				return newStates;
			});
		},
		clearAll: () => set({})
	};
};

export const navigationState = createNavigationStore();
