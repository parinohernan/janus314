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
	const { subscribe, set, update } = writable<NavigationState>(getInitialState());

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
			update((states) => ({ ...states, [path]: state }));
		},
		getState: (path: string): PageState | null => {
			const states = get({ subscribe });
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
