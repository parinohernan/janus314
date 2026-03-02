import { p as push, e as escape_html, l as ensure_array_like, k as attr, v as bind_props, c as pop, m as attr_class, n as stringify, z as copy_payload, A as assign_payload } from "../../../../../chunks/index3.js";
import { o as onDestroy } from "../../../../../chunks/index-server.js";
import "../../../../../chunks/client.js";
import { z as fallback } from "../../../../../chunks/utils.js";
import { f as fetchWithAuth } from "../../../../../chunks/authStore.js";
import { F as FormasPago } from "../../../../../chunks/FormasPago.js";
/* empty css                                                                     */
/* empty css                        */
function ComprobanteDetalle($$payload, $$props) {
  push();
  let numeroFormateado, tipoComprobante;
  let comprobante = $$props["comprobante"];
  let mostrar = fallback($$props["mostrar"], false);
  let onClose = fallback($$props["onClose"], () => {
  });
  let numeroTelefono = "";
  let mostrarBotonActualizar = false;
  function formatearNumeroComprobante(sucursal, numero) {
    const sucursalFormateada = sucursal.padStart(4, "0");
    const numeroFormateado2 = numero.padStart(8, "0");
    return `${sucursalFormateada}-${numeroFormateado2}`;
  }
  function obtenerTipoComprobante(tipo) {
    const tipos = {
      "PRF": "Prefactura",
      "FAA": "Factura A",
      "FAB": "Factura B",
      "FAC": "Factura C",
      "FAE": "Factura E",
      "RMA": "Remito",
      "NCA": "Nota de Crédito A",
      "NCB": "Nota de Crédito B",
      "NCC": "Nota de Crédito C",
      "NDA": "Nota de Débito A",
      "NDB": "Nota de Débito B",
      "NDC": "Nota de Débito C"
    };
    return tipos[tipo] || tipo;
  }
  const actualizarTelefono = () => {
    const evento = new CustomEvent("actualizarTelefono", {
      detail: {
        clienteCodigo: comprobante.clienteCodigo,
        nuevoTelefono: numeroTelefono
      }
    });
    window.dispatchEvent(evento);
    mostrarBotonActualizar = false;
    return true;
  };
  numeroFormateado = formatearNumeroComprobante(comprobante.sucursal, comprobante.numero);
  tipoComprobante = obtenerTipoComprobante(comprobante.tipo);
  if (mostrar) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="modal-overlay svelte-1twlhu1" role="dialog" aria-modal="true" aria-labelledby="comprobante-titulo" tabindex="0"><div class="modal-content svelte-1twlhu1"><div class="modal-header svelte-1twlhu1"><h3 id="comprobante-titulo" class="svelte-1twlhu1">Detalle de Comprobante</h3> <button class="btn-close svelte-1twlhu1" aria-label="Cerrar modal">×</button></div> <div class="modal-body svelte-1twlhu1"><div class="comprobante-resumen svelte-1twlhu1"><div class="comprobante-tipo-numero svelte-1twlhu1"><span class="comprobante-tipo svelte-1twlhu1">${escape_html(tipoComprobante)}</span> <span class="comprobante-numero svelte-1twlhu1">${escape_html(numeroFormateado)}</span></div> <div class="comprobante-info svelte-1twlhu1"><div class="info-grupo svelte-1twlhu1"><div class="info-label svelte-1twlhu1">Fecha:</div> <div class="info-valor svelte-1twlhu1">${escape_html(comprobante.fecha || (/* @__PURE__ */ new Date()).toLocaleDateString())}</div></div> <div class="info-grupo svelte-1twlhu1"><div class="info-label svelte-1twlhu1">Cliente:</div> <div class="info-valor svelte-1twlhu1">${escape_html(comprobante.clienteNombre || "Consumidor Final")}</div></div> `;
    if (comprobante.vendedorNombre) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="info-grupo svelte-1twlhu1"><div class="info-label svelte-1twlhu1">Vendedor:</div> <div class="info-valor svelte-1twlhu1">${escape_html(comprobante.vendedorNombre)}</div></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div> `;
    if (comprobante.items && comprobante.items.length > 0) {
      $$payload.out += "<!--[-->";
      const each_array = ensure_array_like(comprobante.items);
      $$payload.out += `<div class="comprobante-items svelte-1twlhu1"><h4 class="svelte-1twlhu1">Artículos</h4> <div class="items-tabla svelte-1twlhu1"><div class="items-header svelte-1twlhu1"><div class="item-desc svelte-1twlhu1">Descripción</div> <div class="item-cant svelte-1twlhu1">Cant.</div> <div class="item-precio svelte-1twlhu1">Precio</div> <div class="item-subtotal svelte-1twlhu1">Subtotal</div></div> <!--[-->`;
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let item = each_array[$$index];
        $$payload.out += `<div class="item-row svelte-1twlhu1"><div class="item-desc svelte-1twlhu1">${escape_html(item.descripcion)}</div> <div class="item-cant svelte-1twlhu1">${escape_html(item.cantidad)}</div> <div class="item-precio svelte-1twlhu1">$${escape_html(item.precioUnitario.toFixed(2))}</div> <div class="item-subtotal svelte-1twlhu1">$${escape_html(item.subtotal.toFixed(2))}</div></div>`;
      }
      $$payload.out += `<!--]--></div></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div class="comprobante-total svelte-1twlhu1"><div class="total-label svelte-1twlhu1">Total:</div> <div class="total-valor svelte-1twlhu1">$${escape_html(comprobante.total.toFixed(2))}</div></div></div> <div class="comprobante-whatsapp svelte-1twlhu1"><h4 class="svelte-1twlhu1">Compartir Comprobante</h4> <div class="telefono-grupo svelte-1twlhu1"><label for="whatsapp-telefono" class="svelte-1twlhu1">Número de teléfono:</label> `;
    {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<input type="tel" id="whatsapp-telefono"${attr("value", numeroTelefono)} placeholder="Ej: 3492123456" class="input-telefono svelte-1twlhu1"> <small class="ayuda-texto svelte-1twlhu1">Ingrese el número sin 0 ni 15. Ej: 3492123456</small> `;
      {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]-->`;
    }
    $$payload.out += `<!--]--></div> <div class="whatsapp-acciones svelte-1twlhu1"><button class="btn-whatsapp svelte-1twlhu1"><span class="icono-whatsapp">📱</span> <span>Enviar por WhatsApp</span></button> `;
    if (mostrarBotonActualizar && comprobante.clienteCodigo) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<button class="btn-actualizar svelte-1twlhu1"><span class="icono-actualizar">💾</span> <span>Actualizar Teléfono</span></button>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div></div></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  bind_props($$props, {
    comprobante,
    mostrar,
    onClose,
    actualizarTelefono
  });
  pop();
}
function ClienteSelector($$payload, $$props) {
  push();
  let clientesFiltrados = fallback($$props["clientesFiltrados"], () => [], true);
  let mostrarModalClientes = $$props["mostrarModalClientes"];
  let busquedaCliente = $$props["busquedaCliente"];
  let filtrarClientes = $$props["filtrarClientes"];
  let seleccionarCliente = $$props["seleccionarCliente"];
  let cerrar = $$props["cerrar"];
  if (mostrarModalClientes) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(clientesFiltrados);
    $$payload.out += `<div class="modal-overlay svelte-1ef1ogi" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><section class="modal-content svelte-1ef1ogi" role="document"><div class="modal-header svelte-1ef1ogi"><h3 id="modal-title" class="svelte-1ef1ogi">Seleccionar Cliente</h3> <button class="modal-close svelte-1ef1ogi" aria-label="Cerrar">×</button></div> <input type="text" placeholder="Buscar cliente..." class="cliente-busqueda svelte-1ef1ogi"${attr("value", busquedaCliente)}> <div class="clientes-lista svelte-1ef1ogi"><button class="cliente-item svelte-1ef1ogi" type="button"><strong class="svelte-1ef1ogi">Consumidor Final</strong></button> <!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let c = each_array[$$index];
      $$payload.out += `<button class="cliente-item svelte-1ef1ogi" type="button"><strong class="svelte-1ef1ogi">${escape_html(c.Codigo)}</strong> - ${escape_html(c.Descripcion)}</button>`;
    }
    $$payload.out += `<!--]--></div></section> <button class="modal-backdrop-btn svelte-1ef1ogi" aria-label="Cerrar modal"></button></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  bind_props($$props, {
    clientesFiltrados,
    mostrarModalClientes,
    busquedaCliente,
    filtrarClientes,
    seleccionarCliente,
    cerrar
  });
  pop();
}
function ArticulosBusqueda($$payload, $$props) {
  push();
  let agregarArticulo = $$props["agregarArticulo"];
  let handleArticuloKeyDown = $$props["handleArticuloKeyDown"];
  let listaPrecios = fallback($$props["listaPrecios"], "1");
  let productosFiltrados = [];
  let busquedaProducto = "";
  function limpiarBusqueda() {
    busquedaProducto = "";
    productosFiltrados = [];
  }
  function handleKeyDown(event) {
    return;
  }
  onDestroy(() => {
  });
  {
    {
      window.removeEventListener("keydown", handleKeyDown);
    }
  }
  $$payload.out += `<div class="form-group"><div class="tabs svelte-ia871w"><button${attr_class(`tab-btn ${stringify("activa")}`, "svelte-ia871w")} type="button">Buscar</button> <button${attr_class(`tab-btn ${stringify("")}`, "svelte-ia871w")} type="button">Escanear</button></div> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="busqueda-container svelte-ia871w"><input type="text" id="busqueda-producto"${attr("value", busquedaProducto)} placeholder="Buscar por código o descripción..." class="svelte-ia871w"> <button type="button" class="btn-buscar svelte-ia871w">Buscar</button></div>`;
  }
  $$payload.out += `<!--]--> <div class="articulos-lista svelte-ia871w">`;
  if (productosFiltrados.length === 0 && busquedaProducto.length >= 2) {
    $$payload.out += "<!--[2-->";
    $$payload.out += `<div class="no-resultados svelte-ia871w"><p>No se encontraron productos con "${escape_html(busquedaProducto)}"</p> <button class="btn-nuevo-producto svelte-ia871w"><span class="svelte-ia871w">➕ Crear nuevo producto</span></button></div>`;
  } else if (productosFiltrados.length > 0) {
    $$payload.out += "<!--[3-->";
    const each_array = ensure_array_like(productosFiltrados);
    $$payload.out += `<!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let articulo = each_array[$$index];
      $$payload.out += `<div class="articulo-item svelte-ia871w" role="button" tabindex="0"><div class="articulo-info svelte-ia871w"><div class="articulo-codigo svelte-ia871w">${escape_html(articulo.Codigo)}</div> <div class="articulo-nombre svelte-ia871w">${escape_html(articulo.Descripcion)}</div></div> <div class="articulo-actions svelte-ia871w"><div class="articulo-precio svelte-ia871w">$${escape_html(articulo.PrecioVenta?.toFixed(2) || "0.00")} (IVA incl.)</div> <button class="btn-add svelte-ia871w" type="button"><span aria-hidden="true">+</span> <span class="sr-only svelte-ia871w">Agregar artículo</span></button></div></div>`;
    }
    $$payload.out += `<!--]-->`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="instrucciones svelte-ia871w">Escriba al menos 2 caracteres para buscar</div>`;
  }
  $$payload.out += `<!--]--></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, {
    agregarArticulo,
    handleArticuloKeyDown,
    listaPrecios,
    limpiarBusqueda
  });
  pop();
}
function ArticulosSeleccionados($$payload, $$props) {
  push();
  let selectedArticulos = fallback($$props["selectedArticulos"], () => [], true);
  let aumentarCantidad = $$props["aumentarCantidad"];
  let disminuirCantidad = $$props["disminuirCantidad"];
  let quitarArticulo = $$props["quitarArticulo"];
  let cambiarCantidadDecimal = $$props["cambiarCantidadDecimal"];
  let focusedCodigo = null;
  function cantidadTotal(articulo) {
    return (articulo.cantidadEntera || 0) + (articulo.cantidadDecimal || 0) / 1e3;
  }
  function getDecimalDigits(decimal) {
    const str = decimal.toString().padStart(3, "0").slice(0, 3);
    return [
      Number(str[0]),
      Number(str[1]),
      Number(str[2])
    ];
  }
  $$payload.out += `<div class="selected-articulos svelte-1d5enw8"><h3 class="svelte-1d5enw8">Artículos seleccionados</h3> `;
  if (selectedArticulos.length === 0) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<p>No hay artículos seleccionados</p>`;
  } else {
    $$payload.out += "<!--[!-->";
    const each_array = ensure_array_like(selectedArticulos);
    $$payload.out += `<!--[-->`;
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let articulo = each_array[$$index_1];
      const each_array_1 = ensure_array_like(getDecimalDigits(articulo.cantidadDecimal));
      $$payload.out += `<div class="selected-articulo svelte-1d5enw8"><div class="articulo-info svelte-1d5enw8"><div class="articulo-nombre">${escape_html(articulo.Descripcion)}</div> <div class="articulo-codigo">${escape_html(articulo.Codigo)}</div></div> <div class="articulo-actions svelte-1d5enw8"><div class="cantidad-control svelte-1d5enw8"><button type="button" class="btn-cantidad svelte-1d5enw8"${attr("disabled", articulo.cantidadEntera <= 0, true)} aria-label="Disminuir cantidad">-</button> <input type="number" min="0" class="cantidad-input svelte-1d5enw8"${attr("value", articulo.cantidadEntera)} style="width: 40px; text-align: right;"> <span>,</span> <div class="decimal-group-wrapper svelte-1d5enw8"><div class="decimal-group svelte-1d5enw8"><!--[-->`;
      for (let i = 0, $$length2 = each_array_1.length; i < $$length2; i++) {
        let dig = each_array_1[i];
        $$payload.out += `<div class="decimal-digit-group svelte-1d5enw8">`;
        if (focusedCodigo === articulo.Codigo) {
          $$payload.out += "<!--[-->";
          $$payload.out += `<button type="button" class="btn-decimal svelte-1d5enw8">▲</button>`;
        } else {
          $$payload.out += "<!--[!-->";
        }
        $$payload.out += `<!--]--> <input type="text" class="cantidad-decimal-input svelte-1d5enw8"${attr("value", dig)} maxlength="1" size="1" style="width: 32px; height: 40px; font-size: 1.2em; text-align: center; display: inline-block; margin: 2px;"> `;
        if (focusedCodigo === articulo.Codigo) {
          $$payload.out += "<!--[-->";
          $$payload.out += `<button type="button" class="btn-decimal svelte-1d5enw8">▼</button>`;
        } else {
          $$payload.out += "<!--[!-->";
        }
        $$payload.out += `<!--]--></div>`;
      }
      $$payload.out += `<!--]--></div></div> <button type="button" class="btn-cantidad svelte-1d5enw8" aria-label="Aumentar cantidad">+</button></div> <div class="articulo-precio-container svelte-1d5enw8"><span class="articulo-precio-unitario svelte-1d5enw8">$${escape_html(articulo.PrecioVenta?.toFixed(2) || "0.00")}</span> <div class="articulo-total svelte-1d5enw8">$${escape_html(((articulo.PrecioVenta || 0) * cantidadTotal(articulo)).toFixed(2))}</div></div> <button type="button" class="btn-remove svelte-1d5enw8" aria-label="Quitar artículo">×</button></div></div>`;
    }
    $$payload.out += `<!--]--> <div class="total svelte-1d5enw8"><strong>Total:</strong> $${escape_html(selectedArticulos.reduce((sum, a) => sum + (a.PrecioVenta || 0) * ((a.cantidadEntera || 0) + (a.cantidadDecimal || 0) / 1e3), 0).toFixed(2))} (IVA incluido)</div>`;
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, {
    selectedArticulos,
    aumentarCantidad,
    disminuirCantidad,
    quitarArticulo,
    cambiarCantidadDecimal
  });
  pop();
}
function CobroModal($$payload, $$props) {
  push();
  let importeTotal;
  let mostrarModalCobro = fallback($$props["mostrarModalCobro"], false);
  let isLoading = fallback($$props["isLoading"], false);
  let selectedArticulos = fallback($$props["selectedArticulos"], () => [], true);
  let clienteSeleccionado = $$props["clienteSeleccionado"];
  let formasPago = fallback($$props["formasPago"], () => [], true);
  let importeTotalFormasPago = fallback($$props["importeTotalFormasPago"], 0);
  let saldoPendiente = fallback($$props["saldoPendiente"], 0);
  importeTotal = selectedArticulos.reduce((sum, a) => sum + (a.PrecioVenta || 0) * ((a.cantidadEntera || 0) + (a.cantidadDecimal || 0) / 1e3), 0);
  if (mostrarModalCobro) {
    saldoPendiente = importeTotal;
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    if (mostrarModalCobro) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<div class="modal-overlay svelte-q8dajx" role="presentation"><div class="modal-content svelte-q8dajx" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><div class="modal-header svelte-q8dajx"><h2 id="modal-title" class="svelte-q8dajx">Cobro de Venta</h2> <button class="btn-close svelte-q8dajx" aria-label="Cerrar modal" type="button">×</button></div> <div class="modal-body svelte-q8dajx"><div class="cliente-info svelte-q8dajx"><strong>Cliente:</strong> ${escape_html(clienteSeleccionado.Descripcion)}</div> <div class="total-info svelte-q8dajx"><strong>Total a Cobrar:</strong> $${escape_html(importeTotal.toFixed(2))}</div> <div${attr_class("saldo-info svelte-q8dajx", void 0, {
        "pendiente": saldoPendiente > 0,
        "completo": saldoPendiente === 0
      })} role="status" aria-live="polite"><strong>Saldo Pendiente:</strong> $${escape_html(saldoPendiente.toFixed(2))}</div> `;
      FormasPago($$payload2, {
        incluirFormasAplicaSaldo: true,
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
      $$payload2.out += `<!----></div> <div class="modal-footer svelte-q8dajx"><button class="btn-cancelar svelte-q8dajx"${attr("disabled", isLoading, true)} type="button">Cancelar</button> <button class="btn-terminar svelte-q8dajx"${attr("disabled", isLoading || saldoPendiente > 0 || formasPago.length === 0, true)} type="button">${escape_html(isLoading ? "Procesando..." : "Terminar Venta")}</button></div></div></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]-->`;
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  bind_props($$props, {
    mostrarModalCobro,
    isLoading,
    selectedArticulos,
    clienteSeleccionado,
    formasPago,
    importeTotalFormasPago,
    saldoPendiente
  });
  pop();
}
function ClienteNuevoModal($$payload, $$props) {
  push();
  let mostrar = fallback($$props["mostrar"], false);
  let onClose = fallback($$props["onClose"], () => {
  });
  let categoriasIva = [];
  let loading = false;
  let error = "";
  let success = "";
  let cliente = {
    Descripcion: "",
    NombreFantasia: "",
    Cuit: "",
    Calle: "",
    Numero: "",
    Localidad: "",
    Mail: "",
    Telefono: ""
  };
  function resetForm() {
    cliente = {
      Codigo: "",
      Descripcion: "",
      NombreFantasia: "",
      CategoriaIva: "",
      Cuit: "",
      Calle: "",
      Numero: "",
      Localidad: "",
      Mail: "",
      Telefono: "",
      Activo: 1
    };
    error = "";
    success = "";
  }
  if (!mostrar) resetForm();
  if (mostrar) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(categoriasIva);
    $$payload.out += `<div class="modal-backdrop svelte-ha0bel" tabindex="-1" role="dialog" aria-modal="true" aria-label="Nuevo Cliente"><div class="modal svelte-ha0bel" role="dialog" aria-modal="true" aria-label="Nuevo Cliente"><header class="svelte-ha0bel"><h2>Nuevo Cliente</h2> <button class="close svelte-ha0bel" aria-label="Cerrar">×</button></header> <form><div class="form-group svelte-ha0bel"><label for="razonSocial">Razón Social *</label> <input id="razonSocial" type="text"${attr("value", cliente.Descripcion)} maxlength="50" required></div> <div class="form-group svelte-ha0bel"><label for="cuit">CUIT *</label> <input id="cuit" type="text"${attr("value", cliente.Cuit)} maxlength="11" required></div> <div class="form-group svelte-ha0bel"><label for="categoriaIva">Categoría IVA *</label> <select id="categoriaIva" required><option value="">Seleccione una categoría</option><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let categoria = each_array[$$index];
      $$payload.out += `<option${attr("value", categoria.Codigo)}>${escape_html(categoria.Descripcion)}</option>`;
    }
    $$payload.out += `<!--]--></select></div> <div class="form-group svelte-ha0bel"><label for="nombreFantasia">Nombre Fantasía</label> <input id="nombreFantasia" type="text"${attr("value", cliente.NombreFantasia)} maxlength="80"></div> <div class="form-group svelte-ha0bel"><label for="telefono">Teléfono</label> <input id="telefono" type="tel"${attr("value", cliente.Telefono)} maxlength="50"></div> <div class="form-group svelte-ha0bel"><label for="email">Email</label> <input id="email" type="email"${attr("value", cliente.Mail)} maxlength="50"></div> <div class="form-row svelte-ha0bel"><div class="form-group svelte-ha0bel"><label for="calle">Calle</label> <input id="calle" type="text"${attr("value", cliente.Calle)} maxlength="50"></div> <div class="form-group svelte-ha0bel"><label for="numero">Número</label> <input id="numero" type="text"${attr("value", cliente.Numero)} maxlength="15"></div></div> <div class="form-group svelte-ha0bel"><label for="localidad">Localidad</label> <input id="localidad" type="text"${attr("value", cliente.Localidad)} maxlength="50"></div> `;
    if (error) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="error svelte-ha0bel">${escape_html(error)}</div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> `;
    if (success) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="success svelte-ha0bel">${escape_html(success)}</div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div class="modal-actions svelte-ha0bel"><button type="button" class="btn-secondary svelte-ha0bel"${attr("disabled", loading, true)}>Cancelar</button> <button type="submit" class="btn-primary svelte-ha0bel"${attr("disabled", loading, true)}>${escape_html("Guardar")}</button></div></form></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  bind_props($$props, { mostrar, onClose });
  pop();
}
function _page($$payload, $$props) {
  push();
  if (typeof localStorage !== "undefined" && !localStorage.getItem("authToken")) {
    localStorage.setItem("authToken", "bot-telegram-token-temporal");
  }
  let codigoVendedor = "1";
  codigoVendedor = localStorage.getItem("botVendedorCodigo") || "1";
  console.log("codigoVendedor:", codigoVendedor);
  let clienteSeleccionado = { Codigo: "CF", Descripcion: "Consumidor Final" };
  let clientes = [];
  let clientesFiltrados = [];
  let mostrarModalClientes = false;
  let busquedaCliente = "";
  let selectedArticulos = [];
  let isLoading = false;
  let error = null;
  let listaPrecios = "1";
  let mostrarModalCobro = false;
  let mostrarComprobanteDetalle = false;
  let comprobanteActual = {
    tipo: "",
    sucursal: "",
    numero: "",
    clienteNombre: "",
    total: 0,
    items: []
  };
  let mostrarModalNuevoCliente = false;
  let formasPago = [];
  let importeTotalFormasPago = 0;
  let saldoPendiente = 0;
  async function filtrarClientes(event) {
    const input = event.target;
    const busqueda = input.value.toLowerCase();
    busquedaCliente = busqueda;
    if (busqueda.length < 2) {
      clientesFiltrados = clientes.slice(0, 10);
      return;
    }
    isLoading = true;
    try {
      const response = await fetchWithAuth("/clientes", {
        params: {
          page: 1,
          limit: 10,
          search: busqueda,
          field: "Descripcion",
          order: "ASC",
          Activo: 1
        },
        headers: { "Accept": "application/json" }
      });
      const data = await response.json();
      clientesFiltrados = data.items || [];
      if (!clientesFiltrados.find((c) => c.Codigo === "CF")) {
        clientesFiltrados.unshift({ Codigo: "CF", Descripcion: "Consumidor Final" });
      }
    } catch (err) {
      error = "Error al buscar clientes";
      console.error(err);
      clientesFiltrados = clientes.filter((c) => c.Codigo.toLowerCase().includes(busqueda) || c.Descripcion.toLowerCase().includes(busqueda));
    } finally {
      isLoading = false;
    }
  }
  function seleccionarCliente(c) {
    c.Codigo;
    clienteSeleccionado = c;
    mostrarModalClientes = false;
  }
  function agregarArticulo(articulo) {
    const found = selectedArticulos.find((a) => a.Codigo === articulo.Codigo);
    if (found) {
      found.cantidadEntera += 1;
      selectedArticulos = [...selectedArticulos];
    } else {
      selectedArticulos = [
        ...selectedArticulos,
        {
          ...articulo,
          cantidadEntera: 1,
          cantidadDecimal: 0
        }
      ];
    }
  }
  function aumentarCantidad(codigo) {
    const articulo = selectedArticulos.find((a) => a.Codigo === codigo);
    if (articulo) {
      articulo.cantidadEntera += 1;
      selectedArticulos = [...selectedArticulos];
    }
  }
  function disminuirCantidad(codigo) {
    const articulo = selectedArticulos.find((a) => a.Codigo === codigo);
    if (articulo && articulo.cantidadEntera > 0) {
      articulo.cantidadEntera -= 1;
      selectedArticulos = [...selectedArticulos];
    }
  }
  function cambiarCantidadDecimal(codigo, valor) {
    const articulo = selectedArticulos.find((a) => a.Codigo === codigo);
    if (articulo) {
      articulo.cantidadDecimal = valor;
      selectedArticulos = [...selectedArticulos];
    }
  }
  function quitarArticulo(codigo) {
    selectedArticulos = selectedArticulos.filter((a) => a.Codigo !== codigo);
  }
  function handleArticuloKeyDown(event, articulo) {
    if (event.key === "Enter" || event.key === " ") {
      agregarArticulo(articulo);
    }
  }
  function cerrarComprobanteDetalle() {
    mostrarComprobanteDetalle = false;
    clienteSeleccionado = { Codigo: "CF", Descripcion: "Consumidor Final" };
    selectedArticulos = [];
    error = null;
  }
  onDestroy(() => {
  });
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out += `<div class="telegram-webapp svelte-15hwrmv"><button class="btn-volver svelte-15hwrmv">← Volver</button> `;
    if (isLoading) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<div class="loading svelte-15hwrmv">Cargando...</div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    if (error) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<div class="error svelte-15hwrmv">${escape_html(error)}</div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> <form><div class="form-group svelte-15hwrmv"><label for="cliente-display" class="svelte-15hwrmv">Cliente</label> <div class="cliente-selector-row svelte-15hwrmv"><div id="cliente-display" class="cliente-seleccionado svelte-15hwrmv" role="button" tabindex="0" aria-haspopup="dialog"><span class="cliente-label svelte-15hwrmv">${escape_html(clienteSeleccionado.Descripcion)}</span> <button type="button" class="btn-nuevo-cliente svelte-15hwrmv" aria-label="Agregar nuevo cliente">+</button></div></div></div> `;
    ArticulosBusqueda($$payload2, {
      agregarArticulo,
      handleArticuloKeyDown,
      listaPrecios
    });
    $$payload2.out += `<!----> `;
    ArticulosSeleccionados($$payload2, {
      selectedArticulos,
      aumentarCantidad,
      disminuirCantidad,
      quitarArticulo,
      cambiarCantidadDecimal
    });
    $$payload2.out += `<!----> <div class="actions svelte-15hwrmv"><button type="submit" class="btn-primary svelte-15hwrmv"${attr("disabled", isLoading, true)}>${escape_html(isLoading ? "Procesando..." : selectedArticulos.length > 0 ? "Cobrar" : "Agregar artículos")}</button></div></form> `;
    ClienteSelector($$payload2, {
      clientesFiltrados,
      mostrarModalClientes,
      busquedaCliente,
      filtrarClientes,
      seleccionarCliente,
      cerrar: () => mostrarModalClientes = false
    });
    $$payload2.out += `<!----> `;
    CobroModal($$payload2, {
      mostrarModalCobro,
      isLoading,
      selectedArticulos,
      clienteSeleccionado,
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
    $$payload2.out += `<!----> `;
    ComprobanteDetalle($$payload2, {
      comprobante: comprobanteActual,
      mostrar: mostrarComprobanteDetalle,
      onClose: cerrarComprobanteDetalle
    });
    $$payload2.out += `<!----> `;
    ClienteNuevoModal($$payload2, {
      mostrar: mostrarModalNuevoCliente,
      onClose: () => mostrarModalNuevoCliente = false
    });
    $$payload2.out += `<!----></div>`;
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
