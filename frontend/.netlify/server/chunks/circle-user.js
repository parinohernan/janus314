import { g as sanitize_props, j as spread_props, f as slot } from "./index3.js";
import { I as Icon } from "./Icon.js";
function Circle_user($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "circle",
      { "cx": "12", "cy": "12", "r": "10" }
    ],
    [
      "circle",
      { "cx": "12", "cy": "10", "r": "3" }
    ],
    [
      "path",
      {
        "d": "M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "circle-user" },
    $$sanitized_props,
    {
      iconNode,
      children: ($$payload2) => {
        $$payload2.out += `<!---->`;
        slot($$payload2, $$props, "default", {});
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
}
export {
  Circle_user as C
};
