import { h as head, m as attr_class, k as attr, l as ensure_array_like, e as escape_html, c as pop, p as push, n as stringify } from "../../../../../../chunks/index3.js";
import { B as Button } from "../../../../../../chunks/Button.js";
import "../../../../../../chunks/client.js";
import { g as getTodayISOArgentina } from "../../../../../../chunks/dateUtils.js";
import "../../../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  let proveedorCodigo = "";
  let documento = {
    Fecha: getTodayISOArgentina()
  };
  let proveedoresOptions = [];
  let proveedorSearch = "";
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Ingreso por remito</title>`;
  });
  $$payload.out += `<div class="min-h-screen bg-slate-50"><div class="max-w-6xl mx-auto px-4 py-8"><header class="flex justify-between items-center mb-8"><h1 class="text-xl font-semibold text-slate-800">Ingreso por remito</h1> `;
  Button($$payload, {
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Volver`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></header> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <nav class="flex items-center gap-2 mb-8" aria-label="Pasos"><div class="flex items-center gap-2"><span${attr_class(`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${stringify("bg-blue-600 text-white")}`)}>1</span> <span class="text-sm font-medium text-slate-600">Imagen</span></div> <div class="h-px w-8 bg-slate-200" aria-hidden="true"></div> <div class="flex items-center gap-2"><span${attr_class(`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${stringify("bg-slate-200 text-slate-500")}`)}>2</span> <span class="text-sm font-medium text-slate-600">Revisar</span></div> <div class="h-px w-8 bg-slate-200" aria-hidden="true"></div> <div class="flex items-center gap-2"><span${attr_class(`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${stringify("bg-slate-200 text-slate-500")}`)}>3</span> <span class="text-sm font-medium text-slate-600">Tabla</span></div></nav> <main class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">`;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="p-6 space-y-6"><div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div class="relative"><label for="proveedor-search" class="block text-sm font-medium text-slate-700 mb-1.5">Proveedor *</label> <div class="relative"><input id="proveedor-search" type="text"${attr("value", proveedorSearch)} placeholder="Buscar por código o descripción (mín. 2 caracteres)..." class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white pr-10" autocomplete="off"> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div> `;
    if (proveedoresOptions.length > 0) {
      $$payload.out += "<!--[-->";
      const each_array = ensure_array_like(proveedoresOptions);
      $$payload.out += `<div class="absolute z-10 mt-1 w-full bg-white border border-slate-300 shadow-lg rounded-lg max-h-60 overflow-auto" role="listbox"><!--[-->`;
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let p = each_array[$$index];
        $$payload.out += `<button type="button" role="option"${attr("aria-selected", p.Codigo === proveedorCodigo)} class="block w-full text-left px-4 py-2.5 hover:bg-slate-100 text-sm border-b border-slate-100 last:border-b-0 first:rounded-t-lg last:rounded-b-lg"><span class="font-medium text-slate-800">${escape_html(p.Descripcion)}</span> <span class="text-slate-500 ml-1">(${escape_html(p.Codigo)})</span></button>`;
      }
      $$payload.out += `<!--]--></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div> <div><label for="fecha" class="block text-sm font-medium text-slate-700 mb-1.5">Fecha</label> <input id="fecha" type="date"${attr("value", documento.Fecha)} class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"></div></div> <div><label for="providerIA" class="block text-sm font-medium text-slate-700 mb-1.5">Proveedor de IA</label> <select id="providerIA" class="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"><option value="groq">Groq (Llama)</option><option value="gemini">Gemini</option></select></div> <div><label for="imagen-remito" class="block text-sm font-medium text-slate-700 mb-1.5">Imagen del remito</label> <input id="imagen-remito" type="file" accept="image/*" class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <p class="mt-2 text-xs text-slate-500">Suba una foto o escaneo del remito para extraer los ítems.</p> <p class="mt-3 text-sm text-slate-600">O bien:</p> `;
    Button($$payload, {
      variant: "secondary",
      class: "mt-1",
      children: ($$payload2) => {
        $$payload2.out += `<!---->agregar texto manualmente`;
      },
      $$slots: { default: true }
    });
    $$payload.out += `<!----></div></div>`;
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></main></div></div>`;
  pop();
}
export {
  _page as default
};
