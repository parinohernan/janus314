import { e as escape_html, k as attr_class, l as stringify, g as ensure_array_like, x as bind_props, c as pop, p as push } from "../../../../../../../chunks/index3.js";
import "../../../../../../../chunks/client.js";
/* empty css                              */
import { B as Breadcrumbs } from "../../../../../../../chunks/index4.js";
import "clsx";
import "../../../../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  let data = $$props["data"];
  let cliente = data.cliente || {};
  let saldoActual = data.cliente.ImporteDeuda || 0;
  let ultimasFacturas = [];
  function formatearMonto(valor) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2
    }).format(valor);
  }
  function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString("es-AR");
  }
  $$payload.out += `<div class="detalle-cliente-container svelte-agvjtd">`;
  Breadcrumbs($$payload, {});
  $$payload.out += `<!----> <header class="header svelte-agvjtd"><div class="header-title svelte-agvjtd"><h1 class="svelte-agvjtd">Detalles del Cliente</h1> <div class="cliente-code svelte-agvjtd">Código: ${escape_html(cliente.Codigo)}</div></div> <div class="header-actions svelte-agvjtd"><button class="btn-back svelte-agvjtd" aria-label="Volver al listado"><span class="icon svelte-agvjtd">←</span> <span class="label">Volver</span></button> <button class="btn-edit svelte-agvjtd" aria-label="Editar cliente"><span class="icon svelte-agvjtd">✏️</span> <span class="label">Editar</span></button></div></header> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="cliente-details svelte-agvjtd"><section class="detail-section svelte-agvjtd"><h2 class="svelte-agvjtd">Información General</h2> <div class="detail-grid svelte-agvjtd"><div class="detail-item svelte-agvjtd"><div class="detail-label svelte-agvjtd">Nombre/Razón Social</div> <div class="detail-value svelte-agvjtd">${escape_html(cliente.Descripcion || "No disponible")}</div></div> <div class="detail-item svelte-agvjtd"><div class="detail-label svelte-agvjtd">CUIT/DNI</div> <div class="detail-value svelte-agvjtd">${escape_html(cliente.Cuit || "No especificado")}</div></div> <div class="detail-item svelte-agvjtd"><div class="detail-label svelte-agvjtd">Teléfono</div> <div class="detail-value svelte-agvjtd">${escape_html(cliente.Telefono || "No especificado")}</div></div> <div class="detail-item svelte-agvjtd"><div class="detail-label svelte-agvjtd">Email</div> <div class="detail-value svelte-agvjtd">${escape_html(cliente.Email || "No especificado")}</div></div> <div class="detail-item svelte-agvjtd"><div class="detail-label svelte-agvjtd">Estado</div> <div class="detail-value svelte-agvjtd"><span${attr_class(`status-indicator ${stringify(cliente.Activo ? "active" : "inactive")}`, "svelte-agvjtd")}>${escape_html(cliente.Activo ? "Activo" : "Inactivo")}</span></div></div></div></section> <section class="detail-section svelte-agvjtd"><h2 class="svelte-agvjtd">Cuenta Corriente</h2> <div class="detail-grid svelte-agvjtd"><div class="detail-item svelte-agvjtd"><div class="detail-label svelte-agvjtd">Saldo Actual</div> <div${attr_class(`detail-value saldo-level ${stringify(saldoActual > 0 ? "positivo" : "negativo")}`, "svelte-agvjtd")}>${escape_html(formatearMonto(saldoActual))}</div></div> <div class="detail-item svelte-agvjtd"><div class="detail-label svelte-agvjtd">Límite de Crédito</div> <div class="detail-value svelte-agvjtd">${escape_html(formatearMonto(cliente.LimiteCredito || 0))}</div></div> <div class="detail-item svelte-agvjtd"><div class="detail-label svelte-agvjtd">Condición IVA</div> <div class="detail-value svelte-agvjtd">${escape_html(cliente.CondicionIva || "No especificada")}</div></div></div></section> <section class="detail-section svelte-agvjtd"><h2 class="svelte-agvjtd">Últimos Comprobantes</h2> `;
  if (ultimasFacturas.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(ultimasFacturas);
    $$payload.out += `<div class="facturas-list svelte-agvjtd"><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let comprobante = each_array[$$index];
      $$payload.out += `<div class="factura-item svelte-agvjtd"><div class="factura-info svelte-agvjtd"><div class="factura-numero svelte-agvjtd">${escape_html(comprobante.Detalle)}</div> <div class="factura-fecha svelte-agvjtd">${escape_html(formatearFecha(comprobante.Fecha))}</div></div> <div class="factura-montos svelte-agvjtd"><div class="monto-debito svelte-agvjtd">${escape_html(formatearMonto(comprobante.Debitos))}</div> <div${attr_class("monto-credito svelte-agvjtd", void 0, { "negativo": comprobante.Creditos < 0 })}>${escape_html(formatearMonto(comprobante.Creditos))}</div></div></div>`;
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<p class="no-data svelte-agvjtd">No hay comprobantes recientes</p>`;
  }
  $$payload.out += `<!--]--></section></div></div>`;
  bind_props($$props, { data });
  pop();
}
export {
  _page as default
};
