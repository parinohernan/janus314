import { d as store_get, g as ensure_array_like, h as head, e as escape_html, j as attr, u as unsubscribe_stores, c as pop, p as push } from "../../../../chunks/index3.js";
import { p as page } from "../../../../chunks/stores.js";
import "../../../../chunks/client.js";
import { B as Button } from "../../../../chunks/Button.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let localidad = { Codigo: "", Descripcion: "" };
  let provincias = [];
  let loading = false;
  let isEditing = store_get($$store_subs ??= {}, "$page", page).params.id !== "nuevo";
  const each_array = ensure_array_like(provincias);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(isEditing ? "Editar" : "Nueva")} Localidad</title>`;
  });
  $$payload.out += `<div class="container mx-auto p-4"><div class="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md"><h1 class="text-2xl font-bold mb-6">${escape_html(isEditing ? "Editar" : "Nueva")} Localidad</h1> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <form><div class="mb-4"><label for="codigo" class="block text-sm font-medium text-gray-700 mb-1">Código *</label> <input type="text" id="codigo"${attr("value", localidad.Codigo)} required${attr("disabled", isEditing, true)} maxlength="8" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"></div> <div class="mb-4"><label for="descripcion" class="block text-sm font-medium text-gray-700 mb-1">Descripción *</label> <input type="text" id="descripcion"${attr("value", localidad.Descripcion)} required maxlength="50" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div class="mb-6"><label for="provincia" class="block text-sm font-medium text-gray-700 mb-1">Provincia *</label> <select id="provincia" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Seleccione una provincia</option><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let provincia = each_array[$$index];
    $$payload.out += `<option${attr("value", provincia.Codigo)}>${escape_html(provincia.Codigo)} - ${escape_html(provincia.Descripcion)}</option>`;
  }
  $$payload.out += `<!--]--></select></div> <div class="flex justify-between">`;
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
