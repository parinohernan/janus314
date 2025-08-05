import { p as push, j as attr, x as bind_props, c as pop } from "./index3.js";
import { z as fallback } from "./utils.js";
function DatePicker($$payload, $$props) {
  push();
  let value = fallback($$props["value"], () => /* @__PURE__ */ new Date(), true);
  let id = fallback($$props["id"], "");
  $$payload.out += `<input${attr("id", id)} type="date" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"${attr("value", value.toISOString().split("T")[0])}>`;
  bind_props($$props, { value, id });
  pop();
}
export {
  DatePicker as D
};
