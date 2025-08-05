import { h as head, g as ensure_array_like, j as attr, e as escape_html, c as pop, p as push } from "../../../../../chunks/index3.js";
import "../../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  let proveedoresOptions = [];
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Actualización de Precios con Lista</title>`;
  });
  $$payload.out += `<div class="container mx-auto px-4 py-8"><div class="bg-white rounded-lg shadow-md p-6"><h1 class="text-2xl font-bold mb-6">Actualización de Precios con Lista</h1> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(proveedoresOptions);
    $$payload.out += `<div class="space-y-6"><div><label for="proveedor" class="block text-sm font-medium text-gray-700 mb-2">Proveedor</label> <select id="proveedor" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"><option value="">Seleccione un proveedor...</option><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let option = each_array[$$index];
      $$payload.out += `<option${attr("value", option.value)}>${escape_html(option.label)}</option>`;
    }
    $$payload.out += `<!--]--></select></div> <div><label for="archivo" class="block text-sm font-medium text-gray-700 mb-2">Archivo Excel</label> <input type="file" id="archivo" accept=".xlsx,.xls" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"></div></div>`;
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div>`;
  pop();
}
export {
  _page as default
};
