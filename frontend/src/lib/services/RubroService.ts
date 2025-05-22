import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

export interface Rubro {
  Codigo: string;
  Descripcion: string;
}

export interface RubroCompleto extends Rubro {
  RubroGrupoCodigo?: string;
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
  
  /**
   * Crea un nuevo rubro
   */
  public static async crearRubro(rubro: RubroCompleto): Promise<RubroCompleto> {
    try {
      const response = await fetchWithAuth('/rubros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rubro)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el rubro');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al crear rubro:', error);
      throw error;
    }
  }
} 