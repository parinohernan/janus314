import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

export interface Rubro {
  Codigo: string;
  Descripcion: string;
}

export class RubroService {
  /**
   * Obtiene la lista de rubros
   */
  public static async obtenerRubros(limit: number = 500): Promise<Rubro[]> {
    try {
      const response = await fetchWithAuth('/rubros', {
        params: { limit }
      });
      
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error al obtener rubros:', error);
      throw new Error('Error al cargar los rubros');
    }
  }
} 