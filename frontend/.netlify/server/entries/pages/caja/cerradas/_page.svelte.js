import { l as ensure_array_like, k as attr, e as escape_html, m as attr_class, n as stringify, c as pop, p as push } from "../../../../chunks/index3.js";
import "../../../../chunks/client.js";
import "../../../../chunks/authStore.js";
import { B as Button } from "../../../../chunks/Button.js";
function _page($$payload, $$props) {
  push();
  let cajas = [];
  let vendedores = [];
  let vendedoresMap = /* @__PURE__ */ new Map();
  const now = /* @__PURE__ */ new Date();
  const today = now.toISOString().split("T")[0];
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastWeekStr = lastWeek.toISOString().split("T")[0];
  let fechaDesde = lastWeekStr;
  let fechaHasta = today;
  function obtenerNombreVendedor(codigo) {
    return vendedoresMap.get(codigo) || codigo;
  }
  function formatearFecha(fecha) {
    return new Date(fecha).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  function formatearMonto(monto) {
    return parseFloat(String(monto ?? 0)).toFixed(2);
  }
  function getEstadoClass(est) {
    switch (est.toLowerCase()) {
      case "abierta":
        return "bg-green-100 text-green-800";
      case "cerrada":
        return "bg-red-100 text-red-800";
      case "en_arqueo":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }
  const each_array = ensure_array_like(vendedores);
  $$payload.out += `<div><div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold text-gray-800">Listado de cajas</h1> `;
  Button($$payload, {
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Volver a Caja`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div> <div class="bg-white p-4 rounded-lg shadow-sm mb-6"><div class="grid grid-cols-1 md:grid-cols-4 gap-4"><div><label for="vendedor-input" class="block text-sm font-medium text-gray-700 mb-1">Vendedor</label> <select id="vendedor-input" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Todos los vendedores</option><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let vendedor = each_array[$$index];
    $$payload.out += `<option${attr("value", vendedor.Codigo)}>${escape_html(vendedor.Descripcion)}</option>`;
  }
  $$payload.out += `<!--]--></select></div> <div><label for="estado-select" class="block text-sm font-medium text-gray-700 mb-1">Estado</label> <select id="estado-select" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Todos</option><option value="abierta">Abierta</option><option value="cerrada">Cerrada</option><option value="en_arqueo">En Arqueo</option></select></div> <div><label for="fecha-desde" class="block text-sm font-medium text-gray-700 mb-1">Desde</label> <input id="fecha-desde" type="date"${attr("value", fechaDesde)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="fecha-hasta" class="block text-sm font-medium text-gray-700 mb-1">Hasta</label> <input id="fecha-hasta" type="date"${attr("value", fechaHasta)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div class="md:col-span-4">`;
  Button($$payload, {
    variant: "primary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Aplicar filtros`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div></div> `;
  if (cajas.length === 0) {
    $$payload.out += "<!--[2-->";
    $$payload.out += `<div class="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">No se encontraron cajas</div>`;
  } else {
    $$payload.out += "<!--[!-->";
    const each_array_1 = ensure_array_like(cajas);
    $$payload.out += `<div class="space-y-4"><!--[-->`;
    for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
      let caja = each_array_1[$$index_2];
      $$payload.out += `<div class="bg-white p-6 rounded-lg shadow-sm"><div class="grid grid-cols-2 gap-4 mb-4"><div><div class="text-sm text-gray-600">Vendedor</div> <div class="font-medium">${escape_html(obtenerNombreVendedor(caja.Vendedor.Codigo))}</div></div> <div class="text-right"><div class="text-sm text-gray-600">Estado</div> <span${attr_class(`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stringify(getEstadoClass(caja.Estado))}`)}>${escape_html(caja.Estado)}</span></div></div> <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4"><div><div class="text-sm text-gray-600">Apertura</div> <div class="font-medium">${escape_html(formatearFecha(caja.Apertura))}</div></div> <div><div class="text-sm text-gray-600">Cierre</div> <div class="font-medium">${escape_html(caja.Cierre ? formatearFecha(caja.Cierre) : "−")}</div></div> <div><div class="text-sm text-gray-600">Saldo inicial</div> <div class="font-medium">$${escape_html(formatearMonto(caja.SaldoInicial))}</div></div> <div><div class="text-sm text-gray-600">Saldo ${escape_html(caja.Estado === "cerrada" ? "final" : "actual")}</div> <div class="font-medium">$${escape_html(formatearMonto(caja.Estado === "cerrada" ? caja.SaldoCierre : caja.SaldoTeorico))}</div></div></div> `;
      if (caja.Arqueos?.length > 0) {
        $$payload.out += "<!--[-->";
        const each_array_2 = ensure_array_like(caja.Arqueos);
        $$payload.out += `<div class="mt-4"><h4 class="font-medium text-gray-800 mb-2">Arqueos</h4> <div class="overflow-x-auto border rounded-lg"><table class="min-w-full text-sm"><thead class="bg-gray-50"><tr><th class="px-4 py-2 text-left font-medium text-gray-700">Método</th><th class="px-4 py-2 text-right font-medium text-gray-700">Sistema</th><th class="px-4 py-2 text-right font-medium text-gray-700">Contado</th><th class="px-4 py-2 text-right font-medium text-gray-700">Diferencia</th></tr></thead><tbody><!--[-->`;
        for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
          let arqueo = each_array_2[$$index_1];
          $$payload.out += `<tr class="border-t border-gray-100"><td class="px-4 py-2">${escape_html(arqueo.MetodoPago)}</td><td class="px-4 py-2 text-right">$${escape_html(formatearMonto(arqueo.MontoSistema))}</td><td class="px-4 py-2 text-right">$${escape_html(formatearMonto(arqueo.MontoContado))}</td><td${attr_class(`px-4 py-2 text-right ${stringify(arqueo.Diferencia < 0 ? "text-red-600" : "text-green-600")}`)}>$${escape_html(formatearMonto(arqueo.Diferencia))}</td></tr>`;
        }
        $$payload.out += `<!--]--></tbody></table></div></div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (caja.Observaciones) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="mt-4"><div class="text-sm text-gray-600">Observaciones</div> <div class="mt-1 text-gray-700">${escape_html(caja.Observaciones)}</div></div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></div>`;
    }
    $$payload.out += `<!--]--></div> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
