import { e as escape_html, l as ensure_array_like, m as attr_class, k as attr, v as bind_props, c as pop, p as push, n as stringify } from "../../../../../../../chunks/index3.js";
import "../../../../../../../chunks/client.js";
/* empty css                              */
import "../../../../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  let data = $$props["data"];
  let producto = data.articulo || {};
  producto.Codigo || "";
  let currentStep = 1;
  const totalSteps = 4;
  function calcularPrecioSinIva(precioConIva, porcentajeIva) {
    return precioConIva / (1 + porcentajeIva / 100);
  }
  function calcularPrecioLista1(costoSinIva, iva, incremento) {
    const costoConIva = costoSinIva * (1 + iva / 100);
    return costoConIva * (1 + incremento / 100);
  }
  producto.PrecioCostoConIva = producto.PrecioCostoConIva || (producto.PrecioCosto ? producto.PrecioCosto * (1 + (producto.PorcentajeIVA1 || 21) / 100) : 0);
  producto.PrecioCostoSinIva = producto.PrecioCostoSinIva || producto.PrecioCosto || 0;
  if (producto.PrecioCostoConIva > 0 && producto.PorcentajeIVA1) {
    producto.PrecioCostoSinIva = calcularPrecioSinIva(producto.PrecioCostoConIva, producto.PorcentajeIVA1);
    producto.PrecioCosto = producto.PrecioCostoSinIva;
  }
  calcularPrecioLista1(producto.PrecioCostoSinIva, producto.PorcentajeIVA1, producto.Lista1);
  $$payload.out += `<div class="editar-producto-container svelte-wwlxth"><header class="header svelte-wwlxth"><div class="header-title svelte-wwlxth"><h1 class="svelte-wwlxth">Editar Producto</h1> <div class="product-code svelte-wwlxth">Código: ${escape_html(producto.Codigo)}</div></div> <div class="header-actions svelte-wwlxth"><button class="btn-back svelte-wwlxth" aria-label="Volver al listado"><span class="icon svelte-wwlxth">←</span> <span class="label">Volver</span></button></div></header> `;
  {
    $$payload.out += "<!--[!-->";
    const each_array = ensure_array_like(Array(totalSteps));
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div class="steps-indicator svelte-wwlxth"><div class="steps-track svelte-wwlxth"><!--[-->`;
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      each_array[i];
      $$payload.out += `<div${attr_class(`step-dot ${stringify(i + 1 <= currentStep ? "active" : "")}`, "svelte-wwlxth")}></div>`;
    }
    $$payload.out += `<!--]--></div> <div class="step-label svelte-wwlxth">Paso ${escape_html(currentStep)} de ${escape_html(totalSteps)}</div></div> <div class="form-container svelte-wwlxth">`;
    {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="form-section svelte-wwlxth"><h2 class="svelte-wwlxth">Datos Básicos</h2> <div class="form-group svelte-wwlxth"><label for="descripcion" class="svelte-wwlxth">Descripción <span class="required svelte-wwlxth">*</span></label> <input type="text" id="descripcion" placeholder="Nombre del producto"${attr("value", producto.Descripcion)} required class="svelte-wwlxth"></div> <div class="form-group svelte-wwlxth"><label for="codigo-barras" class="svelte-wwlxth">Código de Barras</label> <input type="text" id="codigo-barras" placeholder="Código de barras"${attr("value", producto.CodigoBarras)} class="svelte-wwlxth"></div> <div class="form-group svelte-wwlxth"><label for="activo" class="svelte-wwlxth">Estado</label> <select id="activo" class="svelte-wwlxth"><option${attr("value", 1)}>Activo</option><option${attr("value", 0)}>Inactivo</option></select></div></div>`;
    }
    $$payload.out += `<!--]--> <div class="form-buttons svelte-wwlxth">`;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> `;
    {
      $$payload.out += "<!--[-->";
      $$payload.out += `<button type="button" class="btn-next svelte-wwlxth">Siguiente</button>`;
    }
    $$payload.out += `<!--]--></div></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, { data });
  pop();
}
export {
  _page as default
};
