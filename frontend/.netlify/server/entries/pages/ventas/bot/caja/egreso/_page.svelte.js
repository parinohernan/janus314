import "clsx";
import { c as pop, p as push } from "../../../../../../chunks/index3.js";
import "../../../../../../chunks/client.js";
import "../../../../../../chunks/authStore.js";
/* empty css                           */
/* empty css                                                           */
import { L as LogoJano } from "../../../../../../chunks/LogoJano.js";
function _page($$payload, $$props) {
  push();
  $$payload.out += `<div class="telegram-webapp svelte-130oyl0"><header class="header svelte-130oyl0"><div class="header-content svelte-130oyl0"><button class="btn-back svelte-130oyl0" aria-label="Volver"><span class="back-icon">←</span></button> <div class="title-container svelte-130oyl0">`;
  LogoJano($$payload, { size: "small", animated: false });
  $$payload.out += `<!----> <h2 class="page-subtitle svelte-130oyl0">Nuevo Egreso</h2></div></div></header> <div class="p-4">`;
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
