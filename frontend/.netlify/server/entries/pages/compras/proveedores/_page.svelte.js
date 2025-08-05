import { h as head, j as attr, c as pop, p as push, e as escape_html, g as ensure_array_like, k as attr_class, l as stringify } from "../../../../chunks/index3.js";
import { B as Button } from "../../../../chunks/Button.js";
import "../../../../chunks/client.js";
import { debounce } from "lodash-es";
import { f as fetchWithAuth } from "../../../../chunks/fetchWithAuth.js";
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
      const response = await fetchWithAuth("/proveedores", {
        params: {
          page: pagination.currentPage,
          limit: pagination.limit,
          search: filters.search,
          field: filters.field,
          order: filters.order
        }
      });
      if (!response.ok) throw new Error("Error al cargar los proveedores");
      const data = await response.json();
      proveedores = data.items;
      pagination = {
        currentPage: data.meta.currentPage,
        totalPages: data.meta.totalPages,
        totalItems: data.meta.totalItems,
        limit: data.meta.itemsPerPage
      };
    } catch (err) {
      console.error("Error cargando proveedores:", err);
      if (err instanceof Error) {
        error = err.message;
      } else {
        error = "Error desconocido";
      }
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
    $$payload2.title = `<title>Gestión de Proveedores</title>`;
  });
  $$payload.out += `<div class="container mx-auto p-4"><div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Gestión de Proveedores</h1> `;
  Button($$payload, {
    variant: "primary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Nuevo Proveedor`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div> <div class="mb-6 bg-white p-4 rounded-lg shadow-sm"><div class="flex flex-col md:flex-row gap-4"><div class="flex-grow"><label for="search" class="block text-sm font-medium text-gray-700 mb-1">Buscar</label> <div class="relative"><input type="text" id="search" placeholder="Buscar por código, descripción o CUIT..."${attr("value", filters.search)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"> <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div></div></div> <div class="md:w-48"><label for="limit" class="block text-sm font-medium text-gray-700 mb-1">Resultados por página</label> <select id="limit" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="5">5</option><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></div></div></div> `;
  if (loading) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex justify-center items-center py-10"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div></div>`;
  } else if (error) {
    $$payload.out += "<!--[1-->";
    $$payload.out += `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"><p>${escape_html(error)}</p></div>`;
  } else if (proveedores.length === 0) {
    $$payload.out += "<!--[2-->";
    $$payload.out += `<div class="bg-white p-8 rounded-md shadow text-center"><p class="text-gray-500">No hay proveedores disponibles</p></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    const each_array = ensure_array_like(proveedores);
    $$payload.out += `<div class="overflow-x-auto"><table class="min-w-full bg-white border border-gray-200"><thead><tr><th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"><div class="flex items-center"><span>Código</span> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div></th><th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"><div class="flex items-center"><span>Descripción</span> `;
    {
      $$payload.out += "<!--[-->";
      $$payload.out += `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">`;
      {
        $$payload.out += "<!--[-->";
        $$payload.out += `<path fill-rule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>`;
      }
      $$payload.out += `<!--]--></svg>`;
    }
    $$payload.out += `<!--]--></div></th><th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th></tr></thead><tbody><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let proveedor = each_array[$$index];
      $$payload.out += `<tr class="hover:bg-gray-50"><td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">${escape_html(proveedor.Codigo)}</td><td class="px-6 py-4 border-b border-gray-200">${escape_html(proveedor.Descripcion || "-")}</td><td class="px-6 py-4 whitespace-nowrap text-right border-b border-gray-200">`;
      Button($$payload, {
        variant: "secondary",
        size: "sm",
        children: ($$payload2) => {
          $$payload2.out += `<!---->Editar`;
        },
        $$slots: { default: true }
      });
      $$payload.out += `<!----> `;
      Button($$payload, {
        variant: "danger",
        size: "sm",
        children: ($$payload2) => {
          $$payload2.out += `<!---->Eliminar`;
        },
        $$slots: { default: true }
      });
      $$payload.out += `<!----></td></tr>`;
    }
    $$payload.out += `<!--]--></tbody></table></div> `;
    if (!loading && !error && proveedores.length > 0) {
      $$payload.out += "<!--[-->";
      const each_array_1 = ensure_array_like(Array(Math.min(5, pagination.totalPages)));
      $$payload.out += `<div class="mt-4"><div class="flex justify-between items-center text-sm"><div class="text-gray-600">Mostrando ${escape_html((pagination.currentPage - 1) * pagination.limit + 1)} a ${escape_html(Math.min(pagination.currentPage * pagination.limit, pagination.totalItems))} de ${escape_html(pagination.totalItems)} proveedores</div> <div class="flex space-x-1"><button${attr_class(`px-3 py-1 rounded border ${stringify(pagination.currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50")}`)}${attr("disabled", pagination.currentPage === 1, true)}>«</button> <button${attr_class(`px-3 py-1 rounded border ${stringify(pagination.currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50")}`)}${attr("disabled", pagination.currentPage === 1, true)}>‹</button> <!--[-->`;
      for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
        each_array_1[i];
        const pageNum = pagination.currentPage <= 3 ? i + 1 : pagination.currentPage >= pagination.totalPages - 2 ? pagination.totalPages - 4 + i : pagination.currentPage - 2 + i;
        if (pageNum > 0 && pageNum <= pagination.totalPages) {
          $$payload.out += "<!--[-->";
          $$payload.out += `<button${attr_class(`px-3 py-1 rounded border ${stringify(pageNum === pagination.currentPage ? "bg-blue-50 text-blue-600 border-blue-300" : "bg-white hover:bg-gray-50")}`)}>${escape_html(pageNum)}</button>`;
        } else {
          $$payload.out += "<!--[!-->";
        }
        $$payload.out += `<!--]-->`;
      }
      $$payload.out += `<!--]--> <button${attr_class(`px-3 py-1 rounded border ${stringify(pagination.currentPage === pagination.totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50")}`)}${attr("disabled", pagination.currentPage === pagination.totalPages, true)}>›</button> <button${attr_class(`px-3 py-1 rounded border ${stringify(pagination.currentPage === pagination.totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50")}`)}${attr("disabled", pagination.currentPage === pagination.totalPages, true)}>»</button></div></div></div>`;
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
