import "clsx";
import { c as pop, p as push } from "../../../../../../chunks/index3.js";
import "../../../../../../chunks/client.js";
import "../../../../../../chunks/authStore.js";
/* empty css                           */
import { L as LogoJano } from "../../../../../../chunks/LogoJano.js";
function _page($$payload, $$props) {
  push();
  $$payload.out += `<div class="telegram-webapp svelte-1votf2v"><header class="header svelte-1votf2v"><div class="header-content svelte-1votf2v"><button class="btn-back svelte-1votf2v" aria-label="Volver"><span class="back-icon svelte-1votf2v">←</span></button> <div class="title-container svelte-1votf2v">`;
  LogoJano($$payload, { size: "small", animated: false });
  $$payload.out += `<!----> <h2 class="page-subtitle svelte-1votf2v">Arqueo de Caja</h2></div></div></header> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
