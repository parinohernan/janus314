import { z as copy_payload, A as assign_payload, c as pop, p as push, l as ensure_array_like, k as attr, e as escape_html, m as attr_class, w as clsx } from "../../../../../chunks/index3.js";
import "../../../../../chunks/client.js";
import "../../../../../chunks/navigationState.js";
import "../../../../../chunks/authStore.js";
import { B as Button } from "../../../../../chunks/Button.js";
import { f as formatCurrency, D as DetalleFacturaModal } from "../../../../../chunks/DetalleFacturaModal.js";
import { C as CaeModal, I as ImprimirModal } from "../../../../../chunks/ImprimirModal.js";
function _page($$payload, $$props) {
  push();
  let hayItemEnEdicion;
  let formasPago = [];
  let showCaeModal = false;
  let showImprimirModal = false;
  let notaCreditoCreada = null;
  let notaCredito = {
    DocumentoSucursal: "",
    DocumentoNumero: "",
    Fecha: (/* @__PURE__ */ new Date()).toISOString().substring(0, 10),
    ImporteBruto: 0,
    ImporteIva1: 0,
    ImporteIva2: 0,
    ImporteTotal: 0,
    Items: []
  };
  let clienteBusqueda = "";
  let clientesOptions = [];
  let articuloBusqueda = "";
  let articulosOptions = [];
  let facturasOptions = [];
  let cantidadArticulo = 1;
  let showDetalleFacturaModal = false;
  let facturaSeleccionadaParaDetalle = null;
  let itemsFacturaDetalle = [];
  let cargandoDetalleFactura = false;
  const tiposDocumento = [
    { value: "NCA", label: "Nota de Crédito A" },
    { value: "NCB", label: "Nota de Crédito B" },
    { value: "NCF", label: "Nota de Crédito F" }
  ];
  hayItemEnEdicion = notaCredito.Items.some((item) => item.enEdicion);
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    const each_array_2 = ensure_array_like(tiposDocumento);
    const each_array_3 = ensure_array_like(formasPago);
    const each_array_5 = ensure_array_like(notaCredito.Items);
    $$payload2.out += `<div class="container mx-auto px-4 py-8"><div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold text-gray-800">Nueva Nota de Crédito</h1> <div class="space-x-2">`;
    Button($$payload2, {
      variant: "secondary",
      children: ($$payload3) => {
        $$payload3.out += `<!---->Cancelar`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----> `;
    Button($$payload2, {
      variant: "primary",
      disabled: hayItemEnEdicion,
      children: ($$payload3) => {
        {
          $$payload3.out += "<!--[!-->";
          $$payload3.out += `Guardar`;
        }
        $$payload3.out += `<!--]-->`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----></div></div> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    if (hayItemEnEdicion) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4"><div class="flex items-center"><svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg> <span>Termine de editar el renglón antes de guardar la nota de crédito</span></div></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> <div class="bg-white rounded-lg shadow-sm p-6 mb-6"><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div class="relative md:col-span-2"><label for="cliente" class="block text-sm font-medium text-gray-700 mb-1">Cliente</label> <input id="cliente" type="text"${attr("value", clienteBusqueda)} placeholder="Buscar cliente..." autocomplete="off" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    if (clientesOptions.length > 0) {
      $$payload2.out += "<!--[-->";
      const each_array = ensure_array_like(clientesOptions);
      $$payload2.out += `<div class="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md overflow-auto"><!--[-->`;
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let cliente = each_array[$$index];
        $$payload2.out += `<button class="w-full text-left px-4 py-2 hover:bg-gray-100">${escape_html(cliente.label)}</button>`;
      }
      $$payload2.out += `<!--]--></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div></div> <div class="md:col-span-3"><label class="block text-sm font-medium text-gray-700 mb-2">Facturas de Referencia</label> <div class="border border-gray-300 rounded-md bg-gray-50" style="height: 300px; overflow-y: auto;">`;
    if (facturasOptions.length > 0) {
      $$payload2.out += "<!--[1-->";
      const each_array_1 = ensure_array_like(facturasOptions);
      $$payload2.out += `<table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-100 sticky top-0"><tr><th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th><th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Número</th><th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th><th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th><th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`;
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let factura = each_array_1[$$index_1];
        $$payload2.out += `<tr class="hover:bg-blue-50 cursor-pointer"><td class="px-4 py-2 text-sm">${escape_html(factura.tipo)}</td><td class="px-4 py-2 text-sm">${escape_html(factura.sucursal)}-${escape_html(factura.numero)}</td><td class="px-4 py-2 text-sm">${escape_html(new Date(factura.fecha).toLocaleDateString("es-AR"))}</td><td class="px-4 py-2 text-sm text-right">${escape_html(formatCurrency(factura.total))}</td><td class="px-4 py-2 text-center"><button class="text-blue-600 hover:text-blue-900" aria-label="Ver detalle"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg></button></td></tr>`;
      }
      $$payload2.out += `<!--]--></tbody></table>`;
    } else {
      $$payload2.out += "<!--[!-->";
      $$payload2.out += `<div class="flex justify-center items-center h-full text-gray-500"><p>Seleccione un cliente para ver sus facturas</p></div>`;
    }
    $$payload2.out += `<!--]--></div> `;
    if (notaCredito.FacturaReferencia) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<p class="text-sm text-gray-600 mt-2">Factura seleccionada: <span class="font-medium">${escape_html(notaCredito.FacturaReferencia.tipo)}-${escape_html(notaCredito.FacturaReferencia.sucursal)}-${escape_html(notaCredito.FacturaReferencia.numero)}</span></p>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div> <div><label for="tipoDocumento" class="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label> <select id="tipoDocumento" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><!--[-->`;
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let tipo = each_array_2[$$index_2];
      $$payload2.out += `<option${attr("value", tipo.value)}>${escape_html(tipo.label)}</option>`;
    }
    $$payload2.out += `<!--]--></select></div> <div><label for="formaPago" class="block text-sm font-medium text-gray-700 mb-1">Forma de Pago *</label> <select id="formaPago" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Seleccionar forma de pago</option><!--[-->`;
    for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
      let forma = each_array_3[$$index_3];
      $$payload2.out += `<option${attr("value", forma.value)}>${escape_html(forma.label)}</option>`;
    }
    $$payload2.out += `<!--]--></select></div> <div><label for="numeroDocumento" class="block text-sm font-medium text-gray-700 mb-1">Número</label> <input id="numeroDocumento" type="text" readonly${attr("value", `${notaCredito.DocumentoSucursal}-${notaCredito.DocumentoNumero}`)} class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"></div> <div><label for="fecha" class="block text-sm font-medium text-gray-700 mb-1">Fecha</label> <input id="fecha" type="date"${attr("value", notaCredito.Fecha)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div class="bg-white rounded-lg shadow-sm p-6 mb-6"><h2 class="text-lg font-bold text-gray-800 mb-4">Ítems</h2> <div class="mb-6 p-4 bg-gray-50 rounded-lg"><h3 class="text-md font-semibold text-gray-700 mb-3">Agregar artículo</h3> <div class="grid grid-cols-1 md:grid-cols-4 gap-4"><div class="md:col-span-2 relative"><label for="articulo" class="block text-sm font-medium text-gray-700 mb-1">Artículo</label> <input id="articulo" type="text"${attr("value", articuloBusqueda)} placeholder="Buscar artículo por código o descripción..." class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    if (articulosOptions.length > 0) {
      $$payload2.out += "<!--[-->";
      const each_array_4 = ensure_array_like(articulosOptions);
      $$payload2.out += `<div class="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md overflow-auto"><!--[-->`;
      for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
        let articulo = each_array_4[$$index_4];
        $$payload2.out += `<button class="w-full text-left px-4 py-2 hover:bg-gray-100"><div class="font-medium">${escape_html(articulo.codigo)} - ${escape_html(articulo.descripcion)}</div> <div class="text-sm text-gray-600">Precio: ${escape_html(formatCurrency(articulo.precio))} | IVA: ${escape_html(articulo.iva)}%</div></button>`;
      }
      $$payload2.out += `<!--]--></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div> <div><label for="cantidad" class="block text-sm font-medium text-gray-700 mb-1">Cantidad</label> <input id="cantidad" type="number"${attr("value", cantidadArticulo)} min="1" step="1" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div class="flex items-end"><button${attr("disabled", true, true)} class="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"><div class="flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> Agregar</div></button></div></div> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div> <div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead><tr><th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artículo</th><th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th><th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th><th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th><th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Bonif.</th><th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio c/Bonif.</th><th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% IVA</th><th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th><th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total c/IVA</th><th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`;
    for (let i = 0, $$length = each_array_5.length; i < $$length; i++) {
      let item = each_array_5[i];
      $$payload2.out += `<tr${attr_class(clsx(i % 2 === 0 ? "bg-white" : "bg-gray-50"))}><td class="px-4 py-3 whitespace-nowrap text-sm">${escape_html(item.CodigoArticulo)}</td><td class="px-4 py-3 whitespace-nowrap text-sm">${escape_html(item.Descripcion)}</td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">`;
      if (item.enEdicion) {
        $$payload2.out += "<!--[-->";
        $$payload2.out += `<input type="number"${attr("value", item.Cantidad)} min="1" step="1" class="w-20 px-2 py-1 text-right border border-gray-300 rounded-md">`;
      } else {
        $$payload2.out += "<!--[!-->";
        $$payload2.out += `${escape_html(item.Cantidad)}`;
      }
      $$payload2.out += `<!--]--></td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">`;
      if (item.enEdicion) {
        $$payload2.out += "<!--[-->";
        $$payload2.out += `<input type="number"${attr("value", item.PrecioUnitario)} min="0" step="0.01" class="w-24 px-2 py-1 text-right border border-gray-300 rounded-md">`;
      } else {
        $$payload2.out += "<!--[!-->";
        $$payload2.out += `$${escape_html(item.PrecioUnitario.toLocaleString("es-AR", { minimumFractionDigits: 2 }))}`;
      }
      $$payload2.out += `<!--]--></td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">`;
      if (item.enEdicion) {
        $$payload2.out += "<!--[-->";
        $$payload2.out += `<input type="number"${attr("value", item.PorcentajeBonificacion)} min="0" max="100" step="0.01" class="w-20 px-2 py-1 text-right border border-gray-300 rounded-md">`;
      } else {
        $$payload2.out += "<!--[!-->";
        $$payload2.out += `${escape_html(item.PorcentajeBonificacion)}%`;
      }
      $$payload2.out += `<!--]--></td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">$${escape_html((item.PrecioUnitario * (1 - (item.PorcentajeBonificacion || 0) / 100)).toLocaleString("es-AR", { minimumFractionDigits: 2 }))}</td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">${escape_html(item.PorcentajeIva)}%</td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">$${escape_html(item.Total.toLocaleString("es-AR", { minimumFractionDigits: 2 }))}</td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">$${escape_html(item.TotalConIva.toLocaleString("es-AR", { minimumFractionDigits: 2 }))}</td><td class="px-4 py-3 text-center">`;
      if (item.enEdicion) {
        $$payload2.out += "<!--[-->";
        $$payload2.out += `<button class="text-green-600 hover:text-green-900 mr-2" aria-label="Guardar cambios"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></button>`;
      } else {
        $$payload2.out += "<!--[!-->";
        $$payload2.out += `<button class="text-blue-600 hover:text-blue-900 mr-2" aria-label="Editar ítem"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>`;
      }
      $$payload2.out += `<!--]--> <button class="text-red-600 hover:text-red-900" aria-label="Eliminar ítem"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></td></tr>`;
    }
    $$payload2.out += `<!--]--></tbody></table></div></div> <div class="bg-white rounded-lg shadow-sm p-6"><div class="flex flex-col gap-2 items-end"><div class="w-64 flex justify-between"><span class="text-gray-600">Total sin IVA:</span> <span class="font-medium">$${escape_html(notaCredito.ImporteBruto.toLocaleString("es-AR", { minimumFractionDigits: 2 }))}</span></div> <div class="w-64 flex justify-between"><span class="text-gray-600">IVA 21%:</span> <span class="font-medium">$${escape_html(notaCredito.ImporteIva1.toLocaleString("es-AR", { minimumFractionDigits: 2 }))}</span></div> <div class="w-64 flex justify-between"><span class="text-gray-600">IVA 10.5%:</span> <span class="font-medium">$${escape_html(notaCredito.ImporteIva2.toLocaleString("es-AR", { minimumFractionDigits: 2 }))}</span></div> <div class="w-64 flex justify-between border-t pt-2"><span class="text-gray-800 font-semibold">Total:</span> <span class="font-bold text-lg">$${escape_html(notaCredito.ImporteTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 }))}</span></div></div></div></div></div> `;
    CaeModal($$payload2, {
      factura: notaCreditoCreada,
      get show() {
        return showCaeModal;
      },
      set show($$value) {
        showCaeModal = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!----> `;
    ImprimirModal($$payload2, {
      factura: notaCreditoCreada,
      get show() {
        return showImprimirModal;
      },
      set show($$value) {
        showImprimirModal = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!----> `;
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
    $$payload2.out += `<!---->`;
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
