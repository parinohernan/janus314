import { l as ensure_array_like, k as attr, e as escape_html, c as pop, p as push } from "../../../../../chunks/index3.js";
import { o as onDestroy } from "../../../../../chunks/index-server.js";
import "../../../../../chunks/client.js";
import { B as Button } from "../../../../../chunks/Button.js";
import { a as auth } from "../../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  let loading = false;
  let unsubscribe = auth.subscribe((state) => {
    if (state.user) {
      state.user.usuario || "1";
      state.user.usuario || "";
    }
  });
  let clientesOptions = [];
  let clienteSearch = "";
  const hoy = /* @__PURE__ */ new Date();
  hoy.setHours(hoy.getHours() - 3);
  const fechaFormateada = hoy.toISOString().substring(0, 10);
  let notaDebito = {
    DocumentoSucursal: "",
    Fecha: fechaFormateada,
    ImporteNeto: 0,
    ImporteIva1: 0,
    ImporteTotal: 0
  };
  let items = [];
  let tiposDocumento = [];
  let nuevoItem = { Descripcion: "", Importe: 0 };
  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
  const each_array_1 = ensure_array_like(tiposDocumento);
  $$payload.out += `<div class="container mx-auto px-4 py-8"><div class="max-w-6xl mx-auto"><h1 class="text-2xl font-bold mb-6">Nueva Nota de Débito</h1> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="bg-white rounded-lg shadow-sm p-6"><div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"><div class="md:col-span-1"><label for="cliente" class="block text-sm font-medium text-gray-700 mb-1">Cliente *</label> <div class="relative"><input id="cliente-search" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm pr-10" placeholder="Buscar cliente..."${attr("value", clienteSearch)} autocomplete="off"> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> `;
  if (clientesOptions.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(clientesOptions);
    $$payload.out += `<div class="absolute z-10 mt-1 w-full bg-white border border-gray-300 shadow-lg rounded-md max-h-60 overflow-auto"><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let cliente = each_array[$$index];
      $$payload.out += `<button type="button" class="block w-full text-left px-4 py-2 hover:bg-gray-100"><div class="font-medium">${escape_html(cliente.Descripcion)}</div> <div class="text-sm text-gray-500">Código: ${escape_html(cliente.Codigo)}</div></button>`;
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> <div class="md:col-span-1"><div class="grid grid-cols-3 gap-4"><div class="col-span-3"><label for="tipo" class="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento *</label> <select id="tipo"${attr("disabled", true, true)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"><option value="">Seleccione un tipo</option><!--[-->`;
  for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
    let tipo = each_array_1[$$index_1];
    $$payload.out += `<option${attr("value", tipo.value)}>${escape_html(tipo.label)}</option>`;
  }
  $$payload.out += `<!--]--></select></div> <div><label for="sucursal" class="block text-sm font-medium text-gray-700 mb-1">Sucursal</label> <input id="sucursal" type="text"${attr("value", notaDebito.DocumentoSucursal)} disabled class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"></div> <div class="col-span-2"><label for="fecha" class="block text-sm font-medium text-gray-700 mb-1">Fecha</label> <input id="fecha" type="date"${attr("value", notaDebito.Fecha)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div></div></div></div> <div class="mt-6 border-t pt-6"><h3 class="text-lg font-medium text-gray-900 mb-4">Items</h3> <div class="bg-gray-50 p-4 rounded-md mb-4"><div class="grid grid-cols-1 md:grid-cols-12 gap-4"><div class="md:col-span-8"><label for="descripcion" class="block text-sm font-medium text-gray-700 mb-1">Descripción</label> <input id="descripcion" type="text"${attr("value", nuevoItem.Descripcion)} placeholder="Ingrese la descripción del concepto" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div class="md:col-span-3"><label for="importe" class="block text-sm font-medium text-gray-700 mb-1">Importe</label> <input id="importe" type="number" step="0.01" min="0"${attr("value", nuevoItem.Importe)} placeholder="0.00" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div class="md:col-span-1 flex items-end">`;
  Button($$payload, {
    variant: "primary",
    className: "w-full",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Agregar`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div></div> `;
  if (items.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array_2 = ensure_array_like(items);
    $$payload.out += `<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th><th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Importe</th><th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`;
    for (let index = 0, $$length = each_array_2.length; index < $$length; index++) {
      let item = each_array_2[index];
      $$payload.out += `<tr><td class="px-6 py-4 text-sm text-gray-900">${escape_html(item.Descripcion)}</td><td class="px-6 py-4 text-sm text-gray-900 text-right">$${escape_html(item.Importe.toFixed(2))}</td><td class="px-6 py-4 text-center"><button type="button" class="text-red-600 hover:text-red-900" aria-label="Eliminar item"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></td></tr>`;
    }
    $$payload.out += `<!--]--></tbody></table></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="text-center py-8 bg-gray-50 rounded-md"><p class="text-gray-500">No hay items agregados</p></div>`;
  }
  $$payload.out += `<!--]--></div> <div class="mt-6 border-t pt-6"><div class="flex justify-end"><div class="w-full md:w-1/2 lg:w-1/3"><div class="bg-gray-50 p-4 rounded-md space-y-2"><div class="flex justify-between text-sm"><span class="text-gray-600">Subtotal:</span> <span class="font-medium">$${escape_html(notaDebito.ImporteNeto.toFixed(2))}</span></div> <div class="flex justify-between text-sm"><span class="text-gray-600">IVA (21%):</span> <span class="font-medium">$${escape_html(notaDebito.ImporteIva1.toFixed(2))}</span></div> <div class="flex justify-between text-base font-bold border-t pt-2"><span>Total:</span> <span>$${escape_html(notaDebito.ImporteTotal.toFixed(2))}</span></div></div></div></div></div> <div class="mt-6 flex justify-end gap-3">`;
  Button($$payload, {
    variant: "secondary",
    disabled: loading,
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
      $$payload2.out += `<!---->${escape_html("Grabar")}`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div>`;
  pop();
}
export {
  _page as default
};
