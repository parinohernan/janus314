import { f as slot, c as pop, p as push } from "../../../../../chunks/index3.js";
/* empty css                        */
import "../../../../../chunks/client.js";
import "../../../../../chunks/navigationState.js";
function _layout($$payload, $$props) {
  push();
  $$payload.out += `<div class="telegram-app min-h-screen svelte-nwbxml"><main class="svelte-nwbxml"><!---->`;
  slot($$payload, $$props, "default", {});
  $$payload.out += `<!----></main></div>`;
  pop();
}
export {
  _layout as default
};
