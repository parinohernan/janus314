import { d as store_get, h as head, e as escape_html, j as attr, g as ensure_array_like, u as unsubscribe_stores, c as pop, p as push } from "../../../../../../chunks/index3.js";
import { B as Button } from "../../../../../../chunks/Button.js";
import "../../../../../../chunks/client.js";
import { p as page } from "../../../../../../chunks/stores.js";
import { debounce } from "lodash-es";
import { f as fetchWithAuth } from "../../../../../../chunks/fetchWithAuth.js";
function getTodayISOArgentina() {
  const now = /* @__PURE__ */ new Date();
  const argentinaTime = new Date(now.getTime() - 3 * 60 * 60 * 1e3);
  return argentinaTime.toISOString().split("T")[0];
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const tipoMovimiento = store_get($$store_subs ??= {}, "$page", page).params.tipo === "ingreso" ? "ING" : "EGR";
  let documento = {
    Fecha: getTodayISOArgentina(),
    // Usar la función para la fecha en zona Argentina
    Observacion: ""
  };
  let items = [];
  let loading = false;
  let searchText = "";
  let searchResults = [];
  let searchLoading = false;
  let searchError = null;
  let nuevoArticulo = { codigo: "", cantidad: 1 };
  const searchArticulos = async () => {
    if (!searchText.trim()) {
      searchResults = [];
      return;
    }
    try {
      searchLoading = true;
      searchError = null;
      const response = await fetchWithAuth(`/articulos?search=${encodeURIComponent(searchText)}&limit=10`);
      if (!response.ok) throw new Error("Error al buscar artículos");
      const data = await response.json();
      searchResults = data.items;
    } catch (err) {
      console.error("Error buscando artículos:", err);
      searchError = err instanceof Error ? err.message : "Error desconocido";
    } finally {
      searchLoading = false;
    }
  };
  debounce(searchArticulos, 300);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Nuevo ${escape_html(tipoMovimiento === "ING" ? "Ingreso" : "Egreso")} de Stock</title>`;
  });
  $$payload.out += `<div class="container mx-auto px-4 py-8"><div class="bg-white p-6 rounded-lg shadow-md"><div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Nuevo ${escape_html(tipoMovimiento === "ING" ? "Ingreso" : "Egreso")} de Stock</h1> `;
  Button($$payload, {
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd"></path></svg> Volver`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <form><div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"><div><label for="fecha" class="block text-sm font-medium text-gray-700 mb-1">Fecha</label> <input id="fecha" type="date"${attr("value", documento.Fecha)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="movimientoTipo" class="block text-sm font-medium text-gray-700 mb-1">Tipo de movimiento</label> <input id="movimientoTipo" type="text"${attr("value", tipoMovimiento === "ING" ? "Ingreso" : "Egreso")} readonly class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"></div> <div class="md:col-span-2"><label for="observacion" class="block text-sm font-medium text-gray-700 mb-1">Observación</label> <textarea id="observacion" placeholder="Ingrese una observación o descripción general" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20">`;
  const $$body = escape_html(documento.Observacion);
  if ($$body) {
    $$payload.out += `${$$body}`;
  }
  $$payload.out += `</textarea></div></div> <div class="border-t border-b border-gray-200 py-4 mb-6"><h2 class="text-lg font-semibold mb-4">Artículos</h2> <div class="mb-4"><label for="searchText" class="block text-sm font-medium text-gray-700 mb-1">Buscar artículo</label> <div class="flex space-x-2"><div class="flex-grow"><input id="searchText" type="text"${attr("value", searchText)} placeholder="Ingrese código o descripción (mínimo 3 caracteres)" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> `;
  Button($$payload, {
    type: "button",
    variant: "primary",
    disabled: searchText.length < 3 || searchLoading,
    children: ($$payload2) => {
      $$payload2.out += `<!---->Buscar`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div> `;
  if (searchLoading) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="text-center py-2"><div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div> <span class="ml-2 text-sm text-gray-500">Buscando...</span></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (searchError) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="text-sm text-red-600 mt-1">${escape_html(searchError)}</div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (searchResults.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(searchResults);
    $$payload.out += `<div class="mt-2 border border-gray-200 rounded-md overflow-hidden"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th><th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let articulo = each_array[$$index];
      $$payload.out += `<tr class="hover:bg-gray-50"><td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${escape_html(articulo.Codigo)}</td><td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${escape_html(articulo.Descripcion)}</td><td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${escape_html(articulo.Existencia)}</td><td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">$${escape_html(articulo.PrecioCosto.toFixed(2))}</td><td class="px-3 py-2 whitespace-nowrap text-center"><button type="button" class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs">Agregar</button></td></tr>`;
    }
    $$payload.out += `<!--]--></tbody></table></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> <div class="mb-4"><label for="nuevoCodigo" class="block text-sm font-medium text-gray-700 mb-1">Agregar artículo por código</label> <div class="flex space-x-2"><div class="flex-grow md:w-2/3"><input id="nuevoCodigo" type="text"${attr("value", nuevoArticulo.codigo)} placeholder="Código del artículo" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div class="w-24"><label for="nuevaCantidad" class="sr-only">Cantidad</label> <input id="nuevaCantidad" type="number"${attr("value", nuevoArticulo.cantidad)} min="1" step="any" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> `;
  Button($$payload, {
    type: "button",
    variant: "primary",
    disabled: true,
    children: ($$payload2) => {
      $$payload2.out += `<!---->Agregar`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div> `;
  if (items.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array_1 = ensure_array_like(items);
    $$payload.out += `<div class="mt-4 border border-gray-200 rounded-md overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th><th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`;
    for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
      let item = each_array_1[index];
      $$payload.out += `<tr class="hover:bg-gray-50"><td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${escape_html(item.CodigoArticulo)}</td><td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${escape_html(item.Descripcion)}</td><td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${escape_html(item.Existencia)} `;
      if (tipoMovimiento === "EGR" && item.Cantidad > item.Existencia) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<span class="text-red-600 text-xs ml-1">(Insuficiente)</span>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></td><td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900"><input type="number"${attr("value", item.Cantidad)} min="0.01" step="any" class="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></td><td class="px-3 py-2 whitespace-nowrap text-center"><button type="button" class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs">Eliminar</button></td></tr>`;
    }
    $$payload.out += `<!--]--></tbody></table></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="bg-gray-50 border border-gray-200 rounded-md p-4 text-center text-gray-500">No hay artículos agregados</div>`;
  }
  $$payload.out += `<!--]--></div> <div class="flex justify-end space-x-2">`;
  Button($$payload, {
    type: "button",
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Cancelar`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  Button($$payload, {
    type: "submit",
    variant: "primary",
    disabled: loading,
    children: ($$payload2) => {
      {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]--> Guardar`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></form></div></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
