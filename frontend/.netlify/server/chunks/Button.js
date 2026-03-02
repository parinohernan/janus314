import { g as sanitize_props, q as rest_props, t as spread_attributes, f as slot, v as bind_props } from "./index3.js";
import { z as fallback } from "./utils.js";
function Button($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const $$restProps = rest_props($$sanitized_props, [
    "type",
    "variant",
    "size",
    "disabled",
    "fullWidth",
    "className"
  ]);
  let classes;
  let type = fallback($$props["type"], "button");
  let variant = fallback($$props["variant"], "primary");
  let size = fallback($$props["size"], "md");
  let disabled = fallback($$props["disabled"], false);
  let fullWidth = fallback($$props["fullWidth"], false);
  let className = fallback($$props["className"], "");
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white"
  };
  const sizeClasses = {
    sm: "text-sm py-1 px-2",
    md: "text-base py-2 px-4",
    lg: "text-lg py-3 px-6"
  };
  classes = `
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${fullWidth ? "w-full" : ""}
    rounded font-medium focus:outline-none focus:ring-2 focus:ring-opacity-50
    transition-colors disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `;
  $$payload.out += `<button${spread_attributes(
    {
      type,
      disabled,
      class: classes,
      ...$$restProps
    }
  )}><!---->`;
  slot($$payload, $$props, "default", {});
  $$payload.out += `<!----></button>`;
  bind_props($$props, {
    type,
    variant,
    size,
    disabled,
    fullWidth,
    className
  });
}
export {
  Button as B
};
