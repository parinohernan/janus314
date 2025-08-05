import { d as store_get, e as escape_html, j as attr, g as ensure_array_like, u as unsubscribe_stores, c as pop, p as push } from "../../../../../chunks/index3.js";
import { p as page } from "../../../../../chunks/stores.js";
import { B as Button } from "../../../../../chunks/Button.js";
import "../../../../../chunks/authStore.js";
import "../../../../../chunks/client.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  let observacion = "";
  let items = [];
  let loading = false;
  let clientesOptions = [];
  let clienteSearch = "";
  let articulosOptions = [];
  let articuloSearch = "";
  let importeTotal = 0;
  store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("editar");
  $$payload.out += `<div class="container mx-auto px-4 py-8"><div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold text-gray-800">${escape_html("Nueva Preventa")}</h1> <div class="flex space-x-2">`;
  Button($$payload, {
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Cancelar`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  Button($$payload, {
    variant: "primary",
    disabled: loading,
    children: ($$payload2) => {
      $$payload2.out += `<!---->${escape_html("Guardar Preventa")}`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="bg-blue-100 border border-blue-300 text-blue-700 px-4 py-3 rounded mb-4"><p>Cargando configuraciones del sistema...</p></div>`;
  }
  $$payload.out += `<!--]--> <div class="bg-white p-6 rounded-lg shadow-md mb-6"><div class="flex justify-between items-center mb-4"><h2 class="text-xl font-semibold">Datos de la Preventa</h2></div> <div class="grid grid-cols-1 gap-4 mb-4"><div class="relative"><label for="cliente-search" class="block text-sm font-medium text-gray-700 mb-1">Cliente *</label> <div class="relative"><input id="cliente-search" type="text" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pr-10" placeholder="Buscar cliente..."${attr("value", clienteSearch)} autocomplete="off"> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> `;
  if (clientesOptions.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(clientesOptions);
    $$payload.out += `<div class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto"><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let cliente = each_array[$$index];
      $$payload.out += `<button type="button" class="block w-full text-left px-4 py-2 hover:bg-gray-100"><div class="font-medium">${escape_html(cliente.Descripcion)}</div> <div class="text-sm text-gray-500"><span>Código: ${escape_html(cliente.Codigo)}</span> `;
      if (cliente.ImporteDeuda !== void 0) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<span class="ml-2">Deuda: $${escape_html(cliente.ImporteDeuda.toFixed(2))}</span>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (cliente.ListaPrecio) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<span class="ml-2">Lista: ${escape_html(cliente.ListaPrecio)}</span>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></div></button>`;
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div> <div class="grid grid-cols-1 gap-4 mb-4"><div><label for="observacion" class="block text-sm font-medium text-gray-700 mb-1">Observación</label> <textarea id="observacion" rows="3" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm" placeholder="Ingrese una observación para la preventa...">`;
  const $$body = escape_html(observacion);
  if ($$body) {
    $$payload.out += `${$$body}`;
  }
  $$payload.out += `</textarea></div></div></div> <div class="bg-white p-6 rounded-lg shadow-md mb-6"><div class="flex justify-between items-center mb-4"><h2 class="text-xl font-semibold">Artículos</h2> `;
  Button($$payload, {
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Buscar Artículo`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div> <div class="mb-4"><label for="articulo-search" class="block text-sm font-medium text-gray-700 mb-1">Buscar Artículo</label> <div class="relative"><input id="articulo-search" type="text" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pr-10" placeholder="Buscar artículo..."${attr("value", articuloSearch)} autocomplete="off"> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> `;
  if (articulosOptions.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array_1 = ensure_array_like(articulosOptions);
    $$payload.out += `<div class="mt-1 bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto"><!--[-->`;
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let articulo = each_array_1[$$index_1];
      $$payload.out += `<button type="button" class="block w-full text-left px-4 py-2 hover:bg-gray-100"><div class="font-medium">${escape_html(articulo.Descripcion)}</div> <div class="text-sm text-gray-500"><span>Código: ${escape_html(articulo.Codigo)}</span> <span class="ml-2">Precio: $${escape_html((articulo.PrecioCosto * (1 + (articulo.Lista1 || 0) / 100) * (1 + (articulo.PorcentajeIVA1 || 0) / 100))?.toFixed(2) || "0.00")}</span> <span class="ml-2">Stock: ${escape_html(articulo.Existencia || 0)}</span></div></button>`;
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (items.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array_2 = ensure_array_like(items);
    $$payload.out += `<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Lista</th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desc. %</th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Final</th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`;
    for (let index = 0, $$length = each_array_2.length; index < $$length; index++) {
      let item = each_array_2[index];
      $$payload.out += `<tr><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escape_html(item.CodigoArticulo)}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${escape_html(item.Articulo?.Descripcion)}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><div class="flex items-center"><button type="button" class="text-gray-500 hover:text-gray-700" aria-label="Disminuir cantidad">-</button> <span class="mx-2">${escape_html(item.Cantidad)}</span> <button type="button" class="text-gray-500 hover:text-gray-700" aria-label="Aumentar cantidad">+</button></div></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${escape_html(item.PrecioLista?.toFixed(2))}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escape_html(item.PorcentajeBonificacion || 0)}%</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${escape_html(item.PrecioUnitario?.toFixed(2))}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${escape_html(((item.PrecioUnitario || 0) * (item.Cantidad || 0)).toFixed(2))}</td><td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button type="button" class="text-red-500 hover:text-red-700" aria-label="Eliminar artículo"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg></button></td></tr>`;
    }
    $$payload.out += `<!--]--></tbody><tfoot><tr class="bg-gray-50"><td colspan="4" class="px-6 py-3 text-right text-sm font-medium text-gray-900">Total:</td><td class="px-6 py-3 text-left text-sm font-medium text-gray-900">$${escape_html(importeTotal.toFixed(2))}</td><td></td></tr></tfoot></table> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="text-center py-8 text-gray-500">No hay artículos agregados a la preventa</div>`;
  }
  $$payload.out += `<!--]--></div></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
