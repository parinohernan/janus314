import { g as sanitize_props, j as spread_props, f as slot, z as copy_payload, A as assign_payload, c as pop, p as push, l as ensure_array_like, h as head, k as attr, e as escape_html } from "../../../../../chunks/index3.js";
import "../../../../../chunks/client.js";
import "chart.js/auto";
import { D as DatePicker } from "../../../../../chunks/DatePicker.js";
import "../../../../../chunks/authStore.js";
import { I as Icon, a as Icon$1 } from "../../../../../chunks/Icon.js";
import "../../../../../chunks/navigationState.js";
function Tag($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"
      }
    ],
    [
      "circle",
      {
        "cx": "7.5",
        "cy": "7.5",
        "r": ".5",
        "fill": "currentColor"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "tag" },
    $$sanitized_props,
    {
      iconNode,
      children: ($$payload2) => {
        $$payload2.out += `<!---->`;
        slot($$payload2, $$props, "default", {});
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
}
function _page($$payload, $$props) {
  push();
  let loading = false;
  let fechaDesde = /* @__PURE__ */ new Date();
  let fechaHasta = /* @__PURE__ */ new Date();
  let rubrosSeleccionados = [];
  let todosLosRubros = [];
  let cargandoRubros = false;
  let busquedaRubro = "";
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    const each_array = ensure_array_like(todosLosRubros);
    head($$payload2, ($$payload3) => {
      $$payload3.title = `<title>Informe de Ventas por Rubro</title>`;
    });
    $$payload2.out += `<div class="container mx-auto p-6 space-y-6"><div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"><div><h1 class="text-3xl font-bold text-gray-900">📂 Informe de Ventas por Rubro</h1> <p class="text-gray-600 mt-2">Análisis de ventas de productos agrupados por rubro</p></div></div> <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><h2 class="text-lg font-semibold mb-4">📅 Filtros</h2> <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"><div><label for="fechaDesde" class="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label> `;
    DatePicker($$payload2, {
      id: "fechaDesde",
      get value() {
        return fechaDesde;
      },
      set value($$value) {
        fechaDesde = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!----></div> <div><label for="fechaHasta" class="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label> `;
    DatePicker($$payload2, {
      id: "fechaHasta",
      get value() {
        return fechaHasta;
      },
      set value($$value) {
        fechaHasta = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!----></div> <div><label for="rubro" class="block text-sm font-medium text-gray-700 mb-2">Filtrar por Rubros (Opcional)</label> <div class="flex gap-2 mb-2"><select id="rubro" class="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"${attr("disabled", cargandoRubros, true)}><option value="">Agregar rubro...</option><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let rubro = each_array[$$index];
      $$payload2.out += `<option${attr("value", rubro.codigo)}>${escape_html(rubro.descripcion)}</option>`;
    }
    $$payload2.out += `<!--]--></select> `;
    if (todosLosRubros.length > 0) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<button type="button" class="px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm whitespace-nowrap flex-shrink-0" title="Seleccionar todos los rubros">Todos</button>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    if (rubrosSeleccionados.length > 0) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<button type="button" class="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm whitespace-nowrap flex-shrink-0" title="Limpiar todos los rubros">Limpiar</button>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    if (rubrosSeleccionados.length > 0) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<div class="mb-2"><div class="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-2 rounded-md inline-block">✓ ${escape_html(rubrosSeleccionados.length)} rubro${escape_html(rubrosSeleccionados.length !== 1 ? "s" : "")} seleccionado${escape_html(rubrosSeleccionados.length !== 1 ? "s" : "")}</div></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> <div class="relative"><input type="text"${attr("value", busquedaRubro)} placeholder="Buscar rubro..." class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div></div></div> <div class="flex justify-end"><button type="button"${attr("disabled", loading, true)} class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">`;
    {
      $$payload2.out += "<!--[!-->";
      $$payload2.out += `🔍 Buscar`;
    }
    $$payload2.out += `<!--]--></button></div></div> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    {
      $$payload2.out += "<!--[2-->";
      $$payload2.out += `<div class="text-center py-12"><div class="mb-4">`;
      Icon$1($$payload2, {
        icon: Tag,
        size: 64,
        strokeWidth: 2,
        glass: true
      });
      $$payload2.out += `<!----></div> <h3 class="text-xl font-semibold text-gray-900 mb-2">Selecciona un rango de fechas</h3> <p class="text-gray-600">Para ver el informe de ventas por rubro, selecciona las fechas de inicio y fin.</p></div>`;
    }
    $$payload2.out += `<!--]--></div>`;
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  pop();
}
export {
  _page as default
};
