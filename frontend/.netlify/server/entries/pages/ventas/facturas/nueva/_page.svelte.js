import { p as push, x as bind_props, c as pop, e as escape_html, d as store_get, n as copy_payload, o as assign_payload, u as unsubscribe_stores, j as attr, g as ensure_array_like, k as attr_class } from "../../../../../chunks/index3.js";
import { p as page } from "../../../../../chunks/stores.js";
import "../../../../../chunks/client.js";
import { B as Button } from "../../../../../chunks/Button.js";
import "../../../../../chunks/authStore.js";
import { c as createEventDispatcher } from "../../../../../chunks/index-server.js";
import { f as fetchWithAuth } from "../../../../../chunks/fetchWithAuth.js";
/* empty css                                                           */
import { z as fallback } from "../../../../../chunks/utils.js";
class AfipService {
  /**
   * Obtiene el CAE para una factura
   * @param tipo Tipo de documento
   * @param puntoVenta Punto de venta (sucursal)
   * @param numero Número de comprobante
   * @returns Resultado de la operación con el CAE
   */
  static async obtenerCae(tipo, puntoVenta, numero) {
    try {
      const tipoAfip = this.mapearTipoDocumento(tipo);
      console.log("Llamando al endpoint de nuestro backend...");
      const response = await fetchWithAuth(`/afip/grabar-cae`, {
        method: "POST",
        body: JSON.stringify({
          tipo,
          puntoVenta,
          numero,
          solicitarCAE: true
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.log("Error al solicitar CAE:", errorData);
        return {
          success: false,
          error: errorData.message || "Error al solicitar CAE"
        };
      }
      const data = await response.json();
      console.log("Respuesta del servicio de CAE:", data);
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error("Error en servicio AFIP:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido en servicio AFIP"
      };
    }
  }
  /**
   * Mapea los tipos de documento internos a los códigos de AFIP
   */
  static mapearTipoDocumento(tipo) {
    const mapeo = {
      FCB: "6",
      // Factura B
      FCA: "1",
      // Factura A
      NCB: "8",
      // Nota de Crédito B
      NCA: "3",
      // Nota de Crédito A
      NDB: "7",
      // Nota de Débito B
      NDA: "2"
      // Nota de Débito A
    };
    return mapeo[tipo] || tipo;
  }
  /**
   * Verifica el estado del servidor de AFIP y obtiene los últimos comprobantes
   * @param puntoVenta Punto de venta (sucursal) a consultar
   * @returns Estado del servidor y últimos comprobantes
   */
  static async obtenerEstadoArca(puntoVenta) {
    try {
      const response = await fetchWithAuth(`/afip/estado-completo?puntoVenta=${puntoVenta}`);
      if (!response.ok) {
        throw new Error("Error al obtener estado de ARCA");
      }
      const data = await response.json();
      return {
        disponible: data.disponible,
        mensaje: data.mensaje || "Servidor ARCA disponible",
        ultimosComprobantes: data.ultimosComprobantes || []
      };
    } catch (error) {
      console.error("Error al obtener estado de ARCA:", error);
      return {
        disponible: false,
        mensaje: "Error de conexión con servidor ARCA",
        ultimosComprobantes: []
      };
    }
  }
  /**
   * Obtiene el último número de comprobante para un tipo específico
   * @param tipo Tipo de comprobante (FCA, FCB, etc)
   * @param puntoVenta Punto de venta
   * @returns Último número de comprobante
   */
  static async obtenerUltimoComprobante(tipo, puntoVenta) {
    try {
      const response = await fetchWithAuth(`/afip/ultimo-comprobante`, {
        method: "POST",
        body: JSON.stringify({
          tipo,
          puntoVenta
        })
      });
      if (!response.ok) {
        throw new Error("Error al obtener último comprobante");
      }
      const data = await response.json();
      return data.ultimoNumero;
    } catch (error) {
      console.error("Error al obtener último comprobante:", error);
      throw error;
    }
  }
  /**
   * Coloca CAE manualmente
   * Permite al usuario ingresar el CAE y vencimiento manualmente
   * @param tipo Tipo de documento (FCA, FCB, NCA, NCB)
   * @param puntoVenta Punto de venta (sucursal)
   * @param numero Número de comprobante
   * @param cae Número de CAE
   * @param fechaVencimiento Fecha de vencimiento del CAE (YYYY-MM-DD)
   * @returns Resultado de la operación
   */
  static async colocarCaeManualmente(tipo, puntoVenta, numero, cae, fechaVencimiento) {
    try {
      console.log("📝 Colocando CAE manualmente para:", { tipo, puntoVenta, numero, cae, fechaVencimiento });
      const response = await fetchWithAuth(`/afip/colocar-cae-manualmente`, {
        method: "POST",
        body: JSON.stringify({
          tipo,
          puntoVenta,
          numero,
          cae,
          fechaVencimiento
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error al colocar CAE manualmente:", errorData);
        return {
          success: false,
          error: errorData.message || "Error al colocar CAE manualmente"
        };
      }
      const data = await response.json();
      console.log("✅ CAE colocado manualmente exitosamente:", data);
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error("Error en servicio AFIP - colocar CAE manualmente:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al colocar CAE manualmente"
      };
    }
  }
}
function CaeModal($$payload, $$props) {
  push();
  let show = fallback($$props["show"], false);
  let factura = $$props["factura"];
  let loading = false;
  let error = null;
  let caeData = null;
  const dispatch = createEventDispatcher();
  async function solicitarCae() {
    if (!factura) return;
    loading = true;
    error = null;
    console.log("Solicitando CAE... t", factura);
    try {
      const result = await AfipService.obtenerCae(factura.DocumentoTipo, factura.DocumentoSucursal, factura.DocumentoNumero);
      console.log("Respuesta de obtención de CAE:", result);
      if (result.success) {
        caeData = result.data;
        dispatch("caeObtenido", caeData);
      } else {
        error = result.error || "Error al obtener CAE";
      }
    } catch (err) {
      console.error("Error solicitando CAE:", err);
      error = err instanceof Error ? err.message : "Error desconocido";
    } finally {
      loading = false;
    }
  }
  if (show) {
    solicitarCae();
  }
  if (show) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="modal-backdrop svelte-xds1o1" role="presentation"><div class="modal-content svelte-xds1o1" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><div class="modal-header svelte-xds1o1"><h3 id="modal-title" class="svelte-xds1o1">Proceso de autorización AFIP</h3> <button class="close-button svelte-xds1o1" aria-label="Cerrar" type="button">×</button></div> <div class="modal-body svelte-xds1o1">`;
    if (loading) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="loading-state svelte-xds1o1"><div class="spinner svelte-xds1o1" aria-hidden="true"></div> <p class="svelte-xds1o1">Solicitando CAE a AFIP...</p></div>`;
    } else if (error) {
      $$payload.out += "<!--[1-->";
      $$payload.out += `<div class="error-state svelte-xds1o1"><div class="error-icon svelte-xds1o1" aria-hidden="true">❌</div> <h4 class="svelte-xds1o1">Error en la autorización</h4> <p class="svelte-xds1o1">${escape_html(error)}</p> `;
      Button($$payload, {
        variant: "secondary",
        children: ($$payload2) => {
          $$payload2.out += `<!---->Reintentar`;
        },
        $$slots: { default: true }
      });
      $$payload.out += `<!----></div>`;
    } else if (caeData) {
      $$payload.out += "<!--[2-->";
      $$payload.out += `<div class="success-state svelte-xds1o1"><div class="success-icon svelte-xds1o1" aria-hidden="true">✅</div> <h4 class="svelte-xds1o1">Factura autorizada correctamente</h4> <div class="cae-info svelte-xds1o1"><div class="info-row svelte-xds1o1"><span class="label svelte-xds1o1">CAE:</span> <span class="value svelte-xds1o1">${escape_html(caeData.cae)}</span></div> <div class="info-row svelte-xds1o1"><span class="label svelte-xds1o1">Vencimiento:</span> <span class="value svelte-xds1o1">${escape_html(caeData.fechaVencimiento)}</span></div> `;
      if (caeData.observaciones) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="info-row svelte-xds1o1"><span class="label svelte-xds1o1">Observaciones:</span> <span class="value svelte-xds1o1">${escape_html(caeData.observaciones)}</span></div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></div> <div class="actions svelte-xds1o1">`;
      Button($$payload, {
        variant: "primary",
        children: ($$payload2) => {
          $$payload2.out += `<!---->Aceptar`;
        },
        $$slots: { default: true }
      });
      $$payload.out += `<!----> `;
      Button($$payload, {
        variant: "secondary",
        children: ($$payload2) => {
          $$payload2.out += `<!---->Imprimir`;
        },
        $$slots: { default: true }
      });
      $$payload.out += `<!----></div></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  bind_props($$props, { show, factura });
  pop();
}
function ImprimirModal($$payload, $$props) {
  push();
  let show = fallback($$props["show"], false);
  let factura = $$props["factura"];
  if (show) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="modal-backdrop svelte-5l2ss5" role="presentation"><div class="modal-content svelte-5l2ss5" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><div class="modal-header svelte-5l2ss5"><h3 id="modal-title" class="svelte-5l2ss5">Factura creada exitosamente</h3> <button class="close-button svelte-5l2ss5" aria-label="Cerrar" type="button">×</button></div> <div class="modal-body svelte-5l2ss5"><div class="success-state svelte-5l2ss5"><div class="success-icon svelte-5l2ss5" aria-hidden="true">✅</div> <h4>¡Factura guardada correctamente!</h4> <div class="factura-info svelte-5l2ss5"><div class="info-row svelte-5l2ss5"><span class="label svelte-5l2ss5">Tipo:</span> <span class="value">${escape_html(factura.DocumentoTipo)}</span></div> <div class="info-row svelte-5l2ss5"><span class="label svelte-5l2ss5">Sucursal:</span> <span class="value">${escape_html(factura.DocumentoSucursal)}</span></div> <div class="info-row svelte-5l2ss5"><span class="label svelte-5l2ss5">Número:</span> <span class="value">${escape_html(factura.DocumentoNumero)}</span></div></div> <p class="question svelte-5l2ss5">¿Desea imprimir la factura ahora?</p> <div class="actions svelte-5l2ss5">`;
    Button($$payload, {
      variant: "primary",
      children: ($$payload2) => {
        $$payload2.out += `<!---->Sí, imprimir`;
      },
      $$slots: { default: true }
    });
    $$payload.out += `<!----> `;
    Button($$payload, {
      variant: "secondary",
      children: ($$payload2) => {
        $$payload2.out += `<!---->No, cancelar`;
      },
      $$slots: { default: true }
    });
    $$payload.out += `<!----></div></div></div></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  bind_props($$props, { show, factura });
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const hoy = /* @__PURE__ */ new Date();
  hoy.setHours(hoy.getHours() - 3);
  const fechaFormateada = hoy.toISOString().substring(0, 10);
  let sucursalActual = "0001";
  let factura = {
    DocumentoSucursal: sucursalActual,
    Fecha: fechaFormateada,
    // esto es la fecha de hoy
    ImporteBruto: 0,
    PorcentajeBonificacion: 0,
    ImporteBonificado: 0,
    ImporteNeto: 0,
    ImporteIva1: 0,
    ImporteIva2: 0,
    PorcentajeIngresosBrutos: 0,
    ImporteIngresosBrutos: 0,
    ImporteTotal: 0,
    Observacion: "",
    Items: []
  };
  console.log("fecha de hoy", (/* @__PURE__ */ new Date()).toISOString().substring(0, 10));
  let tiposDocumento = [];
  let clientesBusqueda = "";
  let articuloBusqueda = "";
  let articulosOptions = [];
  let cantidadArticulo = 1;
  let loading = true;
  let sucursalNumeroDisplay = "";
  let formasPago = [];
  let vendedoresOptions = [];
  let showCaeModal = false;
  let facturaCreada = null;
  let showImprimirModal = false;
  store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("preventa");
  const listasPrecio = [
    { value: "1", label: "Lista 1" },
    { value: "2", label: "Lista 2" },
    { value: "3", label: "Lista 3" },
    { value: "4", label: "Lista 4" },
    { value: "5", label: "Lista 5" }
  ];
  sucursalNumeroDisplay = factura.DocumentoSucursal + " - 00000000";
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out += `<div class="container mx-auto px-4 py-8"><div class="flex justify-between items-center mb-6"><div class="flex items-center space-x-4"><h1 class="text-2xl font-bold text-gray-800">Nueva Factura</h1> <div class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">${escape_html(factura.Items.length)} ${escape_html(factura.Items.length === 1 ? "artículo" : "artículos")}</div></div> <div class="flex space-x-2">`;
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
      disabled: loading,
      children: ($$payload3) => {
        $$payload3.out += `<!---->${escape_html("Guardando...")}`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----></div></div> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]-->  <div class="bg-white p-6 rounded-lg shadow-md mb-6"><div class="flex justify-between items-center mb-4"><h2 class="text-xl font-semibold">Datos de la Factura</h2></div> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-4"><div class="relative lg:col-span-3"><label for="cliente" class="block text-sm font-medium text-gray-700 mb-1">Cliente *</label> <input type="text" id="cliente" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm" placeholder="Buscar cliente..."${attr("value", clientesBusqueda)} autocomplete="off"> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div> `;
    {
      $$payload2.out += "<!--[-->";
      const each_array_1 = ensure_array_like(tiposDocumento);
      const each_array_2 = ensure_array_like(formasPago);
      const each_array_3 = ensure_array_like(listasPrecio);
      $$payload2.out += `<div class="lg:col-span-4"><label for="tipoDocumento" class="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento *</label> <div class="flex space-x-2"><select id="tipoDocumento" class="w-2/5 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Seleccionar tipo</option><!--[-->`;
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let tipo = each_array_1[$$index_1];
        $$payload2.out += `<option${attr("value", tipo.value)}>${escape_html(tipo.label)}</option>`;
      }
      $$payload2.out += `<!--]--></select> <input id="sucursal" type="text"${attr("value", sucursalNumeroDisplay)} disabled class="w-3/5 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700" title="Próximo número de documento"></div></div> <div class="lg:col-span-2"><label for="formaPago" class="block text-sm font-medium text-gray-700 mb-1">Forma de Pago</label> <select id="formaPago" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Forma de pago</option><!--[-->`;
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let forma = each_array_2[$$index_2];
        $$payload2.out += `<option${attr("value", forma.value)}>${escape_html(forma.label)}</option>`;
      }
      $$payload2.out += `<!--]--></select></div> <div class="lg:col-span-3"><div class="grid grid-cols-2 gap-2"><div><label for="listaPrecio" class="block text-sm font-medium text-gray-700 mb-1">Lista de Precios</label> <select id="listaPrecio" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><!--[-->`;
      for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
        let lista = each_array_3[$$index_3];
        $$payload2.out += `<option${attr("value", lista.value)}>${escape_html(lista.label)}</option>`;
      }
      $$payload2.out += `<!--]--></select></div> <div><label for="fecha" class="block text-sm font-medium text-gray-700 mb-1">Fecha</label> <input id="fecha" type="date"${attr("value", factura.Fecha)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div></div></div>`;
    }
    $$payload2.out += `<!--]--></div></div> <div class="bg-white rounded-lg shadow-sm p-6 mb-6"><h2 class="text-lg font-semibold mb-4">Artículos</h2> <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4"><div class="md:col-span-2"><label for="articulo" class="block text-sm font-medium text-gray-700 mb-1">Artículo</label> <div class="relative"><input type="text" id="articulo" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm" placeholder="Buscar artículo..."${attr("value", articuloBusqueda)} autocomplete="off"> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    if (articulosOptions.length > 0) {
      $$payload2.out += "<!--[-->";
      const each_array_4 = ensure_array_like(articulosOptions);
      $$payload2.out += `<div class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm"><ul><!--[-->`;
      for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
        let articulo = each_array_4[$$index_4];
        $$payload2.out += `<li><button class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 w-full text-left"><div class="flex items-center"><span class="font-normal block truncate">${escape_html(articulo.Codigo)} - ${escape_html(articulo.Descripcion)}</span></div></button></li>`;
      }
      $$payload2.out += `<!--]--></ul></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div></div> <div><label for="cantidad" class="block text-sm font-medium text-gray-700 mb-1">Cantidad</label> <input id="cantidad" type="number" min="1" step="1"${attr("value", cantidadArticulo)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="btnAgregar" class="invisible block text-sm font-medium text-gray-700 mb-1">Agregar</label> `;
    Button($$payload2, {
      id: "btnAgregar",
      variant: "secondary",
      disabled: true,
      class: "w-full",
      children: ($$payload3) => {
        $$payload3.out += `<!---->Agregar`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----></div></div> `;
    if (factura.Items.length > 0) {
      $$payload2.out += "<!--[-->";
      const each_array_5 = ensure_array_like(factura.Items);
      $$payload2.out += `<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Existencia</th><th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th><th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Lista</th><th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Desc.</th><th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th><th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% IVA</th><th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio C/IVA</th><th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th><th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`;
      for (let i = 0, $$length = each_array_5.length; i < $$length; i++) {
        let item = each_array_5[i];
        $$payload2.out += `<tr${attr_class(`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} ${item.Cantidad > (item.Existencia ?? 0) ? "text-red-500" : ""}`)}><td class="px-4 py-3 whitespace-nowrap text-sm">${escape_html(item.ArticuloCodigo)}</td><td class="px-4 py-3 whitespace-nowrap text-sm">${escape_html(item.Descripcion)}</td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">${escape_html(item.Existencia)}</td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">`;
        if (item.enEdicion) {
          $$payload2.out += "<!--[-->";
          $$payload2.out += `<input type="number"${attr("value", item.Cantidad)} min="1" step="1" class="w-16 px-2 py-1 text-right border border-gray-300 rounded">`;
        } else {
          $$payload2.out += "<!--[!-->";
          $$payload2.out += `${escape_html(item.Cantidad)}`;
        }
        $$payload2.out += `<!--]--></td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">$${escape_html(item.PrecioLista.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }))}</td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">`;
        if (item.enEdicion) {
          $$payload2.out += "<!--[-->";
          $$payload2.out += `<input type="number"${attr("value", item.PorcentajeBonificado)} min="0" max="100" step="0.1" class="w-16 px-2 py-1 text-right border border-gray-300 rounded">`;
        } else {
          $$payload2.out += "<!--[!-->";
          $$payload2.out += `${escape_html(item.PorcentajeBonificado)}%`;
        }
        $$payload2.out += `<!--]--></td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">$${escape_html(item.PrecioUnitario.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }))}</td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">${escape_html(item.PorcentajeIva)}%</td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">$${escape_html(item.PrecioUnitarioConIva.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }))}</td><td class="px-4 py-3 whitespace-nowrap text-sm text-right">$${escape_html(item.Total.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }))}</td><td class="px-4 py-3 whitespace-nowrap text-center">`;
        if (item.enEdicion) {
          $$payload2.out += "<!--[-->";
          $$payload2.out += `<button class="text-green-600 hover:text-green-900 mr-2" aria-label="Guardar cambios"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></button>`;
        } else {
          $$payload2.out += "<!--[!-->";
          $$payload2.out += `<button class="text-blue-600 hover:text-blue-900 mr-2" aria-label="Editar ítem"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>`;
        }
        $$payload2.out += `<!--]--> <button class="text-red-600 hover:text-red-900" aria-label="Eliminar ítem"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></td></tr>`;
      }
      $$payload2.out += `<!--]--></tbody></table> `;
      {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]--></div> <div class="mt-6 flex justify-end"><div class="w-80 space-y-2"><div class="flex justify-between"><span class="font-medium">Importe Bruto:</span> <span>$${escape_html(factura.ImporteBruto.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }))}</span></div> <div class="flex justify-between items-center"><span class="font-medium">Bonificación (%):</span> <div class="flex items-center"><input type="number"${attr("value", factura.PorcentajeBonificacion)} min="0" max="100" step="0.1" class="w-16 px-2 py-1 text-right border border-gray-300 rounded mr-2"> <span>$${escape_html(factura.ImporteBonificado.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }))}</span></div></div> <div class="flex justify-between"><span class="font-medium">Importe Neto:</span> <span>$${escape_html(factura.ImporteNeto.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }))}</span></div> <div class="flex justify-between"><span class="font-medium">IVA 21%:</span> <span>$${escape_html(factura.ImporteIva1.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }))}</span></div> <div class="flex justify-between"><span class="font-medium">IVA 10.5%:</span> <span>$${escape_html(factura.ImporteIva2.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }))}</span></div> <div class="flex justify-between items-center"><span class="font-medium">Ingresos Brutos (%):</span> <div class="flex items-center"><input type="number"${attr("value", factura.PorcentajeIngresosBrutos)} min="0" max="100" step="0.1" class="w-16 px-2 py-1 text-right border border-gray-300 rounded mr-2"> <span>$${escape_html(factura.ImporteIngresosBrutos.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }))}</span></div></div> <div class="flex justify-between text-lg font-bold pt-2 border-t border-gray-200"><span>Total:</span> <span>$${escape_html(factura.ImporteTotal.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }))}</span></div></div></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
      $$payload2.out += `<div class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4"><p>No hay artículos agregados a la factura.</p></div>`;
    }
    $$payload2.out += `<!--]--></div> `;
    {
      $$payload2.out += "<!--[-->";
      const each_array_6 = ensure_array_like(vendedoresOptions);
      $$payload2.out += `<div class="card"><div class="card-header d-flex justify-content-between align-items-center"><h5>Detalles adicionales</h5> `;
      Button($$payload2, {
        variant: "secondary",
        size: "sm",
        children: ($$payload3) => {
          $$payload3.out += `<!---->Ocultar detalles`;
        },
        $$slots: { default: true }
      });
      $$payload2.out += `<!----></div> <div class="card-body"><div class="row"><div class="mb-4"><label for="observacion" class="block text-sm font-medium text-gray-700 mb-1">Observación</label> <textarea id="observacion" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">`;
      const $$body = escape_html(factura.Observacion);
      if ($$body) {
        $$payload2.out += `${$$body}`;
      }
      $$payload2.out += `</textarea></div> <div class="col-md-6 mb-3"><label for="vendedor" class="block text-sm font-medium text-gray-700 mb-1">Vendedor</label> <select id="vendedor" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Seleccionar vendedor</option><!--[-->`;
      for (let $$index_6 = 0, $$length = each_array_6.length; $$index_6 < $$length; $$index_6++) {
        let vendedor = each_array_6[$$index_6];
        $$payload2.out += `<option${attr("value", vendedor.value)}>${escape_html(vendedor.label)}</option>`;
      }
      $$payload2.out += `<!--]--></select></div></div></div></div>`;
    }
    $$payload2.out += `<!--]--></div> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    CaeModal($$payload2, {
      factura: facturaCreada,
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
      factura: facturaCreada,
      get show() {
        return showImprimirModal;
      },
      set show($$value) {
        showImprimirModal = $$value;
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
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
