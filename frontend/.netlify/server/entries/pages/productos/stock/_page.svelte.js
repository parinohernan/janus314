import { h as head, j as attr, c as pop, p as push, e as escape_html, g as ensure_array_like, k as attr_class, l as stringify } from "../../../../chunks/index3.js";
import { B as Button } from "../../../../chunks/Button.js";
import "../../../../chunks/client.js";
import { debounce } from "lodash-es";
import "../../../../chunks/navigationState.js";
import { f as fetchWithAuth } from "../../../../chunks/fetchWithAuth.js";
function _page($$payload, $$props) {
  push();
  let movimientos = [];
  let loading = true;
  let error = null;
  let filters = { search: "", field: "Fecha", order: "DESC" };
  let pagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  };
  const loadMovimientos = async () => {
    try {
      loading = true;
      error = null;
      const response = await fetchWithAuth("/movimientos-stock", {
        params: {
          page: pagination.currentPage,
          limit: pagination.limit,
          search: filters.search,
          field: filters.field,
          order: filters.order
        }
      });
      const data = await response.json();
      movimientos = data.items;
      pagination = {
        currentPage: data.meta.currentPage,
        totalPages: data.meta.totalPages,
        totalItems: data.meta.totalItems,
        limit: data.meta.itemsPerPage
      };
    } catch (err) {
      console.error("Error cargando movimientos:", err);
      error = err instanceof Error ? err.message : "Error desconocido";
    } finally {
      loading = false;
    }
    return Promise.resolve();
  };
  debounce(
    () => {
      pagination.currentPage = 1;
      loadMovimientos();
    },
    300
  );
  const formatMovimientoTipo = (tipo) => {
    if (!tipo) return "Desconocido";
    return tipo === "ING" ? "Ingreso" : "Egreso";
  };
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Movimientos de Stock</title>`;
  });
  $$payload.out += `<div class="container mx-auto px-4 py-8"><div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Gestión de Movimientos de Stock</h1> <div class="space-x-2">`;
  Button($$payload, {
    variant: "primary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Nuevo Ingreso`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  Button($$payload, {
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Nuevo Egreso`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div> <div class="mb-6 bg-white p-4 rounded-lg shadow-sm"><div class="flex flex-col md:flex-row gap-4"><div class="flex-grow"><label for="search" class="block text-sm font-medium text-gray-700 mb-1">Buscar</label> <div class="relative"><input type="text" id="search" placeholder="Buscar por número, observación..."${attr("value", filters.search)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"> <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div></div></div> <div class="md:w-48"><label for="limit" class="block text-sm font-medium text-gray-700 mb-1">Resultados por página</label> <select id="limit" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option${attr("value", 5)}>5</option><option${attr("value", 10)}>10</option><option${attr("value", 25)}>25</option><option${attr("value", 50)}>50</option><option${attr("value", 100)}>100</option></select></div></div></div> `;
  if (loading) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex justify-center items-center py-10"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div></div>`;
  } else if (error) {
    $$payload.out += "<!--[1-->";
    $$payload.out += `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"><p>${escape_html(error)}</p></div>`;
  } else if (movimientos.length === 0) {
    $$payload.out += "<!--[2-->";
    $$payload.out += `<div class="bg-white p-8 rounded-md shadow text-center"><p class="text-gray-500">No hay movimientos de stock disponibles</p></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    const each_array = ensure_array_like(movimientos);
    $$payload.out += `<div class="overflow-x-auto"><table class="min-w-full bg-white border border-gray-200"><thead><tr><th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"><div class="flex items-center"><span>Tipo</span> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div></th><th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"><div class="flex items-center"><span>Documento</span> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div></th><th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"><div class="flex items-center"><span>Fecha</span> `;
    {
      $$payload.out += "<!--[-->";
      $$payload.out += `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">`;
      {
        $$payload.out += "<!--[!-->";
        $$payload.out += `<path fill-rule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>`;
      }
      $$payload.out += `<!--]--></svg>`;
    }
    $$payload.out += `<!--]--></div></th><th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"><div class="flex items-center"><span>Tipo Movimiento</span> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div></th><th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th><th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observación</th><th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th></tr></thead><tbody><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let movimiento = each_array[$$index];
      $$payload.out += `<tr class="hover:bg-gray-50"><td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">${escape_html(movimiento.DocumentoTipo)}</td><td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">${escape_html(movimiento.DocumentoSucursal)}-${escape_html(movimiento.DocumentoNumero)}</td><td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">${escape_html(new Date(movimiento.Fecha).toLocaleDateString())}</td><td class="px-6 py-4 whitespace-nowrap border-b border-gray-200"><span${attr_class(`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${stringify(movimiento.MovimientoTipo === "ING" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}`)}>${escape_html(formatMovimientoTipo(movimiento.MovimientoTipo))}</span></td><td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">${escape_html(movimiento.Items)} (Total: ${escape_html(Math.abs(movimiento.TotalItems))})</td><td class="px-6 py-4 border-b border-gray-200 truncate max-w-xs">${escape_html(movimiento.Observacion || "-")}</td><td class="px-6 py-4 whitespace-nowrap text-right border-b border-gray-200">`;
      Button($$payload, {
        variant: "secondary",
        size: "sm",
        children: ($$payload2) => {
          $$payload2.out += `<!---->Ver`;
        },
        $$slots: { default: true }
      });
      $$payload.out += `<!----> <button class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm ml-2">Eliminar</button></td></tr>`;
    }
    $$payload.out += `<!--]--></tbody></table></div> `;
    if (pagination.totalPages > 1) {
      $$payload.out += "<!--[-->";
      const each_array_1 = ensure_array_like(Array(pagination.totalPages > 5 ? 5 : pagination.totalPages));
      $$payload.out += `<div class="mt-4 flex justify-between items-center"><div class="text-sm text-gray-700">Mostrando ${escape_html(Math.min((pagination.currentPage - 1) * pagination.limit + 1, pagination.totalItems))} a ${escape_html(Math.min(pagination.currentPage * pagination.limit, pagination.totalItems))} de ${escape_html(pagination.totalItems)} resultados</div> <div class="flex space-x-1"><button${attr_class(`px-3 py-1 border rounded ${stringify(pagination.currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-blue-600 hover:bg-blue-50")}`)}${attr("disabled", pagination.currentPage === 1, true)}>«</button> <button${attr_class(`px-3 py-1 border rounded ${stringify(pagination.currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-blue-600 hover:bg-blue-50")}`)}${attr("disabled", pagination.currentPage === 1, true)}>‹</button> <!--[-->`;
      for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
        each_array_1[i];
        const pageIndex = pagination.totalPages > 5 ? pagination.currentPage > 2 && pagination.currentPage < pagination.totalPages - 1 ? i + pagination.currentPage - 2 : pagination.currentPage > pagination.totalPages - 3 ? pagination.totalPages - 4 + i : i + 1 : i + 1;
        if (pageIndex > 0 && pageIndex <= pagination.totalPages) {
          $$payload.out += "<!--[-->";
          $$payload.out += `<button${attr_class(`px-3 py-1 border rounded ${stringify(pagination.currentPage === pageIndex ? "bg-blue-600 text-white" : "bg-white text-blue-600 hover:bg-blue-50")}`)}>${escape_html(pageIndex)}</button>`;
        } else {
          $$payload.out += "<!--[!-->";
        }
        $$payload.out += `<!--]-->`;
      }
      $$payload.out += `<!--]--> <button${attr_class(`px-3 py-1 border rounded ${stringify(pagination.currentPage === pagination.totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-blue-600 hover:bg-blue-50")}`)}${attr("disabled", pagination.currentPage === pagination.totalPages, true)}>›</button> <button${attr_class(`px-3 py-1 border rounded ${stringify(pagination.currentPage === pagination.totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-blue-600 hover:bg-blue-50")}`)}${attr("disabled", pagination.currentPage === pagination.totalPages, true)}>»</button></div></div>`;
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
