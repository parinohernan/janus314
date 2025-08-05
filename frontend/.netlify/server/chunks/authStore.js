import { w as writable } from "./index2.js";
import { P as PUBLIC_API_URL } from "./public.js";
import { D as DEV } from "./utils.js";
const browser = DEV;
const DEFAULT_AUTH_MODE = "online";
const authConfig = {
  mode: DEFAULT_AUTH_MODE,
  endpoints: {
    local: {
      login: "/auth/local/login",
      logout: "/auth/local/logout",
      verify: "/auth/local/verify"
    },
    online: {
      login: "/auth/online/login",
      logout: "/auth/online/logout",
      verify: "/auth/online/verify"
    }
  }
};
const DEFAULT_CREDENTIALS = {
  usuario: "admin",
  password: "admin123"
};
function createAuthStore() {
  const { subscribe, set, update } = writable({
    user: null,
    isAuthenticated: false,
    token: null,
    empresa: null
  });
  return {
    subscribe,
    login: async (credentials) => {
      try {
        console.log("Iniciando login con credenciales:", credentials);
        if (authConfig.mode === "local") ;
        const endpoint = `${PUBLIC_API_URL}${authConfig.endpoints.online.login}`;
        console.log("Haciendo login online en:", endpoint);
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials)
        });
        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 403) {
            throw new Error(errorData.error || "Acceso denegado - Solo los administradores pueden acceder al sistema");
          }
          throw new Error(errorData.error || "Error de autenticación");
        }
        const data = await response.json();
        console.log("Respuesta del servidor:", data);
        update((state) => ({
          ...state,
          user: data.user,
          isAuthenticated: true,
          token: data.token,
          empresa: data.empresa || null
        }));
        if (browser && data.token) ;
        return data;
      } catch (error) {
        console.error("Error en login:", error);
        throw error;
      }
    },
    logout: async () => {
      console.log("Iniciando logout");
      const endpoint = `${PUBLIC_API_URL}${authConfig.endpoints.online.logout}`;
      try {
        if (browser) ;
      } finally {
        set({
          user: null,
          isAuthenticated: false,
          token: null,
          empresa: null
        });
      }
    },
    verifySession: async () => {
      console.log("Verificando sesión");
      {
        console.log("No es navegador, retornando false");
        return false;
      }
    }
  };
}
const auth = createAuthStore();
export {
  auth as a,
  browser as b
};
