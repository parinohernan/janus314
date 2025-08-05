import { d as store_get, g as ensure_array_like, k as attr_class, l as stringify, j as attr, e as escape_html, u as unsubscribe_stores, x as bind_props, c as pop, p as push } from "./index3.js";
import "./client.js";
import { p as page } from "./stores.js";
/* empty css                                    */
import { z as fallback } from "./utils.js";
function Breadcrumbs($$payload, $$props) {
  push();
  var $$store_subs;
  let breadcrumbs;
  let customPath = fallback($$props["customPath"], null);
  let hideHome = fallback($$props["hideHome"], false);
  const routeLabels = {
    "ventas": "Ventas",
    "bot": "Bot",
    "productos": "Productos",
    "nuevo": "Nuevo",
    "editar": "Editar",
    "detalles": "Detalles",
    "clientes": "Clientes",
    "proveedores": "Proveedores",
    "alertas": "Alertas",
    "stock": "Stock",
    "usuarios": "Usuarios",
    "configuracion": "Configuración"
  };
  function generateBreadcrumbs(currentPath) {
    if (customPath) {
      return customPath.map((item, index) => ({
        label: item.label,
        path: item.path,
        active: index === customPath.length - 1
      }));
    }
    const items = !hideHome ? [
      {
        label: "Home",
        path: "/ventas/bot/home",
        active: false
      }
    ] : [];
    const segments = currentPath.split("/").filter((segment) => segment);
    let currentRoute = "";
    segments.forEach((segment, index) => {
      currentRoute += `/${segment}`;
      if (segment.startsWith("[") || /^\d+$/.test(segment)) {
        return;
      }
      if (segment === "productos" && segments[index + 1] === "detalles" && segments[index + 2] && /^\d+$/.test(segments[index + 2])) {
        return;
      }
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      items.push({
        label,
        path: currentRoute,
        active: index === segments.length - 1
      });
    });
    return items;
  }
  breadcrumbs = generateBreadcrumbs(store_get($$store_subs ??= {}, "$page", page).url.pathname);
  const each_array = ensure_array_like(breadcrumbs);
  $$payload.out += `<nav class="breadcrumb-container svelte-12kdqy" aria-label="Breadcrumb"><ol class="breadcrumb-list svelte-12kdqy"><!--[-->`;
  for (let i = 0, $$length = each_array.length; i < $$length; i++) {
    let item = each_array[i];
    $$payload.out += `<li${attr_class(`breadcrumb-item ${stringify(item.active ? "active" : "")}`, "svelte-12kdqy")}>`;
    if (!item.active) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<button class="breadcrumb-link svelte-12kdqy"${attr("aria-current", item.active ? "page" : void 0)}>${escape_html(item.label)}</button> <span class="separator svelte-12kdqy" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svelte-12kdqy"><polyline points="9 18 15 12 9 6"></polyline></svg></span>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<span class="current-page svelte-12kdqy">${escape_html(item.label)}</span>`;
    }
    $$payload.out += `<!--]--></li>`;
  }
  $$payload.out += `<!--]--></ol></nav>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { customPath, hideHome });
  pop();
}
export {
  Breadcrumbs as B
};
