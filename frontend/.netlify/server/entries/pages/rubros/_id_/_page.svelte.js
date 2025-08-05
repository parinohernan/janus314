import { d as store_get, h as head, e as escape_html, j as attr, u as unsubscribe_stores, c as pop, p as push } from "../../../../chunks/index3.js";
import { p as page } from "../../../../chunks/stores.js";
import "../../../../chunks/client.js";
import { B as Button } from "../../../../chunks/Button.js";
import "../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let rubro = {
    Codigo: "",
    Descripcion: "",
    RubroGrupoCodigo: ""
  };
  let loading = false;
  let isEditing = store_get($$store_subs ??= {}, "$page", page).params.id !== "nuevo";
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(isEditing ? "Editar" : "Nuevo")} Rubro</title>`;
  });
  $$payload.out += `<div class="container mx-auto p-4"><div class="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6"><h1 class="text-2xl font-bold mb-6">${escape_html(isEditing ? "Editar" : "Nuevo")} Rubro</h1> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <form class="space-y-4"><div><label for="codigo" class="block text-sm font-medium text-gray-700 mb-1">Código *</label> <input type="text" id="codigo"${attr("value", rubro.Codigo)} required${attr("disabled", isEditing, true)} maxlength="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"></div> <div><label for="descripcion" class="block text-sm font-medium text-gray-700 mb-1">Descripción *</label> <input type="text" id="descripcion"${attr("value", rubro.Descripcion)} required maxlength="50" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div class="mb-6"><label for="rubroGrupo" class="block text-sm font-medium text-gray-700 mb-1">Grupo de Rubro</label> <input type="text" id="rubroGrupo"${attr("value", rubro.RubroGrupoCodigo)} maxlength="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div class="flex gap-4 pt-4">`;
  Button($$payload, {
    type: "submit",
    disabled: loading,
    children: ($$payload2) => {
      $$payload2.out += `<!---->${escape_html("Guardar")}`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  Button($$payload, {
    type: "button",
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Cancelar`;
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
