import { get } from 'svelte/store';
import { auth } from '$lib/stores/authStore';
import { PUBLIC_API_URL } from '$env/static/public';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

/**
 * Helper para hacer peticiones HTTP autenticadas
 * @param endpoint - Endpoint relativo (sin el PUBLIC_API_URL)
 * @param options - Opciones de fetch
 * @returns Response
 */
export async function fetchWithAuth(endpoint: string, options: FetchOptions = {}) {
  try {
    const authState = get(auth);
    if (!authState.token) {
      throw new Error('No hay token de autenticación');
    }

    // Construir la URL con los parámetros de consulta si existen
    let url = `${PUBLIC_API_URL}${endpoint}`;
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        searchParams.append(key, value.toString());
      });
      url += `?${searchParams.toString()}`;
    }

    // Agregar el token a los headers
    const headers = {
      'Authorization': `Bearer ${authState.token}`,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error('Error en fetchWithAuth:', error);
    throw error;
  }
} 