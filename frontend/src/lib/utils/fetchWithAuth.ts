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
    console.log('Usando token cacheado');
    return tokenCache;
  }
  
  // Intentar obtener el token del store
  const authState = get(auth);
  console.log('Estado de autenticación:', authState);
  let token = authState.token;
  
  // Si no hay token en el store, intentar obtenerlo del localStorage
  if (!token && browser) {
    token = localStorage.getItem('authToken');
    console.log('Token obtenido del localStorage:', token);
  }
  
  // Si aún no hay token, intentar verificar la sesión
  if (!token && browser) {
    console.log('No hay token, intentando verificar sesión...');
    auth.verifySession().then(() => {
      const newAuthState = get(auth);
      token = newAuthState.token;
      console.log('Nuevo estado de autenticación después de verificar:', newAuthState);
    });
  }
  
  // Actualizar caché
  tokenCache = token;
  lastTokenCheck = now;
  
  console.log('Token final:', token);
  return token;
}

/**
 * Genera headers con token para las peticiones
 * @param token Token de autenticación
 * @param options Opciones de fetch
 * @returns Headers para fetch
 */
function getAuthHeaders(token: string, options?: FetchOptions): HeadersInit {
  // Si hay un FormData en el body, no establecer Content-Type
  const isFormData = options?.body instanceof FormData;
  
  // Crear headers base
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Origin': window.location.origin
  };

  // Agregar Content-Type si no es FormData
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Combinar con headers personalizados si existen
  if (options?.headers) {
    Object.assign(headers, options.headers);
  }
  
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
    let url: string;
    
    if (endpoint.startsWith(PUBLIC_API_URL)) {
      // Si el endpoint ya incluye la URL base completa, usarlo tal cual
      url = endpoint;
    } else {
      // Si es una ruta relativa, combinarla con la URL base
      url = `${PUBLIC_API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    }

    // Construir la URL con los parámetros de consulta si existen
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        searchParams.append(key, value.toString());
      });
      url += `?${searchParams.toString()}`;
    }

    // Asegurarse de que la URL no termine con /
    url = url.replace(/\/+$/, '');

    // Obtener headers considerando el tipo de body
    const headers = getAuthHeaders(token, options);

    // console.log('🚀 Enviando petición:', {
    //   url,
    //   method: options.method,
    //   headers,
    //   body: options.body
    // });

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
      mode: 'cors'
    });

    // console.log('📥 Respuesta recibida:', {
    //   status: response.status,
    //   statusText: response.statusText,
    //   headers: Object.fromEntries(response.headers.entries())
    // });

    return response;
  } catch (error) {
    console.error('❌ Error en fetchWithAuth:', error);
    throw error;
  }
} 