import { g as sanitize_props, j as spread_props, f as slot, z as copy_payload, A as assign_payload, c as pop, p as push, l as ensure_array_like, h as head, k as attr, e as escape_html } from "../../../../../chunks/index3.js";
import "chart.js/auto";
import { D as DatePicker } from "../../../../../chunks/DatePicker.js";
import "../../../../../chunks/authStore.js";
import { I as Icon, a as Icon$1 } from "../../../../../chunks/Icon.js";
function Factory($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M12 16h.01" }],
    ["path", { "d": "M16 16h.01" }],
    [
      "path",
      {
        "d": "M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5a.5.5 0 0 0-.769-.422l-4.462 2.844A.5.5 0 0 1 15 10.5v-2a.5.5 0 0 0-.769-.422L9.77 10.922A.5.5 0 0 1 9 10.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"
      }
    ],
    ["path", { "d": "M8 16h.01" }]
  ];
  Icon($$payload, spread_props([
    { name: "factory" },
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
  let proveedoresSeleccionados = [];
  let formasPago = [];
  let todosLosProveedores = [];
  let cargandoProveedores = false;
  let busquedaProveedor = "";
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    const each_array = ensure_array_like(formasPago);
    const each_array_1 = ensure_array_like(todosLosProveedores);
    head($$payload2, ($$payload3) => {
      $$payload3.title = `<title>Informe de Ventas por Proveedor</title>`;
    });
    $$payload2.out += `<div class="container mx-auto p-6 space-y-6"><div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"><div><h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">`;
    Icon$1($$payload2, {
      icon: Factory,
      size: 32,
      strokeWidth: 2.5,
      glass: true
    });
    $$payload2.out += `<!----> Informe de Ventas por Proveedor</h1> <p class="text-gray-600 mt-2">Análisis de ventas de productos agrupados por proveedor</p></div></div> <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><h2 class="text-lg font-semibold mb-4">📅 Filtros</h2> <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4"><div><label for="fechaDesde" class="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label> `;
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
    $$payload2.out += `<!----></div> <div><label for="filtroPagoTipo" class="block text-sm font-medium text-gray-700 mb-2">Forma de pago</label> <select id="filtroPagoTipo" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"><option value="">Todas</option><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let fp = each_array[$$index];
      $$payload2.out += `<option${attr("value", fp.value)}>${escape_html(fp.label)}</option>`;
    }
    $$payload2.out += `<!--]--></select></div> <div class="md:col-span-4"><label for="proveedor" class="block text-sm font-medium text-gray-700 mb-2">Filtrar por Proveedores (Opcional)</label> <div class="flex gap-2 mb-2"><select id="proveedor" class="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"${attr("disabled", cargandoProveedores, true)}><option value="">Agregar proveedor...</option><!--[-->`;
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let proveedor = each_array_1[$$index_1];
      $$payload2.out += `<option${attr("value", proveedor.codigo)}>${escape_html(proveedor.descripcion)}</option>`;
    }
    $$payload2.out += `<!--]--></select> `;
    if (todosLosProveedores.length > 0) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<button type="button" class="px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm whitespace-nowrap flex-shrink-0" title="Seleccionar todos los proveedores">Todos</button>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    if (proveedoresSeleccionados.length > 0) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<button type="button" class="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm whitespace-nowrap flex-shrink-0" title="Limpiar todos los proveedores">Limpiar</button>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    if (proveedoresSeleccionados.length > 0) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<div class="mb-2"><div class="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-2 rounded-md inline-block">✓ ${escape_html(proveedoresSeleccionados.length)} proveedor${escape_html(proveedoresSeleccionados.length !== 1 ? "es" : "")} seleccionado${escape_html(proveedoresSeleccionados.length !== 1 ? "s" : "")}</div></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> <div class="relative"><input type="text"${attr("value", busquedaProveedor)} placeholder="Buscar proveedor..." class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"> `;
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
      $$payload2.out += `<div class="text-center py-12"><div class="text-6xl mb-4">🏭</div> <h3 class="text-xl font-semibold text-gray-900 mb-2">Selecciona un rango de fechas</h3> <p class="text-gray-600">Para ver el informe de ventas por proveedor, selecciona las fechas de inicio y fin.</p></div>`;
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
