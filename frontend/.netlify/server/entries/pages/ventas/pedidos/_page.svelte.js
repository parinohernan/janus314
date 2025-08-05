import { e as escape_html, c as pop, p as push } from "../../../../chunks/index3.js";
import "clsx";
import { B as Button } from "../../../../chunks/Button.js";
function _page($$payload, $$props) {
  push();
  let totalPages = 0;
  Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    return i + 1;
  });
  $$payload.out += `<div class="container mx-auto px-4 py-8"><div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Pedidos</h1> `;
  Button($$payload, {
    href: "/pedidos/nuevo",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Nuevo Pedido`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div> <div class="mb-6"><div class="flex justify-between items-center mb-2"><h2 class="text-lg font-semibold">Filtros</h2> <button class="text-sm text-blue-600 hover:text-blue-800">${escape_html("Mostrar filtros")}</button></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex justify-center items-center py-10"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
