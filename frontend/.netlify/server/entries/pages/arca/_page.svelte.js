import "clsx";
import { c as pop, p as push } from "../../../chunks/index3.js";
import "../../../chunks/authStore.js";
import { B as Button } from "../../../chunks/Button.js";
function _page($$payload, $$props) {
  push();
  let loading = true;
  $$payload.out += `<div class="container mx-auto px-4 py-8"><div class="flex justify-between items-center mb-8"><h1 class="text-2xl font-bold">Estado del Servidor ARCA</h1> `;
  Button($$payload, {
    variant: "secondary",
    disabled: loading,
    children: ($$payload2) => {
      {
        $$payload2.out += "<!--[-->";
        $$payload2.out += `<span class="animate-spin mr-2 svelte-slkc9m">⟳</span>`;
      }
      $$payload2.out += `<!--]--> Actualizar`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex justify-center items-center h-64"><div class="animate-spin text-4xl svelte-slkc9m">⟳</div></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
