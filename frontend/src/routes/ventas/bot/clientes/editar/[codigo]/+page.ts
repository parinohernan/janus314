import type { PageLoad } from './$types';
import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

export const load: PageLoad = async ({ params, fetch }) => {
  try {
    const response = await fetchWithAuth(`/clientes/${params.codigo}`, { fetch });
    if (!response.ok) {
      throw new Error('Cliente no encontrado');
    }
    const cliente = await response.json();
    return {
      cliente
    };
  } catch (error) {
    console.error('Error al cargar cliente:', error);
    return {
      cliente: {}
    };
  }
}; 