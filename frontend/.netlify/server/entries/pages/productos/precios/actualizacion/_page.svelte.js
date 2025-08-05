import { n as copy_payload, o as assign_payload, c as pop, p as push, h as head, j as attr, g as ensure_array_like, e as escape_html } from "../../../../../chunks/index3.js";
import { B as Button } from "../../../../../chunks/Button.js";
import { M as MultiSelect } from "../../../../../chunks/MultiSelect.js";
import "../../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  let proveedores = [];
  let rubros = [];
  let articulos = [];
  let proveedoresSeleccionados = [];
  let rubrosSeleccionados = [];
  let porcentajeIncremento = 0;
  let loading = false;
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    head($$payload2, ($$payload3) => {
      $$payload3.title = `<title>Actualización de Precios</title>`;
    });
    $$payload2.out += `<div class="container mx-auto px-4 py-8"><div class="bg-white rounded-lg shadow-md p-6"><h1 class="text-2xl font-bold mb-6">Actualización de Precios</h1> <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"><div><label id="proveedores-label" for="proveedores-select" class="block text-sm font-medium text-gray-700 mb-2">Proveedores</label> <div id="proveedores-select" role="group" aria-labelledby="proveedores-label">`;
    MultiSelect($$payload2, {
      items: proveedores,
      labelField: "Descripcion",
      valueField: "Codigo",
      placeholder: "Seleccione proveedores...",
      get selectedValues() {
        return proveedoresSeleccionados;
      },
      set selectedValues($$value) {
        proveedoresSeleccionados = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!----></div></div> <div><label id="rubros-label" for="rubros-select" class="block text-sm font-medium text-gray-700 mb-2">Rubros</label> <div id="rubros-select" role="group" aria-labelledby="rubros-label">`;
    MultiSelect($$payload2, {
      items: rubros,
      labelField: "Descripcion",
      valueField: "Codigo",
      placeholder: "Seleccione rubros...",
      get selectedValues() {
        return rubrosSeleccionados;
      },
      set selectedValues($$value) {
        rubrosSeleccionados = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!----></div></div> <div><label for="porcentaje-input" class="block text-sm font-medium text-gray-700 mb-2">Porcentaje de Incremento</label> <input id="porcentaje-input" type="number"${attr("value", porcentajeIncremento)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ingrese porcentaje..." step="0.01"></div></div> <div class="flex gap-4 mb-6">`;
    Button($$payload2, {
      disabled: loading,
      children: ($$payload3) => {
        $$payload3.out += `<!---->${escape_html("Buscar")}`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----> `;
    Button($$payload2, {
      variant: "success",
      disabled: articulos.length === 0,
      children: ($$payload3) => {
        $$payload3.out += `<!---->${escape_html("Actualizar Precios")}`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----> `;
    Button($$payload2, {
      variant: "secondary",
      children: ($$payload3) => {
        $$payload3.out += `<!---->Salir`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----></div> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    if (articulos.length > 0) {
      $$payload2.out += "<!--[-->";
      const each_array = ensure_array_like(articulos);
      $$payload2.out += `<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rubro</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Actual</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nuevo Precio</th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`;
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let articulo = each_array[$$index];
        $$payload2.out += `<tr class="hover:bg-gray-50"><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${escape_html(articulo.Codigo)}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${escape_html(articulo.Descripcion)}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escape_html(articulo.Rubro?.Descripcion || "-")}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escape_html(articulo.Proveedor?.Descripcion || "-")}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${escape_html(articulo.PrecioCosto.toFixed(2))}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${escape_html((articulo.PrecioCosto * (1 + porcentajeIncremento / 100)).toFixed(2))}</td></tr>`;
      }
      $$payload2.out += `<!--]--></tbody></table></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div></div>`;
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
