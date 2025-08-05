import "clsx";
import { c as pop, p as push } from "../../../../../../chunks/index3.js";
import "../../../../../../chunks/client.js";
import "../../../../../../chunks/authStore.js";
/* empty css                           */
import { L as LogoJano } from "../../../../../../chunks/LogoJano.js";
function _page($$payload, $$props) {
  push();
  $$payload.out += `<div class="telegram-webapp svelte-i2d6qe"><header class="header svelte-i2d6qe"><div class="header-content svelte-i2d6qe"><button class="btn-back svelte-i2d6qe" aria-label="Volver"><span class="back-icon">←</span></button> <div class="title-container svelte-i2d6qe">`;
  LogoJano($$payload, { size: "small", animated: false });
  $$payload.out += `<!----> <h2 class="page-subtitle svelte-i2d6qe">Cierre de Caja</h2></div></div></header> <div class="p-4">`;
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
