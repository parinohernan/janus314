import { h as head, j as attr, e as escape_html, c as pop, p as push, g as ensure_array_like, k as attr_class, m as clsx } from "../../../../chunks/index3.js";
import { B as Button } from "../../../../chunks/Button.js";
import "../../../../chunks/client.js";
import { debounce } from "lodash-es";
import "../../../../chunks/navigationState.js";
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
  let tiposDePago = [];
  let loading = true;
  let error = null;
  const loadTiposDePago = async () => {
    try {
      loading = true;
      error = null;
      const params = {
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        search: filters.search,
        field: filters.field,
        order: filters.order
      };
      const response = await fetchWithAuth("/tipos-pago", { params });
      if (!response.ok) throw new Error("Error al cargar los tipos de pago");
      const data = await response.json();
      tiposDePago = data.items || [];
      pagination = {
        currentPage: parseInt(data.currentPage || data.meta?.currentPage || pagination.currentPage, 10),
        totalPages: parseInt(data.totalPages || data.meta?.totalPages || 1, 10),
        totalItems: parseInt(data.totalItems || data.meta?.totalItems || 0, 10),
        limit: parseInt(data.limit || data.meta?.itemsPerPage || pagination.limit, 10)
      };
    } catch (err) {
      console.error("Error cargando tipos de pago:", err);
      error = err instanceof Error ? err.message : "Error desconocido";
    } finally {
      loading = false;
    }
  };
  debounce(
    () => {
      pagination.currentPage = 1;
      loadTiposDePago();
    },
    300
  );
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Tipos de Pago</title>`;
  });
  $$payload.out += `<div class="container mx-auto px-4 py-6"><div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Tipos de Pago</h1> `;
  Button($$payload, {
    variant: "primary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Nuevo Tipo de Pago`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div> <div class="mb-6 flex flex-col md:flex-row gap-4"><div class="flex-grow"><input type="text" placeholder="Buscar tipos de pago..." class="w-full px-4 py-2 border rounded-md"${attr("value", filters.search)}></div> <div class="flex items-center"><label for="limit" class="mr-2">Mostrar:</label> <select id="limit" class="px-3 py-2 border rounded-md"><option${attr("value", 10)}>10</option><option${attr("value", 25)}>25</option><option${attr("value", 50)}>50</option><option${attr("value", 100)}>100</option></select></div></div> `;
  if (error) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"><p>${escape_html(error)}</p></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="overflow-x-auto bg-white rounded-lg shadow"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Código `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Descripción `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span>${escape_html("↑")}</span>`;
  }
  $$payload.out += `<!--]--></th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Estado `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></th><th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th></tr></thead><tbody class="bg-white divide-y divide-gray-200">`;
  if (loading) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<tr><td colspan="4" class="px-6 py-4 text-center"><div class="flex justify-center"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div></div></td></tr>`;
  } else if (tiposDePago.length === 0) {
    $$payload.out += "<!--[1-->";
    $$payload.out += `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No se encontraron tipos de pago</td></tr>`;
  } else {
    $$payload.out += "<!--[!-->";
    const each_array = ensure_array_like(tiposDePago);
    $$payload.out += `<!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let tipo = each_array[$$index];
      $$payload.out += `<tr class="hover:bg-gray-50"><td class="px-6 py-4 whitespace-nowrap">${escape_html(tipo.Codigo)}</td><td class="px-6 py-4">${escape_html(tipo.Descripcion)}</td><td class="px-6 py-4 whitespace-nowrap"><span${attr_class(clsx(tipo.Activo === 1 ? "text-green-600" : "text-red-600"))}>${escape_html(tipo.Activo === 1 ? "Activo" : "Inactivo")}</span></td><td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button class="text-blue-600 hover:text-blue-900 mr-3">Editar</button> <button${attr_class(clsx(tipo.Activo === 1 ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"))}>${escape_html(tipo.Activo === 1 ? "Desactivar" : "Activar")}</button></td></tr>`;
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]--></tbody></table></div> `;
  if (pagination.totalPages > 1) {
    $$payload.out += "<!--[-->";
    const each_array_1 = ensure_array_like(Array(Math.min(5, pagination.totalPages)));
    $$payload.out += `<div class="flex justify-between items-center mt-6"><div class="text-sm text-gray-700">Mostrando <span class="font-medium">${escape_html((pagination.currentPage - 1) * pagination.limit + 1)}</span> a <span class="font-medium">${escape_html(Math.min(pagination.currentPage * pagination.limit, pagination.totalItems))}</span> de <span class="font-medium">${escape_html(pagination.totalItems)}</span> resultados</div> <div class="flex space-x-2"><button class="px-3 py-1 border rounded-md disabled:opacity-50"${attr("disabled", pagination.currentPage === 1, true)}>Anterior</button> <!--[-->`;
    for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
      each_array_1[i];
      if (pagination.totalPages <= 5 || i === 0 || i === 4 && pagination.totalPages > 5 || pagination.currentPage - 3 + i >= 1 && pagination.currentPage - 3 + i <= pagination.totalPages) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<button${attr_class(`px-3 py-1 border rounded-md ${pagination.currentPage === (pagination.totalPages <= 5 ? i + 1 : pagination.currentPage - 3 + i) ? "bg-blue-500 text-white" : ""}`)}>${escape_html(pagination.totalPages <= 5 ? i + 1 : pagination.currentPage - 3 + i)}</button>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]-->`;
    }
    $$payload.out += `<!--]--> <button class="px-3 py-1 border rounded-md disabled:opacity-50"${attr("disabled", pagination.currentPage === pagination.totalPages, true)}>Siguiente</button></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
