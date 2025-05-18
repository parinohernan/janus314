import { writable } from 'svelte/store';
import type { Usuario } from '$lib/types/usuario.types';
import { authConfig } from '$lib/config/auth.config';
import { PUBLIC_API_URL } from '$env/static/public';
import { browser } from '$app/environment';

interface AuthState {
  user: Usuario | null;
  isAuthenticated: boolean;
  token: string | null;
  empresa?: {
    id: string;
    nombre: string;
    baseDatos: string;
  } | null;
}

// Credenciales por defecto para modo local
const DEFAULT_CREDENTIALS = {
  usuario: 'admin',
  password: 'admin123'
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    isAuthenticated: false,
    token: null,
    empresa: null
  });

  return {
    subscribe,
    login: async (credentials: { usuario: string; password: string; empresa?: string }) => {
      try {
        // En modo local, verificar credenciales por defecto
        if (authConfig.mode === 'local') {
          if (credentials.usuario === DEFAULT_CREDENTIALS.usuario && 
              credentials.password === DEFAULT_CREDENTIALS.password) {
            const mockUser: Usuario = {
              id: '1',
              nombre: 'Administrador de',
              apellido: 'Sistema',
              usuario: 'admin',
              rol: 'admin',
              activo: true,
              fechaCreacion: new Date().toISOString()
            };

            update(state => ({
              ...state,
              user: mockUser,
              isAuthenticated: true,
              token: 'mock-token-local',
              empresa: null
            }));

            if (browser) {
              localStorage.setItem('authToken', 'mock-token-local');
            }
            return { user: mockUser, token: 'mock-token-local' };
          }
          throw new Error('Credenciales inválidas');
        }

        // En modo online, hacer la llamada al servidor
        const endpoint = `${PUBLIC_API_URL}${authConfig.endpoints.online.login}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        });

        if (!response.ok) throw new Error('Error de autenticación');

        const data = await response.json();
        
        update(state => ({
          ...state,
          user: data.user,
          isAuthenticated: true,
          token: data.token,
          empresa: data.empresa || null
        }));

        if (browser && data.token) {
          localStorage.setItem('authToken', data.token);
        }

        return data;
      } catch (error) {
        throw error;
      }
    },
    logout: async () => {
      if (authConfig.mode === 'local') {
        if (browser) {
          localStorage.removeItem('authToken');
        }
        set({
          user: null,
          isAuthenticated: false,
          token: null,
          empresa: null
        });
        return;
      }

      const endpoint = `${PUBLIC_API_URL}${authConfig.endpoints.online.logout}`;
      try {
        if (browser) {
          await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });
        }
      } finally {
        if (browser) {
          localStorage.removeItem('authToken');
        }
        set({
          user: null,
          isAuthenticated: false,
          token: null,
          empresa: null
        });
      }
    },
    verifySession: async () => {
      if (!browser) {
        return false;
      }

      if (authConfig.mode === 'local') {
        const token = localStorage.getItem('authToken');
        if (token === 'mock-token-local') {
          const mockUser: Usuario = {
            id: '1',
            nombre: 'Administrador',
            apellido: 'Sistema',
            usuario: 'admin',
            rol: 'admin',
            activo: true,
            fechaCreacion: new Date().toISOString()
          };

          update(state => ({
            ...state,
            user: mockUser,
            isAuthenticated: true,
            token: 'mock-token-local',
            empresa: null
          }));

          return true;
        }
        return false;
      }

      try {
        const token = localStorage.getItem('authToken');
        if (!token) return false;

        const endpoint = `${PUBLIC_API_URL}${authConfig.endpoints.online.verify}`;
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          localStorage.removeItem('authToken');
          return false;
        }

        const data = await response.json();
        
        update(state => ({
          ...state,
          user: data.user,
          isAuthenticated: true,
          token: data.token,
          empresa: data.empresa || null
        }));

        return true;
      } catch {
        if (browser) {
          localStorage.removeItem('authToken');
        }
        return false;
      }
    }
  };
}

export const auth = createAuthStore(); 