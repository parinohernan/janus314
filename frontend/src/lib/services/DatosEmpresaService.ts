import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

export interface DatosEmpresa {
  RazonSocial: string;
  NombreFantasia?: string;
  Direccion?: string;
  Logo?: string;
  Cuit?: string;
  Telefono?: string;
  Email?: string;
}

export class DatosEmpresaService {
  /**
   * Obtiene los datos de la empresa
   */
  public static async obtenerDatosEmpresa(): Promise<DatosEmpresa | null> {
    try {
      const response = await fetchWithAuth('/datosempresa');

      if (!response.ok) {
        throw new Error('Error al cargar los datos de la empresa');
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error cargando datos de empresa:', error);
      return null;
    }
  }

  /**
   * Actualiza los datos de la empresa
   */
  public static async actualizarDatosEmpresa(datos: DatosEmpresa): Promise<DatosEmpresa> {
    try {
      const response = await fetchWithAuth('/datosempresa', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar los datos de la empresa');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error actualizando datos de empresa:', error);
      throw error;
    }
  }
}
