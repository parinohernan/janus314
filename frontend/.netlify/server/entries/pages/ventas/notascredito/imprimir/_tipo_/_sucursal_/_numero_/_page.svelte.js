import { d as store_get, e as escape_html, u as unsubscribe_stores, c as pop, p as push } from "../../../../../../../../chunks/index3.js";
import { p as page } from "../../../../../../../../chunks/stores.js";
import { B as Button } from "../../../../../../../../chunks/Button.js";
import "../../../../../../../../chunks/client.js";
import "clsx";
import "../../../../../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const { tipo, sucursal, numero } = store_get($$store_subs ??= {}, "$page", page).params;
  $$payload.out += `<div class="container mx-auto px-4 py-8"><div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold text-gray-800">Imprimir Nota de Crédito ${escape_html(tipo)}-${escape_html(sucursal)}-${escape_html(numero)}</h1> `;
  Button($$payload, {
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"></path></svg> Volver a la lista`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div> `;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="bg-gray-50 p-4 rounded-lg text-center"><p class="text-gray-600">El PDF se abrirá en una nueva pestaña. Si no se abre automáticamente, 
        verifique que su navegador no esté bloqueando las ventanas emergentes.</p></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
