import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

export interface Proveedor {
  Codigo: string;
  Descripcion: string;
}

export interface ProveedorCompleto extends Proveedor {
  Cuit?: string;
  Calle?: string;
  Numero?: string;
  Piso?: string;
  Departamento?: string;
  CodigoPostal?: string;
  Telefono?: string;
  Mail?: string;
}

export interface ProveedorCuentaCorriente extends Proveedor {
  Saldo: number;
}

export interface ComprobanteProveedor {
  Fecha: string;
  Detalle: string;
  Debitos: number;
  Creditos: number;
  Saldo: number;
  TipoComprobante: string;
}

export interface CuentasCorrientesResult {
  items: ProveedorCuentaCorriente[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

export interface ComprobantesProveedorResult {
  items: ComprobanteProveedor[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
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

  /**
   * Crea un nuevo proveedor
   */
  public static async crearProveedor(proveedor: ProveedorCompleto): Promise<ProveedorCompleto> {
    try {
      const response = await fetchWithAuth('/proveedores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(proveedor)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el proveedor');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      throw error;
    }
  }

  /**
   * Obtiene cuentas corrientes de proveedores (listado con saldo)
   */
  public static async obtenerCuentasCorrientes(params: {
    page?: number;
    limit?: number;
    search?: string;
    field?: string;
    order?: 'ASC' | 'DESC';
  } = {}): Promise<CuentasCorrientesResult> {
    const searchParams = new URLSearchParams();
    if (params.page != null) searchParams.append('page', String(params.page));
    if (params.limit != null) searchParams.append('limit', String(params.limit));
    if (params.search) searchParams.append('search', params.search);
    if (params.field) searchParams.append('field', params.field);
    if (params.order) searchParams.append('order', params.order);
    const response = await fetchWithAuth(`/proveedores/cuentascorrientes?${searchParams}`);
    if (!response.ok) throw new Error('Error al obtener cuentas corrientes');
    const data = await response.json();
    return {
      items: data.items ?? [],
      currentPage: data.meta?.currentPage ?? 1,
      totalPages: data.meta?.totalPages ?? 1,
      totalItems: data.meta?.totalItems ?? 0,
      limit: data.meta?.itemsPerPage ?? 10
    };
  }

  /**
   * Obtiene comprobantes de un proveedor (para detalle de cuenta corriente)
   */
  public static async obtenerComprobantesProveedor(
    codigoProveedor: string,
    page: number = 1,
    limit: number = 50
  ): Promise<ComprobantesProveedorResult> {
    const response = await fetchWithAuth(
      `/proveedores/${encodeURIComponent(codigoProveedor)}/comprobantes?page=${page}&limit=${limit}`
    );
    if (!response.ok) throw new Error('Error al obtener comprobantes');
    const data = await response.json();
    return {
      items: data.items ?? [],
      meta: data.meta ?? {
        totalItems: 0,
        itemsPerPage: limit,
        currentPage: 1,
        totalPages: 0
      }
    };
  }

  /**
   * Genera y descarga el PDF de cuenta corriente de un proveedor
   */
  public static async generarPDFCuentaCorriente(codigoProveedor: string): Promise<void> {
    const response = await fetchWithAuth(`/proveedores/${encodeURIComponent(codigoProveedor)}/cuenta-corriente/pdf`, {
      method: 'GET'
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Error ${response.status} al generar el PDF`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cuenta-corriente-proveedor-${codigoProveedor}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
} 