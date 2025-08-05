import "clsx";
import { c as pop, p as push } from "../../../../../chunks/index3.js";
import "../../../../../chunks/client.js";
import "../../../../../chunks/authStore.js";
/* empty css                        */
import { L as LogoJano } from "../../../../../chunks/LogoJano.js";
function _page($$payload, $$props) {
  push();
  $$payload.out += `<div class="recibos-container svelte-6a4l1l"><header class="header svelte-6a4l1l"><div class="header-content svelte-6a4l1l"><button class="btn-back svelte-6a4l1l" aria-label="Volver"><span class="back-icon svelte-6a4l1l">←</span></button> <div class="title-container svelte-6a4l1l">`;
  LogoJano($$payload, { size: "small", animated: false });
  $$payload.out += `<!----> <h2 class="page-subtitle svelte-6a4l1l">Recibos</h2></div></div></header> <div class="action-bar svelte-6a4l1l"><button class="btn-nuevo svelte-6a4l1l"><span class="plus-icon svelte-6a4l1l">+</span> Nuevo Recibo</button></div> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="loading-container svelte-6a4l1l"><span class="loader svelte-6a4l1l"></span> <p class="svelte-6a4l1l">Cargando recibos...</p></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
