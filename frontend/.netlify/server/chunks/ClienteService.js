import { f as fetchWithAuth } from "./fetchWithAuth.js";
class ClienteService {
  /**
   * Obtiene la lista paginada de clientes
   */
  static async obtenerClientes(params) {
    try {
      const searchParams = new URLSearchParams({
        page: params.page.toString(),
        limit: params.limit.toString(),
        search: params.search,
        field: params.field,
        order: params.order
      });
      const response = await fetchWithAuth(`/clientes?${searchParams}`);
      if (!response.ok) {
        throw new Error("Error al cargar los clientes");
      }
      const data = await response.json();
      return {
        items: data.items || [],
        currentPage: parseInt(data.currentPage || data.meta?.currentPage || "1", 10),
        totalPages: parseInt(data.totalPages || data.meta?.totalPages || "1", 10),
        totalItems: parseInt(data.totalItems || data.meta?.totalItems || "0", 10),
        limit: parseInt(data.limit || data.meta?.itemsPerPage || "10", 10)
      };
    } catch (error) {
      console.error("Error cargando clientes:", error);
      throw error;
    }
  }
  /**
   * Busca clientes según un término de búsqueda
   */
  static async buscarClientes(busqueda) {
    try {
      if (!busqueda || busqueda.length < 3) {
        return [];
      }
      const response = await fetchWithAuth(
        `/clientes?search=${encodeURIComponent(busqueda)}&limit=10`
      );
      if (!response.ok) {
        throw new Error("Error al buscar clientes");
      }
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("Error al buscar clientes:", error);
      return [];
    }
  }
  /**
   * Obtiene un cliente por su código
   */
  static async obtenerClientePorCodigo(codigo) {
    try {
      if (!codigo) {
        return null;
      }
      const response = await fetchWithAuth(`/clientes/${codigo}`);
      if (!response.ok) {
        throw new Error("Error al obtener cliente");
      }
      const data = await response.json();
      console.log("obtenerClientePorCodigo response:", data);
      return data;
    } catch (error) {
      console.error(`Error al obtener cliente ${codigo}:`, error);
      return null;
    }
  }
  /**
   * Cambia el estado activo/inactivo de un cliente
   */
  static async toggleActivo(codigo) {
    try {
      const response = await fetchWithAuth(`/clientes/${codigo}/toggleActivo`, {
        method: "PUT"
      });
      if (!response.ok) {
        throw new Error("Error al cambiar el estado del cliente");
      }
    } catch (error) {
      console.error(`Error al cambiar estado del cliente ${codigo}:`, error);
      throw error;
    }
  }
  /**
   * Guarda un cliente (nuevo o existente)
   */
  static async guardarCliente(cliente, isEditing) {
    try {
      const url = isEditing ? `/clientes/${cliente.Codigo}` : "/clientes";
      const method = isEditing ? "PUT" : "POST";
      const response = await fetchWithAuth(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(cliente)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar el cliente");
      }
      return await response.json();
    } catch (error) {
      console.error("Error guardando cliente:", error);
      throw error;
    }
  }
  /**
   * Obtiene la lista paginada de cuentas corrientes de clientes
   */
  static async obtenerCuentasCorrientes(params) {
    try {
      const requestParams = {
        page: params.page.toString(),
        limit: params.limit.toString(),
        search: params.search,
        field: params.field,
        order: params.order
      };
      const response = await fetchWithAuth("/clientes/cuentascorrientes", { params: requestParams });
      const data = await response.json();
      return {
        items: data.items || [],
        currentPage: parseInt(data.currentPage || data.meta?.currentPage || "1", 10),
        totalPages: parseInt(data.totalPages || data.meta?.totalPages || "1", 10),
        totalItems: parseInt(data.totalItems || data.meta?.totalItems || "0", 10),
        limit: parseInt(data.limit || data.meta?.itemsPerPage || "10", 10)
      };
    } catch (error) {
      console.error("Error cargando cuentas corrientes:", error);
      throw error;
    }
  }
  /**
   * Obtiene los comprobantes de una cuenta corriente por el código de cliente
   */
  static async obtenerComprobantes(codigoCliente) {
    try {
      const response = await fetchWithAuth(`/clientes/${codigoCliente}/comprobantes`);
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error(`Error cargando comprobantes para cliente ${codigoCliente}:`, error);
      throw error;
    }
  }
}
export {
  ClienteService as C
};
