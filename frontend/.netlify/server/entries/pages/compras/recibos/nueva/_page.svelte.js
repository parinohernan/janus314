import { l as ensure_array_like, h as head, k as attr, e as escape_html, m as attr_class, c as pop, p as push, n as stringify } from "../../../../../chunks/index3.js";
import "../../../../../chunks/client.js";
import { B as Button } from "../../../../../chunks/Button.js";
import { I as Input } from "../../../../../chunks/Input.js";
import "../../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  let saldoPendiente;
  const DOC_TIPO = "RCP";
  let loading = false;
  let proveedoresOptions = [];
  let proveedorSearch = "";
  let fecha = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  let importeTotalPagar = 0;
  let importeTotalCredito = 0;
  let formasPago = [];
  let importeTotalFormasPago = 0;
  saldoPendiente = importeTotalPagar - importeTotalCredito - importeTotalFormasPago;
  const each_array_4 = ensure_array_like(formasPago);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Nuevo comprobante de pago (recibo)</title>`;
  });
  $$payload.out += `<div class="container mx-auto px-4 py-8"><div class="max-w-4xl mx-auto"><h1 class="text-2xl font-bold mb-6">Nuevo comprobante de pago (recibo)</h1> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="bg-white rounded-lg shadow-sm p-6"><div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="md:col-span-1 relative"><label for="proveedor-search" class="block text-sm font-medium text-gray-700 mb-1">Proveedor</label> <div class="relative"><input id="proveedor-search" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm pr-10" placeholder="Buscar proveedor..."${attr("value", proveedorSearch)}${attr("disabled", false, true)} autocomplete="off"> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (proveedoresOptions.length > 0 && true) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(proveedoresOptions);
    $$payload.out += `<div class="absolute z-10 mt-1 w-full bg-white border border-gray-300 shadow-lg rounded-md max-h-60 overflow-auto"><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let p = each_array[$$index];
      $$payload.out += `<button type="button" class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"><div class="font-medium">${escape_html(p.Descripcion)}</div> <div class="text-xs text-gray-500">Código: ${escape_html(p.Codigo)}</div></button>`;
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> <div class="md:col-span-1"><div class="grid grid-cols-3 gap-4"><div><label for="tipo-doc" class="block text-sm font-medium text-gray-700 mb-1">Tipo</label> `;
  Input($$payload, {
    id: "tipo-doc",
    value: DOC_TIPO,
    disabled: true,
    className: "bg-gray-100"
  });
  $$payload.out += `<!----></div> <div><label for="numero-doc" class="block text-sm font-medium text-gray-700 mb-1">Número</label> `;
  Input($$payload, {
    id: "numero-doc",
    value: "Cargando...",
    disabled: true,
    className: "bg-gray-100"
  });
  $$payload.out += `<!----></div> <div><label for="fecha-recibo" class="block text-sm font-medium text-gray-700 mb-1">Fecha</label> <input id="fecha-recibo" type="date" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"${attr("value", fecha)}></div></div></div></div> <div class="mt-6 border-t pt-6"><div class="flex justify-between items-center mb-2"><h3 class="text-lg font-medium text-gray-900">Documentos de deuda (facturas / ND)</h3> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="h-20 flex items-center justify-center bg-gray-100 rounded"><span class="text-gray-500">Seleccione un proveedor</span></div>`;
  }
  $$payload.out += `<!--]--></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="mt-6 border-t pt-6"><div class="flex justify-between items-center mb-2"><h3 class="text-lg font-medium text-gray-900">Formas de pago</h3> <button type="button" class="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700">${escape_html("Agregar forma de pago")}</button></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Importe</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adjuntar comprobante (imagen)</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`;
  for (let i = 0, $$length = each_array_4.length; i < $$length; i++) {
    let fp = each_array_4[i];
    $$payload.out += `<tr><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escape_html(fp.Descripcion || fp.Codigo)}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escape_html((fp.Importe || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" }))}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-amber-600 font-medium">Próximamente</td><td class="px-6 py-4 whitespace-nowrap text-sm"><button type="button" class="text-red-600 hover:text-red-800">Eliminar</button></td></tr>`;
  }
  $$payload.out += `<!--]--></tbody><tfoot class="bg-gray-50"><tr><td class="px-6 py-4 text-right text-sm font-medium text-gray-900">Total formas de pago:</td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">${escape_html(importeTotalFormasPago.toLocaleString("es-AR", { style: "currency", currency: "ARS" }))}</td><td></td><td></td></tr></tfoot></table></div></div> <div class="mt-6 border-t pt-6"><h3 class="text-lg font-medium text-gray-900 mb-4">Resumen</h3> <div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="bg-gray-50 p-4 rounded-md"><div class="flex justify-between mb-2"><span class="text-sm font-medium text-gray-700">Total documentos deuda:</span> <span class="text-sm font-medium text-red-600">${escape_html(importeTotalPagar.toLocaleString("es-AR", { style: "currency", currency: "ARS" }))}</span></div> <div class="flex justify-between mb-2"><span class="text-sm font-medium text-gray-700">Total crédito:</span> <span class="text-sm font-medium text-blue-600">-${escape_html(importeTotalCredito.toLocaleString("es-AR", { style: "currency", currency: "ARS" }))}</span></div> <div class="flex justify-between mb-2"><span class="text-sm font-medium text-gray-700">Total formas de pago:</span> <span class="text-sm font-medium text-green-600">-${escape_html(importeTotalFormasPago.toLocaleString("es-AR", { style: "currency", currency: "ARS" }))}</span></div> <div class="flex justify-between pt-2 border-t"><span class="text-sm font-medium text-gray-900">Saldo pendiente:</span> <span${attr_class(`text-sm font-medium ${stringify(saldoPendiente > 0 ? "text-red-600" : "text-green-600")}`)}>${escape_html(saldoPendiente.toLocaleString("es-AR", { style: "currency", currency: "ARS" }))}</span></div></div></div></div> <div class="mt-6 flex justify-end gap-3">`;
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
    disabled: true,
    children: ($$payload2) => {
      $$payload2.out += `<!---->${escape_html("Grabar")}`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  pop();
}
export {
  _page as default
};
