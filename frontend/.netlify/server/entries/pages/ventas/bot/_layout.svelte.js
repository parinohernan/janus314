import { h as head, f as slot, c as pop, p as push } from "../../../../chunks/index3.js";
/* empty css                     */
import "../../../../chunks/client.js";
import "../../../../chunks/navigationState.js";
/* empty css                     */
/* empty css                            */
function _layout($$payload, $$props) {
  push();
  head($$payload, ($$payload2) => {
    $$payload2.out += `<meta name="apple-mobile-web-app-capable" content="yes"> <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"> <meta name="mobile-web-app-capable" content="yes">`;
  });
  $$payload.out += `<div class="mobile-app-container svelte-lo18xs"><div class="telegram-app min-h-screen svelte-lo18xs"><main class="svelte-lo18xs"><!---->`;
  slot($$payload, $$props, "default", {});
  $$payload.out += `<!----></main></div></div>`;
  pop();
}
export {
  _layout as default
};
