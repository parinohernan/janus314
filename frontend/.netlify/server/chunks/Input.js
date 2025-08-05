import { t as sanitize_props, v as rest_props, w as spread_attributes, l as stringify, x as bind_props } from "./index3.js";
import { z as fallback } from "./utils.js";
function Input($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const $$restProps = rest_props($$sanitized_props, [
    "value",
    "type",
    "id",
    "disabled",
    "className"
  ]);
  let value = fallback($$props["value"], "");
  let type = fallback($$props["type"], "text");
  let id = fallback($$props["id"], "");
  let disabled = fallback($$props["disabled"], false);
  let className = fallback($$props["className"], "");
  $$payload.out += `<input${spread_attributes(
    {
      type,
      id,
      disabled,
      value,
      class: `w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${stringify(className)}`,
      ...$$restProps
    }
  )}>`;
  bind_props($$props, { value, type, id, disabled, className });
}
export {
  Input as I
};
