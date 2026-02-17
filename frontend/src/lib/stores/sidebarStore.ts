import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'janus314_sidebar_collapsed';

// Estado inicial
const initialCollapsed = browser 
  ? localStorage.getItem(STORAGE_KEY) === 'true'
  : false;

export const sidebarCollapsed = writable<boolean>(initialCollapsed);

// Suscribirse a cambios para persistir en localStorage
sidebarCollapsed.subscribe(value => {
  if (browser) {
    localStorage.setItem(STORAGE_KEY, value.toString());
  }
});
