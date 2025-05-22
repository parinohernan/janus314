import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

export interface CodigoPostal {
  Codigo: string;
  Descripcion: string;
  Provincia?: string;
  ProvinciaRelacion?: {
    Descripcion: string;
  };
}

export class CodigoPostalService {
  /**
   * Obtiene todos los códigos postales (localidades)
   */
  public static async obtenerCodigosPostales(limit: number = 500): Promise<CodigoPostal[]> {
    try {
      const response = await fetchWithAuth('/localidades', {
        params: { limit }
      });
      
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

  /**
   * Obtiene un código postal específico por su código
   */
  public static async obtenerCodigoPostal(codigo: string): Promise<CodigoPostal | null> {
    try {
      const response = await fetchWithAuth(`/localidades/${codigo}`);
      
      if (!response.ok) {
        throw new Error(`Error al obtener localidad: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error al obtener localidad ${codigo}:`, error);
      return null;
    }
  }
} 