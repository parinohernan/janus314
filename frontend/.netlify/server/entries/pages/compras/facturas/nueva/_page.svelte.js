import { l as ensure_array_like, h as head, k as attr, e as escape_html, c as pop, p as push } from "../../../../../chunks/index3.js";
import "../../../../../chunks/client.js";
import "../../../../../chunks/navigationState.js";
import { B as Button } from "../../../../../chunks/Button.js";
import "../../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  const hoy = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  let loading = false;
  let proveedoresBusqueda = "";
  let formasPago = [];
  let compra = {
    DocumentoTipo: "",
    DocumentoSucursal: "01",
    DocumentoNumero: "",
    Fecha: hoy,
    FechaDePago: "",
    ImporteBruto: 0,
    ImporteBonificado: 0,
    ImporteNeto: 0,
    ImporteAdicional: 0,
    ImporteIva1: 0,
    ImporteIva2: 0,
    Percepcion: 0,
    IngresosBrutos: 0,
    OtrosImpuestos1: 0,
    OtrosImpuestos2: 0,
    OtrosImpuestos3: 0,
    ImporteTotal: 0,
    ImportePagado: 0,
    Observacion: "",
    RemitoNro: "",
    OrdenCompraNro: ""
  };
  const fmt = (n) => n.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const each_array_1 = ensure_array_like(formasPago);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Nueva factura de compra</title>`;
  });
  $$payload.out += `<div class="container mx-auto px-4 py-8"><div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold text-gray-800">Nueva factura de compra</h1> <div class="flex space-x-2">`;
  Button($$payload, {
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Cancelar`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  Button($$payload, {
    variant: "primary",
    disabled: loading,
    children: ($$payload2) => {
      $$payload2.out += `<!---->${escape_html("Guardar factura")}`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><strong>Próximamente:</strong> carga de factura por PDF/imagen con IA (OCR). Los ítems de la factura se podrán cargar en un próximo sprint.</div> <div class="bg-white p-6 rounded-lg shadow-md mb-6"><h2 class="text-xl font-semibold mb-4">Datos de la factura</h2> <p class="text-sm text-gray-500 mb-4">Tipo, sucursal y número son los del comprobante que recibió del proveedor (ej. factura, NC, etc.).</p> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-4"><div class="relative lg:col-span-3"><label for="proveedor" class="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label> <input type="text" id="proveedor" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Buscar proveedor..."${attr("value", proveedoresBusqueda)} autocomplete="off"> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> <div class="lg:col-span-1"><label for="documentoTipo" class="block text-sm font-medium text-gray-700 mb-1">Tipo comprobante *</label> <input id="documentoTipo" type="text"${attr("value", compra.DocumentoTipo)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Ej. FCA, FCB, N/D" maxlength="3"></div> <div class="lg:col-span-1"><label for="documentoSucursal" class="block text-sm font-medium text-gray-700 mb-1">Sucursal</label> <input id="documentoSucursal" type="text"${attr("value", compra.DocumentoSucursal)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="01" maxlength="4"></div> <div class="lg:col-span-1"><label for="documentoNumero" class="block text-sm font-medium text-gray-700 mb-1">Número *</label> <input id="documentoNumero" type="text"${attr("value", compra.DocumentoNumero)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Nº del comprobante"></div> <div class="lg:col-span-2"><label for="tipoPago" class="block text-sm font-medium text-gray-700 mb-1">Forma de pago</label> <select id="tipoPago" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"><option value="">Seleccionar</option><!--[-->`;
  for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
    let fp = each_array_1[$$index_1];
    $$payload.out += `<option${attr("value", fp.value)}>${escape_html(fp.label)}</option>`;
  }
  $$payload.out += `<!--]--></select></div> <div class="lg:col-span-2"><label for="fecha" class="block text-sm font-medium text-gray-700 mb-1">Fecha *</label> <input id="fecha" type="date"${attr("value", compra.Fecha)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"></div> <div class="lg:col-span-2"><label for="fechaPago" class="block text-sm font-medium text-gray-700 mb-1">Fecha de pago</label> <input id="fechaPago" type="date"${attr("value", compra.FechaDePago)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"></div></div> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-4"><div class="lg:col-span-3"><label for="remito" class="block text-sm font-medium text-gray-700 mb-1">Nº remito</label> <input id="remito" type="text"${attr("value", compra.RemitoNro)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Opcional"></div> <div class="lg:col-span-3"><label for="ordenCompra" class="block text-sm font-medium text-gray-700 mb-1">Nº orden de compra</label> <input id="ordenCompra" type="text"${attr("value", compra.OrdenCompraNro)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Opcional"></div> <div class="lg:col-span-6"><label for="observacion" class="block text-sm font-medium text-gray-700 mb-1">Observación</label> <input id="observacion" type="text"${attr("value", compra.Observacion)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Opcional"></div></div></div> <div class="bg-white rounded-lg shadow-sm p-6 mb-6"><h2 class="text-lg font-semibold mb-4">Importes</h2> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4"><div><label for="importeBruto" class="block text-sm font-medium text-gray-700 mb-1">Importe bruto</label> <input id="importeBruto" type="number" step="0.01" min="0"${attr("value", compra.ImporteBruto)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"></div> <div><label for="importeBonificado" class="block text-sm font-medium text-gray-700 mb-1">Importe bonificado</label> <input id="importeBonificado" type="number" step="0.01" min="0"${attr("value", compra.ImporteBonificado)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"></div> <div><label for="importeNeto" class="block text-sm font-medium text-gray-700 mb-1">Importe neto</label> <input id="importeNeto" type="number" step="0.01" min="0"${attr("value", compra.ImporteNeto)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"></div> <div><label for="importeAdicional" class="block text-sm font-medium text-gray-700 mb-1">Importe adicional</label> <input id="importeAdicional" type="number" step="0.01" min="0"${attr("value", compra.ImporteAdicional)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"></div> <div><label for="importeIva1" class="block text-sm font-medium text-gray-700 mb-1">Importe IVA 1</label> <input id="importeIva1" type="number" step="0.01" min="0"${attr("value", compra.ImporteIva1)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"></div> <div><label for="importeIva2" class="block text-sm font-medium text-gray-700 mb-1">Importe IVA 2</label> <input id="importeIva2" type="number" step="0.01" min="0"${attr("value", compra.ImporteIva2)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"></div> <div><label for="percepcion" class="block text-sm font-medium text-gray-700 mb-1">Percepción</label> <input id="percepcion" type="number" step="0.01" min="0"${attr("value", compra.Percepcion)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"></div> <div><label for="ingresosBrutos" class="block text-sm font-medium text-gray-700 mb-1">Ingresos brutos</label> <input id="ingresosBrutos" type="number" step="0.01" min="0"${attr("value", compra.IngresosBrutos)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"></div> <div><label for="otros1" class="block text-sm font-medium text-gray-700 mb-1">Otros impuestos 1</label> <input id="otros1" type="number" step="0.01" min="0"${attr("value", compra.OtrosImpuestos1)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"></div> <div><label for="otros2" class="block text-sm font-medium text-gray-700 mb-1">Otros impuestos 2</label> <input id="otros2" type="number" step="0.01" min="0"${attr("value", compra.OtrosImpuestos2)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"></div> <div><label for="otros3" class="block text-sm font-medium text-gray-700 mb-1">Otros impuestos 3</label> <input id="otros3" type="number" step="0.01" min="0"${attr("value", compra.OtrosImpuestos3)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"></div></div> <div class="flex justify-end pt-4 border-t border-gray-200"><div class="w-80 space-y-2"><div class="flex justify-between text-sm"><span class="font-medium text-gray-700">Importe total *</span> <input type="number" step="0.01" min="0"${attr("value", compra.ImporteTotal)} class="w-32 px-2 py-1 text-right border border-gray-300 rounded"></div> <div class="flex justify-between text-sm"><span class="font-medium text-gray-700">Importe pagado</span> <input type="number" step="0.01" min="0"${attr("value", compra.ImportePagado)} class="w-32 px-2 py-1 text-right border border-gray-300 rounded"></div> <div class="flex justify-between text-lg font-bold pt-2 border-t border-gray-200"><span>Total:</span> <span>$${escape_html(fmt(compra.ImporteTotal))}</span></div></div></div></div> <p class="text-sm text-gray-500">Los ítems de la factura (detalle por artículo) se podrán cargar en un próximo sprint.</p></div>`;
  pop();
}
export {
  _page as default
};
