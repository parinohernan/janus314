import "clsx";
import { c as pop, p as push } from "../../../chunks/index3.js";
import "../../../chunks/authStore.js";
import "../../../chunks/menuVisibilityStore.js";
function _page($$payload, $$props) {
  push();
  $$payload.out += `<div class="container mx-auto px-4 py-8"><div class="mb-6"><h1 class="text-3xl font-bold text-gray-800">Configuración del Sistema</h1> <p class="text-gray-600 mt-2">Gestiona los parámetros generales del sistema</p></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex justify-center items-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
