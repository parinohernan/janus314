import { d as store_get, h as head, e as escape_html, g as ensure_array_like, j as attr, u as unsubscribe_stores, c as pop, p as push } from "../../../../../chunks/index3.js";
import { p as page } from "../../../../../chunks/stores.js";
import "../../../../../chunks/client.js";
import { B as Button } from "../../../../../chunks/Button.js";
import "../../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let isEditing = store_get($$store_subs ??= {}, "$page", page).params.id !== "nuevo";
  let proveedor = {
    Codigo: "",
    Descripcion: "",
    Cuit: "",
    Calle: "",
    Numero: "",
    Piso: "",
    Departamento: "",
    Telefono: "",
    Mail: "",
    ContactoComercial: "",
    ImporteDeuda: 0,
    SaldoNTCNoAplicado: 0,
    retenciones_generales_codigo: "",
    CondicionVentaCodigo: "",
    ProveedorTipoCodigo: "",
    InvCuentaCompras: null
  };
  let codigosPostales = [];
  let loading = false;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(isEditing ? "Editar" : "Nuevo")} Proveedor</title>`;
  });
  $$payload.out += `<div class="container mx-auto p-4"><div class="bg-white p-6 rounded-lg shadow-md"><div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">${escape_html(isEditing ? "Editar" : "Nuevo")} Proveedor</h1> `;
  Button($$payload, {
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Volver al listado`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div> `;
  {
    $$payload.out += "<!--[!-->";
    const each_array = ensure_array_like(codigosPostales);
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <form><div class="space-y-6"><div><h2 class="text-lg font-medium mb-3 text-gray-800 border-b pb-2">Datos principales</h2> <div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label for="codigo" class="block text-sm font-medium text-gray-700 mb-1">Código *</label> <input type="text" id="codigo"${attr("value", proveedor.Codigo)} required${attr("disabled", isEditing, true)} maxlength="8" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"></div> <div><label for="descripcion" class="block text-sm font-medium text-gray-700 mb-1">Descripción *</label> <input type="text" id="descripcion"${attr("value", proveedor.Descripcion)} required maxlength="50" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="cuit" class="block text-sm font-medium text-gray-700 mb-1">CUIT</label> <input type="text" id="cuit"${attr("value", proveedor.Cuit)} maxlength="11" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div></div></div> <div><h2 class="text-lg font-medium mb-3 text-gray-800 border-b pb-2">Dirección</h2> <div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label for="calle" class="block text-sm font-medium text-gray-700 mb-1">Calle</label> <input type="text" id="calle"${attr("value", proveedor.Calle)} maxlength="50" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="numero" class="block text-sm font-medium text-gray-700 mb-1">Número</label> <input type="text" id="numero"${attr("value", proveedor.Numero)} maxlength="15" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="piso" class="block text-sm font-medium text-gray-700 mb-1">Piso</label> <input type="text" id="piso"${attr("value", proveedor.Piso)} maxlength="10" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="departamento" class="block text-sm font-medium text-gray-700 mb-1">Departamento</label> <input type="text" id="departamento"${attr("value", proveedor.Departamento)} maxlength="10" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="codigoPostal" class="block text-sm font-medium text-gray-700 mb-1">Código Postal</label> <select id="codigoPostal" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Seleccione localidad</option><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let cp = each_array[$$index];
      $$payload.out += `<option${attr("value", cp.Codigo)}>${escape_html(cp.Descripcion)} (${escape_html(cp.Codigo)})</option>`;
    }
    $$payload.out += `<!--]--></select></div></div></div> <div><h2 class="text-lg font-medium mb-3 text-gray-800 border-b pb-2">Contacto</h2> <div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label for="telefono" class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label> <input type="text" id="telefono"${attr("value", proveedor.Telefono)} maxlength="50" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="mail" class="block text-sm font-medium text-gray-700 mb-1">Email</label> <input type="email" id="mail"${attr("value", proveedor.Mail)} maxlength="50" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="contactoComercial" class="block text-sm font-medium text-gray-700 mb-1">Contacto Comercial</label> <input type="text" id="contactoComercial"${attr("value", proveedor.ContactoComercial)} maxlength="50" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div></div></div> <div class="space-y-4"><h2 class="text-lg font-semibold border-b pb-2">Datos comerciales</h2> <div class="grid grid-cols-2 gap-4"><div><label for="importeDeuda" class="block text-sm font-medium text-gray-700 mb-1">Importe Deuda</label> <input type="number" id="importeDeuda"${attr("value", proveedor.ImporteDeuda)} step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="saldoNTC" class="block text-sm font-medium text-gray-700 mb-1">Saldo NTC No Aplicado</label> <input type="number" id="saldoNTC"${attr("value", proveedor.SaldoNTCNoAplicado)} step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div></div> <div class="grid grid-cols-2 gap-4"><div><label for="retencionesGenerales" class="block text-sm font-medium text-gray-700 mb-1">Código Retención General</label> <input type="text" id="retencionesGenerales"${attr("value", proveedor.retenciones_generales_codigo)} maxlength="2" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="condicionVenta" class="block text-sm font-medium text-gray-700 mb-1">Condición Venta Código</label> <input type="text" id="condicionVenta"${attr("value", proveedor.CondicionVentaCodigo)} maxlength="2" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div></div> <div class="grid grid-cols-2 gap-4"><div><label for="proveedorTipo" class="block text-sm font-medium text-gray-700 mb-1">Proveedor Tipo Código</label> <input type="text" id="proveedorTipo"${attr("value", proveedor.ProveedorTipoCodigo)} maxlength="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="cuentaCompras" class="block text-sm font-medium text-gray-700 mb-1">Cuenta Compras</label> <input type="number" id="cuentaCompras"${attr("value", proveedor.InvCuentaCompras)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div></div> <div><label for="enviado" class="block text-sm font-medium text-gray-700 mb-1">Enviado</label> <select id="enviado" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option${attr("value", 0)}>No</option><option${attr("value", 1)}>Sí</option></select></div></div></div> <div class="flex justify-between pt-4">`;
    Button($$payload, {
      variant: "secondary",
      type: "button",
      disabled: loading,
      children: ($$payload2) => {
        $$payload2.out += `<!---->Cancelar`;
      },
      $$slots: { default: true }
    });
    $$payload.out += `<!----> `;
    Button($$payload, {
      variant: "primary",
      type: "submit",
      disabled: loading,
      children: ($$payload2) => {
        $$payload2.out += `<!---->${escape_html("Guardar")}`;
      },
      $$slots: { default: true }
    });
    $$payload.out += `<!----></div></form>`;
  }
  $$payload.out += `<!--]--></div></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
