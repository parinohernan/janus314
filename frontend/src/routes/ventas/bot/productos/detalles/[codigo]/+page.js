import { error } from '@sveltejs/kit';
import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

// Desactivamos Server-Side Rendering para esta página
// ya que necesitamos acceso al token de autenticación que solo está disponible en el cliente
export const ssr = false;

export async function load({ params }) {
  try {
    const codigo = params.codigo;
    
    // Usamos fetchWithAuth para hacer la petición autenticada
    const response = await fetchWithAuth(`/articulos/${codigo}`);
    
    if (!response.ok) {
      throw error(response.status || 500, `Error al cargar el producto con código ${codigo}`);
    }
    
    const articulo = await response.json();
    
    if (!articulo) {
      throw error(404, `Producto con código ${codigo} no encontrado`);
    }
    
    return {
      articulo
    };
  } catch (err) {
    console.error('Error al cargar el artículo:', err);
    throw error(500, 'Error al cargar el producto. Intente nuevamente.');
  }
} 