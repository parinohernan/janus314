import { writable } from 'svelte/store';
import { PUBLIC_API_URL } from '$env/static/public';
import { browser } from '$app/environment';

const ADMIN_TOKEN_KEY = 'adminToken';

interface AdminState {
  token: string | null;
  usuario: string | null;
  isAuthenticated: boolean;
}

function readStoredToken(): string | null {
  if (!browser) return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

function createAdminAuthStore() {
  const { subscribe, set, update } = writable<AdminState>({
    token: null,
    usuario: null,
    isAuthenticated: false
  });

  return {
    subscribe,
    login: async (usuario: string, password: string) => {
      const response = await fetch(`${PUBLIC_API_URL}/auth/superadmin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      });

      if (!response.ok) {
        let message = 'Credenciales inválidas';
        try {
          const data = await response.json();
          message = data.error || message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      const data = await response.json();
      if (browser) {
        localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      }
      update(() => ({
        token: data.token,
        usuario: data.user?.usuario || usuario,
        isAuthenticated: true
      }));
      return data;
    },
    logout: () => {
      if (browser) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
      }
      set({ token: null, usuario: null, isAuthenticated: false });
    },
    hydrate: () => {
      const token = readStoredToken();
      if (!token) {
        set({ token: null, usuario: null, isAuthenticated: false });
        return false;
      }
      update((state) => ({
        ...state,
        token,
        isAuthenticated: true
      }));
      return true;
    },
    getToken: () => readStoredToken()
  };
}

export const adminAuth = createAdminAuthStore();
export { ADMIN_TOKEN_KEY };
