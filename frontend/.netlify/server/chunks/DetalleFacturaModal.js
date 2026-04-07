import { p as push, e as escape_html, l as ensure_array_like, v as bind_props, c as pop } from "./index3.js";
import { z as fallback } from "./utils.js";
function formatCurrency(amount) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS"
  }).format(amount);
}
function DetalleFacturaModal($$payload, $$props) {
  push();
  let show = fallback($$props["show"], false);
  let factura = fallback($$props["factura"], null);
  let items = fallback($$props["items"], () => [], true);
  let loading = fallback($$props["loading"], false);
  if (show) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"><div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white"><div class="flex justify-between items-center mb-4 pb-3 border-b"><h3 class="text-lg font-semibold text-gray-900">Detalle de Factura ${escape_html(factura?.tipo)}-${escape_html(factura?.sucursal)}-${escape_html(factura?.numero)}</h3> <button class="text-gray-400 hover:text-gray-600" aria-label="Cerrar"><svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div> `;
    if (loading) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="flex justify-center items-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>`;
    } else if (factura) {
      $$payload.out += "<!--[1-->";
      const each_array = ensure_array_like(items);
      $$payload.out += `<div class="grid grid-cols-2 gap-4 mb-4"><div><p class="text-sm text-gray-600">Cliente:</p> <p class="font-medium">${escape_html(factura.cliente)}</p></div> <div><p class="text-sm text-gray-600">Fecha:</p> <p class="font-medium">${escape_html(new Date(factura.fecha).toLocaleDateString("es-AR"))}</p></div></div> <div class="mb-4"><h4 class="font-semibold mb-2">Items:</h4> <div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th><th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th><th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cant.</th><th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Precio</th><th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`;
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let item = each_array[$$index];
        $$payload.out += `<tr><td class="px-4 py-2 text-sm">${escape_html(item.CodigoArticulo || item.codigoArticulo)}</td><td class="px-4 py-2 text-sm">${escape_html(item.Descripcion || item.descripcion)}</td><td class="px-4 py-2 text-sm text-right">${escape_html(item.Cantidad || item.cantidad)}</td><td class="px-4 py-2 text-sm text-right">${escape_html(formatCurrency(item.PrecioUnitario || item.precioUnitario))}</td><td class="px-4 py-2 text-sm text-right">${escape_html(formatCurrency((item.Cantidad || item.cantidad) * (item.PrecioUnitario || item.precioUnitario)))}</td></tr>`;
      }
      $$payload.out += `<!--]--></tbody></table></div></div> <div class="border-t pt-4"><div class="flex justify-end"><div class="w-64"><div class="flex justify-between mb-2"><span class="text-gray-600">Total:</span> <span class="font-bold text-lg">${escape_html(formatCurrency(factura.total))}</span></div></div></div></div> <div class="flex justify-end gap-2 mt-6"><button class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cerrar</button> <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Usar esta factura</button></div>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<p class="text-center text-gray-500 py-8">No hay información de factura</p>`;
    }
    $$payload.out += `<!--]--></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  bind_props($$props, { show, factura, items, loading });
  pop();
}
export {
  DetalleFacturaModal as D,
  formatCurrency as f
};
