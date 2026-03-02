import { l as ensure_array_like, m as attr_class, k as attr, e as escape_html, c as pop, p as push, n as stringify } from "../../../../../../chunks/index3.js";
import "../../../../../../chunks/client.js";
/* empty css                           */
import "../../../../../../chunks/authStore.js";
import { B as Breadcrumbs } from "../../../../../../chunks/index4.js";
function _page($$payload, $$props) {
  push();
  let currentStep = 1;
  const totalSteps = 4;
  function validateStep(step) {
    switch (step) {
      case 1:
        return false;
      case 2:
        return false;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  }
  let producto = {
    Descripcion: "",
    CodigoBarras: "",
    CodigoProveedor: ""
  };
  const each_array = ensure_array_like(Array(totalSteps));
  $$payload.out += `<div class="nuevo-producto-container svelte-1iuahql">`;
  Breadcrumbs($$payload, {
    customPath: [
      { label: "Home", path: "/ventas/bot/home" },
      {
        label: "Productos",
        path: "/ventas/bot/productos"
      },
      {
        label: "Nuevo Producto",
        path: "/ventas/bot/productos/nuevo"
      }
    ]
  });
  $$payload.out += `<!----> <header class="header svelte-1iuahql"><div class="header-title svelte-1iuahql"><h1 class="svelte-1iuahql">Nuevo Producto</h1></div> <div class="header-actions"><button class="btn-back svelte-1iuahql" aria-label="Volver al listado"><span class="icon svelte-1iuahql">←</span> <span class="label">Volver</span></button></div></header> <div class="progress-bar svelte-1iuahql"><div class="progress-steps svelte-1iuahql"><!--[-->`;
  for (let i = 0, $$length = each_array.length; i < $$length; i++) {
    each_array[i];
    $$payload.out += `<button${attr_class(`step-indicator ${stringify(currentStep === i + 1 ? "active" : "")} ${stringify(currentStep > i + 1 ? "completed" : "")}`, "svelte-1iuahql")}${attr("disabled", currentStep < i + 1 && !validateStep(currentStep), true)}>${escape_html(i + 1)}</button> `;
    if (i < totalSteps - 1) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div${attr_class(`step-line ${stringify(currentStep > i + 1 ? "completed" : "")}`, "svelte-1iuahql")}></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]--></div></div> <div class="form-container svelte-1iuahql">`;
  {
    $$payload.out += "<!--[!-->";
    {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="form-step svelte-1iuahql"><h2 class="svelte-1iuahql">Datos Principales</h2> <div class="form-group svelte-1iuahql"><label for="descripcion" class="svelte-1iuahql">Descripción <span class="required svelte-1iuahql">*</span></label> <input type="text" id="descripcion"${attr("value", producto.Descripcion)} placeholder="Nombre del producto" required class="svelte-1iuahql"></div> <div class="form-group svelte-1iuahql"><label for="codigoBarras" class="svelte-1iuahql">Código de Barras</label> <input type="text" id="codigoBarras"${attr("value", producto.CodigoBarras)} placeholder="Código de barras (opcional)" class="svelte-1iuahql"></div> <div class="form-group svelte-1iuahql"><label for="codigoProveedor" class="svelte-1iuahql">Código de Proveedor</label> <input type="text" id="codigoProveedor"${attr("value", producto.CodigoProveedor)} placeholder="Código del proveedor (opcional)" class="svelte-1iuahql"></div></div>`;
    }
    $$payload.out += `<!--]--> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div class="form-navigation svelte-1iuahql">`;
    {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<button class="btn-secondary svelte-1iuahql">Cancelar</button>`;
    }
    $$payload.out += `<!--]--> `;
    {
      $$payload.out += "<!--[-->";
      $$payload.out += `<button class="btn-primary svelte-1iuahql"${attr("disabled", !validateStep(currentStep), true)}>Siguiente</button>`;
    }
    $$payload.out += `<!--]--></div>`;
  }
  $$payload.out += `<!--]--></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
