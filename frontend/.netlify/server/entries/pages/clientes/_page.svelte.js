import { l as ensure_array_like, h as head, k as attr, e as escape_html, c as pop, p as push, m as attr_class, n as stringify } from "../../../chunks/index3.js";
import "../../../chunks/client.js";
import { debounce } from "lodash-es";
import "../../../chunks/navigationState.js";
import { B as Button } from "../../../chunks/Button.js";
import { C as ClienteService } from "../../../chunks/ClienteService.js";
import "../../../chunks/tabsStore.js";
function _page($$payload, $$props) {
  push();
  let filters = {
    search: "",
    field: "Descripcion",
    order: "ASC",
    localidad: ""
  };
  let localidadesOptions = [];
  let pagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  };
  let clientes = [];
  let loading = true;
  let error = null;
  const loadClientes = async () => {
    try {
      loading = true;
      error = null;
      const data = await ClienteService.obtenerClientes({
        page: pagination.currentPage,
        limit: pagination.limit,
        search: filters.search,
        field: filters.field,
        order: filters.order,
        localidad: filters.localidad || void 0
      });
      clientes = data.items;
      pagination = {
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalItems: data.totalItems,
        limit: data.limit
      };
    } catch (err) {
      console.error("Error cargando clientes:", err);
      error = err instanceof Error ? err.message : "Error desconocido";
    } finally {
      loading = false;
    }
  };
  debounce(
    () => {
      pagination.currentPage = 1;
      loadClientes();
    },
    300
  );
  const each_array = ensure_array_like(localidadesOptions);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Clientes</title>`;
  });
  $$payload.out += `<div class="container mx-auto p-4"><div class="flex justify-between items-center mb-4"><h1 class="text-2xl font-bold">Clientes</h1> <div class="flex gap-2">`;
  Button($$payload, {
    variant: "secondary",
    disabled: loading,
    children: ($$payload2) => {
      $$payload2.out += `<!---->${escape_html("Exportar PDF")}`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  Button($$payload, {
    variant: "primary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Nuevo Cliente`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div> <div class="mb-6 bg-white p-4 rounded-lg shadow-sm"><div class="flex flex-col md:flex-row gap-4"><div class="flex-grow"><label for="search" class="block text-sm font-medium text-gray-700 mb-1">Buscar</label> <div class="relative"><input type="text" id="search" placeholder="Buscar por código, descripción, nombre fantasía, CUIT o localidad..."${attr("value", filters.search)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"> <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div></div></div> <div class="md:w-52"><label for="localidad" class="block text-sm font-medium text-gray-700 mb-1">Localidad</label> <select id="localidad" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Todas</option><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let loc = each_array[$$index];
    $$payload.out += `<option${attr("value", loc)}>${escape_html(loc)}</option>`;
  }
  $$payload.out += `<!--]--></select></div> <div class="md:w-48"><label for="limit" class="block text-sm font-medium text-gray-700 mb-1">Mostrar</label> <select id="limit" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option${attr("value", 5)}>5 por página</option><option${attr("value", 10)}>10 por página</option><option${attr("value", 25)}>25 por página</option><option${attr("value", 50)}>50 por página</option><option${attr("value", 100)}>100 por página</option></select></div></div></div> `;
  if (loading) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="text-center py-12"><div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div> <p class="mt-2 text-gray-600">Cargando...</p></div>`;
  } else if (error) {
    $$payload.out += "<!--[1-->";
    $$payload.out += `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"><p class="font-bold">Error al cargar los datos</p> <p>${escape_html(error)}</p> <button class="mt-2 bg-red-200 hover:bg-red-300 text-red-800 px-3 py-1 rounded">Reintentar</button></div>`;
  } else if (clientes.length === 0) {
    $$payload.out += "<!--[2-->";
    $$payload.out += `<div class="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-8 rounded mb-4 text-center"><p>No se encontraron clientes que coincidan con los criterios de búsqueda.</p></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    const each_array_1 = ensure_array_like(clientes);
    $$payload.out += `<div class="overflow-x-auto bg-white rounded-lg shadow"><table class="min-w-full"><thead class="bg-gray-50 border-b"><tr><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><button class="flex items-center">Código `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></button></th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><button class="flex items-center">Razón Social `;
    {
      $$payload.out += "<!--[-->";
      $$payload.out += `<span class="ml-1">${escape_html("↑")}</span>`;
    }
    $$payload.out += `<!--]--></button></th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><button class="flex items-center">Nombre Fantasía `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></button></th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CUIT</th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localidad</th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><button class="flex items-center">Deuda `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></button></th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><button class="flex items-center">Estado `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></button></th><th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th></tr></thead><tbody><!--[-->`;
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let cliente = each_array_1[$$index_1];
      $$payload.out += `<tr class="hover:bg-gray-50"><td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">${escape_html(cliente.Codigo)}</td><td class="px-6 py-4 border-b border-gray-200">${escape_html(cliente.Descripcion || "-")}</td><td class="px-6 py-4 border-b border-gray-200">${escape_html(cliente.NombreFantasia || "-")}</td><td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">${escape_html(cliente.Cuit || "-")}</td><td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">${escape_html(cliente.Localidad || "-")}</td><td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">$${escape_html(cliente.ImporteDeuda?.toFixed(2) || "0.00")}</td><td class="px-6 py-4 whitespace-nowrap border-b border-gray-200"><span${attr_class(`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${stringify(cliente.Activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}`)}>${escape_html(cliente.Activo ? "Activo" : "Inactivo")}</span></td><td class="px-6 py-4 whitespace-nowrap text-right border-b border-gray-200">`;
      Button($$payload, {
        variant: "secondary",
        size: "sm",
        title: "Click para editar, Ctrl+Click para abrir en nuevo tab",
        children: ($$payload2) => {
          $$payload2.out += `<!---->Editar`;
        },
        $$slots: { default: true }
      });
      $$payload.out += `<!----> <button${attr_class(`${stringify(cliente.Activo ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700")} text-white px-2 py-1 rounded text-sm ml-2`)}>${escape_html(cliente.Activo ? "Desactivar" : "Activar")}</button></td></tr>`;
    }
    $$payload.out += `<!--]--></tbody></table></div> `;
    if (!loading && !error && clientes.length > 0) {
      $$payload.out += "<!--[-->";
      const each_array_2 = ensure_array_like(Array(Math.min(5, pagination.totalPages)));
      $$payload.out += `<div class="mt-4"><div class="flex justify-between items-center text-sm"><div class="text-gray-600">Mostrando ${escape_html((pagination.currentPage - 1) * pagination.limit + 1)} a ${escape_html(Math.min(pagination.currentPage * pagination.limit, pagination.totalItems))} de ${escape_html(pagination.totalItems)} clientes</div> <div class="flex space-x-1"><button${attr_class(`px-3 py-1 rounded border ${stringify(pagination.currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50")}`)}${attr("disabled", pagination.currentPage === 1, true)}>«</button> <button${attr_class(`px-3 py-1 rounded border ${stringify(pagination.currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50")}`)}${attr("disabled", pagination.currentPage === 1, true)}>‹</button> <!--[-->`;
      for (let i = 0, $$length = each_array_2.length; i < $$length; i++) {
        each_array_2[i];
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
