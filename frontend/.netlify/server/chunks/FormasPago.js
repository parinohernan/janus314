import { p as push, l as ensure_array_like, e as escape_html, v as bind_props, c as pop } from "./index3.js";
import { z as fallback } from "./utils.js";
import "clsx";
import "./authStore.js";
const BANCOS = [
  { codigo: "BNA", descripcion: "Banco de la Nación Argentina" },
  { codigo: "BBVA", descripcion: "Banco BBVA" },
  { codigo: "GAL", descripcion: "Banco Galicia" },
  { codigo: "SAN", descripcion: "Banco Santander" }
];
function FormasPago($$payload, $$props) {
  push();
  let formasPago = fallback($$props["formasPago"], () => [], true);
  let importeTotalFormasPago = fallback($$props["importeTotalFormasPago"], 0);
  let saldoPendiente = fallback($$props["saldoPendiente"], 0);
  let incluirFormasAplicaSaldo = fallback($$props["incluirFormasAplicaSaldo"], false);
  function getDescripcionBanco(codigo) {
    const banco = BANCOS.find((b) => b.codigo === codigo);
    return banco ? banco.descripcion : "";
  }
  const each_array_2 = ensure_array_like(formasPago);
  $$payload.out += `<div class="mt-6 border-t pt-6"><div class="flex justify-between items-center mb-2"><h3 class="text-lg font-medium text-gray-900">Formas de Pago</h3> <button type="button" class="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700">${escape_html("Agregar Forma de Pago")}</button></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles</th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importe</th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`;
  for (let index = 0, $$length = each_array_2.length; index < $$length; index++) {
    let formaPago = each_array_2[index];
    $$payload.out += `<tr><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escape_html(formaPago.descripcion)}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">`;
    if (formaPago.codigo === "CH") {
      $$payload.out += "<!--[-->";
      $$payload.out += `Banco: ${escape_html(getDescripcionBanco(formaPago.banco ?? ""))}<br> Número: ${escape_html(formaPago.numero)}<br> Fecha: ${escape_html(formaPago.fecha)}`;
    } else if (formaPago.codigo === "TRF") {
      $$payload.out += "<!--[1-->";
      $$payload.out += `Banco: ${escape_html(getDescripcionBanco(formaPago.banco ?? ""))}<br> `;
      if (formaPago.numero) {
        $$payload.out += "<!--[-->";
        $$payload.out += `Referencia: ${escape_html(formaPago.numero)}<br>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> Fecha: ${escape_html(formaPago.fecha)}`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${escape_html(formaPago.importe.toFixed(2))}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><button type="button" class="text-red-600 hover:text-red-800">Eliminar</button></td></tr>`;
  }
  $$payload.out += `<!--]--></tbody><tfoot class="bg-gray-50"><tr><td colspan="2" class="px-6 py-4 text-right text-sm font-medium text-gray-900">Total Formas de Pago:</td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">$${escape_html(importeTotalFormasPago.toFixed(2))}</td><td></td></tr></tfoot></table></div></div>`;
  bind_props($$props, {
    formasPago,
    importeTotalFormasPago,
    saldoPendiente,
    incluirFormasAplicaSaldo
  });
  pop();
}
export {
  FormasPago as F
};
