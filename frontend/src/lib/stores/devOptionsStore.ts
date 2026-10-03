import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'janus-dev-options';
const DEV_PASSWORD = 'tel0303456';

function createDevOptionsStore() {
	const { subscribe, set } = writable(false);

	return {
		subscribe,
		hydrate() {
			if (!browser) return;
			set(sessionStorage.getItem(STORAGE_KEY) === '1');
		},
		unlock(password: string) {
			if (password !== DEV_PASSWORD) return false;
			if (browser) sessionStorage.setItem(STORAGE_KEY, '1');
			set(true);
			return true;
		},
		lock() {
			if (browser) sessionStorage.removeItem(STORAGE_KEY);
			set(false);
		}
	};
}

export const devOptions = createDevOptionsStore();
