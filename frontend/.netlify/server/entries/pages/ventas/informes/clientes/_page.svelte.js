import { g as sanitize_props, j as spread_props, f as slot, z as copy_payload, A as assign_payload, c as pop, p as push, l as ensure_array_like, h as head, k as attr, e as escape_html } from "../../../../../chunks/index3.js";
import "../../../../../chunks/client.js";
import { f as fetchWithAuth } from "../../../../../chunks/authStore.js";
import { D as DatePicker } from "../../../../../chunks/DatePicker.js";
import { B as Button } from "../../../../../chunks/Button.js";
import { I as Icon, a as Icon$1 } from "../../../../../chunks/Icon.js";
import "../../../../../chunks/navigationState.js";
function Chart_column($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M3 3v16a2 2 0 0 0 2 2h16" }],
    ["path", { "d": "M18 17V9" }],
    ["path", { "d": "M13 17V5" }],
    ["path", { "d": "M8 17v-3" }]
  ];
  Icon($$payload, spread_props([
    { name: "chart-column" },
    $$sanitized_props,
    {
      iconNode,
      children: ($$payload2) => {
        $$payload2.out += `<!---->`;
        slot($$payload2, $$props, "default", {});
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
}
function Users($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      }
    ],
    [
      "path",
      { "d": "M16 3.128a4 4 0 0 1 0 7.744" }
    ],
    ["path", { "d": "M22 21v-2a4 4 0 0 0-3-3.87" }],
    ["circle", { "cx": "9", "cy": "7", "r": "4" }]
  ];
  Icon($$payload, spread_props([
    { name: "users" },
    $$sanitized_props,
    {
      iconNode,
      children: ($$payload2) => {
        $$payload2.out += `<!---->`;
        slot($$payload2, $$props, "default", {});
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
}
function _page($$payload, $$props) {
  push();
  let loading = false;
  let error = null;
  let datos = null;
  let vendedores = [];
  let categoriasIva = [];
  let localidadesDisponibles = [];
  let fechaDesde = /* @__PURE__ */ new Date();
  let fechaHasta = /* @__PURE__ */ new Date();
  let localidad = "";
  let vendedorCodigo = "";
  let categoriaIva = "";
  let clienteSeleccionado = null;
  async function cargarDatos() {
    try {
      loading = true;
      error = null;
      clienteSeleccionado = null;
      const params = new URLSearchParams({
        fechaDesde: fechaDesde.toISOString().split("T")[0],
        fechaHasta: fechaHasta.toISOString().split("T")[0]
      });
      if (localidad) ;
      if (vendedorCodigo) ;
      if (categoriaIva) ;
      const response = await fetchWithAuth(`/informes/ventas-por-clientes?${params}`);
      if (!response.ok) {
        throw new Error("Error al cargar los datos");
      }
      const result = await response.json();
      if (result.success) {
        datos = result.data;
        const localidadesSet = /* @__PURE__ */ new Set();
        datos.clientes.forEach((cliente) => {
          if (cliente.localidad && cliente.localidad !== "Sin localidad") {
            localidadesSet.add(cliente.localidad);
          }
        });
        localidadesDisponibles = Array.from(localidadesSet).sort();
        console.log("Datos recibidos:", datos);
      } else {
        throw new Error(result.message || "Error en el servidor");
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
      error = err instanceof Error ? err.message : "Error desconocido";
    } finally {
      loading = false;
    }
  }
  function formatearMoneda(valor) {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(valor);
  }
  if (fechaDesde && fechaHasta) {
    cargarDatos();
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    const each_array_1 = ensure_array_like(vendedores);
    const each_array_2 = ensure_array_like(categoriasIva);
    head($$payload2, ($$payload3) => {
      $$payload3.title = `<title>Informe de Ventas por Clientes</title>`;
    });
    $$payload2.out += `<div class="container mx-auto p-6 space-y-6"><div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"><div><h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">`;
    Icon$1($$payload2, {
      icon: Users,
      size: 32,
      strokeWidth: 2.5,
      glass: true
    });
    $$payload2.out += `<!----> Informe de Ventas por Clientes</h1> <p class="text-gray-600 mt-2">Análisis detallado de ventas por cliente con filtros avanzados</p></div> <div class="flex gap-3">`;
    Button($$payload2, {
      variant: "secondary",
      disabled: loading,
      children: ($$payload3) => {
        $$payload3.out += `<!---->🔄 Limpiar Filtros`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----> `;
    Button($$payload2, {
      variant: "primary",
      disabled: loading,
      children: ($$payload3) => {
        $$payload3.out += `<!---->${escape_html(loading ? "🔄 Cargando..." : "🔍 Buscar")}`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----></div></div> <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><h2 class="text-lg font-semibold mb-4">🔍 Filtros</h2> <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><div><label for="fechaDesde" class="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label> `;
    DatePicker($$payload2, {
      id: "fechaDesde",
      get value() {
        return fechaDesde;
      },
      set value($$value) {
        fechaDesde = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!----></div> <div><label for="fechaHasta" class="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label> `;
    DatePicker($$payload2, {
      id: "fechaHasta",
      get value() {
        return fechaHasta;
      },
      set value($$value) {
        fechaHasta = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!----></div></div> <div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label for="localidad" class="block text-sm font-medium text-gray-700 mb-2">🏙️ Localidad</label> <input type="text" id="localidad"${attr("value", localidad)} placeholder="Filtrar por localidad..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" list="localidades-list"> `;
    if (localidadesDisponibles.length > 0) {
      $$payload2.out += "<!--[-->";
      const each_array = ensure_array_like(localidadesDisponibles);
      $$payload2.out += `<datalist id="localidades-list"><!--[-->`;
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let loc = each_array[$$index];
        $$payload2.out += `<option${attr("value", loc)}></option>`;
      }
      $$payload2.out += `<!--]--></datalist>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div> <div><label for="vendedor" class="block text-sm font-medium text-gray-700 mb-2">👤 Vendedor</label> <select id="vendedor" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><option value="">Todos los vendedores</option><!--[-->`;
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let vendedor = each_array_1[$$index_1];
      $$payload2.out += `<option${attr("value", vendedor.Codigo)}>${escape_html(vendedor.Descripcion)}</option>`;
    }
    $$payload2.out += `<!--]--></select></div> <div><label for="categoriaIva" class="block text-sm font-medium text-gray-700 mb-2">📋 Categoría IVA</label> <select id="categoriaIva" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><option value="">Todas las categorías</option><!--[-->`;
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let cat = each_array_2[$$index_2];
      $$payload2.out += `<option${attr("value", cat.Codigo)}>${escape_html(cat.Descripcion)}</option>`;
    }
    $$payload2.out += `<!--]--></select></div></div> `;
    if (datos && datos.filtrosAplicados) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<div class="mt-4 flex flex-wrap gap-2"><span class="text-sm font-medium text-gray-700">Filtros aplicados:</span> `;
      if (datos.filtrosAplicados.localidad !== "Todos") {
        $$payload2.out += "<!--[-->";
        $$payload2.out += `<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">Localidad: ${escape_html(datos.filtrosAplicados.localidad)}</span>`;
      } else {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]--> `;
      if (datos.filtrosAplicados.vendedor !== "Todos") {
        $$payload2.out += "<!--[-->";
        $$payload2.out += `<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Vendedor: ${escape_html(datos.filtrosAplicados.vendedor)}</span>`;
      } else {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]--> `;
      if (datos.filtrosAplicados.categoriaIva !== "Todas") {
        $$payload2.out += "<!--[-->";
        $$payload2.out += `<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">IVA: ${escape_html(datos.filtrosAplicados.categoriaIva)}</span>`;
      } else {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]--></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div> `;
    if (error) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"><p>❌ ${escape_html(error)}</p></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    if (loading) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<div class="flex justify-center items-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 svelte-jtt58"></div></div>`;
    } else if (datos) {
      $$payload2.out += "<!--[1-->";
      $$payload2.out += `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg"><div class="flex items-center justify-between"><div><p class="text-blue-100 text-sm font-medium">Total Clientes</p> <p class="text-3xl font-bold">${escape_html(datos.estadisticasGenerales.totalClientes)}</p></div> <div class="text-4xl">👥</div></div></div> <div class="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg"><div class="flex items-center justify-between"><div><p class="text-green-100 text-sm font-medium">Total Ventas</p> <p class="text-3xl font-bold">${escape_html(formatearMoneda(datos.estadisticasGenerales.totalVentas))}</p></div> <div class="text-4xl">💰</div></div></div> <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg"><div class="flex items-center justify-between"><div><p class="text-purple-100 text-sm font-medium">Total Facturas</p> <p class="text-3xl font-bold">${escape_html(datos.estadisticasGenerales.totalFacturas)}</p></div> <div class="text-4xl">📄</div></div></div> <div class="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg"><div class="flex items-center justify-between"><div><p class="text-orange-100 text-sm font-medium">Promedio x Cliente</p> <p class="text-3xl font-bold">${escape_html(formatearMoneda(datos.estadisticasGenerales.promedioVentaCliente))}</p></div> `;
      Icon$1($$payload2, {
        icon: Chart_column,
        size: 40,
        strokeWidth: 2,
        glass: true
      });
      $$payload2.out += `<!----></div></div></div> <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><h2 class="text-xl font-semibold mb-6">📋 Ventas por Cliente</h2> `;
      if (datos.clientes.length === 0) {
        $$payload2.out += "<!--[-->";
        $$payload2.out += `<div class="text-center py-12"><div class="text-6xl mb-4">🔍</div> <h3 class="text-xl font-semibold text-gray-900 mb-2">No hay datos</h3> <p class="text-gray-600">No se encontraron ventas de clientes con los filtros seleccionados.</p></div>`;
      } else {
        $$payload2.out += "<!--[!-->";
        const each_array_3 = ensure_array_like(datos.clientes);
        $$payload2.out += `<div class="overflow-x-auto"><table class="w-full"><thead><tr class="border-b border-gray-200"><th class="text-left py-3 px-4 font-semibold">#</th><th class="text-left py-3 px-4 font-semibold">Cliente</th><th class="text-left py-3 px-4 font-semibold">CUIT</th><th class="text-left py-3 px-4 font-semibold">Localidad</th><th class="text-left py-3 px-4 font-semibold">Vendedor</th><th class="text-left py-3 px-4 font-semibold">Cat. IVA</th><th class="text-right py-3 px-4 font-semibold">Facturas</th><th class="text-right py-3 px-4 font-semibold">Total</th><th class="text-center py-3 px-4 font-semibold">Acciones</th></tr></thead><tbody><!--[-->`;
        for (let i = 0, $$length = each_array_3.length; i < $$length; i++) {
          let cliente = each_array_3[i];
          $$payload2.out += `<tr class="border-b border-gray-100 hover:bg-gray-50"><td class="py-3 px-4"><div class="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">${escape_html(i + 1)}</div></td><td class="py-3 px-4"><div class="font-medium">${escape_html(cliente.descripcion)}</div> <div class="text-sm text-gray-500">Código: ${escape_html(cliente.codigo)}</div></td><td class="py-3 px-4 text-gray-600">${escape_html(cliente.cuit || "N/A")}</td><td class="py-3 px-4"><span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">${escape_html(cliente.localidad)}</span></td><td class="py-3 px-4 text-gray-600">${escape_html(cliente.vendedorDescripcion)}</td><td class="py-3 px-4"><span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">${escape_html(cliente.categoriaIvaDescripcion)}</span></td><td class="py-3 px-4 text-right text-gray-600">${escape_html(cliente.cantidadFacturas)}</td><td class="py-3 px-4 text-right font-semibold text-green-600">${escape_html(formatearMoneda(cliente.totalVentas))}</td><td class="py-3 px-4 text-center"><button class="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors">👁️ Ver Detalle</button></td></tr>`;
        }
        $$payload2.out += `<!--]--></tbody></table></div>`;
      }
      $$payload2.out += `<!--]--></div>`;
    } else if (!loading) {
      $$payload2.out += "<!--[2-->";
      $$payload2.out += `<div class="text-center py-12"><div class="text-6xl mb-4">👥</div> <h3 class="text-xl font-semibold text-gray-900 mb-2">Selecciona los filtros</h3> <p class="text-gray-600">Configura los filtros y presiona "Buscar" para ver el informe.</p></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div> `;
    if (clienteSeleccionado) {
      $$payload2.out += "<!--[-->";
      const each_array_4 = ensure_array_like(clienteSeleccionado.facturas);
      $$payload2.out += `<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"><div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6"><div class="flex justify-between items-start"><div><h3 class="text-2xl font-bold mb-2">${escape_html(clienteSeleccionado.descripcion)}</h3> <div class="space-y-1 text-blue-100"><p>Código: ${escape_html(clienteSeleccionado.codigo)}</p> <p>CUIT: ${escape_html(clienteSeleccionado.cuit || "N/A")}</p> <p>Localidad: ${escape_html(clienteSeleccionado.localidad)}</p></div></div> <button class="text-white hover:bg-blue-700 rounded-full p-2 transition-colors"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div></div> <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]"><div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"><div class="bg-blue-50 p-4 rounded-lg"><p class="text-sm text-blue-600 font-medium mb-1">Total Ventas</p> <p class="text-2xl font-bold text-blue-900">${escape_html(formatearMoneda(clienteSeleccionado.totalVentas))}</p></div> <div class="bg-green-50 p-4 rounded-lg"><p class="text-sm text-green-600 font-medium mb-1">Cantidad Facturas</p> <p class="text-2xl font-bold text-green-900">${escape_html(clienteSeleccionado.cantidadFacturas)}</p></div> <div class="bg-purple-50 p-4 rounded-lg"><p class="text-sm text-purple-600 font-medium mb-1">Promedio Factura</p> <p class="text-2xl font-bold text-purple-900">${escape_html(formatearMoneda(clienteSeleccionado.totalVentas / clienteSeleccionado.cantidadFacturas))}</p></div></div> <div class="mb-6 p-4 bg-gray-50 rounded-lg"><h4 class="font-semibold mb-3">Información del Cliente</h4> <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm"><div><span class="text-gray-600">Vendedor:</span> <span class="font-medium ml-2">${escape_html(clienteSeleccionado.vendedorDescripcion)}</span></div> <div><span class="text-gray-600">Categoría IVA:</span> <span class="font-medium ml-2">${escape_html(clienteSeleccionado.categoriaIvaDescripcion)}</span></div> <div><span class="text-gray-600">Total IVA:</span> <span class="font-medium ml-2">${escape_html(formatearMoneda(clienteSeleccionado.totalIva))}</span></div></div></div> <div><h4 class="font-semibold mb-3">Facturas del Período</h4> <div class="overflow-x-auto"><table class="w-full"><thead><tr class="border-b border-gray-200 bg-gray-50"><th class="text-left py-2 px-3 text-sm font-semibold">Tipo</th><th class="text-left py-2 px-3 text-sm font-semibold">Número</th><th class="text-left py-2 px-3 text-sm font-semibold">Fecha</th><th class="text-right py-2 px-3 text-sm font-semibold">Importe</th></tr></thead><tbody><!--[-->`;
      for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
        let factura = each_array_4[$$index_4];
        $$payload2.out += `<tr class="border-b border-gray-100"><td class="py-2 px-3"><span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">${escape_html(factura.tipo)}</span></td><td class="py-2 px-3 text-sm">${escape_html(factura.numero)}</td><td class="py-2 px-3 text-sm text-gray-600">${escape_html(new Date(factura.fecha).toLocaleDateString("es-AR"))}</td><td class="py-2 px-3 text-sm text-right font-semibold">${escape_html(formatearMoneda(factura.importe))}</td></tr>`;
      }
      $$payload2.out += `<!--]--></tbody></table></div></div></div> <div class="p-4 bg-gray-50 border-t border-gray-200">`;
      Button($$payload2, {
        variant: "secondary",
        class: "w-full",
        children: ($$payload3) => {
          $$payload3.out += `<!---->Cerrar`;
        },
        $$slots: { default: true }
      });
      $$payload2.out += `<!----></div></div></div>`;
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
  pop();
}
export {
  _page as default
};
