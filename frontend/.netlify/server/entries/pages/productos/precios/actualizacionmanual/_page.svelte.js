import { z as copy_payload, A as assign_payload, c as pop, p as push, h as head, l as ensure_array_like, m as attr_class, e as escape_html, n as stringify, k as attr } from "../../../../../chunks/index3.js";
import "../../../../../chunks/client.js";
import { B as Button } from "../../../../../chunks/Button.js";
import { M as MultiSelect } from "../../../../../chunks/MultiSelect.js";
import "../../../../../chunks/authStore.js";
import "idb";
import "../../../../../chunks/navigationState.js";
function _page($$payload, $$props) {
  push();
  let articulosSeleccionados, hayCambios;
  const MODOS = [
    { value: "precioCosto", label: "Precio costo" },
    {
      value: "precioCostoMasImp",
      label: "Costo + IVA"
    },
    { value: "lista1", label: "Lista 1" },
    { value: "lista2", label: "Lista 2" },
    { value: "lista3", label: "Lista 3" },
    { value: "lista4", label: "Lista 4" },
    { value: "lista5", label: "Lista 5" }
  ];
  let proveedores = [];
  let rubros = [];
  let articulos = [];
  let proveedoresSeleccionados = [];
  let rubrosSeleccionados = [];
  let modoEdicion = "precioCosto";
  let loading = false;
  let seleccionarTodos = false;
  let articulosModificados = /* @__PURE__ */ new Map();
  function getValorActual(articulo) {
    switch (modoEdicion) {
      case "precioCosto":
        return articulo.PrecioCosto ?? 0;
      case "precioCostoMasImp":
        return articulo.PrecioCostoMasImp ?? (articulo.PrecioCosto ?? 0) * (1 + (articulo.PorcentajeIVA1 ?? 21) / 100);
      case "lista1":
        return articulo.Lista1 ?? 0;
      case "lista2":
        return articulo.Lista2 ?? 0;
      case "lista3":
        return articulo.Lista3 ?? 0;
      case "lista4":
        return articulo.Lista4 ?? 0;
      case "lista5":
        return articulo.Lista5 ?? 0;
      default:
        return 0;
    }
  }
  function getKeyModo() {
    return "PrecioCosto";
  }
  function getValorParaMostrar(articulo) {
    const mod = articulosModificados.get(articulo.Codigo);
    if (mod) {
      const key = getKeyModo();
      const v = mod[key];
      if (v !== void 0 && v !== null) return Number(v);
    }
    return getValorActual(articulo);
  }
  function calcularPrecioConIva(articulo) {
    const iva = articulo.PorcentajeIVA1 ?? 21;
    {
      const costo = getValorParaMostrar(articulo);
      return costo * (1 + iva / 100);
    }
  }
  function tieneCambio(codigo) {
    return articulosModificados.has(codigo);
  }
  articulosSeleccionados = articulos.filter((a) => a.seleccionado).length;
  hayCambios = articulosModificados.size > 0;
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    head($$payload2, ($$payload3) => {
      $$payload3.title = `<title>Actualización Manual de Precios</title>`;
    });
    $$payload2.out += `<div class="container mx-auto px-4 py-8"><div class="bg-white rounded-lg shadow-md p-6"><h1 class="text-2xl font-bold mb-6">Actualización Manual de Precios</h1> <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"><div role="group" aria-labelledby="proveedores-label"><label id="proveedores-label" class="block text-sm font-medium text-gray-700 mb-2">Proveedores</label> `;
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
    $$payload2.out += `<!----></div> <div role="group" aria-labelledby="rubros-label"><label id="rubros-label" class="block text-sm font-medium text-gray-700 mb-2">Rubros</label> `;
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
    $$payload2.out += `<!----></div></div> <div class="flex gap-4 mb-6">`;
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
      disabled: !hayCambios,
      children: ($$payload3) => {
        $$payload3.out += `<!---->${escape_html(`Actualizar (${articulosModificados.size} cambios)`)}`;
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
      const each_array = ensure_array_like(MODOS);
      const each_array_1 = ensure_array_like(articulos);
      $$payload2.out += `<div class="mb-4"><span class="text-sm font-medium text-gray-700 mr-2">Editar:</span> <div class="inline-flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg"><!--[-->`;
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let m = each_array[$$index];
        $$payload2.out += `<button type="button"${attr_class(`px-3 py-1.5 text-sm rounded ${stringify(modoEdicion === m.value ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-200")}`)}>${escape_html(m.label)}</button>`;
      }
      $$payload2.out += `<!--]--></div></div> <div class="mb-4 flex items-center justify-between"><div class="flex items-center gap-4"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox"${attr("checked", seleccionarTodos, true)} class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"> <span class="text-sm font-medium text-gray-700">Seleccionar todos</span></label> <span class="text-sm text-gray-600">${escape_html(articulosSeleccionados)} de ${escape_html(articulos.length)} artículo(s)</span> `;
      if (hayCambios) {
        $$payload2.out += "<!--[-->";
        $$payload2.out += `<span class="text-sm text-amber-600 font-medium">${escape_html(articulosModificados.size)} con cambios</span>`;
      } else {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]--></div></div> <div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10"><input type="checkbox"${attr("checked", seleccionarTodos, true)} class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"></th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rubro</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio costo</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">${escape_html("Nuevo costo")}</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio con IVA</th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`;
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let articulo = each_array_1[$$index_1];
        const modificado = tieneCambio(articulo.Codigo);
        $$payload2.out += `<tr${attr_class(`${stringify(articulo.seleccionado ? "hover:bg-gray-50" : "opacity-30 bg-gray-50")} ${stringify(modificado ? "ring-1 ring-amber-400" : "")}`)}><td class="px-4 py-3 whitespace-nowrap"><input type="checkbox"${attr("checked", articulo.seleccionado, true)} class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"></td><td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${escape_html(articulo.Codigo)}</td><td class="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">${escape_html(articulo.Descripcion)}</td><td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${escape_html(articulo.Rubro?.Descripcion || "-")}</td><td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${escape_html(articulo.Proveedor?.Descripcion || "-")}</td><td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">$${escape_html((articulo.PrecioCosto ?? 0).toFixed(2))}</td><td class="px-4 py-3 whitespace-nowrap"><input type="number"${attr("value", getValorParaMostrar(articulo))}${attr("step", "0.01")} class="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></td><td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">$${escape_html(calcularPrecioConIva(articulo).toFixed(2))}</td></tr>`;
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
