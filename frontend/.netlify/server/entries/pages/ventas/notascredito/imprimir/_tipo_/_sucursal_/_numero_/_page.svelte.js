import { d as store_get, e as escape_html, u as unsubscribe_stores, c as pop, p as push } from "../../../../../../../../chunks/index3.js";
import { p as page } from "../../../../../../../../chunks/stores.js";
import "../../../../../../../../chunks/client.js";
import { B as Button } from "../../../../../../../../chunks/Button.js";
import "clsx";
import "../../../../../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const tipo = store_get($$store_subs ??= {}, "$page", page).params.tipo;
  const sucursal = store_get($$store_subs ??= {}, "$page", page).params.sucursal;
  const numero = store_get($$store_subs ??= {}, "$page", page).params.numero;
  $$payload.out += `<div class="container mx-auto px-4 py-6"><div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold text-gray-800">Vista previa de nota de crédito ${escape_html(tipo)}-${escape_html(sucursal)}-${escape_html(numero)}</h1> `;
  Button($$payload, {
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg> Volver`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div> `;
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
