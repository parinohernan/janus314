import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

export interface Localidad {
  Codigo: string;
  Descripcion: string;
}

export class LocalidadService {
  /**
   * Obtiene todas las localidades
   */
  public static async obtenerLocalidades(): Promise<Localidad[]> {
    try {
      const response = await fetchWithAuth('/localidades');
      
      if (!response.ok) {
        throw new Error('Error al cargar las localidades');
      }
      
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error cargando localidades:', error);
      return [];
    }
  }
} 