import { n as copy_payload, o as assign_payload, c as pop, p as push, j as attr, g as ensure_array_like, e as escape_html, k as attr_class, l as stringify } from "../../../../../chunks/index3.js";
import { o as onDestroy } from "../../../../../chunks/index-server.js";
import { B as Button } from "../../../../../chunks/Button.js";
import { I as Input } from "../../../../../chunks/Input.js";
import { a as auth } from "../../../../../chunks/authStore.js";
import { F as FormasPago } from "../../../../../chunks/FormasPago.js";
import "../../../../../chunks/client.js";
function _page($$payload, $$props) {
  push();
  let importeTotalRecibo;
  let loading = false;
  let unsubscribe = auth.subscribe((state) => {
    if (state.user) {
      state.user.usuario || "1";
    }
  });
  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
  let clientesOptions = [];
  let clienteSearch = "";
  let documentosSeleccionados = [];
  let importeTotalPagar = 0;
  let formasPago = [];
  let importeTotalFormasPago = 0;
  let saldoPendiente = 0;
  let documentosCreditoSeleccionados = [];
  let importeTotalCredito = 0;
  const hoy = /* @__PURE__ */ new Date();
  hoy.setHours(hoy.getHours() - 3);
  const fechaFormateada = hoy.toISOString().substring(0, 10);
  let recibo = {
    DocumentoTipo: "RCF",
    Fecha: fechaFormateada
  };
  new Map(documentosSeleccionados.map((doc) => [
    `${doc.DocumentoTipo}-${doc.DocumentoSucursal}-${doc.DocumentoNumero}`,
    true
  ]));
  new Map(documentosCreditoSeleccionados.map((doc) => [doc.documento, true]));
  importeTotalRecibo = importeTotalPagar - importeTotalCredito;
  saldoPendiente = importeTotalPagar - importeTotalCredito - importeTotalFormasPago;
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out += `<div class="container mx-auto px-4 py-8"><div class="max-w-4xl mx-auto"><h1 class="text-2xl font-bold mb-6">Nuevo Recibo</h1> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> <div class="bg-white rounded-lg shadow-sm p-6"><div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="md:col-span-1"><label for="cliente" class="block text-sm font-medium text-gray-700 mb-1">Cliente</label> <div class="relative"><input id="cliente-search" type="text" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pr-10" placeholder="Buscar cliente..."${attr("value", clienteSearch)} autocomplete="off"> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div> `;
    if (clientesOptions.length > 0) {
      $$payload2.out += "<!--[-->";
      const each_array = ensure_array_like(clientesOptions);
      $$payload2.out += `<div class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto"><!--[-->`;
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let cliente = each_array[$$index];
        $$payload2.out += `<button type="button" class="block w-full text-left px-4 py-2 hover:bg-gray-100"><div class="font-medium">${escape_html(cliente.Descripcion)}</div> <div class="text-sm text-gray-500"><span>Código: ${escape_html(cliente.Codigo)}</span> `;
        if (cliente.ImporteDeuda !== void 0) {
          $$payload2.out += "<!--[-->";
          $$payload2.out += `<span class="ml-2">Deuda: $${escape_html(cliente.ImporteDeuda.toFixed(2))}</span>`;
        } else {
          $$payload2.out += "<!--[!-->";
        }
        $$payload2.out += `<!--]--> `;
        if (cliente.ListaPrecio) {
          $$payload2.out += "<!--[-->";
          $$payload2.out += `<span class="ml-2">Lista: ${escape_html(cliente.ListaPrecio)}</span>`;
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
    $$payload2.out += `<!--]--></div> <div class="md:col-span-1"><div class="grid grid-cols-3 gap-4"><div><label for="tipo" class="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label> `;
    Input($$payload2, {
      id: "tipo",
      value: recibo.DocumentoTipo,
      disabled: true,
      className: "bg-gray-100"
    });
    $$payload2.out += `<!----></div> <div><label for="numero" class="block text-sm font-medium text-gray-700 mb-1">Número</label> `;
    Input($$payload2, {
      id: "numero",
      value: "Cargando...",
      disabled: true,
      className: "bg-gray-100"
    });
    $$payload2.out += `<!----></div> <div><label for="fecha" class="block text-sm font-medium text-gray-700 mb-1">Fecha</label> `;
    Input($$payload2, {
      id: "fecha",
      type: "date",
      value: recibo.Fecha
    });
    $$payload2.out += `<!----></div></div></div></div> <div class="mt-6 border-t pt-6"><div class="flex justify-between items-center mb-2"><h3 class="text-lg font-medium text-gray-900">Documentos de Deuda</h3> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div> `;
    {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<div class="h-20 flex items-center justify-center bg-gray-100 rounded"><span class="text-gray-500">No hay documentos de deuda para este cliente</span></div>`;
    }
    $$payload2.out += `<!--]--></div> <div class="mt-6 border-t pt-6"><div class="flex justify-between items-center mb-2"><h3 class="text-lg font-medium text-gray-900">Documentos de Crédito</h3> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div> `;
    {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<div class="h-20 flex items-center justify-center bg-gray-100 rounded"><span class="text-gray-500">No hay documentos de crédito para este cliente</span></div>`;
    }
    $$payload2.out += `<!--]--></div>  `;
    FormasPago($$payload2, {
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
    $$payload2.out += `<!---->  <div class="mt-6 border-t pt-6"><h3 class="text-lg font-medium text-gray-900 mb-4">Resumen de Totales</h3> <div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="bg-gray-50 p-4 rounded-md"><div class="flex justify-between mb-2"><span class="text-sm font-medium text-gray-700">Total Documentos de Deuda:</span> <span class="text-sm font-medium text-red-600">$${escape_html(importeTotalPagar.toFixed(2))}</span></div> <div class="flex justify-between mb-2"><span class="text-sm font-medium text-gray-700">Total Documentos de Crédito:</span> <span class="text-sm font-medium text-blue-600">-$${escape_html(importeTotalCredito.toFixed(2))}</span></div> <div class="flex justify-between mb-2"><span class="text-sm font-medium text-gray-700">Total Formas de Pago:</span> <span class="text-sm font-medium text-green-600">-$${escape_html(importeTotalFormasPago.toFixed(2))}</span></div> <div class="flex justify-between pt-2 border-t"><span class="text-sm font-medium text-gray-700">Total a Pagar:</span> <span class="text-sm font-medium text-red-600">$${escape_html(importeTotalRecibo.toFixed(2))}</span></div> <div class="flex justify-between"><span class="text-sm font-medium text-gray-900">Saldo Pendiente:</span> <span${attr_class(`text-sm font-medium ${stringify(saldoPendiente > 0 ? "text-red-600" : "text-green-600")}`)}>$${escape_html(saldoPendiente.toFixed(2))}</span></div></div></div></div>  <div class="mt-6 flex justify-end gap-3">`;
    Button($$payload2, {
      variant: "secondary",
      disabled: loading,
      children: ($$payload3) => {
        $$payload3.out += `<!---->Cancelar`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----> `;
    Button($$payload2, {
      variant: "primary",
      disabled: loading,
      children: ($$payload3) => {
        $$payload3.out += `<!---->${escape_html("Grabar")}`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----></div> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div></div></div>`;
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
