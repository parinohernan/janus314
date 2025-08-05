import "clsx";
import { c as pop, p as push } from "../../../../../chunks/index3.js";
import "../../../../../chunks/client.js";
import "../../../../../chunks/authStore.js";
/* empty css                        */
/* empty css                                                        */
import { L as LogoJano } from "../../../../../chunks/LogoJano.js";
function _page($$payload, $$props) {
  push();
  $$payload.out += `<div class="telegram-webapp svelte-1u46pxm"><header class="header svelte-1u46pxm"><div class="header-content svelte-1u46pxm"><button class="btn-back svelte-1u46pxm" aria-label="Volver"><span class="back-icon svelte-1u46pxm">←</span></button> <div class="title-container svelte-1u46pxm">`;
  LogoJano($$payload, { size: "small", animated: false });
  $$payload.out += `<!----> <h2 class="page-subtitle svelte-1u46pxm">Caja <button class="btn-help svelte-1u46pxm" aria-label="Ayuda"><span class="help-icon svelte-1u46pxm">?</span></button></h2></div></div></header> <div class="mb-4 svelte-1u46pxm"><button class="w-full p-4 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-between svelte-1u46pxm"><span class="font-medium svelte-1u46pxm">Ver Listado de Cajas</span> <span class="text-xl svelte-1u46pxm">→</span></button></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="p-4 svelte-1u46pxm">`;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex justify-center items-center h-32 svelte-1u46pxm"><div class="loading-spinner svelte-1u46pxm"></div></div>`;
  }
  $$payload.out += `<!--]--></div></div>`;
  pop();
}
export {
  _page as default
};
