import { d as store_get, u as unsubscribe_stores, c as pop, p as push } from "../../../../chunks/index3.js";
import "../../../../chunks/client.js";
import "clsx";
import { a as auth } from "../../../../chunks/authStore.js";
import { B as Button } from "../../../../chunks/Button.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  if (typeof store_get($$store_subs ??= {}, "$auth", auth)?.user?.usuario === "string") {
    store_get($$store_subs ??= {}, "$auth", auth).user.usuario;
  }
  $$payload.out += `<div><div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold text-gray-800">Arqueo de caja</h1> `;
  Button($$payload, {
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Volver a Caja`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
