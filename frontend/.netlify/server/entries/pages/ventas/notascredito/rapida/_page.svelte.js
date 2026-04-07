import { d as store_get, z as copy_payload, A as assign_payload, u as unsubscribe_stores, c as pop, p as push } from "../../../../../chunks/index3.js";
import { p as page } from "../../../../../chunks/stores.js";
import "../../../../../chunks/client.js";
import "../../../../../chunks/navigationState.js";
import { B as Button } from "../../../../../chunks/Button.js";
import "clsx";
import "../../../../../chunks/authStore.js";
/* empty css                                                           */
/* empty css                                                                */
import { D as DetalleFacturaModal } from "../../../../../chunks/DetalleFacturaModal.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let preventaParam, preventaTipo, preventaSucursal, preventaNumero;
  let showDetalleFacturaModal = false;
  let facturaSeleccionadaParaDetalle = null;
  let itemsFacturaDetalle = [];
  let cargandoDetalleFactura = false;
  preventaParam = store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("preventa");
  [
    preventaTipo,
    preventaSucursal,
    preventaNumero
  ] = preventaParam ? preventaParam.split("/") : [null, null, null];
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out += `<div class="container mx-auto px-4 py-6"><div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold text-gray-800">Nueva nota de crédito RÁPIDA</h1> `;
    Button($$payload2, {
      variant: "secondary",
      children: ($$payload3) => {
        $$payload3.out += `<!---->Volver a Preventas`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----></div> `;
    if (!preventaParam) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<div class="bg-amber-100 border border-amber-400 text-amber-800 px-4 py-3 rounded">Use esta pantalla desde el listado de preventas con la acción "Generar nota de crédito".</div> <p class="mt-2"><a href="/ventas/preventas" class="text-indigo-600 hover:underline">Ir a preventas</a></p>`;
    } else {
      $$payload2.out += "<!--[1-->";
      $$payload2.out += `<div class="flex justify-center py-12"><div class="spinner svelte-j5tdg7"></div></div>`;
    }
    $$payload2.out += `<!--]--></div> `;
    DetalleFacturaModal($$payload2, {
      factura: facturaSeleccionadaParaDetalle,
      items: itemsFacturaDetalle,
      loading: cargandoDetalleFactura,
      get show() {
        return showDetalleFacturaModal;
      },
      set show($$value) {
        showDetalleFacturaModal = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!----> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]-->`;
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
