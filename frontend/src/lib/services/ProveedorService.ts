import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

export interface Proveedor {
  Codigo: string;
  Descripcion: string;
}

export class ProveedorService {
  /**
   * Obtiene la lista de proveedores
   */
  public static async obtenerProveedores(limit: number = 500): Promise<Proveedor[]> {
    try {
      const response = await fetchWithAuth('/proveedores', {
        params: { limit }
      });
      
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      throw new Error('Error al cargar los proveedores');
    }
  }
} 