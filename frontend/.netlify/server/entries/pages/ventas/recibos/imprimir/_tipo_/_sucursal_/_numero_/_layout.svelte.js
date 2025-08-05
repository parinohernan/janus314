import { h as head, c as pop, p as push } from "../../../../../../../../chunks/index3.js";
import "../../../../../../../../chunks/client.js";
import "../../../../../../../../chunks/navigationState.js";
function _layout($$payload, $$props) {
  push();
  let { children } = $$props;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Imprimir Recibo | Gestión Comercial</title>`;
  });
  $$payload.out += `<div class="min-h-screen print:p-0">`;
  children($$payload);
  $$payload.out += `<!----></div>`;
  pop();
}
export {
  _layout as default
};
