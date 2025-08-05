import { n as copy_payload, o as assign_payload, c as pop, p as push, j as attr, g as ensure_array_like, e as escape_html, k as attr_class } from "../../../../../../chunks/index3.js";
import "../../../../../../chunks/client.js";
import "../../../../../../chunks/authStore.js";
import { F as FormasPago } from "../../../../../../chunks/FormasPago.js";
/* empty css                           */
import { L as LogoJano } from "../../../../../../chunks/LogoJano.js";
function _page($$payload, $$props) {
  push();
  let clientesOptions = [];
  let clienteSearch = "";
  let documentosDeuda = [];
  let documentosSeleccionados = [];
  let importeTotalPagar = 0;
  let formasPago = [];
  let importeTotalFormasPago = 0;
  let saldoPendiente = 0;
  ({
    Fecha: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
  });
  function getDocumentoKey(doc) {
    return `${doc.DocumentoTipo}-${doc.DocumentoSucursal}-${doc.DocumentoNumero}`;
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out += `<!----># Nuevo archivo <div class="telegram-webapp svelte-1e0adfu"><header class="header svelte-1e0adfu"><div class="header-content svelte-1e0adfu"><button class="btn-back svelte-1e0adfu" aria-label="Volver"><span class="back-icon svelte-1e0adfu">←</span></button> <div class="title-container svelte-1e0adfu">`;
    LogoJano($$payload2, { size: "small", animated: false });
    $$payload2.out += `<!----> <h2 class="page-subtitle svelte-1e0adfu">Nuevo Recibo</h2></div></div></header> <div class="content svelte-1e0adfu">`;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> <div class="section svelte-1e0adfu"><label for="cliente-search" class="svelte-1e0adfu">Cliente</label> <div class="search-container svelte-1e0adfu"><input id="cliente-search" type="text"${attr("value", clienteSearch)} placeholder="Buscar cliente..." class="input-field svelte-1e0adfu"> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div> `;
    if (clientesOptions.length > 0) {
      $$payload2.out += "<!--[-->";
      const each_array = ensure_array_like(clientesOptions);
      $$payload2.out += `<div class="search-results svelte-1e0adfu"><!--[-->`;
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let cliente = each_array[$$index];
        $$payload2.out += `<button class="cliente-option svelte-1e0adfu"><div class="cliente-nombre svelte-1e0adfu">${escape_html(cliente.Descripcion)}</div> <div class="cliente-info svelte-1e0adfu"><span class="svelte-1e0adfu">Código: ${escape_html(cliente.Codigo)}</span> `;
        if (cliente.ImporteDeuda !== void 0) {
          $$payload2.out += "<!--[-->";
          $$payload2.out += `<span class="svelte-1e0adfu">Deuda: $${escape_html(cliente.ImporteDeuda.toFixed(2))}</span>`;
        } else {
          $$payload2.out += "<!--[!-->";
        }
        $$payload2.out += `<!--]--></div></button>`;
      }
      $$payload2.out += `<!--]--></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div> `;
    if (documentosDeuda.length > 0) {
      $$payload2.out += "<!--[1-->";
      const each_array_1 = ensure_array_like(documentosDeuda);
      $$payload2.out += `<div class="section svelte-1e0adfu"><h3 class="svelte-1e0adfu">Documentos a Pagar</h3> <div class="documentos-lista svelte-1e0adfu"><!--[-->`;
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let doc = each_array_1[$$index_1];
        const key = getDocumentoKey(doc);
        const isSelected = documentosSeleccionados.some((d) => getDocumentoKey(d) === key);
        $$payload2.out += `<button${attr_class("documento-item svelte-1e0adfu", void 0, { "selected": isSelected })}><div class="documento-info svelte-1e0adfu"><div class="documento-tipo svelte-1e0adfu">${escape_html(doc.DocumentoTipo)}-${escape_html(doc.DocumentoSucursal)}-${escape_html(doc.DocumentoNumero)}</div> <div class="documento-fecha svelte-1e0adfu">${escape_html(new Date(doc.Fecha).toLocaleDateString())}</div></div> <div class="documento-importes svelte-1e0adfu"><div class="importe-total svelte-1e0adfu">Total: $${escape_html(doc.ImporteTotal.toFixed(2))}</div> <div class="importe-pendiente svelte-1e0adfu">Pendiente: $${escape_html((doc.ImporteTotal - (doc.ImportePagado || 0)).toFixed(2))}</div></div></button>`;
      }
      $$payload2.out += `<!--]--></div></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    if (documentosSeleccionados.length > 0) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<div class="section svelte-1e0adfu">`;
      FormasPago($$payload2, {
        incluirFormasAplicaSaldo: false,
        get formasPago() {
          return formasPago;
        },
        set formasPago($$value) {
          formasPago = $$value;
          $$settled = false;
        },
        get importeTotalFormasPago() {
          return importeTotalFormasPago;
        },
        set importeTotalFormasPago($$value) {
          importeTotalFormasPago = $$value;
          $$settled = false;
        },
        get saldoPendiente() {
          return saldoPendiente;
        },
        set saldoPendiente($$value) {
          saldoPendiente = $$value;
          $$settled = false;
        }
      });
      $$payload2.out += `<!----></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    if (documentosSeleccionados.length > 0) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<div class="section resumen svelte-1e0adfu"><h3 class="svelte-1e0adfu">Resumen</h3> <div class="resumen-item svelte-1e0adfu"><span class="svelte-1e0adfu">Total a Pagar:</span> <span class="importe svelte-1e0adfu">$${escape_html(importeTotalPagar.toFixed(2))}</span></div> <div class="resumen-item svelte-1e0adfu"><span class="svelte-1e0adfu">Total Formas de Pago:</span> <span class="importe svelte-1e0adfu">$${escape_html(importeTotalFormasPago.toFixed(2))}</span></div> <div class="resumen-item saldo svelte-1e0adfu"><span class="svelte-1e0adfu">Saldo Pendiente:</span> <span${attr_class("importe svelte-1e0adfu", void 0, { "negativo": saldoPendiente > 0 })}>$${escape_html(saldoPendiente.toFixed(2))}</span></div></div> <button class="btn-grabar svelte-1e0adfu"${attr("disabled", saldoPendiente > 0, true)}>${escape_html("Grabar Recibo")}</button>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div></div>`;
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  pop();
}
export {
  _page as default
};
