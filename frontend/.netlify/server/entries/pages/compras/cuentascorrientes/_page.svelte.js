import { h as head, k as attr, c as pop, p as push, e as escape_html, l as ensure_array_like, m as attr_class, n as stringify } from "../../../../chunks/index3.js";
import "../../../../chunks/client.js";
import "../../../../chunks/navigationState.js";
import { debounce } from "lodash-es";
import { B as Button } from "../../../../chunks/Button.js";
import { f as fetchWithAuth } from "../../../../chunks/authStore.js";
class ProveedorService {
  /**
   * Obtiene la lista de proveedores (por defecto solo activos, para selectores)
   */
  static async obtenerProveedores(limit = 500, activo = "activos") {
    try {
      const response = await fetchWithAuth("/proveedores", {
        params: { limit, activo }
      });
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
      throw new Error("Error al cargar los proveedores");
    }
  }
  /**
   * Obtiene un proveedor específico por su código
   */
  static async obtenerProveedor(codigo) {
    try {
      const response = await fetchWithAuth(`/proveedores/${codigo}`);
      if (!response.ok) {
        throw new Error(`Error al obtener proveedor: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error al obtener proveedor ${codigo}:`, error);
      throw new Error("Error al cargar el proveedor");
    }
  }
  /**
   * Activa o desactiva un proveedor
   */
  static async toggleActivoProveedor(codigo, activo) {
    try {
      const response = await fetchWithAuth(`/proveedores/${encodeURIComponent(codigo)}/activo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Activo: activo })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el estado del proveedor");
      }
    } catch (error) {
      console.error(`Error al actualizar proveedor ${codigo}:`, error);
      throw error;
    }
  }
  /**
   * Crea un nuevo proveedor
   */
  static async crearProveedor(proveedor) {
    try {
      const response = await fetchWithAuth("/proveedores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(proveedor)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear el proveedor");
      }
      return await response.json();
    } catch (error) {
      console.error("Error al crear proveedor:", error);
      throw error;
    }
  }
  /**
   * Obtiene cuentas corrientes de proveedores (listado con saldo)
   */
  static async obtenerCuentasCorrientes(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page != null) searchParams.append("page", String(params.page));
    if (params.limit != null) searchParams.append("limit", String(params.limit));
    if (params.search) searchParams.append("search", params.search);
    if (params.field) searchParams.append("field", params.field);
    if (params.order) searchParams.append("order", params.order);
    const response = await fetchWithAuth(`/proveedores/cuentascorrientes?${searchParams}`);
    if (!response.ok) throw new Error("Error al obtener cuentas corrientes");
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
  static async obtenerComprobantesProveedor(codigoProveedor, page = 1, limit = 50) {
    const response = await fetchWithAuth(
      `/proveedores/${encodeURIComponent(codigoProveedor)}/comprobantes?page=${page}&limit=${limit}`
    );
    if (!response.ok) throw new Error("Error al obtener comprobantes");
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
  static async generarPDFCuentaCorriente(codigoProveedor) {
    const response = await fetchWithAuth(`/proveedores/${encodeURIComponent(codigoProveedor)}/cuenta-corriente/pdf`, {
      method: "GET"
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Error ${response.status} al generar el PDF`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cuenta-corriente-proveedor-${codigoProveedor}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
function _page($$payload, $$props) {
  push();
  let filters = {
    search: "",
    field: "Descripcion",
    order: "ASC"
  };
  let pagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  };
  let proveedores = [];
  let loading = true;
  let error = null;
  const loadProveedores = async () => {
    try {
      loading = true;
      error = null;
      const result = await ProveedorService.obtenerCuentasCorrientes({
        page: pagination.currentPage,
        limit: pagination.limit,
        search: filters.search,
        field: filters.field,
        order: filters.order
      });
      proveedores = result.items;
      pagination = {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalItems,
        limit: result.limit
      };
    } catch (err) {
      console.error("Error cargando cuentas corrientes:", err);
      error = err instanceof Error ? err.message : "Error desconocido";
    } finally {
      loading = false;
    }
  };
  debounce(
    () => {
      pagination.currentPage = 1;
      loadProveedores();
    },
    300
  );
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Cuentas Corrientes - Proveedores</title>`;
  });
  $$payload.out += `<div class="container mx-auto p-4"><div class="flex justify-between items-center mb-4"><h1 class="text-2xl font-bold">Cuentas Corrientes - Proveedores</h1></div> <div class="mb-6 bg-white p-4 rounded-lg shadow-sm"><div class="flex flex-col md:flex-row gap-4"><div class="flex-grow"><label for="search" class="block text-sm font-medium text-gray-700 mb-1">Buscar</label> <input type="text" id="search" placeholder="Buscar por código o descripción..."${attr("value", filters.search)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div class="md:w-48"><label for="limit" class="block text-sm font-medium text-gray-700 mb-1">Mostrar</label> <select id="limit" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option${attr("value", 5)}>5 por página</option><option${attr("value", 10)}>10 por página</option><option${attr("value", 25)}>25 por página</option><option${attr("value", 50)}>50 por página</option></select></div></div></div> `;
  if (loading) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="text-center py-12"><div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div> <p class="mt-2 text-gray-600">Cargando...</p></div>`;
  } else if (error) {
    $$payload.out += "<!--[1-->";
    $$payload.out += `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"><p class="font-bold">Error al cargar los datos</p> <p>${escape_html(error)}</p> <button class="mt-2 bg-red-200 hover:bg-red-300 text-red-800 px-3 py-1 rounded">Reintentar</button></div>`;
  } else if (proveedores.length === 0) {
    $$payload.out += "<!--[2-->";
    $$payload.out += `<div class="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-8 rounded mb-4 text-center"><p>No se encontraron cuentas corrientes de proveedores.</p></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    const each_array = ensure_array_like(proveedores);
    $$payload.out += `<div class="overflow-x-auto bg-white rounded-lg shadow"><table class="min-w-full"><thead class="bg-gray-50 border-b"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><button class="flex items-center">Código `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></button></th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><button class="flex items-center">Descripción `;
    {
      $$payload.out += "<!--[-->";
      $$payload.out += `<span class="ml-1">${escape_html("↑")}</span>`;
    }
    $$payload.out += `<!--]--></button></th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><button class="flex items-center">Saldo `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></button></th><th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th></tr></thead><tbody><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let prov = each_array[$$index];
      $$payload.out += `<tr class="hover:bg-gray-50"><td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">${escape_html(prov.Codigo)}</td><td class="px-6 py-4 border-b border-gray-200">${escape_html(prov.Descripcion)}</td><td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">${escape_html((prov.Saldo ?? 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" }))}</td><td class="px-6 py-4 whitespace-nowrap text-right border-b border-gray-200">`;
      Button($$payload, {
        variant: "secondary",
        size: "sm",
        children: ($$payload2) => {
          $$payload2.out += `<!---->Ver detalle`;
        },
        $$slots: { default: true }
      });
      $$payload.out += `<!----></td></tr>`;
    }
    $$payload.out += `<!--]--></tbody></table></div> `;
    if (pagination.totalPages > 1) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="mt-4 flex justify-between items-center text-sm"><div class="text-gray-600">Mostrando ${escape_html((pagination.currentPage - 1) * pagination.limit + 1)} a
          ${escape_html(Math.min(pagination.currentPage * pagination.limit, pagination.totalItems))} de
          ${escape_html(pagination.totalItems)} proveedores</div> <div class="flex space-x-1"><button${attr_class(`px-3 py-1 rounded border ${stringify(pagination.currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50")}`)}${attr("disabled", pagination.currentPage === 1, true)}>«</button> <button${attr_class(`px-3 py-1 rounded border ${stringify(pagination.currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50")}`)}${attr("disabled", pagination.currentPage === 1, true)}>Anterior</button> <span class="px-3 py-1">Página ${escape_html(pagination.currentPage)} de ${escape_html(pagination.totalPages)}</span> <button${attr_class(`px-3 py-1 rounded border ${stringify(pagination.currentPage >= pagination.totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50")}`)}${attr("disabled", pagination.currentPage >= pagination.totalPages, true)}>Siguiente</button> <button${attr_class(`px-3 py-1 rounded border ${stringify(pagination.currentPage >= pagination.totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50")}`)}${attr("disabled", pagination.currentPage >= pagination.totalPages, true)}>»</button></div></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
