import { l as ensure_array_like, h as head, k as attr, e as escape_html, c as pop, p as push } from "../../../../chunks/index3.js";
import "../../../../chunks/client.js";
import "../../../../chunks/navigationState.js";
import { B as Button } from "../../../../chunks/Button.js";
import "../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  const hoy = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  let filtroFechaDesde = hoy;
  let filtroFechaHasta = hoy;
  let proveedores = [];
  const each_array = ensure_array_like(proveedores);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Órdenes de compra</title>`;
  });
  $$payload.out += `<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><h1 class="text-2xl font-semibold text-gray-900">Órdenes de compra</h1> `;
  Button($$payload, {
    variant: "primary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Nueva orden`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div> <div class="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"><div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><div><label for="proveedor" class="block text-sm font-medium text-gray-700">Proveedor</label> <select id="proveedor" class="mt-1 block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"><option value="">Todos</option><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let p = each_array[$$index];
    $$payload.out += `<option${attr("value", p.Codigo)}>${escape_html(p.Descripcion)}</option>`;
  }
  $$payload.out += `<!--]--></select></div> <div><label for="fechaDesde" class="block text-sm font-medium text-gray-700">Desde</label> <input id="fechaDesde" type="date" class="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"${attr("value", filtroFechaDesde)}></div> <div><label for="fechaHasta" class="block text-sm font-medium text-gray-700">Hasta</label> <input id="fechaHasta" type="date" class="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"${attr("value", filtroFechaHasta)}></div> <div class="flex items-end">`;
  Button($$payload, {
    variant: "primary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Filtrar`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<p class="mt-6 text-gray-500">Cargando órdenes...</p>`;
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
