import { l as ensure_array_like, k as attr, e as escape_html, c as pop, p as push } from "../../../../../chunks/index3.js";
import "../../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  const tiposFactura = [
    {
      value: "",
      label: "Seleccione tipo de factura"
    },
    { value: "FCA", label: "Factura A" },
    { value: "FCB", label: "Factura B" }
    // ... otros tipos si existen
  ];
  const each_array = ensure_array_like(tiposFactura);
  $$payload.out += `<div><div class="form-group"><label for="tipoFactura" class="block text-sm font-medium text-gray-700">Tipo de Factura *</label> <select id="tipoFactura" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let tipo = each_array[$$index];
    $$payload.out += `<option${attr("value", tipo.value)}>${escape_html(tipo.label)}</option>`;
  }
  $$payload.out += `<!--]--></select></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
