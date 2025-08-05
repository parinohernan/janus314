import { j as attr, c as pop, p as push } from "../../../../../chunks/index3.js";
import "../../../../../chunks/client.js";
/* empty css                        */
import "../../../../../chunks/authStore.js";
import { B as Breadcrumbs } from "../../../../../chunks/index4.js";
import { L as LogoJano } from "../../../../../chunks/LogoJano.js";
function _page($$payload, $$props) {
  push();
  let searchTerm = "";
  $$payload.out += `<div class="productos-container svelte-1axnztd">`;
  Breadcrumbs($$payload, {
    customPath: [
      { label: "Home", path: "/ventas/bot/home" },
      {
        label: "Productos",
        path: "/ventas/bot/productos"
      }
    ]
  });
  $$payload.out += `<!----> <header class="header svelte-1axnztd"><div class="header-content svelte-1axnztd"><button class="btn-back svelte-1axnztd" aria-label="Volver"><span class="back-icon">←</span></button> <div class="title-container svelte-1axnztd">`;
  LogoJano($$payload, { size: "small", animated: false });
  $$payload.out += `<!----> <h2 class="page-subtitle svelte-1axnztd">Productos</h2></div></div> <div class="header-actions svelte-1axnztd"><button class="btn-nuevo svelte-1axnztd" aria-label="Crear nuevo producto"><span class="icon svelte-1axnztd">+</span> <span class="label">Nuevo</span></button></div></header> <div class="search-filter-container svelte-1axnztd"><div class="search-bar svelte-1axnztd"><input type="text" placeholder="Buscar productos..."${attr("value", searchTerm)} class="svelte-1axnztd"></div></div> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="loading-state svelte-1axnztd"><div class="spinner svelte-1axnztd"></div> <span>Cargando productos...</span></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
