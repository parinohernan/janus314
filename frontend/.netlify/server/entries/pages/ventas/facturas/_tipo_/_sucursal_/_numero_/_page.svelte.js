import { d as store_get, u as unsubscribe_stores, c as pop, p as push } from "../../../../../../../chunks/index3.js";
import "../../../../../../../chunks/client.js";
import { p as page } from "../../../../../../../chunks/stores.js";
import { B as Button } from "../../../../../../../chunks/Button.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  store_get($$store_subs ??= {}, "$page", page).params.tipo;
  store_get($$store_subs ??= {}, "$page", page).params.sucursal;
  store_get($$store_subs ??= {}, "$page", page).params.numero;
  $$payload.out += `<div class="container mx-auto px-4 py-8"><div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold text-gray-800">`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `Detalle de Factura`;
  }
  $$payload.out += `<!--]--></h1> <div class="flex space-x-2">`;
  Button($$payload, {
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Volver`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  Button($$payload, {
    variant: "primary",
    disabled: true,
    children: ($$payload2) => {
      $$payload2.out += `<!---->Imprimir`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex justify-center items-center py-12"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
