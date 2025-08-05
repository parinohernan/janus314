import { d as store_get, u as unsubscribe_stores, c as pop, p as push } from "../../../../../../../../../chunks/index3.js";
import { p as page } from "../../../../../../../../../chunks/stores.js";
import "../../../../../../../../../chunks/client.js";
import "clsx";
import "../../../../../../../../../chunks/authStore.js";
import "html2pdf.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  store_get($$store_subs ??= {}, "$page", page).params.tipo;
  store_get($$store_subs ??= {}, "$page", page).params.sucursal;
  store_get($$store_subs ??= {}, "$page", page).params.numero;
  $$payload.out += `<div class="recibo-container svelte-jdaxh7"><div class="action-bar svelte-jdaxh7"><button class="btn-back svelte-jdaxh7"><span class="back-icon svelte-jdaxh7">←</span> <span class="svelte-jdaxh7">Volver</span></button> <button class="btn-share svelte-jdaxh7"><span class="share-icon svelte-jdaxh7">↗️</span> <span class="svelte-jdaxh7">Compartir</span></button></div> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="loading-container svelte-jdaxh7"><span class="loader svelte-jdaxh7"></span> <p class="svelte-jdaxh7">Cargando recibo...</p></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
