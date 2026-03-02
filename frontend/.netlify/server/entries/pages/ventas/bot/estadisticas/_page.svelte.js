import { k as attr, m as attr_class, l as ensure_array_like, e as escape_html, c as pop, p as push, n as stringify } from "../../../../../chunks/index3.js";
import "../../../../../chunks/client.js";
import "../../../../../chunks/authStore.js";
/* empty css                        */
import { L as LogoJano } from "../../../../../chunks/LogoJano.js";
function _page($$payload, $$props) {
  push();
  let fechaDesde = "";
  let fechaHasta = "";
  let vendedores = [];
  let detalleVentas = [];
  detalleVentas.reduce((total, venta) => total + parseFloat(venta.ImporteTotal || 0), 0);
  $$payload.out += `<div class="telegram-webapp svelte-nuzmz1"><header class="header svelte-nuzmz1"><div class="header-content svelte-nuzmz1"><button class="btn-back svelte-nuzmz1" aria-label="Volver"><span class="back-icon svelte-nuzmz1">←</span></button> <div class="title-container svelte-nuzmz1">`;
  LogoJano($$payload, { size: "small", animated: false });
  $$payload.out += `<!----> <h2 class="page-subtitle svelte-nuzmz1">Estadísticas</h2></div></div></header> <div class="filtros-container svelte-nuzmz1"><div class="fecha-container svelte-nuzmz1"><div class="fecha-grupo svelte-nuzmz1"><label for="fecha-desde" class="svelte-nuzmz1">Desde:</label> <input type="date" id="fecha-desde"${attr("value", fechaDesde)} class="input-fecha svelte-nuzmz1"></div> <div class="fecha-grupo svelte-nuzmz1"><label for="fecha-hasta" class="svelte-nuzmz1">Hasta:</label> <input type="date" id="fecha-hasta"${attr("value", fechaHasta)} class="input-fecha svelte-nuzmz1"></div></div></div> <div class="tabs-container svelte-nuzmz1"><button${attr_class(`tab-button ${stringify("active")}`, "svelte-nuzmz1")}>👤 Vendedores</button> <button${attr_class(`tab-button ${stringify("")}`, "svelte-nuzmz1")}>📦 Productos</button></div> `;
  {
    $$payload.out += "<!--[!-->";
    {
      $$payload.out += "<!--[-->";
      const each_array = ensure_array_like(vendedores);
      $$payload.out += `<div class="vendedores-container svelte-nuzmz1"><div class="select-container svelte-nuzmz1"><label for="select-vendedor" class="svelte-nuzmz1">Seleccionar Vendedor:</label> <select id="select-vendedor" class="select-input svelte-nuzmz1"><!--[-->`;
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let vendedor = each_array[$$index];
        $$payload.out += `<option${attr("value", vendedor.codigo)} class="svelte-nuzmz1">${escape_html(vendedor.nombre)}</option>`;
      }
      $$payload.out += `<!--]--></select></div> `;
      {
        $$payload.out += "<!--[!-->";
        $$payload.out += `<p class="no-data-message svelte-nuzmz1">Seleccione un vendedor para ver sus estadísticas</p>`;
      }
      $$payload.out += `<!--]--></div>`;
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
