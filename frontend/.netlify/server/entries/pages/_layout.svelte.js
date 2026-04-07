import { d as store_get, u as unsubscribe_stores, c as pop, p as push } from "../../chunks/index3.js";
/* empty css               */
import "../../chunks/authStore.js";
import "clsx";
import "../../chunks/client.js";
/* empty css                                              */
import { p as page } from "../../chunks/stores.js";
import "../../chunks/tabsStore.js";
import { w as writable } from "../../chunks/index2.js";
import "../../chunks/menuVisibilityStore.js";
import "../../chunks/navigationState.js";
const initialCollapsed = false;
const sidebarCollapsed = writable(initialCollapsed);
sidebarCollapsed.subscribe((value) => {
});
function _layout($$payload, $$props) {
  push();
  var $$store_subs;
  !store_get($$store_subs ??= {}, "$page", page).url.pathname.includes("/ventas/bot/") ? store_get($$store_subs ??= {}, "$sidebarCollapsed", sidebarCollapsed) ? "ml-16" : "ml-60" : "";
  let { children } = $$props;
  store_get($$store_subs ??= {}, "$page", page).url.pathname.includes("/ventas/bot/");
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex items-center justify-center h-screen"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>`;
  }
  $$payload.out += `<!--]-->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _layout as default
};
