import { get } from 'svelte/store';
import { auth } from '$lib/stores/authStore';
import { PUBLIC_API_URL } from '$env/static/public';
import { browser } from '$app/environment';
import { page } from '$app/stores';

export const ssr = false;

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

// Cache para el token
let tokenCache: string | null = null;
let lastTokenCheck = 0;
const TOKEN_CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

// Cache para headers
const headerCache: Record<string, HeadersInit> = {};

/**
 * Obtiene el token de autenticación
 */
function getAuthToken(): string | null {
  const now = Date.now();
  
  // Si el caché es válido, retornar el token cacheado
  if (tokenCache && (now - lastTokenCheck) < TOKEN_CACHE_DURATION) {
    return tokenCache;
  }
  
  // Verificar si estamos en una ruta del bot
  const currentPath = browser ? window.location.pathname : '';
  const esMiniWebTelegram = currentPath.includes('/ventas/bot/');
  
  if (esMiniWebTelegram) {
    // Para rutas del bot, usar el token temporal
    tokenCache = 'bot-telegram-token-temporal';
    lastTokenCheck = now;
    return tokenCache;
  }
  
  // Para rutas normales, intentar obtener el token del store
  const authState = get(auth);
  let token = authState.token;
  
  // Si no hay token en el store, intentar obtenerlo del localStorage
  if (!token && browser) {
    token = localStorage.getItem('authToken');
  }
  
  // Actualizar caché
  tokenCache = token;
  lastTokenCheck = now;
  
  return token;
}

/**
 * Genera headers con token para las peticiones
 */
function getAuthHeaders(token: string): HeadersInit {
  // Usar caché de headers si ya existe para este token
  if (headerCache[token]) {
    return headerCache[token];
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Origin': 'https://janus314.osvi.lat'
  };
  
  // Guardar en caché
  headerCache[token] = headers;
  
  return headers;
}

/**
 * Helper para hacer peticiones HTTP autenticadas
 */
export async function fetchWithAuth(endpoint: string, options: FetchOptions = {}) {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Asegurarse de que el endpoint no comienza con /api si PUBLIC_API_URL ya lo incluye
    let cleanEndpoint = endpoint;
    let url: string;
    
    if (endpoint.startsWith(PUBLIC_API_URL)) {
      url = endpoint;
    } else {
      url = `${PUBLIC_API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    }

    // Construir la URL con los parámetros de consulta
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        searchParams.append(key, value.toString());
      });
      url += `?${searchParams.toString()}`;
    }

    // Asegurarse de que la URL no termine con /
    url = url.replace(/\/+$/, '');

    // Obtener headers cacheados
    const headers = getAuthHeaders(token);

    const response = await fetch(url, {
      ...options,
      headers,
      redirect: 'manual',
      mode: 'cors'
    });

    // Si hay una redirección, hacer la petición a la nueva URL
    if (response.type === 'opaqueredirect') {
      const redirectUrl = response.headers.get('Location');
      if (redirectUrl) {
        return fetch(redirectUrl, {
          ...options,
          headers,
          mode: 'cors'
        });
      }
    }

    // Para rutas del bot, no redirigir al login en caso de error de autenticación
    const currentPath = browser ? window.location.pathname : '';
    const esMiniWebTelegram = currentPath.includes('/ventas/bot/');

    if (!response.ok && response.status === 401 && !esMiniWebTelegram) {
      // Solo redirigir al login si no estamos en una ruta del bot
      window.location.href = '/login';
      throw new Error('Sesión expirada');
    }

    return response;
  } catch (error) {
    console.error('Error en fetchWithAuth:', error);
    throw error;
  }
} 