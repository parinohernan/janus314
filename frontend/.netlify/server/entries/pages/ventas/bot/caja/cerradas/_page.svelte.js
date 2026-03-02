import { l as ensure_array_like, k as attr, e as escape_html, m as attr_class, n as stringify, c as pop, p as push } from "../../../../../../chunks/index3.js";
import "../../../../../../chunks/client.js";
import { a as auth } from "../../../../../../chunks/authStore.js";
import { o as onDestroy } from "../../../../../../chunks/index-server.js";
/* empty css                           */
import { L as LogoJano } from "../../../../../../chunks/LogoJano.js";
function _page($$payload, $$props) {
  push();
  let cajas = [];
  let vendedores = [];
  let vendedoresMap = /* @__PURE__ */ new Map();
  const today = /* @__PURE__ */ new Date();
  const todayStr = today.toISOString().split("T")[0];
  let fechaDesde = todayStr;
  let fechaHasta = todayStr;
  function guardarDatosVendedor(usuario) {
    if (usuario) {
      localStorage.setItem("botVendedorNombre", usuario.nombre || "Vendedor");
      localStorage.setItem("botVendedorApellido", usuario.apellido || "");
      localStorage.setItem("botVendedorCodigo", usuario.usuario || "1");
      console.log("Datos de vendedor guardados en localStorage:", usuario.usuario);
    }
  }
  let unsubscribe = auth.subscribe((state) => {
    console.log("Estado de autenticación:", state);
    if (state.user) {
      state.user.usuario || "1";
      guardarDatosVendedor(state.user);
    } else {
      localStorage.getItem("botVendedorCodigo");
    }
  });
  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
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
    return parseFloat(monto?.toString() || "0").toFixed(2);
  }
  function getEstadoClass(estado) {
    switch (estado.toLowerCase()) {
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
  $$payload.out += `<div class="telegram-webapp svelte-1aknmgi"><header class="header svelte-1aknmgi"><div class="header-content svelte-1aknmgi"><button class="btn-back svelte-1aknmgi" aria-label="Volver"><span class="back-icon svelte-1aknmgi">←</span></button> <div class="title-container svelte-1aknmgi">`;
  LogoJano($$payload, { size: "small", animated: false });
  $$payload.out += `<!----> <h2 class="page-subtitle svelte-1aknmgi">Listado de Cajas</h2></div></div></header> <div class="filtros bg-white p-4 rounded-lg shadow mb-4 svelte-1aknmgi"><div class="grid grid-cols-1 md:grid-cols-4 gap-4 svelte-1aknmgi"><div class="svelte-1aknmgi"><label for="vendedor-input" class="block text-sm font-medium text-gray-700 mb-1 svelte-1aknmgi">Vendedor</label> <select id="vendedor-input" class="w-full p-2 border rounded svelte-1aknmgi"><option value="" class="svelte-1aknmgi">Todos los vendedores</option><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let vendedor = each_array[$$index];
    $$payload.out += `<option${attr("value", vendedor.Codigo)} class="svelte-1aknmgi">${escape_html(vendedor.Descripcion)}</option>`;
  }
  $$payload.out += `<!--]--></select></div> <div class="svelte-1aknmgi"><label for="estado-select" class="block text-sm font-medium text-gray-700 mb-1 svelte-1aknmgi">Estado</label> <select id="estado-select" class="w-full p-2 border rounded svelte-1aknmgi"><option value="" class="svelte-1aknmgi">Todos</option><option value="abierta" class="svelte-1aknmgi">Abierta</option><option value="cerrada" class="svelte-1aknmgi">Cerrada</option><option value="en_arqueo" class="svelte-1aknmgi">En Arqueo</option></select></div> <div class="svelte-1aknmgi"><label for="fecha-desde" class="block text-sm font-medium text-gray-700 mb-1 svelte-1aknmgi">Desde</label> <input id="fecha-desde" type="date"${attr("value", fechaDesde)} class="w-full p-2 border rounded svelte-1aknmgi"></div> <div class="svelte-1aknmgi"><label for="fecha-hasta" class="block text-sm font-medium text-gray-700 mb-1 svelte-1aknmgi">Hasta</label> <input id="fecha-hasta" type="date"${attr("value", fechaHasta)} class="w-full p-2 border rounded svelte-1aknmgi"></div></div> <button class="mt-4 w-full bg-blue-500 text-white p-2 rounded svelte-1aknmgi">Aplicar Filtros</button></div> `;
  if (cajas.length === 0) {
    $$payload.out += "<!--[2-->";
    $$payload.out += `<div class="text-center p-4 svelte-1aknmgi">No se encontraron cajas</div>`;
  } else {
    $$payload.out += "<!--[!-->";
    const each_array_1 = ensure_array_like(cajas);
    $$payload.out += `<div class="cajas-list space-y-4 svelte-1aknmgi"><!--[-->`;
    for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
      let caja = each_array_1[$$index_2];
      $$payload.out += `<div class="caja bg-white p-4 rounded-lg shadow svelte-1aknmgi"><div class="grid grid-cols-2 gap-4 mb-4 svelte-1aknmgi"><div class="svelte-1aknmgi"><div class="text-sm text-gray-600 svelte-1aknmgi">Vendedor</div> <div class="font-medium svelte-1aknmgi">${escape_html(obtenerNombreVendedor(caja.Vendedor.Codigo))}</div></div> <div class="text-right svelte-1aknmgi"><div class="text-sm text-gray-600 svelte-1aknmgi">Estado</div> <span${attr_class(`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stringify(getEstadoClass(caja.Estado))}`, "svelte-1aknmgi")}>${escape_html(caja.Estado)}</span></div></div> <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 svelte-1aknmgi"><div class="svelte-1aknmgi"><div class="text-sm text-gray-600 svelte-1aknmgi">Apertura</div> <div class="font-medium svelte-1aknmgi">${escape_html(formatearFecha(caja.Apertura))}</div></div> <div class="svelte-1aknmgi"><div class="text-sm text-gray-600 svelte-1aknmgi">Cierre</div> <div class="font-medium svelte-1aknmgi">${escape_html(caja.Cierre ? formatearFecha(caja.Cierre) : "-")}</div></div> <div class="svelte-1aknmgi"><div class="text-sm text-gray-600 svelte-1aknmgi">Saldo Inicial</div> <div class="font-medium svelte-1aknmgi">$${escape_html(formatearMonto(caja.SaldoInicial))}</div></div> <div class="svelte-1aknmgi"><div class="text-sm text-gray-600 svelte-1aknmgi">Saldo ${escape_html(caja.Estado === "cerrada" ? "Final" : "Actual")}</div> <div class="font-medium svelte-1aknmgi">$${escape_html(formatearMonto(caja.Estado === "cerrada" ? caja.SaldoCierre : caja.SaldoTeorico))}</div></div></div> `;
      if (caja.Arqueos && caja.Arqueos.length > 0) {
        $$payload.out += "<!--[-->";
        const each_array_2 = ensure_array_like(caja.Arqueos);
        $$payload.out += `<div class="mt-4 svelte-1aknmgi"><h4 class="font-medium mb-2 svelte-1aknmgi">Arqueos</h4> <div class="overflow-x-auto svelte-1aknmgi"><table class="min-w-full svelte-1aknmgi"><thead class="svelte-1aknmgi"><tr class="bg-gray-50 svelte-1aknmgi"><th class="px-4 py-2 text-left svelte-1aknmgi">Método</th><th class="px-4 py-2 text-right svelte-1aknmgi">Sistema</th><th class="px-4 py-2 text-right svelte-1aknmgi">Contado</th><th class="px-4 py-2 text-right svelte-1aknmgi">Diferencia</th></tr></thead><tbody class="svelte-1aknmgi"><!--[-->`;
        for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
          let arqueo = each_array_2[$$index_1];
          $$payload.out += `<tr class="border-t svelte-1aknmgi"><td class="px-4 py-2 svelte-1aknmgi">${escape_html(arqueo.MetodoPago)}</td><td class="px-4 py-2 text-right svelte-1aknmgi">$${escape_html(formatearMonto(arqueo.MontoSistema))}</td><td class="px-4 py-2 text-right svelte-1aknmgi">$${escape_html(formatearMonto(arqueo.MontoContado))}</td><td${attr_class("px-4 py-2 text-right svelte-1aknmgi", void 0, {
            "text-red-600": arqueo.Diferencia < 0,
            "text-green-600": arqueo.Diferencia > 0
          })}>$${escape_html(formatearMonto(arqueo.Diferencia))}</td></tr>`;
        }
        $$payload.out += `<!--]--></tbody></table></div></div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (caja.Observaciones) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="mt-4 svelte-1aknmgi"><div class="text-sm text-gray-600 svelte-1aknmgi">Observaciones</div> <div class="mt-1 text-gray-700 svelte-1aknmgi">${escape_html(caja.Observaciones)}</div></div>`;
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
