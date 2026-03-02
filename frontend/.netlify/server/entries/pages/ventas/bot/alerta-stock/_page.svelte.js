import { l as ensure_array_like, k as attr, e as escape_html, c as pop, p as push } from "../../../../../chunks/index3.js";
import "../../../../../chunks/client.js";
/* empty css                        */
/* empty css                        */
import "../../../../../chunks/authStore.js";
import { L as LogoJano } from "../../../../../chunks/LogoJano.js";
function _page($$payload, $$props) {
  push();
  let searchTerm = "";
  let proveedores = [];
  const each_array = ensure_array_like(proveedores);
  $$payload.out += `<div class="alerta-stock-container svelte-1dqxulv"><header class="header svelte-1dqxulv"><div class="header-content svelte-1dqxulv"><button class="btn-back svelte-1dqxulv" aria-label="Volver"><span class="back-icon svelte-1dqxulv">←</span></button> <div class="title-container svelte-1dqxulv">`;
  LogoJano($$payload, { size: "small", animated: false });
  $$payload.out += `<!----> <h2 class="page-subtitle svelte-1dqxulv">Alerta de Stock</h2></div></div></header> <div class="search-filter-container svelte-1dqxulv"><div class="filter-row svelte-1dqxulv"><div class="search-bar svelte-1dqxulv"><input type="text" placeholder="Buscar productos..."${attr("value", searchTerm)} class="svelte-1dqxulv"></div> <div class="filter-select svelte-1dqxulv"><select aria-label="Filtrar por proveedor" class="svelte-1dqxulv"><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let proveedor = each_array[$$index];
    $$payload.out += `<option${attr("value", proveedor.codigo)} class="svelte-1dqxulv">${escape_html(proveedor.descripcion)}</option>`;
  }
  $$payload.out += `<!--]--></select></div></div></div> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="loading-container svelte-1dqxulv"><span class="loader svelte-1dqxulv"></span> <p class="svelte-1dqxulv">Cargando alertas de stock...</p></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
