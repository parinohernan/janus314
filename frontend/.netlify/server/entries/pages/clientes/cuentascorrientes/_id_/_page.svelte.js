import { d as store_get, h as head, u as unsubscribe_stores, c as pop, p as push, e as escape_html } from "../../../../../chunks/index3.js";
import { p as page } from "../../../../../chunks/stores.js";
import "../../../../../chunks/client.js";
import { B as Button } from "../../../../../chunks/Button.js";
import "clsx";
import "../../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const clienteId = store_get($$store_subs ??= {}, "$page", page).params.id;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Cuenta Corriente: ${escape_html(clienteId)}</title>`;
  });
  $$payload.out += `<div class="container mx-auto p-4"><div class="flex justify-between items-center mb-4"><div>`;
  Button($$payload, {
    variant: "secondary",
    size: "sm",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Volver a Cuentas Corrientes`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div> <div class="bg-white p-6 rounded-lg shadow-md mb-6"><h1 class="text-2xl font-bold mb-2">Cuenta Corriente</h1> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="text-center py-12"><div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div> <p class="mt-2 text-gray-600">Cargando comprobantes...</p></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
