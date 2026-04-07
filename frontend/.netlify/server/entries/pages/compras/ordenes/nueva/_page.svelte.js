import { l as ensure_array_like, h as head, k as attr, e as escape_html, c as pop, p as push } from "../../../../../chunks/index3.js";
import "../../../../../chunks/client.js";
import { B as Button } from "../../../../../chunks/Button.js";
import "../../../../../chunks/authStore.js";
import "../../../../../chunks/navigationState.js";
function _page($$payload, $$props) {
  push();
  const hoy = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  let loading = false;
  let proveedoresBusqueda = "";
  let articuloBusqueda = "";
  let articuloOptions = [];
  let cantidadArticulo = 1;
  let formasPago = [];
  let orden = {
    Fecha: hoy,
    FechaDeEntrega: "",
    Observacion: ""
  };
  let items = [];
  const each_array_1 = ensure_array_like(formasPago);
  const each_array_3 = ensure_array_like(items);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Nueva orden de compra</title>`;
  });
  $$payload.out += `<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><h1 class="text-2xl font-semibold text-gray-900">Nueva orden de compra</h1> <div class="flex gap-2">`;
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
      $$payload2.out += `<!---->${escape_html("Guardar orden")}`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"><h2 class="mb-4 text-lg font-semibold text-gray-900">Datos de la orden</h2> <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12"><div class="relative lg:col-span-4"><label for="proveedor" class="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label> <input type="text" id="proveedor" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Buscar proveedor..."${attr("value", proveedoresBusqueda)} autocomplete="off"> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> <div class="lg:col-span-2"><label for="fecha" class="block text-sm font-medium text-gray-700 mb-1">Fecha *</label> <input id="fecha" type="date" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"${attr("value", orden.Fecha)}></div> <div class="lg:col-span-2"><label for="fechaEntrega" class="block text-sm font-medium text-gray-700 mb-1">Fecha de entrega</label> <input id="fechaEntrega" type="date" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"${attr("value", orden.FechaDeEntrega)}></div> <div class="lg:col-span-2"><label for="tipoPago" class="block text-sm font-medium text-gray-700 mb-1">Forma de pago</label> <select id="tipoPago" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"><option value="">Seleccionar</option><!--[-->`;
  for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
    let fp = each_array_1[$$index_1];
    $$payload.out += `<option${attr("value", fp.value)}>${escape_html(fp.label)}</option>`;
  }
  $$payload.out += `<!--]--></select></div> <div class="lg:col-span-12"><label for="observacion" class="block text-sm font-medium text-gray-700 mb-1">Observación</label> <input id="observacion" type="text" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Opcional"${attr("value", orden.Observacion)}></div></div></div> <div class="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"><h2 class="mb-4 text-lg font-semibold text-gray-900">Ítems</h2> <div class="mb-6 rounded-lg bg-gray-50 p-4"><h3 class="mb-3 text-sm font-semibold text-gray-700">Agregar artículo</h3> <div class="grid grid-cols-1 gap-4 md:grid-cols-4"><div class="relative md:col-span-2"><label for="articulo" class="mb-1 block text-sm font-medium text-gray-700">Artículo</label> <input id="articulo" type="text" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Buscar artículo por código o descripción..."${attr("value", articuloBusqueda)}> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (articuloOptions.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array_2 = ensure_array_like(articuloOptions);
    $$payload.out += `<div class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white py-1 shadow-lg"><!--[-->`;
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let art = each_array_2[$$index_2];
      $$payload.out += `<button type="button" class="w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-gray-100">${escape_html(art.Codigo)} - ${escape_html(art.Descripcion)}</button>`;
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> <div><label for="cantidad" class="mb-1 block text-sm font-medium text-gray-700">Cantidad</label> <input id="cantidad" type="number" min="1" step="0.01" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"${attr("value", cantidadArticulo)}></div> <div class="flex items-end">`;
  Button($$payload, {
    variant: "primary",
    disabled: true,
    class: "w-full",
    children: ($$payload2) => {
      $$payload2.out += `<!---->+ Agregar`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> <div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Artículo</th><th class="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Cantidad</th><th class="px-4 py-2 w-12"></th></tr></thead><tbody class="divide-y divide-gray-200 bg-white"><!--[-->`;
  for (let i = 0, $$length = each_array_3.length; i < $$length; i++) {
    let item = each_array_3[i];
    $$payload.out += `<tr><td class="px-4 py-2 text-sm text-gray-900">${escape_html(item.CodigoArticulo)} - ${escape_html(item.Descripcion)}</td><td class="px-4 py-2 text-right text-sm text-gray-900">${escape_html(item.Cantidad)}</td><td class="px-4 py-2"><button type="button" class="text-red-600 hover:text-red-800">Quitar</button></td></tr>`;
  }
  $$payload.out += `<!--]--></tbody></table></div> `;
  if (items.length === 0) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<p class="mt-4 text-center text-sm text-gray-500">No hay ítems. Busque y agregue artículos arriba.</p>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div>`;
  pop();
}
export {
  _page as default
};
