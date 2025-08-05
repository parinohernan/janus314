import { f as slot } from "../../../../../chunks/index3.js";
function _layout($$payload, $$props) {
  console.log("Layout de clientes cargado");
  $$payload.out += `<div class="clientes-layout svelte-wrrc6q"><!---->`;
  slot($$payload, $$props, "default", {});
  $$payload.out += `<!----></div>`;
}
export {
  _layout as default
};
