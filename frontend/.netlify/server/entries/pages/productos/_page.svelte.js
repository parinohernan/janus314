import { g as ensure_array_like, h as head, j as attr, e as escape_html, c as pop, p as push, k as attr_class, m as clsx, l as stringify } from "../../../chunks/index3.js";
import { B as Button } from "../../../chunks/Button.js";
import "../../../chunks/client.js";
import { debounce } from "lodash-es";
import "../../../chunks/navigationState.js";
import { f as fetchWithAuth } from "../../../chunks/fetchWithAuth.js";
function _page($$payload, $$props) {
  push();
  let filters = {
    search: "",
    field: "Descripcion",
    order: "ASC",
    proveedor: "",
    rubro: "",
    activo: 1
  };
  let pagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  };
  let articulos = [];
  let loading = true;
  let error = null;
  let proveedores = [];
  let rubros = [];
  const loadArticulos = async () => {
    try {
      loading = true;
      error = null;
      const params = {
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        search: filters.search,
        field: filters.field,
        order: filters.order,
        activo: filters.activo.toString()
      };
      if (filters.proveedor) ;
      if (filters.rubro) ;
      const response = await fetchWithAuth("/articulos", { params });
      if (!response.ok) throw new Error("Error al cargar los artículos");
      console.log(response);
      const data = await response.json();
      articulos = data.items;
      pagination = {
        currentPage: data.meta.currentPage,
        totalPages: data.meta.totalPages,
        totalItems: data.meta.totalItems,
        limit: data.meta.itemsPerPage
      };
    } catch (err) {
      console.error("Error cargando artículos:", err);
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
      loadArticulos();
    },
    300
  );
  const calcularPrecioFinal = (articulo) => {
    const precioCosto = articulo.PrecioCosto || 0;
    const lista1 = articulo.Lista1 || 0;
    const porcentajeIva = articulo.PorcentajeIVA1 || 21;
    const precioConLista = precioCosto * (1 + lista1 / 100);
    const precioFinal = precioConLista * (1 + porcentajeIva / 100);
    return precioFinal;
  };
  const each_array = ensure_array_like(proveedores);
  const each_array_1 = ensure_array_like(rubros);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Gestión de Productos</title>`;
  });
  $$payload.out += `<div class="container mx-auto px-4 py-8"><div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Gestión de Productos</h1> <div class="flex space-x-2">`;
  Button($$payload, {
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Listado de Precios`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  Button($$payload, {
    variant: "primary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Nuevo Producto`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div> <div class="mb-6 bg-white p-4 rounded-lg shadow-sm"><div class="flex flex-col md:flex-row gap-4"><div class="flex-grow"><label for="search" class="block text-sm font-medium text-gray-700 mb-1">Buscar</label> <div class="relative"><input type="text" id="search" placeholder="Buscar por código, descripción o código de barras..."${attr("value", filters.search)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"> <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div></div></div> <div class="md:w-48"><label for="proveedor" class="block text-sm font-medium text-gray-700 mb-1">Proveedor</label> <select id="proveedor" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Todos los proveedores</option><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let proveedor = each_array[$$index];
    $$payload.out += `<option${attr("value", proveedor.Codigo)}>${escape_html(proveedor.Descripcion)}</option>`;
  }
  $$payload.out += `<!--]--></select></div> <div class="md:w-48"><label for="rubro" class="block text-sm font-medium text-gray-700 mb-1">Rubro</label> <select id="rubro" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Todos los rubros</option><!--[-->`;
  for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
    let rubro = each_array_1[$$index_1];
    $$payload.out += `<option${attr("value", rubro.Codigo)}>${escape_html(rubro.Descripcion)}</option>`;
  }
  $$payload.out += `<!--]--></select></div> <div class="md:w-48"><label for="activo" class="block text-sm font-medium text-gray-700 mb-1">Estado</label> <select id="activo" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option${attr("value", 1)}>Activos</option><option${attr("value", 0)}>Inactivos</option><option${attr("value", -1)}>Todos</option></select></div> <div class="md:w-48"><label for="limit" class="block text-sm font-medium text-gray-700 mb-1">Resultados por página</label> <select id="limit" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option${attr("value", 5)}>5</option><option${attr("value", 10)}>10</option><option${attr("value", 25)}>25</option><option${attr("value", 50)}>50</option><option${attr("value", 100)}>100</option></select></div></div></div>  `;
  if (loading) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex justify-center items-center py-10"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div></div>`;
  } else if (error) {
    $$payload.out += "<!--[1-->";
    $$payload.out += `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"><p>${escape_html(error)}</p></div>`;
  } else if (articulos.length === 0) {
    $$payload.out += "<!--[2-->";
    $$payload.out += `<div class="bg-white p-8 rounded-md shadow text-center"><p class="text-gray-500">No hay productos disponibles</p></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    const each_array_2 = ensure_array_like(articulos);
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
    $$payload.out += `<!--]--></div></th><th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"><div class="flex items-center"><span>Precio Costo</span> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div></th><th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Final</th><th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"><div class="flex items-center"><span>Existencia</span> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div></th><th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th><th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th></tr></thead><tbody><!--[-->`;
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let articulo = each_array_2[$$index_2];
      $$payload.out += `<tr class="hover:bg-gray-50"><td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">${escape_html(articulo.Codigo)}</td><td class="px-6 py-4 border-b border-gray-200">${escape_html(articulo.Descripcion || "-")}</td><td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">${escape_html(articulo.PrecioCosto?.toFixed(2) || "0.00")}</td><td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">$${escape_html(calcularPrecioFinal(articulo).toFixed(2))}</td><td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">${escape_html(articulo.Existencia?.toFixed(2) || "0.00")}</td><td class="px-6 py-4 whitespace-nowrap border-b border-gray-200"><span${attr_class(clsx(articulo.Activo ? "px-2 py-1 text-xs rounded-full bg-green-100 text-green-800" : "px-2 py-1 text-xs rounded-full bg-red-100 text-red-800"))}>${escape_html(articulo.Activo ? "Activo" : "Inactivo")}</span></td><td class="px-6 py-4 whitespace-nowrap text-right border-b border-gray-200">`;
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
    if (!loading && !error && articulos.length > 0) {
      $$payload.out += "<!--[-->";
      const each_array_3 = ensure_array_like(Array(Math.min(5, pagination.totalPages)));
      $$payload.out += `<div class="mt-4"><div class="flex justify-between items-center text-sm"><div class="text-gray-600">Mostrando ${escape_html((pagination.currentPage - 1) * pagination.limit + 1)} a ${escape_html(Math.min(pagination.currentPage * pagination.limit, pagination.totalItems))} de ${escape_html(pagination.totalItems)} productos</div> <div class="flex space-x-1"><button${attr_class(`px-3 py-1 rounded border ${stringify(pagination.currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50")}`)}${attr("disabled", pagination.currentPage === 1, true)}>«</button> <button${attr_class(`px-3 py-1 rounded border ${stringify(pagination.currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50")}`)}${attr("disabled", pagination.currentPage === 1, true)}>‹</button> <!--[-->`;
      for (let i = 0, $$length = each_array_3.length; i < $$length; i++) {
        each_array_3[i];
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
