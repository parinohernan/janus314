import { l as ensure_array_like, k as attr, e as escape_html, c as pop, p as push } from "../../../../chunks/index3.js";
import { o as onDestroy } from "../../../../chunks/index-server.js";
import "../../../../chunks/client.js";
import { B as Button } from "../../../../chunks/Button.js";
import "../../../../chunks/navigationState.js";
import "../../../../chunks/authStore.js";
/* empty css                                                        */
import "../../../../chunks/tabsStore.js";
function _page($$payload, $$props) {
  push();
  let currentPage = 1;
  let totalPages = 0;
  const hoy = /* @__PURE__ */ new Date();
  hoy.setHours(hoy.getHours() - 3);
  const fechaFormateada = hoy.toISOString().substring(0, 10);
  let filtroFechaDesde = fechaFormateada;
  let filtroFechaHasta = fechaFormateada;
  let formasPago = [];
  const tiposDocumento = [
    { value: "", label: "Todos" },
    { value: "FCA", label: "Factura A" },
    { value: "FCB", label: "Factura B" },
    { value: "FCC", label: "Factura C" },
    { value: "PRF", label: "Prefactura" },
    { value: "NCA", label: "Nota de Crédito A" },
    { value: "NCB", label: "Nota de Crédito B" },
    { value: "NCC", label: "Nota de Crédito C" }
  ];
  let clientesOptions = [];
  let clienteBusqueda = "";
  let vendedoresOptions = [];
  let vendedoresLoading = false;
  onDestroy(() => {
  });
  function getPaginasVisibles(actual, total) {
    {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
  }
  getPaginasVisibles(currentPage, totalPages);
  const each_array = ensure_array_like(tiposDocumento);
  const each_array_2 = ensure_array_like(vendedoresOptions);
  const each_array_3 = ensure_array_like(formasPago);
  $$payload.out += `<div><div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold text-gray-800">Facturas</h1> `;
  Button($$payload, {
    variant: "primary",
    title: "Click para crear, Ctrl+Click para abrir en nuevo tab",
    children: ($$payload2) => {
      $$payload2.out += `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> Nueva Factura`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div> <div class="bg-white p-4 rounded-lg shadow-sm mb-6"><div class="grid grid-cols-1 md:grid-cols-6 gap-4"><div><label for="filtroTipo" class="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label> <select id="filtroTipo" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let tipo = each_array[$$index];
    $$payload.out += `<option${attr("value", tipo.value)}>${escape_html(tipo.label)}</option>`;
  }
  $$payload.out += `<!--]--></select></div> <div class="relative w-full md:w-64 mb-4 md:mb-0"><label for="filtroCliente" class="block text-sm font-medium text-gray-700 mb-1">Cliente</label> <div class="relative"><input type="text" id="filtroCliente" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Buscar cliente..."${attr("value", clienteBusqueda)} autocomplete="off"> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> `;
  if (clientesOptions.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array_1 = ensure_array_like(clientesOptions);
    $$payload.out += `<div class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm"><ul><!--[-->`;
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let cliente = each_array_1[$$index_1];
      $$payload.out += `<li><button class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 w-full text-left"><div class="flex items-center"><span class="font-normal block truncate">${escape_html(cliente.label)}</span></div></button></li>`;
    }
    $$payload.out += `<!--]--></ul></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> <div class="w-full md:w-64 mb-4 md:mb-0"><label for="filtroVendedor" class="block text-sm font-medium text-gray-700 mb-1">Vendedor</label> <select id="filtroVendedor"${attr("disabled", vendedoresLoading, true)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Todos</option><!--[-->`;
  for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
    let vendedor = each_array_2[$$index_2];
    $$payload.out += `<option${attr("value", vendedor.value)}>${escape_html(vendedor.label)}</option>`;
  }
  $$payload.out += `<!--]--></select> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> <div><label for="filtroPagoTipo" class="block text-sm font-medium text-gray-700 mb-1">Pago</label> <select id="filtroPagoTipo" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Todas</option><!--[-->`;
  for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
    let fp = each_array_3[$$index_3];
    $$payload.out += `<option${attr("value", fp.value)}>${escape_html(fp.label)}</option>`;
  }
  $$payload.out += `<!--]--></select></div> <div><label for="filtroFechaDesde" class="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label> <input id="filtroFechaDesde" type="date"${attr("value", filtroFechaDesde)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="filtroFechaHasta" class="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label> <input id="filtroFechaHasta" type="date"${attr("value", filtroFechaHasta)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div class="md:col-span-6 flex justify-end space-x-2">`;
  Button($$payload, {
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Limpiar Filtros`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  Button($$payload, {
    variant: "primary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Aplicar Filtros`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div></div> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex justify-center items-center py-12"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div></div>`;
  }
  $$payload.out += `<!--]--></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  pop();
}
export {
  _page as default
};
