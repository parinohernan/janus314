import { d as store_get, h as head, e as escape_html, j as attr, u as unsubscribe_stores, c as pop, p as push } from "../../../../chunks/index3.js";
import { p as page } from "../../../../chunks/stores.js";
import "../../../../chunks/client.js";
import { B as Button } from "../../../../chunks/Button.js";
import "../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let provincia = { Codigo: "", Descripcion: "" };
  let loading = false;
  let isEditing = store_get($$store_subs ??= {}, "$page", page).params.id !== "nuevo";
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(isEditing ? "Editar" : "Nueva")} Provincia</title>`;
  });
  $$payload.out += `<div class="container mx-auto p-4"><div class="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md"><h1 class="text-2xl font-bold mb-6">${escape_html(isEditing ? "Editar" : "Nueva")} Provincia</h1> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <form><div class="mb-4"><label for="codigo" class="block text-sm font-medium text-gray-700 mb-1">Código *</label> <input type="text" id="codigo"${attr("value", provincia.Codigo)} required${attr("disabled", isEditing, true)} maxlength="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"></div> <div class="mb-6"><label for="descripcion" class="block text-sm font-medium text-gray-700 mb-1">Descripción *</label> <input type="text" id="descripcion"${attr("value", provincia.Descripcion)} required maxlength="50" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div class="flex justify-between">`;
  Button($$payload, {
    variant: "secondary",
    type: "button",
    disabled: loading,
    children: ($$payload2) => {
      $$payload2.out += `<!---->Cancelar`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  Button($$payload, {
    variant: "primary",
    type: "submit",
    disabled: loading,
    children: ($$payload2) => {
      $$payload2.out += `<!---->${escape_html("Guardar")}`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></form></div></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
