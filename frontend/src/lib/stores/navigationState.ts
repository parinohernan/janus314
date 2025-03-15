import { writable, get } from 'svelte/store';

// Interfaz para el estado de navegación
interface PageState {
	scroll: number;
	pagination?: {
		currentPage: number;
		limit: number;
	};
	filters?: Record<string, any>;
}

const STORAGE_KEY = 'app_navigation_state';

// Recuperar estado guardado del localStorage
const getInitialState = (): Record<string, PageState> => {
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		return saved ? JSON.parse(saved) : {};
	} catch (e) {
		console.warn('Error recuperando estado de navegación:', e);
		return {};
	}
};

// Store que almacena el estado por ruta
const createNavigationStore = () => {
	const { subscribe, update, set } = writable<Record<string, PageState>>(getInitialState());

	// Suscribirse a cambios y guardar en localStorage
	subscribe((state) => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		} catch (e) {
			console.warn('Error guardando estado de navegación:', e);
		}
	});

	return {
		subscribe,
		saveState: (path: string, state: PageState) => {
			console.log(`Guardando estado para ${path}:`, state);
			update((states) => ({
				...states,
				[path]: state
			}));
		},
		getState: (path: string): PageState | null => {
			const states = get({ subscribe });
			const state = states[path] || null;
			console.log(`Recuperando estado para ${path}:`, state);
			return state;
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
