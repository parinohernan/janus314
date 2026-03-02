import { d as store_get, h as head, e as escape_html, u as unsubscribe_stores, c as pop, p as push } from "../../../../../chunks/index3.js";
import { p as page } from "../../../../../chunks/stores.js";
import "../../../../../chunks/client.js";
import { B as Button } from "../../../../../chunks/Button.js";
import "clsx";
import "../../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const proveedorId = store_get($$store_subs ??= {}, "$page", page).params.id;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Cuenta corriente - ${escape_html(proveedorId)}</title>`;
  });
  $$payload.out += `<div class="container mx-auto p-4"><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4"><h1 class="text-2xl font-bold">Cuenta corriente - ${escape_html(proveedorId)}</h1> <div class="flex gap-2">`;
  Button($$payload, {
    variant: "primary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Generar PDF`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  Button($$payload, {
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Volver al listado`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<p class="text-gray-500">Cargando...</p>`;
  }
  $$payload.out += `<!--]--></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
