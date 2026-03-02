import { d as store_get, h as head, u as unsubscribe_stores, c as pop, p as push, e as escape_html } from "../../../../../../../chunks/index3.js";
import "../../../../../../../chunks/client.js";
import { p as page } from "../../../../../../../chunks/stores.js";
import "clsx";
import "../../../../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const tipo = store_get($$store_subs ??= {}, "$page", page).params.tipo;
  const sucursal = store_get($$store_subs ??= {}, "$page", page).params.sucursal;
  const numero = store_get($$store_subs ??= {}, "$page", page).params.numero;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Factura de compra ${escape_html(tipo)} ${escape_html(sucursal)}-${escape_html(numero)}</title>`;
  });
  $$payload.out += `<div class="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">`;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<p class="text-gray-500">Cargando factura...</p>`;
  }
  $$payload.out += `<!--]--></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
