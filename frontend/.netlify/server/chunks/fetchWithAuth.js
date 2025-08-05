import { g as get } from "./index2.js";
import { a as auth, b as browser } from "./authStore.js";
import { P as PUBLIC_API_URL } from "./public.js";
let tokenCache = null;
let lastTokenCheck = 0;
const TOKEN_CACHE_DURATION = 30 * 60 * 1e3;
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
export {
  fetchWithAuth as f
};
