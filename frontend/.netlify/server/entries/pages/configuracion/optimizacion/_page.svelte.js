import { d as store_get, h as head, u as unsubscribe_stores, c as pop, p as push, e as escape_html } from "../../../../chunks/index3.js";
import "../../../../chunks/client.js";
import { a as auth } from "../../../../chunks/authStore.js";
import "clsx";
import { B as Button } from "../../../../chunks/Button.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const VENDEDOR_ADMIN = "admin";
  let ejecutando = null;
  const esAdmin = store_get($$store_subs ??= {}, "$auth", auth)?.user?.usuario === VENDEDOR_ADMIN;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Optimización | Configuración</title>`;
  });
  if (!esAdmin) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="container mx-auto px-4 py-8"><p class="text-gray-600">Redirigiendo...</p></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="container mx-auto px-4 py-8"><div class="mb-6"><h1 class="text-3xl font-bold text-gray-800">Optimización</h1> <p class="text-gray-600 mt-2">Tareas avanzadas. Solo visible para el vendedor administrador (Codigo=admin).</p></div> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><div class="bg-white rounded-lg shadow-md p-6 border border-gray-200"><h2 class="text-lg font-semibold text-gray-800 mb-2">Eliminar preventas antiguas</h2> <p class="text-sm text-gray-600 mb-4">Elimina preventas con fecha anterior a 1 año. Se borran cabezas e ítems. No se puede deshacer.</p> `;
    Button($$payload, {
      variant: "secondary",
      disabled: ejecutando !== null,
      children: ($$payload2) => {
        $$payload2.out += `<!---->${escape_html("Eliminar preventas antiguas")}`;
      },
      $$slots: { default: true }
    });
    $$payload.out += `<!----></div> <div class="bg-white rounded-lg shadow-md p-6 border border-gray-200"><h2 class="text-lg font-semibold text-gray-800 mb-2">Backup</h2> <p class="text-sm text-gray-600 mb-4">Solicita un respaldo de la base de datos. La exportación completa se configura en el servidor.</p> `;
    Button($$payload, {
      variant: "secondary",
      disabled: ejecutando !== null,
      children: ($$payload2) => {
        $$payload2.out += `<!---->${escape_html("Generar backup")}`;
      },
      $$slots: { default: true }
    });
    $$payload.out += `<!----></div> <div class="bg-white rounded-lg shadow-md p-6 border border-gray-200"><h2 class="text-lg font-semibold text-gray-800 mb-2">Exportar tablas</h2> <p class="text-sm text-gray-600 mb-4">Exporta tablas de configuración (configuración, números de control, vendedores, tipos de pago, datos empresa) en JSON.</p> `;
    Button($$payload, {
      variant: "secondary",
      disabled: ejecutando !== null,
      children: ($$payload2) => {
        $$payload2.out += `<!---->${escape_html("Exportar tablas")}`;
      },
      $$slots: { default: true }
    });
    $$payload.out += `<!----></div></div> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div class="mt-6"><a href="/configuracion" class="text-blue-600 hover:underline">← Volver a Configuración</a></div></div>`;
  }
  $$payload.out += `<!--]-->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
