import { g as ensure_array_like, j as attr, e as escape_html, k as attr_class, m as clsx, c as pop, p as push } from "../../../../../chunks/index3.js";
import "../../../../../chunks/client.js";
import "../../../../../chunks/authStore.js";
import { B as Button } from "../../../../../chunks/Button.js";
function _page($$payload, $$props) {
  push();
  let formasPago = [];
  let notaCredito = {
    DocumentoSucursal: "",
    DocumentoNumero: "",
    Fecha: (/* @__PURE__ */ new Date()).toISOString().substring(0, 10),
    ImporteBruto: 0,
    ImporteIva1: 0,
    ImporteIva2: 0,
    ImporteTotal: 0,
    Items: []
  };
  let loading = false;
  let clienteBusqueda = "";
  let clientesOptions = [];
  let facturaReferenciaBusqueda = "";
  let facturasOptions = [];
  const tiposDocumento = [
    { value: "NCA", label: "Nota de Crédito A" },
    { value: "NCB", label: "Nota de Crédito B" },
    { value: "NCF", label: "Nota de Crédito F" }
  ];
  const each_array_2 = ensure_array_like(tiposDocumento);
  const each_array_3 = ensure_array_like(formasPago);
  const each_array_4 = ensure_array_like(notaCredito.Items);
  $$payload.out += `<div class="container mx-auto px-4 py-8"><div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold text-gray-800">Nueva Nota de Crédito</h1> <div class="space-x-2">`;
  Button($$payload, {
    variant: "secondary",
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
      {
        $$payload2.out += "<!--[!-->";
        $$payload2.out += `Guardar`;
      }
      $$payload2.out += `<!--]-->`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="bg-white rounded-lg shadow-sm p-6 mb-6"><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div class="relative md:col-span-2"><label for="cliente" class="block text-sm font-medium text-gray-700 mb-1">Cliente</label> <input id="cliente" type="text"${attr("value", clienteBusqueda)} placeholder="Buscar cliente..." class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (clientesOptions.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(clientesOptions);
    $$payload.out += `<div class="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md overflow-auto"><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let cliente = each_array[$$index];
      $$payload.out += `<button class="w-full text-left px-4 py-2 hover:bg-gray-100">${escape_html(cliente.label)}</button>`;
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div> <div class="relative"><label for="facturaRef" class="block text-sm font-medium text-gray-700 mb-1">Factura de Referencia</label> <input id="facturaRef" type="text"${attr("value", facturaReferenciaBusqueda)} placeholder="Buscar factura..." class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (facturasOptions.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array_1 = ensure_array_like(facturasOptions);
    $$payload.out += `<div class="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md overflow-auto"><!--[-->`;
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let factura = each_array_1[$$index_1];
      $$payload.out += `<button class="w-full text-left px-4 py-2 hover:bg-gray-100">${escape_html(factura.label)}</button>`;
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> <div><label for="tipoDocumento" class="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label> <select id="tipoDocumento" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><!--[-->`;
  for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
    let tipo = each_array_2[$$index_2];
    $$payload.out += `<option${attr("value", tipo.value)}>${escape_html(tipo.label)}</option>`;
  }
  $$payload.out += `<!--]--></select></div> <div><label for="formaPago" class="block text-sm font-medium text-gray-700 mb-1">Forma de Pago *</label> <select id="formaPago" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Seleccionar forma de pago</option><!--[-->`;
  for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
    let forma = each_array_3[$$index_3];
    $$payload.out += `<option${attr("value", forma.value)}>${escape_html(forma.label)}</option>`;
  }
  $$payload.out += `<!--]--></select></div> <div><label for="numeroDocumento" class="block text-sm font-medium text-gray-700 mb-1">Número</label> <input id="numeroDocumento" type="text" readonly${attr("value", `${notaCredito.DocumentoSucursal}-${notaCredito.DocumentoNumero}`)} class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"></div> <div><label for="fecha" class="block text-sm font-medium text-gray-700 mb-1">Fecha</label> <input id="fecha" type="date"${attr("value", notaCredito.Fecha)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div class="bg-white rounded-lg shadow-sm p-6 mb-6"><h2 class="text-lg font-bold text-gray-800 mb-4">Ítems</h2> <div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead><tr><th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artículo</th><th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th><th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th><th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th><th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Bonif.</th><th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio c/Bonif.</th><th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% IVA</th><th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th><th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total c/IVA</th><th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`;
  for (let i = 0, $$length = each_array_4.length; i < $$length; i++) {
    let item = each_array_4[i];
    $$payload.out += `<tr${attr_class(clsx(i % 2 === 0 ? "bg-white" : "bg-gray-50"))}><td class="px-4 py-3 whitespace-nowrap text-sm">${escape_html(item.CodigoArticulo)}</td><td class="px-4 py-3 whitespace-nowrap text-sm">${escape_html(item.Descripcion)}</td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">`;
    if (item.enEdicion) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<input type="number"${attr("value", item.Cantidad)} min="1" step="1" class="w-20 px-2 py-1 text-right border border-gray-300 rounded-md">`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `${escape_html(item.Cantidad)}`;
    }
    $$payload.out += `<!--]--></td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">$${escape_html(item.PrecioUnitario.toLocaleString("es-AR", { minimumFractionDigits: 2 }))}</td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">`;
    if (item.enEdicion) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<input type="number"${attr("value", item.PorcentajeBonificacion)} min="0" max="100" step="0.01" class="w-20 px-2 py-1 text-right border border-gray-300 rounded-md">`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `${escape_html(item.PorcentajeBonificacion)}%`;
    }
    $$payload.out += `<!--]--></td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">$${escape_html((item.PrecioUnitario * (1 - (item.PorcentajeBonificacion || 0) / 100)).toLocaleString("es-AR", { minimumFractionDigits: 2 }))}</td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">${escape_html(item.PorcentajeIva)}%</td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">$${escape_html(item.Total.toLocaleString("es-AR", { minimumFractionDigits: 2 }))}</td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">$${escape_html(item.TotalConIva.toLocaleString("es-AR", { minimumFractionDigits: 2 }))}</td><td class="px-4 py-3 text-center">`;
    if (item.enEdicion) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<button class="text-green-600 hover:text-green-900 mr-2" aria-label="Guardar cambios"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></button>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<button class="text-blue-600 hover:text-blue-900 mr-2" aria-label="Editar ítem"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>`;
    }
    $$payload.out += `<!--]--> <button class="text-red-600 hover:text-red-900" aria-label="Eliminar ítem"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></td></tr>`;
  }
  $$payload.out += `<!--]--></tbody></table></div></div> <div class="bg-white rounded-lg shadow-sm p-6"><div class="flex flex-col gap-2 items-end"><div class="w-64 flex justify-between"><span class="text-gray-600">Total sin IVA:</span> <span class="font-medium">$${escape_html(notaCredito.ImporteBruto.toLocaleString("es-AR", { minimumFractionDigits: 2 }))}</span></div> <div class="w-64 flex justify-between"><span class="text-gray-600">IVA 21%:</span> <span class="font-medium">$${escape_html(notaCredito.ImporteIva1.toLocaleString("es-AR", { minimumFractionDigits: 2 }))}</span></div> <div class="w-64 flex justify-between"><span class="text-gray-600">IVA 10.5%:</span> <span class="font-medium">$${escape_html(notaCredito.ImporteIva2.toLocaleString("es-AR", { minimumFractionDigits: 2 }))}</span></div> <div class="w-64 flex justify-between border-t pt-2"><span class="text-gray-800 font-semibold">Total:</span> <span class="font-bold text-lg">$${escape_html(notaCredito.ImporteTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 }))}</span></div></div></div></div></div>`;
  pop();
}
export {
  _page as default
};
