import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { MENU_ENTRIES } from '$lib/config/menuStructure';

const STORAGE_KEY = 'janus314_menu_visibility';

// IDs únicos de todas las entradas (main + submenus)
const ALL_MENU_IDS = MENU_ENTRIES.map((e) => e.id);

const getInitialState = (): Record<string, boolean> => {
	if (!browser) {
		return Object.fromEntries(ALL_MENU_IDS.map((id) => [id, true]));
	}
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			const parsed = JSON.parse(saved) as Record<string, boolean>;
			return Object.fromEntries(
				ALL_MENU_IDS.map((id) => [id, parsed[id] ?? true])
			);
		}
	} catch (e) {
		console.warn('Error leyendo visibilidad del menú:', e);
	}
	return Object.fromEntries(ALL_MENU_IDS.map((id) => [id, true]));
};

const createStore = () => {
	const store = writable<Record<string, boolean>>(getInitialState());

	return {
		subscribe: store.subscribe,
		setVisible: (id: string, visible: boolean) => {
			store.update((state) => {
				const next = { ...state, [id]: visible };
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
				}
				return next;
			});
		},
		isVisible: (id: string): boolean => {
			return get(store)[id] ?? true;
		},
		resetToDefault: () => {
			const defaultState = Object.fromEntries(
				ALL_MENU_IDS.map((id) => [id, true])
			);
			store.set(defaultState);
			if (browser) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
			}
		}
	};
};

export const menuVisibilityStore = createStore();
export { MENU_ENTRIES };
