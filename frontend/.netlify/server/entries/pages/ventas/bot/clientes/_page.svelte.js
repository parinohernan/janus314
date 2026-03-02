import { k as attr, c as pop, p as push } from "../../../../../chunks/index3.js";
import "../../../../../chunks/client.js";
/* empty css                        */
import "../../../../../chunks/authStore.js";
import { L as LogoJano } from "../../../../../chunks/LogoJano.js";
function _page($$payload, $$props) {
  push();
  let searchTerm = "";
  $$payload.out += `<div class="clientes-container svelte-1i871m5"><header class="header svelte-1i871m5"><div class="header-content svelte-1i871m5"><button class="btn-back svelte-1i871m5" aria-label="Volver"><span class="back-icon">←</span></button> <div class="title-container svelte-1i871m5">`;
  LogoJano($$payload, { size: "small", animated: false });
  $$payload.out += `<!----> <h2 class="page-subtitle svelte-1i871m5">Clientes</h2></div></div> <div class="header-actions svelte-1i871m5"><button class="btn-nuevo svelte-1i871m5"><span class="icon svelte-1i871m5">+</span> <span class="label">Nuevo Cliente</span></button></div></header> <div class="search-bar svelte-1i871m5"><input type="text" placeholder="Buscar clientes..."${attr("value", searchTerm)} class="svelte-1i871m5"></div> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="loading-state svelte-1i871m5"><div class="spinner svelte-1i871m5"></div> <span>Cargando clientes...</span></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
