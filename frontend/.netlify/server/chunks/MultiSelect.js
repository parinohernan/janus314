import { p as push, k as attr, m as attr_class, l as ensure_array_like, e as escape_html, v as bind_props, c as pop } from "./index3.js";
import { z as fallback } from "./utils.js";
function MultiSelect($$payload, $$props) {
  push();
  let items = fallback($$props["items"], () => [], true);
  let selectedValues = fallback($$props["selectedValues"], () => [], true);
  let labelField = fallback($$props["labelField"], "label");
  let valueField = fallback($$props["valueField"], "value");
  let placeholder = fallback($$props["placeholder"], "Seleccione...");
  let disabled = fallback($$props["disabled"], false);
  let isOpen = false;
  let comboboxId = `multiselect-${Math.random().toString(36).substr(2, 9)}`;
  function getSelectedLabels() {
    return selectedValues.map((value) => items.find((item) => item[valueField] === value)?.[labelField]).filter(Boolean);
  }
  $$payload.out += `<div class="relative"><div role="combobox" aria-haspopup="listbox"${attr("aria-expanded", isOpen)}${attr("aria-controls", comboboxId)}${attr("aria-label", placeholder)} tabindex="0"${attr_class("min-h-[42px] p-1 border border-gray-300 rounded-md bg-white cursor-pointer flex flex-wrap gap-1 items-center", void 0, { "cursor-not-allowed": disabled })}>`;
  if (selectedValues.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(getSelectedLabels());
    $$payload.out += `<!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let label = each_array[$$index];
      $$payload.out += `<span class="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-md flex items-center">${escape_html(label)} <button type="button" class="ml-1 text-blue-600 hover:text-blue-800"${attr("aria-label", `Eliminar ${label}`)}>×</button></span>`;
    }
    $$payload.out += `<!--]-->`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<span class="text-gray-400 px-2">${escape_html(placeholder)}</span>`;
  }
  $$payload.out += `<!--]--></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, {
    items,
    selectedValues,
    labelField,
    valueField,
    placeholder,
    disabled
  });
  pop();
}
export {
  MultiSelect as M
};
