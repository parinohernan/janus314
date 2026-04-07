import { z as copy_payload, A as assign_payload, c as pop, p as push, k as attr, e as escape_html } from "../../../../chunks/index3.js";
import "../../../../chunks/client.js";
import { B as Button } from "../../../../chunks/Button.js";
import "../../../../chunks/authStore.js";
import "../../../../chunks/navigationState.js";
import { E as EntitySelector } from "../../../../chunks/EntitySelector.js";
import { M as MultiSelect } from "../../../../chunks/MultiSelect.js";
function _page($$payload, $$props) {
  push();
  let selectedPreventas = [];
  let loadingInforme = false;
  let filtros = {
    cliente: "",
    fechaDesde: "",
    fechaHasta: "",
    pendientes: true
  };
  let vendedores = [];
  let vendedoresSeleccionados = [];
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out += `<div class="container mx-auto px-4 py-6 svelte-1vieo83"><h1 class="text-2xl font-bold mb-6 svelte-1vieo83">Listado de Preventas</h1> <div class="bg-white rounded-lg shadow-md p-4 mb-6 svelte-1vieo83"><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-4 svelte-1vieo83"><div class="svelte-1vieo83">`;
    EntitySelector($$payload2, {
      label: "Cliente",
      placeholder: "Buscar cliente...",
      apiEndpoint: "/clientes",
      valueField: "Codigo",
      labelField: "Descripcion",
      initialValue: filtros.cliente,
      minSearchLength: 3
    });
    $$payload2.out += `<!----></div> <div class="svelte-1vieo83"><label for="vendedores-select" class="block text-sm font-medium text-gray-700 mb-2 svelte-1vieo83">Vendedores</label> `;
    MultiSelect($$payload2, {
      items: vendedores,
      labelField: "Descripcion",
      valueField: "Codigo",
      placeholder: "Seleccione vendedores...",
      get selectedValues() {
        return vendedoresSeleccionados;
      },
      set selectedValues($$value) {
        vendedoresSeleccionados = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!----></div> <div class="svelte-1vieo83"><label for="filtroFechaDesde" class="block text-sm font-medium text-gray-700 svelte-1vieo83">Fecha desde</label> <input type="date" id="filtroFechaDesde"${attr("value", filtros.fechaDesde)} class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 svelte-1vieo83"></div> <div class="svelte-1vieo83"><label for="filtroFechaHasta" class="block text-sm font-medium text-gray-700 svelte-1vieo83">Fecha hasta</label> <input type="date" id="filtroFechaHasta"${attr("value", filtros.fechaHasta)} class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 svelte-1vieo83"></div> <div class="flex items-end svelte-1vieo83"><label class="inline-flex items-center svelte-1vieo83"><input type="checkbox"${attr("checked", filtros.pendientes, true)} class="form-checkbox h-5 w-5 text-indigo-600 svelte-1vieo83"> <span class="ml-2 text-gray-700 svelte-1vieo83">Solo pendientes</span></label></div></div> <div class="flex justify-between items-center svelte-1vieo83"><div class="flex space-x-2 svelte-1vieo83">`;
    Button($$payload2, {
      variant: "secondary",
      children: ($$payload3) => {
        $$payload3.out += `<!---->Limpiar Filtros`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----> `;
    Button($$payload2, {
      variant: "primary",
      children: ($$payload3) => {
        $$payload3.out += `<!---->Aplicar Filtros`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----></div> `;
    Button($$payload2, {
      variant: "primary",
      children: ($$payload3) => {
        $$payload3.out += `<!---->Nueva Preventa`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----></div></div> <div class="flex flex-wrap items-center justify-between mb-6 svelte-1vieo83"><div class="flex flex-wrap items-center space-x-4 svelte-1vieo83">`;
    Button($$payload2, {
      variant: "primary",
      disabled: selectedPreventas.length === 0 || loadingInforme,
      children: ($$payload3) => {
        $$payload3.out += `<!---->Resumen`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----> `;
    Button($$payload2, {
      variant: "secondary",
      disabled: selectedPreventas.length === 0 || loadingInforme,
      children: ($$payload3) => {
        $$payload3.out += `<!---->Informe por Preventa`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----> `;
    if (selectedPreventas.length > 0) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<div class="flex items-center space-x-2 svelte-1vieo83"><label for="ordenamiento" class="text-sm font-medium text-gray-700 svelte-1vieo83">Ordenar por:</label> <select id="ordenamiento" class="border border-gray-300 rounded-md shadow-sm p-2 text-sm svelte-1vieo83"><option value="codigo" class="svelte-1vieo83">Código</option><option value="descripcion" class="svelte-1vieo83">Descripción</option><option value="proveedor" class="svelte-1vieo83">Proveedor</option><option value="rubro" class="svelte-1vieo83">Rubro</option><option value="cantidad" class="svelte-1vieo83">Cantidad</option></select></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div> `;
    if (selectedPreventas.length > 0) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<div class="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md text-sm font-medium svelte-1vieo83">${escape_html(selectedPreventas.length)} preventas seleccionadas</div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<div class="flex justify-center items-center h-48 svelte-1vieo83"><div class="spinner svelte-1vieo83"></div></div>`;
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
