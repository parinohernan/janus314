import { f as fetchWithAuth } from "./authStore.js";
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
      if (params.localidad) {
        searchParams.set("localidad", params.localidad);
      }
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
   * Obtiene la lista de localidades distintas de clientes (para filtros)
   */
  static async obtenerLocalidadesDistinct() {
    try {
      const response = await fetchWithAuth("/clientes/localidades");
      if (!response.ok) {
        throw new Error("Error al cargar las localidades");
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error cargando localidades de clientes:", error);
      return [];
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
   * Obtiene los comprobantes de una cuenta corriente por el código de cliente con paginación
   */
  static async obtenerComprobantes(codigoCliente, params) {
    try {
      const searchParams = new URLSearchParams();
      if (params) {
        searchParams.append("page", params.page.toString());
        searchParams.append("limit", params.limit.toString());
        searchParams.append("search", params.search);
        searchParams.append("field", params.field);
        searchParams.append("order", params.order);
      }
      const url = `/clientes/${codigoCliente}/comprobantes${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      const response = await fetchWithAuth(url);
      const data = await response.json();
      return {
        items: data.items || [],
        currentPage: parseInt(data.meta?.currentPage || "1", 10),
        totalPages: parseInt(data.meta?.totalPages || "1", 10),
        totalItems: parseInt(data.meta?.totalItems || "0", 10),
        limit: parseInt(data.meta?.itemsPerPage || "10", 10)
      };
    } catch (error) {
      console.error(`Error cargando comprobantes para cliente ${codigoCliente}:`, error);
      throw error;
    }
  }
  /**
   * Genera y descarga el PDF de cuenta corriente de un cliente
   */
  static async generarPDFCuentaCorriente(codigoCliente) {
    try {
      console.log("🔍 Intentando generar PDF para cliente:", codigoCliente);
      const response = await fetchWithAuth(`/clientes/${codigoCliente}/cuenta-corriente/pdf`, {
        method: "GET"
      });
      console.log("📥 Respuesta del servidor:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        throw new Error(`Error al generar el PDF de cuenta corriente: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      console.log("📄 Blob recibido:", blob.size, "bytes");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cuenta-corriente-${codigoCliente}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      console.log("✅ PDF descargado exitosamente");
    } catch (error) {
      console.error(`❌ Error generando PDF de cuenta corriente para cliente ${codigoCliente}:`, error);
      throw error;
    }
  }
  /**
   * Función de prueba para generar PDF de cuenta corriente (sin autenticación)
   */
  static async generarPDFCuentaCorrientePrueba(codigoCliente) {
    try {
      console.log("🧪 Probando generación de PDF sin autenticación para cliente:", codigoCliente);
      const response = await fetch(`https://janus314-api.janus314.com.ar/test-cuenta-corriente/${codigoCliente}`, {
        method: "GET"
      });
      console.log("📥 Respuesta del servidor (prueba):", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error response (prueba):", errorText);
        throw new Error(`Error al generar el PDF de prueba: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      console.log("📄 Blob recibido (prueba):", blob.size, "bytes");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cuenta-corriente-prueba-${codigoCliente}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      console.log("✅ PDF de prueba descargado exitosamente");
    } catch (error) {
      console.error(`❌ Error generando PDF de prueba para cliente ${codigoCliente}:`, error);
      throw error;
    }
  }
}
export {
  ClienteService as C
};
