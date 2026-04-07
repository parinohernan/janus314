import { l as ensure_array_like, k as attr, e as escape_html, c as pop, p as push } from "../../../../../chunks/index3.js";
import "../../../../../chunks/client.js";
import "../../../../../chunks/authStore.js";
import { B as Button } from "../../../../../chunks/Button.js";
import { a as Icon } from "../../../../../chunks/Icon.js";
import "../../../../../chunks/navigationState.js";
import { C as Circle_user } from "../../../../../chunks/circle-user.js";
function _page($$payload, $$props) {
  push();
  let vendedoresOptions = [];
  let vendedoresLoading = false;
  const hoy = /* @__PURE__ */ new Date();
  hoy.setHours(hoy.getHours() - 3);
  const fechaFormateada = hoy.toISOString().substring(0, 10);
  let fechaDesde = fechaFormateada;
  let fechaHasta = fechaFormateada;
  const each_array = ensure_array_like(vendedoresOptions);
  $$payload.out += `<div class="container mx-auto px-4 py-6"><h1 class="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">`;
  Icon($$payload, {
    icon: Circle_user,
    size: 32,
    strokeWidth: 2.5,
    glass: true
  });
  $$payload.out += `<!----> Informe de Ventas por Vendedor</h1> <div class="bg-white p-6 rounded-lg shadow-md mb-6"><h2 class="text-xl font-semibold text-gray-700 mb-4">Filtros</h2> <div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label for="vendedor" class="block text-sm font-medium text-gray-700 mb-1">Vendedor <span class="text-red-500">*</span></label> <select id="vendedor"${attr("disabled", vendedoresLoading, true)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Seleccione un vendedor...</option><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let vendedor = each_array[$$index];
    $$payload.out += `<option${attr("value", vendedor.value)}>${escape_html(vendedor.label)}</option>`;
  }
  $$payload.out += `<!--]--></select> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> <div><label for="fechaDesde" class="block text-sm font-medium text-gray-700 mb-1">Fecha Desde <span class="text-red-500">*</span></label> <input id="fechaDesde" type="date"${attr("value", fechaDesde)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="fechaHasta" class="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta <span class="text-red-500">*</span></label> <input id="fechaHasta" type="date"${attr("value", fechaHasta)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div></div> <div class="flex justify-end space-x-3 mt-6">`;
  Button($$payload, {
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Limpiar`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  Button($$payload, {
    variant: "primary",
    disabled: true,
    children: ($$payload2) => {
      {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]--> Generar Informe`;
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
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
