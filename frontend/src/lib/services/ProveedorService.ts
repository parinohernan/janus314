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

  /**
   * Obtiene un proveedor específico por su código
   */
  public static async obtenerProveedor(codigo: string): Promise<Proveedor> {
    try {
      const response = await fetchWithAuth(`/proveedores/${codigo}`);
      
      if (!response.ok) {
        throw new Error(`Error al obtener proveedor: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error al obtener proveedor ${codigo}:`, error);
      throw new Error('Error al cargar el proveedor');
    }
  }
  
  /**
   * Elimina un proveedor por su código
   */
  public static async eliminarProveedor(codigo: string): Promise<void> {
    try {
      const response = await fetchWithAuth(`/proveedores/${codigo}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el proveedor');
      }
    } catch (error) {
      console.error(`Error al eliminar proveedor ${codigo}:`, error);
      throw error;
    }
  }
} 