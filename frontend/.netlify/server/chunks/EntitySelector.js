import { p as push, m as attr_class, k as attr, e as escape_html, v as bind_props, c as pop, n as stringify } from "./index3.js";
import { z as fallback } from "./utils.js";
import "./authStore.js";
function EntitySelector($$payload, $$props) {
  push();
  let label = fallback($$props["label"], "");
  let placeholder = fallback($$props["placeholder"], "Buscar...");
  let apiEndpoint = fallback($$props["apiEndpoint"], "");
  let valueField = fallback($$props["valueField"], "Codigo");
  let labelField = fallback($$props["labelField"], "Descripcion");
  let initialValue = fallback($$props["initialValue"], "");
  let required = fallback($$props["required"], false);
  let disabled = fallback($$props["disabled"], false);
  let minSearchLength = fallback($$props["minSearchLength"], 0);
  let searchParam = fallback($$props["searchParam"], "search");
  let showClearButton = fallback($$props["showClearButton"], true);
  let className = fallback($$props["className"], "");
  let errorMessage = fallback($$props["errorMessage"], "");
  let id = fallback($$props["id"], () => `entity-selector-${Math.random().toString(36).substring(2, 9)}`, true);
  let searchTerm = "";
  let isOpen = false;
  $$payload.out += `<div${attr_class(`relative ${stringify(className)}`)}>`;
  if (label) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<label${attr("for", id)} class="block text-sm font-medium text-gray-700 mb-1">${escape_html(label)}${escape_html(required ? " *" : "")}</label>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="relative"><input${attr("id", id)} type="text"${attr("value", searchTerm)}${attr("placeholder", placeholder)}${attr("disabled", disabled, true)}${attr_class(`w-full p-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${stringify(errorMessage ? "border-red-500" : "")}`)} autocomplete="off" aria-controls="opciones-id"${attr("aria-expanded", isOpen)} aria-autocomplete="list" role="combobox"> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> `;
  if (errorMessage) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<p class="mt-1 text-xs text-red-600"${attr("id", `${id}-error`)}>${escape_html(errorMessage)}</p>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, {
    label,
    placeholder,
    apiEndpoint,
    valueField,
    labelField,
    initialValue,
    required,
    disabled,
    minSearchLength,
    searchParam,
    showClearButton,
    className,
    errorMessage,
    id
  });
  pop();
}
export {
  EntitySelector as E
};
