import { g as get, w as writable } from "./index2.js";
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
let tokenCache = null;
let lastTokenCheck = 0;
const TOKEN_CACHE_DURATION = 30 * 60 * 1e3;
function clearAuthTokenCache() {
  tokenCache = null;
  lastTokenCheck = 0;
}
function getAuthToken() {
  const now = Date.now();
  if (tokenCache && now - lastTokenCheck < TOKEN_CACHE_DURATION) {
    console.log("Usando token cacheado");
    return tokenCache;
  }
  const authState = get(auth);
  console.log("Estado de autenticación:", authState);
  let token = authState.token;
  if (!token && browser) {
    token = localStorage.getItem("authToken");
    console.log("Token obtenido del localStorage:", token);
  }
  if (!token && browser) {
    console.log("No hay token, intentando verificar sesión...");
    auth.verifySession().then(() => {
      const newAuthState = get(auth);
      token = newAuthState.token;
      console.log("Nuevo estado de autenticación después de verificar:", newAuthState);
    });
  }
  tokenCache = token;
  lastTokenCheck = now;
  console.log("Token final:", token);
  return token;
}
function getAuthHeaders(token, options) {
  const isFormData = options?.body instanceof FormData;
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/json",
    "Origin": window.location.origin
  };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (options?.headers) {
    Object.assign(headers, options.headers);
  }
  return headers;
}
async function fetchWithAuth(endpoint, options = {}) {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No hay token de autenticación");
    }
    let cleanEndpoint = endpoint;
    let url;
    if (endpoint.startsWith(PUBLIC_API_URL)) {
      url = endpoint;
    } else {
      url = `${PUBLIC_API_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    }
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        searchParams.append(key, value.toString());
      });
      url += `?${searchParams.toString()}`;
    }
    url = url.replace(/\/+$/, "");
    const headers = getAuthHeaders(token, options);
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
      mode: "cors"
    });
    return response;
  } catch (error) {
    console.error("❌ Error en fetchWithAuth:", error);
    throw error;
  }
}
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
        console.log("Haciendo login online en:", endpoint, "PUBLIC_API_URL:", PUBLIC_API_URL);
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials)
        });
        if (!response.ok) {
          const contentType = response.headers.get("content-type") || "";
          let errorMessage = `Error de autenticación (HTTP ${response.status})`;
          try {
            if (contentType.includes("application/json")) {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } else {
              const text = await response.text();
              if (text) errorMessage = text;
            }
          } catch {
          }
          if (response.status === 403) {
            throw new Error(errorMessage || "Acceso denegado - Solo los administradores pueden acceder al sistema");
          }
          throw new Error(errorMessage);
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
  fetchWithAuth as f
};
