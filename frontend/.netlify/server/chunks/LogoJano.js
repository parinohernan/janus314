import { y as attr_style, k as attr_class, x as bind_props, c as pop, p as push, l as stringify } from "./index3.js";
import { z as fallback } from "./utils.js";
function LogoJano($$payload, $$props) {
  push();
  let size = fallback($$props["size"], "medium");
  let animated = fallback($$props["animated"], true);
  let fontSize;
  let logoSize;
  let isHovered = false;
  let showGlow = false;
  {
    switch (size) {
      case "small":
        fontSize = "1.4rem";
        logoSize = "30px";
        break;
      case "large":
        fontSize = "2.2rem";
        logoSize = "45px";
        break;
      default:
        fontSize = "1.8rem";
        logoSize = "38px";
        break;
    }
  }
  $$payload.out += `<div class="logo-container svelte-xa910g" role="button" aria-label="Logo Jano miniPOS" tabindex="0"><div class="fox-container svelte-xa910g"${attr_style(`width: ${stringify(logoSize)}; height: ${stringify(logoSize)};`)}><img src="/logojano.png" alt="Jano Fox Logo"${attr_class("fox-logo svelte-xa910g", void 0, { "wiggle": isHovered })}></div> <div${attr_class("logo-text svelte-xa910g", void 0, { "glow": showGlow })}${attr_style(`font-size: ${stringify(fontSize)};`)}><span class="jano svelte-xa910g">Jano</span> <span class="minipos svelte-xa910g">miniPOS</span></div></div>`;
  bind_props($$props, { size, animated });
  pop();
}
export {
  LogoJano as L
};
