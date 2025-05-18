import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

export interface CategoriaIva {
  Codigo: string;
  Descripcion: string;
}

export class CategoriaIvaService {
  /**
   * Obtiene todas las categorías de IVA
   */
  public static async obtenerCategorias(): Promise<CategoriaIva[]> {
    try {
      const response = await fetchWithAuth('/categorias-iva');
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(error.message || 'Error al cargar las categorías de IVA');
      }
      
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error cargando categorías de IVA:', error);
      return [];
    }
  }
} 