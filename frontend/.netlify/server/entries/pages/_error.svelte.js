import { d as store_get, h as head, e as escape_html, u as unsubscribe_stores, c as pop, p as push } from "../../chunks/index3.js";
import { p as page } from "../../chunks/stores.js";
import "../../chunks/client.js";
import { B as Button } from "../../chunks/Button.js";
function _error($$payload, $$props) {
  push();
  var $$store_subs;
  let errorMessage, description;
  errorMessage = store_get($$store_subs ??= {}, "$page", page).status === 404 ? "Sección en construcción" : "Ha ocurrido un error";
  description = store_get($$store_subs ??= {}, "$page", page).status === 404 ? "La página que estás buscando está en desarrollo. Pronto estará disponible." : `Error ${store_get($$store_subs ??= {}, "$page", page).status}: ${store_get($$store_subs ??= {}, "$page", page).error?.message || "Algo salió mal"}`;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(errorMessage)} | Gestión Comercial</title>`;
  });
  $$payload.out += `<div class="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50"><div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center"><div class="mb-6">`;
  if (store_get($$store_subs ??= {}, "$page", page).status === 404) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
  }
  $$payload.out += `<!--]--></div> <h1 class="text-3xl font-bold mb-2">${escape_html(errorMessage)}</h1> <p class="text-gray-600 mb-8">${escape_html(description)}</p> <div class="flex flex-col sm:flex-row justify-center gap-4">`;
  Button($$payload, {
    variant: "primary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Volver al inicio`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  Button($$payload, {
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Volver atrás`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _error as default
};
