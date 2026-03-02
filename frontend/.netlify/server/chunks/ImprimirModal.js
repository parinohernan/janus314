import { p as push, v as bind_props, c as pop, e as escape_html } from "./index3.js";
import { c as createEventDispatcher } from "./index-server.js";
import { B as Button } from "./Button.js";
import { f as fetchWithAuth } from "./authStore.js";
/* empty css                                       */
import { z as fallback } from "./utils.js";
/* empty css                                            */
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
  let esNotaCredito;
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
  esNotaCredito = factura?.DocumentoTipo?.startsWith("NC");
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
      $$payload.out += `<div class="success-state svelte-xds1o1"><div class="success-icon svelte-xds1o1" aria-hidden="true">✅</div> <h4 class="svelte-xds1o1">${escape_html(esNotaCredito ? "Nota de crédito" : "Factura")} autorizada correctamente</h4> <div class="cae-info svelte-xds1o1"><div class="info-row svelte-xds1o1"><span class="label svelte-xds1o1">CAE:</span> <span class="value svelte-xds1o1">${escape_html(caeData.cae)}</span></div> <div class="info-row svelte-xds1o1"><span class="label svelte-xds1o1">Vencimiento:</span> <span class="value svelte-xds1o1">${escape_html(caeData.fechaVencimiento)}</span></div> `;
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
  let esNotaCredito, datosCompletos;
  let show = fallback($$props["show"], false);
  let factura = $$props["factura"];
  esNotaCredito = factura?.DocumentoTipo?.startsWith("NC");
  datosCompletos = factura?.DocumentoTipo && factura?.DocumentoSucursal && factura?.DocumentoNumero;
  if (show && datosCompletos) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="modal-backdrop svelte-5l2ss5" role="presentation"><div class="modal-content svelte-5l2ss5" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><div class="modal-header svelte-5l2ss5"><h3 id="modal-title" class="svelte-5l2ss5">${escape_html(esNotaCredito ? "Nota de crédito" : "Factura")} creada exitosamente</h3> <button class="close-button svelte-5l2ss5" aria-label="Cerrar" type="button">×</button></div> <div class="modal-body svelte-5l2ss5"><div class="success-state svelte-5l2ss5"><div class="success-icon svelte-5l2ss5" aria-hidden="true">✅</div> <h4>¡${escape_html(esNotaCredito ? "Nota de crédito" : "Factura")} guardada correctamente!</h4> <div class="factura-info svelte-5l2ss5"><div class="info-row svelte-5l2ss5"><span class="label svelte-5l2ss5">Tipo:</span> <span class="value">${escape_html(factura.DocumentoTipo)}</span></div> <div class="info-row svelte-5l2ss5"><span class="label svelte-5l2ss5">Sucursal:</span> <span class="value">${escape_html(factura.DocumentoSucursal)}</span></div> <div class="info-row svelte-5l2ss5"><span class="label svelte-5l2ss5">Número:</span> <span class="value">${escape_html(factura.DocumentoNumero)}</span></div></div> <p class="question svelte-5l2ss5">¿Desea imprimir ${escape_html(esNotaCredito ? "la nota de crédito" : "la factura")} ahora?</p> <div class="actions svelte-5l2ss5">`;
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
export {
  CaeModal as C,
  ImprimirModal as I
};
