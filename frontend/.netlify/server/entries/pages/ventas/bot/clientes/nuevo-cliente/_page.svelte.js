import { g as ensure_array_like, k as attr_class, e as escape_html, j as attr, c as pop, p as push } from "../../../../../../chunks/index3.js";
import "../../../../../../chunks/client.js";
/* empty css                           */
import "../../../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  let currentStep = 1;
  const totalSteps = 3;
  let cliente = {
    Descripcion: "",
    // Razón Social
    NombreFantasia: "",
    Cuit: ""
  };
  let loading = false;
  let categoriasIva = [];
  const each_array = ensure_array_like(Array(totalSteps));
  $$payload.out += `<div class="nuevo-cliente-container svelte-heeb5"><header class="header svelte-heeb5"><div class="header-title svelte-heeb5"><h1 class="svelte-heeb5">Nuevo Cliente</h1></div> <div class="header-actions"><button class="btn-back svelte-heeb5" aria-label="Volver a clientes"><span class="icon svelte-heeb5">←</span> <span class="label">Volver</span></button></div></header> <div class="stepper svelte-heeb5"><div class="step-dots svelte-heeb5"><!--[-->`;
  for (let i = 0, $$length = each_array.length; i < $$length; i++) {
    each_array[i];
    $$payload.out += `<div${attr_class("step-dot svelte-heeb5", void 0, {
      "active": currentStep === i + 1,
      "completed": currentStep > i + 1
    })}>${escape_html(i + 1)}</div> `;
    if (i < totalSteps - 1) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div${attr_class("step-line svelte-heeb5", void 0, { "completed": currentStep > i + 1 })}></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]--></div> <div class="step-labels svelte-heeb5"><div${attr_class("step-label svelte-heeb5", void 0, { "active": currentStep === 1 })}>Datos Principales</div> <div${attr_class("step-label svelte-heeb5", void 0, { "active": currentStep === 2 })}>Dirección</div> <div${attr_class("step-label svelte-heeb5", void 0, { "active": currentStep === 3 })}>Contacto</div></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="cliente-form svelte-heeb5">`;
  {
    $$payload.out += "<!--[-->";
    const each_array_1 = ensure_array_like(categoriasIva);
    $$payload.out += `<div class="form-step svelte-heeb5"><div class="form-group svelte-heeb5"><label for="razonSocial" class="svelte-heeb5">Razón Social <span class="required svelte-heeb5">*</span></label> <input type="text" id="razonSocial"${attr("value", cliente.Descripcion)} placeholder="Ingrese la razón social" maxlength="50" required class="svelte-heeb5"></div> <div class="form-group svelte-heeb5"><label for="nombreFantasia" class="svelte-heeb5">Nombre Fantasía</label> <input type="text" id="nombreFantasia"${attr("value", cliente.NombreFantasia)} placeholder="Ingrese el nombre de fantasía" maxlength="80" class="svelte-heeb5"></div> <div class="form-group svelte-heeb5"><label for="categoriaIva" class="svelte-heeb5">Categoría IVA <span class="required svelte-heeb5">*</span></label> <select id="categoriaIva" required class="svelte-heeb5"><option value="">Seleccione una categoría</option><!--[-->`;
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let categoria = each_array_1[$$index_1];
      $$payload.out += `<option${attr("value", categoria.Codigo)}>${escape_html(categoria.Descripcion)}</option>`;
    }
    $$payload.out += `<!--]--></select></div> <div class="form-group svelte-heeb5"><label for="cuit" class="svelte-heeb5">CUIT <span class="required svelte-heeb5">*</span></label> <input type="text" id="cuit"${attr("value", cliente.Cuit)} placeholder="Ingrese el CUIT (11 dígitos)" maxlength="11" required class="svelte-heeb5"></div></div>`;
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="form-buttons svelte-heeb5">`;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <button type="button" class="btn-primary svelte-heeb5"${attr("disabled", loading, true)}>${escape_html("Siguiente")} `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></button></div></div></div>`;
  pop();
}
export {
  _page as default
};
