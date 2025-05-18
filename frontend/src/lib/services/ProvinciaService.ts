import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

export interface Provincia {
  Codigo: string;
  Descripcion: string;
}

export class ProvinciaService {
  /**
   * Obtiene todas las provincias
   */
  public static async obtenerProvincias(): Promise<Provincia[]> {
    try {
      const response = await fetchWithAuth('/provincias');
      
      if (!response.ok) {
        throw new Error('Error al cargar las provincias');
      }
      
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error cargando provincias:', error);
      return [];
    }
  }
} 