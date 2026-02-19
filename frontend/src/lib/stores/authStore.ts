import { writable } from 'svelte/store';
import type { Usuario } from '$lib/types/usuario.types';
import { authConfig } from '$lib/config/auth.config';
import { PUBLIC_API_URL } from '$env/static/public';
import { browser } from '$app/environment';
import { clearAuthTokenCache } from '$lib/utils/fetchWithAuth';

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
        console.log('Iniciando login con credenciales:', credentials);
        
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

            const mockToken = 'mock-token-local';
            console.log('Login local exitoso, token:', mockToken);

            update(state => ({
              ...state,
              user: mockUser,
              isAuthenticated: true,
              token: mockToken,
              empresa: null
            }));

            if (browser) {
              localStorage.setItem('authToken', mockToken);
              console.log('Token guardado en localStorage');
            }
            return { user: mockUser, token: mockToken };
          }
          throw new Error('Credenciales inválidas');
        }

        // En modo online, hacer la llamada al servidor
        const endpoint = `${PUBLIC_API_URL}${authConfig.endpoints.online.login}`;
        console.log('Haciendo login online en:', endpoint, 'PUBLIC_API_URL:', PUBLIC_API_URL);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type') || '';
          let errorMessage = `Error de autenticación (HTTP ${response.status})`;
          try {
            if (contentType.includes('application/json')) {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } else {
              const text = await response.text();
              if (text) errorMessage = text;
            }
          } catch {
            // ignorar parseos fallidos
          }
          if (response.status === 403) {
            throw new Error(errorMessage || 'Acceso denegado - Solo los administradores pueden acceder al sistema');
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('Respuesta del servidor:', data);
        
        update(state => ({
          ...state,
          user: data.user,
          isAuthenticated: true,
          token: data.token,
          empresa: data.empresa || null
        }));

        if (browser && data.token) {
          localStorage.setItem('authToken', data.token);
          console.log('Token guardado en localStorage');
        }

        return data;
      } catch (error) {
        console.error('Error en login:', error);
        throw error;
      }
    },
    logout: async () => {
      console.log('Iniciando logout');
      
      if (authConfig.mode === 'local') {
        if (browser) {
          localStorage.removeItem('authToken');
          console.log('Token eliminado del localStorage');
        }
        clearAuthTokenCache();
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
          const token = localStorage.getItem('authToken');
          console.log('Haciendo logout online con token:', token);
          
          await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }
      } finally {
        if (browser) {
          localStorage.removeItem('authToken');
          console.log('Token eliminado del localStorage');
        }
        clearAuthTokenCache();
        set({
          user: null,
          isAuthenticated: false,
          token: null,
          empresa: null
        });
      }
    },
    verifySession: async () => {
      console.log('Verificando sesión');
      
      if (!browser) {
        console.log('No es navegador, retornando false');
        return false;
      }

      if (authConfig.mode === 'local') {
        const token = localStorage.getItem('authToken');
        console.log('Modo local, token en localStorage:', token);
        
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

          console.log('Sesión local verificada exitosamente');
          return true;
        }
        console.log('No hay token local válido');
        return false;
      }

      try {
        const token = localStorage.getItem('authToken');
        console.log('Token en localStorage:', token);
        
        if (!token) {
          console.log('No hay token en localStorage');
          return false;
        }

        const endpoint = `${PUBLIC_API_URL}${authConfig.endpoints.online.verify}`;
        console.log('Verificando sesión online en:', endpoint);
        
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          console.log('Verificación fallida:', response.status);
          localStorage.removeItem('authToken');
          return false;
        }

        const data = await response.json();
        console.log('Respuesta de verificación:', data);
        
        update(state => ({
          ...state,
          user: data.user,
          isAuthenticated: true,
          token: data.token,
          empresa: data.empresa || null
        }));

        console.log('Sesión verificada exitosamente');
        return true;
      } catch (error) {
        console.error('Error verificando sesión:', error);
        if (browser) {
          localStorage.removeItem('authToken');
        }
        return false;
      }
    }
  };
}

export const auth = createAuthStore(); 