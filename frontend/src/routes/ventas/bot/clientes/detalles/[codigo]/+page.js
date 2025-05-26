import { error } from '@sveltejs/kit';
import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

// Desactivamos Server-Side Rendering para esta página
export const ssr = false;

export async function load({ params }) {
  try {
    const codigo = params.codigo;
    
    // Obtener datos del cliente
    const response = await fetchWithAuth(`/clientes/${codigo}`);
    
    if (!response.ok) {
      throw error(response.status || 500, `Error al cargar el cliente con código ${codigo}`);
    }
    
    const cliente = await response.json();
    
    if (!cliente) {
      throw error(404, `Cliente con código ${codigo} no encontrado`);
    }
    
    return {
      cliente
    };
  } catch (err) {
    console.error('Error al cargar el cliente:', err);
    throw error(500, 'Error al cargar el cliente. Intente nuevamente.');
  }
} 