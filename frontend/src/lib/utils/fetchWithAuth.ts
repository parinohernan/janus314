import { get } from 'svelte/store';
import { auth } from '$lib/stores/authStore';
import { PUBLIC_API_URL } from '$env/static/public';
import { browser } from '$app/environment';

export const ssr = false;

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

// Cache para el token - Aumentamos duración para mejorar rendimiento
let tokenCache: string | null = null;
let lastTokenCheck = 0;
const TOKEN_CACHE_DURATION = 30 * 60 * 1000; // 30 minutos en lugar de 5

// Cache para reducir llamadas a headers repetidos
const headerCache: Record<string, HeadersInit> = {};

/**
 * Obtiene el token de autenticación, usando caché para evitar accesos frecuentes al store/localStorage
 */
function getAuthToken(): string | null {
  const now = Date.now();
  
  // Si el caché es válido, retornar el token cacheado
  if (tokenCache && (now - lastTokenCheck) < TOKEN_CACHE_DURATION) {
    return tokenCache;
  }
  
  // Intentar obtener el token del store
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
 * @param token Token de autenticación
 * @returns Headers para fetch
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
 * @param endpoint - Endpoint relativo (sin el PUBLIC_API_URL)
 * @param options - Opciones de fetch
 * @returns Response
 */
export async function fetchWithAuth(endpoint: string, options: FetchOptions = {}) {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Asegurarse de que el endpoint no comienza con /api si PUBLIC_API_URL ya lo incluye
    let cleanEndpoint = endpoint;
    if (PUBLIC_API_URL.endsWith('/api') && endpoint.startsWith('/api')) {
      cleanEndpoint = endpoint.substring(4); // Elimina los primeros 4 caracteres (/api)
    }

    // Construir la URL con los parámetros de consulta si existen
    let url = `${PUBLIC_API_URL}${cleanEndpoint}`;
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
      redirect: 'manual', // Evitar redirecciones automáticas
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

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error('Error en fetchWithAuth:', error);
    throw error;
  }
} 