import { d as store_get, h as head, u as unsubscribe_stores, c as pop, p as push, e as escape_html } from "../../../../../chunks/index3.js";
import { p as page } from "../../../../../chunks/stores.js";
import "../../../../../chunks/client.js";
import { B as Button } from "../../../../../chunks/Button.js";
import "clsx";
import "../../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const clienteId = store_get($$store_subs ??= {}, "$page", page).params.id;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Cuenta Corriente: ${escape_html(clienteId)}</title>`;
  });
  $$payload.out += `<div class="container mx-auto p-4 svelte-1b95tlj"><div class="flex justify-between items-center mb-4"><div>`;
  Button($$payload, {
    variant: "secondary",
    size: "sm",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Volver a Cuentas Corrientes`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div> <div class="flex gap-2 print:hidden svelte-1b95tlj">`;
  Button($$payload, {
    variant: "primary",
    children: ($$payload2) => {
      $$payload2.out += `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg> Imprimir`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  Button($$payload, {
    variant: "primary",
    children: ($$payload2) => {
      $$payload2.out += `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> Descargar PDF`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  Button($$payload, {
    variant: "primary",
    children: ($$payload2) => {
      $$payload2.out += `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg> Compartir`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  Button($$payload, {
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> PDF Prueba`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div> <div class="bg-white p-6 rounded-lg shadow-md mb-6 svelte-1b95tlj"><h1 class="text-2xl font-bold mb-2">Cuenta Corriente</h1> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="text-center py-12"><div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div> <p class="mt-2 text-gray-600">Cargando comprobantes...</p></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
