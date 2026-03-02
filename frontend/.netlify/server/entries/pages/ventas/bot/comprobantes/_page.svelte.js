import { h as head, l as ensure_array_like, k as attr, e as escape_html, c as pop, p as push } from "../../../../../chunks/index3.js";
import { o as onDestroy } from "../../../../../chunks/index-server.js";
import "../../../../../chunks/client.js";
/* empty css                        */
/* empty css                               */
import { a as auth, f as fetchWithAuth } from "../../../../../chunks/authStore.js";
/* empty css                                                                     */
import { L as LogoJano } from "../../../../../chunks/LogoJano.js";
function _page($$payload, $$props) {
  push();
  let comprobantes = [];
  let isLoading = false;
  let error = null;
  let currentPage = 1;
  let totalPages = 1;
  let vendedores = [];
  let vendedoresMap = /* @__PURE__ */ new Map();
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
  const handleActualizarTelefono = (event) => {
    const customEvent = event;
    if (customEvent.detail && customEvent.detail.clienteCodigo && customEvent.detail.nuevoTelefono) {
      const { clienteCodigo, nuevoTelefono } = customEvent.detail;
      console.log(`Actualizando teléfono para cliente ${clienteCodigo}: ${nuevoTelefono}`);
      actualizarTelefonoCliente(clienteCodigo, nuevoTelefono);
    }
  };
  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
    window.removeEventListener("actualizarTelefono", handleActualizarTelefono);
  });
  function obtenerNombreVendedor(codigo) {
    return vendedoresMap.get(codigo) || codigo;
  }
  function formatearImporte(importe) {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(importe);
  }
  async function actualizarTelefonoCliente(codigo, nuevoTelefono) {
    try {
      isLoading = true;
      error = null;
      console.log(`Intentando actualizar teléfono para cliente ${codigo} con valor: ${nuevoTelefono}`);
      const getResponse = await fetchWithAuth(`/clientes/${codigo}`);
      if (!getResponse.ok) {
        console.error(`Error al obtener datos del cliente: ${getResponse.status} - ${getResponse.statusText}`);
        throw new Error("Error al obtener datos del cliente");
      }
      const clienteActual = await getResponse.json();
      console.log("Datos actuales del cliente:", clienteActual);
      console.log("Intentando actualizar con PUT...");
      const putResponse = await fetchWithAuth(`/clientes/${codigo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...clienteActual, Telefono: nuevoTelefono })
      });
      if (!putResponse.ok) {
        console.error(`PUT falló con status ${putResponse.status} - ${putResponse.statusText}`);
        const errorText = await putResponse.text();
        console.error("Detalles del error:", errorText);
        throw new Error("Error al actualizar el teléfono del cliente");
      }
      console.log("Actualización exitosa con PUT");
      const mensajeAnterior = error;
      error = "Teléfono actualizado correctamente";
      setTimeout(
        () => {
          error = mensajeAnterior;
        },
        2e3
      );
      return true;
    } catch (err) {
      console.error("Error al actualizar el teléfono:", err);
      error = "Error al actualizar el teléfono del cliente. Intente nuevamente más tarde.";
      return false;
    } finally {
      isLoading = false;
    }
  }
  head($$payload, ($$payload2) => {
    $$payload2.out += `<script src="https://telegram.org/js/telegram-web-app.js"><\/script><!---->`;
  });
  $$payload.out += `<div class="telegram-webapp svelte-9a7yhh"><header class="header svelte-9a7yhh"><div class="header-content svelte-9a7yhh"><button class="btn-back svelte-9a7yhh" aria-label="Volver"><span class="back-icon">←</span></button> <div class="title-container svelte-9a7yhh">`;
  LogoJano($$payload, { size: "small", animated: false });
  $$payload.out += `<!----> <h2 class="page-subtitle svelte-9a7yhh">Comprobantes</h2></div></div></header> `;
  if (error) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="error">${escape_html(error)}</div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(vendedores);
    const each_array_1 = ensure_array_like(comprobantes);
    $$payload.out += `<div class="filtros svelte-9a7yhh"><select class="select-vendedor svelte-9a7yhh"><option value="" class="svelte-9a7yhh">Todos los vendedores</option><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let vendedor = each_array[$$index];
      $$payload.out += `<option${attr("value", vendedor.Codigo)} class="svelte-9a7yhh">${escape_html(vendedor.Descripcion)}</option>`;
    }
    $$payload.out += `<!--]--></select></div> `;
    if (isLoading) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="loading">Cargando...</div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div class="comprobantes-lista svelte-9a7yhh"><!--[-->`;
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let comprobante = each_array_1[$$index_1];
      $$payload.out += `<div class="comprobante-card svelte-9a7yhh" role="button" tabindex="0"><div class="comprobante-header svelte-9a7yhh"><div class="comprobante-fecha svelte-9a7yhh">${escape_html(comprobante.Fecha)}</div> <div class="comprobante-vendedor svelte-9a7yhh">${escape_html(obtenerNombreVendedor(comprobante.VendedorCodigo))}</div></div> <div class="comprobante-cliente svelte-9a7yhh">${escape_html(comprobante.ClienteDescripcion)}</div> <div class="comprobante-numero svelte-9a7yhh">${escape_html(comprobante.DocumentoTipo)}-${escape_html(comprobante.DocumentoSucursal)}-${escape_html(comprobante.DocumentoNumero)}</div> <div class="comprobante-importe svelte-9a7yhh">${escape_html(formatearImporte(comprobante.ImporteTotal))}</div></div>`;
    }
    $$payload.out += `<!--]--></div> <div class="paginacion svelte-9a7yhh"><button class="btn-pagina svelte-9a7yhh"${attr("disabled", currentPage === 1, true)}>←</button> <span class="pagina-actual svelte-9a7yhh">${escape_html(currentPage)} de ${escape_html(totalPages)}</span> <button class="btn-pagina svelte-9a7yhh"${attr("disabled", currentPage === totalPages, true)}>→</button></div>`;
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
