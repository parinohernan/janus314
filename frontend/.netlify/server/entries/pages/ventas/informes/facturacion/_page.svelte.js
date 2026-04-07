import { g as sanitize_props, j as spread_props, f as slot, p as push, y as attr_style, v as bind_props, c as pop, n as stringify, z as copy_payload, A as assign_payload, h as head, e as escape_html, l as ensure_array_like, k as attr } from "../../../../../chunks/index3.js";
import "../../../../../chunks/client.js";
import { f as fetchWithAuth } from "../../../../../chunks/authStore.js";
import { D as DatePicker } from "../../../../../chunks/DatePicker.js";
import { B as Button } from "../../../../../chunks/Button.js";
import { o as onDestroy } from "../../../../../chunks/index-server.js";
import { z as fallback } from "../../../../../chunks/utils.js";
import { I as Icon, a as Icon$1 } from "../../../../../chunks/Icon.js";
import "../../../../../chunks/navigationState.js";
import { F as File_text } from "../../../../../chunks/file-text.js";
function Chart_pie($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"
      }
    ],
    [
      "path",
      { "d": "M21.21 15.89A10 10 0 1 1 8 2.83" }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "chart-pie" },
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
function Trending_up($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M16 7h6v6" }],
    ["path", { "d": "m22 7-8.5 8.5-5-5L2 17" }]
  ];
  Icon($$payload, spread_props([
    { name: "trending-up" },
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
function Chart_1($$payload, $$props) {
  push();
  let data = $$props["data"];
  let type = fallback($$props["type"], "bar");
  let options = fallback($$props["options"], () => ({}), true);
  let height = fallback($$props["height"], "400px");
  onDestroy(() => {
  });
  $$payload.out += `<div${attr_style(`height: ${stringify(height)}; position: relative;`)}><canvas></canvas></div>`;
  bind_props($$props, { data, type, options, height });
  pop();
}
function _page($$payload, $$props) {
  push();
  let loading = false;
  let error = null;
  let datos = null;
  let fechaDesde = /* @__PURE__ */ new Date();
  let fechaHasta = /* @__PURE__ */ new Date();
  let agruparPor = "dia";
  async function cargarDatos() {
    try {
      loading = true;
      error = null;
      const params = new URLSearchParams({
        fechaDesde: fechaDesde.toISOString().split("T")[0],
        fechaHasta: fechaHasta.toISOString().split("T")[0],
        agruparPor
      });
      const response = await fetchWithAuth(`/informes/facturacion?${params}`);
      if (!response.ok) {
        throw new Error("Error al cargar los datos");
      }
      const result = await response.json();
      if (result.success) {
        datos = result.data;
        console.log("Datos recibidos:", datos);
        console.log("Evolución de ventas:", datos.evolucionVentas);
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
  function getColorTipo(tipo) {
    const colores = {
      "FCA": "#3B82F6",
      // Azul
      "FCB": "#10B981",
      // Verde
      "FCC": "#F59E0B",
      // Amarillo
      "NCA": "#EF4444",
      // Rojo
      "NCB": "#8B5CF6",
      // Púrpura
      "NCC": "#F97316"
      // Naranja
    };
    return colores[tipo] || "#6B7280";
  }
  if (fechaDesde && fechaHasta) {
    cargarDatos();
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    head($$payload2, ($$payload3) => {
      $$payload3.title = `<title>Informe de Facturación</title>`;
    });
    $$payload2.out += `<div class="container mx-auto p-6 space-y-6"><div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"><div><h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">`;
    Icon$1($$payload2, {
      icon: Chart_pie,
      size: 32,
      strokeWidth: 2.5,
      glass: true
    });
    $$payload2.out += `<!----> Informe de Facturación</h1> <p class="text-gray-600 mt-2">Análisis completo de ventas y facturación</p></div> <div class="flex flex-col sm:flex-row gap-3"><select class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><option value="dia">Por Día</option><option value="semana">Por Semana</option><option value="mes">Por Mes</option></select> `;
    Button($$payload2, {
      variant: "primary",
      disabled: loading,
      children: ($$payload3) => {
        $$payload3.out += `<!---->${escape_html(loading ? "🔄 Cargando..." : "🔄 Actualizar")}`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----></div></div> <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><h2 class="text-lg font-semibold mb-4">📅 Filtros de Fecha</h2> <div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label for="fechaDesde" class="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label> `;
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
    $$payload2.out += `<!----></div></div></div> `;
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
      const each_array = ensure_array_like(datos.agrupacionPorTipo);
      const each_array_1 = ensure_array_like(datos.agrupacionPorVendedor.slice(0, 5));
      const each_array_2 = ensure_array_like(datos.agrupacionPorCliente);
      const each_array_3 = ensure_array_like(datos.facturas.slice(-10).reverse());
      $$payload2.out += `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg"><div class="flex items-center justify-between"><div><p class="text-blue-100 text-sm font-medium">Total Facturas</p> <p class="text-3xl font-bold">${escape_html(datos.estadisticasGenerales.totalFacturas)}</p></div> <div class="text-4xl">📄</div></div></div> <div class="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg"><div class="flex items-center justify-between"><div><p class="text-green-100 text-sm font-medium">Total Ventas</p> <p class="text-3xl font-bold">${escape_html(formatearMoneda(datos.estadisticasGenerales.totalVentas))}</p></div> <div class="text-4xl">💰</div></div></div> <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg"><div class="flex items-center justify-between"><div><p class="text-purple-100 text-sm font-medium">Promedio Ticket</p> <p class="text-3xl font-bold">${escape_html(formatearMoneda(datos.estadisticasGenerales.promedioTicket))}</p></div> <div class="text-4xl">🎫</div></div></div> <div class="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg"><div class="flex items-center justify-between"><div><p class="text-orange-100 text-sm font-medium">Total IVA</p> <p class="text-3xl font-bold">${escape_html(formatearMoneda(datos.estadisticasGenerales.totalIva))}</p></div> <div class="text-4xl">🏛️</div></div></div></div> <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><h2 class="text-xl font-semibold mb-6">📈 Evolución de Ventas</h2> `;
      if (datos.evolucionVentas && datos.evolucionVentas.length > 0) {
        $$payload2.out += "<!--[-->";
        const chartData = {
          labels: datos.evolucionVentas.map((item) => {
            {
              return new Date(item.periodo).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
            }
          }),
          datasets: [
            {
              label: "Ventas ($)",
              data: datos.evolucionVentas.map((item) => item.monto),
              backgroundColor: "rgba(59, 130, 246, 0.8)",
              borderColor: "rgba(59, 130, 246, 1)",
              borderWidth: 2,
              borderRadius: 4,
              borderSkipped: false
            }
          ]
        };
        const chartOptions = {
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label(context) {
                  const item = datos.evolucionVentas[context.dataIndex];
                  if (item) {
                    return [
                      `Ventas: ${formatearMoneda(context.parsed.y)}`,
                      `Facturas: ${item.cantidad}`,
                      `Fecha: ${item.periodo}`
                    ];
                  }
                  return `Ventas: ${formatearMoneda(context.parsed.y)}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback(value) {
                  if (typeof value === "number") {
                    return formatearMoneda(value);
                  }
                  return value;
                }
              }
            }
          }
        };
        Chart_1($$payload2, {
          data: chartData,
          type: "bar",
          options: chartOptions,
          height: "400px"
        });
      } else {
        $$payload2.out += "<!--[!-->";
        $$payload2.out += `<div class="h-80 flex items-center justify-center text-gray-500"><div class="text-center"><div class="mb-4">`;
        Icon$1($$payload2, {
          icon: Trending_up,
          size: 40,
          strokeWidth: 2,
          glass: true
        });
        $$payload2.out += `<!----></div> <p>No hay datos de evolución de ventas para el período seleccionado</p></div></div>`;
      }
      $$payload2.out += `<!--]--></div> <div class="grid grid-cols-1 lg:grid-cols-2 gap-6"><div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><h2 class="text-xl font-semibold mb-6">📋 Distribución por Tipo</h2> <div class="space-y-4"><!--[-->`;
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let item = each_array[$$index];
        $$payload2.out += `<div class="flex items-center justify-between"><div class="flex items-center gap-3"><div class="w-4 h-4 rounded-full"${attr_style(`background-color: ${stringify(getColorTipo(item.tipo))}`)}></div> <span class="font-medium">${escape_html(item.tipo)}</span></div> <div class="text-right"><div class="font-semibold">${escape_html(formatearMoneda(item.monto))}</div> <div class="text-sm text-gray-500">${escape_html(item.cantidad)} facturas</div></div></div>`;
      }
      $$payload2.out += `<!--]--></div></div> <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><h2 class="text-xl font-semibold mb-6">👥 Top Vendedores</h2> <div class="space-y-4"><!--[-->`;
      for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
        let vendedor = each_array_1[i];
        $$payload2.out += `<div class="flex items-center justify-between"><div class="flex items-center gap-3"><div class="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">${escape_html(i + 1)}</div> <div><div class="font-medium">${escape_html(vendedor.nombre)}</div> <div class="text-sm text-gray-500">${escape_html(vendedor.cantidad)} ventas</div></div></div> <div class="text-right font-semibold">${escape_html(formatearMoneda(vendedor.monto))}</div></div>`;
      }
      $$payload2.out += `<!--]--></div></div></div> <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><h2 class="text-xl font-semibold mb-6">🏆 Top 10 Clientes</h2> <div class="overflow-x-auto"><table class="w-full"><thead><tr class="border-b border-gray-200"><th class="text-left py-3 px-4 font-semibold">#</th><th class="text-left py-3 px-4 font-semibold">Cliente</th><th class="text-right py-3 px-4 font-semibold">Cantidad</th><th class="text-right py-3 px-4 font-semibold">Total</th></tr></thead><tbody><!--[-->`;
      for (let i = 0, $$length = each_array_2.length; i < $$length; i++) {
        let cliente = each_array_2[i];
        $$payload2.out += `<tr class="border-b border-gray-100 hover:bg-gray-50"><td class="py-3 px-4"><div class="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">${escape_html(i + 1)}</div></td><td class="py-3 px-4 font-medium">${escape_html(cliente.nombre)}</td><td class="py-3 px-4 text-right text-gray-600">${escape_html(cliente.cantidad)}</td><td class="py-3 px-4 text-right font-semibold">${escape_html(formatearMoneda(cliente.monto))}</td></tr>`;
      }
      $$payload2.out += `<!--]--></tbody></table></div></div> <div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><h2 class="text-xl font-semibold mb-6">✅ Estado CAE</h2> <div class="flex items-center justify-center"><div class="relative w-32 h-32"><svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36"><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" stroke-width="2"></path>`;
      if (datos.estadisticasGenerales.totalFacturas > 0) {
        $$payload2.out += "<!--[-->";
        const porcentaje = datos.estadisticasGenerales.facturasConCae / datos.estadisticasGenerales.totalFacturas * 100;
        $$payload2.out += `<path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" stroke-width="2"${attr("stroke-dasharray", `${stringify(porcentaje)}, 100`)}></path>`;
      } else {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]--></svg> <div class="absolute inset-0 flex items-center justify-center"><div class="text-center"><div class="text-2xl font-bold text-green-600">${escape_html(datos.estadisticasGenerales.totalFacturas > 0 ? (datos.estadisticasGenerales.facturasConCae / datos.estadisticasGenerales.totalFacturas * 100).toFixed(1) : "0")}%</div> <div class="text-sm text-gray-500">Con CAE</div></div></div></div></div> <div class="mt-4 text-center"><div class="text-sm text-gray-600">${escape_html(datos.estadisticasGenerales.facturasConCae)} de ${escape_html(datos.estadisticasGenerales.totalFacturas)} facturas</div></div></div> <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><h2 class="text-xl font-semibold mb-6 flex items-center gap-2">`;
      Icon$1($$payload2, {
        icon: File_text,
        size: 20,
        strokeWidth: 2.5,
        glass: true
      });
      $$payload2.out += `<!----> Resumen Financiero</h2> <div class="space-y-4"><div class="flex justify-between items-center"><span class="text-gray-600">Ventas Brutas:</span> <span class="font-semibold">${escape_html(formatearMoneda(datos.estadisticasGenerales.totalVentas + datos.estadisticasGenerales.totalBonificaciones))}</span></div> <div class="flex justify-between items-center"><span class="text-gray-600">Bonificaciones:</span> <span class="font-semibold text-red-600">-${escape_html(formatearMoneda(datos.estadisticasGenerales.totalBonificaciones))}</span></div> <div class="flex justify-between items-center"><span class="text-gray-600">IVA:</span> <span class="font-semibold text-blue-600">+${escape_html(formatearMoneda(datos.estadisticasGenerales.totalIva))}</span></div> <hr class="border-gray-200"> <div class="flex justify-between items-center text-lg font-bold"><span>Total Neto:</span> <span class="text-green-600">${escape_html(formatearMoneda(datos.estadisticasGenerales.totalVentas))}</span></div></div></div></div> <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><h2 class="text-xl font-semibold mb-6">📋 Facturas Recientes</h2> <div class="overflow-x-auto"><table class="w-full"><thead><tr class="border-b border-gray-200"><th class="text-left py-3 px-4 font-semibold">Número</th><th class="text-left py-3 px-4 font-semibold">Fecha</th><th class="text-left py-3 px-4 font-semibold">Cliente</th><th class="text-left py-3 px-4 font-semibold">Vendedor</th><th class="text-right py-3 px-4 font-semibold">Monto</th><th class="text-center py-3 px-4 font-semibold">CAE</th></tr></thead><tbody><!--[-->`;
      for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
        let factura = each_array_3[$$index_3];
        $$payload2.out += `<tr class="border-b border-gray-100 hover:bg-gray-50"><td class="py-3 px-4"><span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"${attr_style(`background-color: ${stringify(getColorTipo(factura.tipo))}20; color: ${stringify(getColorTipo(factura.tipo))}`)}>${escape_html(factura.numero)}</span></td><td class="py-3 px-4 text-gray-600">${escape_html(new Date(factura.fecha).toLocaleDateString("es-AR"))}</td><td class="py-3 px-4 font-medium">${escape_html(factura.cliente)}</td><td class="py-3 px-4 text-gray-600">${escape_html(factura.vendedor)}</td><td class="py-3 px-4 text-right font-semibold">${escape_html(formatearMoneda(factura.monto))}</td><td class="py-3 px-4 text-center">`;
        if (factura.tieneCae) {
          $$payload2.out += "<!--[-->";
          $$payload2.out += `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✅</span>`;
        } else {
          $$payload2.out += "<!--[!-->";
          $$payload2.out += `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">❌</span>`;
        }
        $$payload2.out += `<!--]--></td></tr>`;
      }
      $$payload2.out += `<!--]--></tbody></table></div></div>`;
    } else if (!loading) {
      $$payload2.out += "<!--[2-->";
      $$payload2.out += `<div class="text-center py-12"><div class="mb-4">`;
      Icon$1($$payload2, {
        icon: Chart_pie,
        size: 64,
        strokeWidth: 2,
        glass: true
      });
      $$payload2.out += `<!----></div> <h3 class="text-xl font-semibold text-gray-900 mb-2">Selecciona un rango de fechas</h3> <p class="text-gray-600">Para ver el informe de facturación, selecciona las fechas de inicio y fin.</p></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div>`;
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
