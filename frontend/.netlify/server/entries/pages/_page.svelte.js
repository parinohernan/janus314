import { g as sanitize_props, j as spread_props, f as slot, k as attr, e as escape_html, l as ensure_array_like, m as attr_class, n as stringify, c as pop, p as push, d as store_get, u as unsubscribe_stores } from "../../chunks/index3.js";
import "clsx";
import { a as auth } from "../../chunks/authStore.js";
/* empty css                                              */
import { I as Icon, a as Icon$1 } from "../../chunks/Icon.js";
import "../../chunks/client.js";
import "../../chunks/tabsStore.js";
import { C as Circle_user } from "../../chunks/circle-user.js";
import { F as File_text } from "../../chunks/file-text.js";
import { Z as Zap } from "../../chunks/zap.js";
function Circle_alert($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "circle",
      { "cx": "12", "cy": "12", "r": "10" }
    ],
    [
      "line",
      {
        "x1": "12",
        "x2": "12",
        "y1": "8",
        "y2": "12"
      }
    ],
    [
      "line",
      {
        "x1": "12",
        "x2": "12.01",
        "y1": "16",
        "y2": "16"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "circle-alert" },
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
function Clock($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "circle",
      { "cx": "12", "cy": "12", "r": "10" }
    ],
    ["path", { "d": "M12 6v6l4 2" }]
  ];
  Icon($$payload, spread_props([
    { name: "clock" },
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
function Dollar_sign($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "line",
      {
        "x1": "12",
        "x2": "12",
        "y1": "2",
        "y2": "22"
      }
    ],
    [
      "path",
      {
        "d": "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "dollar-sign" },
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
function Package_x($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"
      }
    ],
    ["path", { "d": "m7.5 4.27 9 5.15" }],
    [
      "polyline",
      { "points": "3.29 7 12 12 20.71 7" }
    ],
    [
      "line",
      {
        "x1": "12",
        "x2": "12",
        "y1": "22",
        "y2": "12"
      }
    ],
    ["path", { "d": "m17 13 5 5m-5 0 5-5" }]
  ];
  Icon($$payload, spread_props([
    { name: "package-x" },
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
function Package($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"
      }
    ],
    ["path", { "d": "M12 22V12" }],
    [
      "polyline",
      { "points": "3.29 7 12 12 20.71 7" }
    ],
    ["path", { "d": "m7.5 4.27 9 5.15" }]
  ];
  Icon($$payload, spread_props([
    { name: "package" },
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
function Refresh_cw($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
      }
    ],
    ["path", { "d": "M21 3v5h-5" }],
    [
      "path",
      {
        "d": "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
      }
    ],
    ["path", { "d": "M8 16H3v5" }]
  ];
  Icon($$payload, spread_props([
    { name: "refresh-cw" },
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
function Triangle_alert($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
      }
    ],
    ["path", { "d": "M12 9v4" }],
    ["path", { "d": "M12 17h.01" }]
  ];
  Icon($$payload, spread_props([
    { name: "triangle-alert" },
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
function User_plus($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      }
    ],
    ["circle", { "cx": "9", "cy": "7", "r": "4" }],
    [
      "line",
      {
        "x1": "19",
        "x2": "19",
        "y1": "8",
        "y2": "14"
      }
    ],
    [
      "line",
      {
        "x1": "22",
        "x2": "16",
        "y1": "11",
        "y2": "11"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "user-plus" },
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
function VendedoresWidget($$payload, $$props) {
  push();
  let { vendedores, loading = false } = $$props;
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timezoneOffset = (/* @__PURE__ */ new Date()).toLocaleTimeString("es-AR", { timeZoneName: "short" }).split(" ").pop() || "GMT-3";
  function getEstadoColor(vendedor) {
    if (vendedor.pedidosSinFacturar > 5) return "text-red-500";
    if (vendedor.pedidosSinFacturar > 0) return "text-yellow-500";
    return "text-green-500";
  }
  function getEstadoBadge(vendedor) {
    if (vendedor.activo) return {
      text: "Activo hoy",
      class: "bg-green-100 text-green-700"
    };
    if (vendedor.pedidosSinFacturar > 0) return {
      text: "Con pendientes",
      class: "bg-yellow-100 text-yellow-700"
    };
    return {
      text: "Sin actividad",
      class: "bg-gray-100 text-gray-600"
    };
  }
  function formatearFecha(fecha) {
    if (!fecha) return "Sin pedidos";
    const fechaPedido = new Date(fecha);
    const hoy = /* @__PURE__ */ new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    const esMismoDia = (d1, d2) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
    if (esMismoDia(fechaPedido, hoy)) {
      return `Hoy ${fechaPedido.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (esMismoDia(fechaPedido, ayer)) {
      return `Ayer ${fechaPedido.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      const diasAtras = Math.floor((hoy.getTime() - fechaPedido.getTime()) / (1e3 * 60 * 60 * 24));
      return `Hace ${diasAtras} día${diasAtras !== 1 ? "s" : ""}`;
    }
  }
  $$payload.out += `<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50"><div class="flex items-center justify-between"><div class="flex items-center gap-2">`;
  Icon$1($$payload, {
    icon: Circle_user,
    size: 24,
    strokeWidth: 2.5,
    glass: true
  });
  $$payload.out += `<!----> <h2 class="text-lg font-semibold text-gray-900">Estado de Vendedores</h2></div> <div class="flex items-center gap-3"><span class="text-xs text-gray-500"${attr("title", `Timezone: ${userTimezone}`)}>Hora local (${escape_html(timezoneOffset)})</span> <span class="text-sm text-gray-600">${escape_html(vendedores.length)} vendedores</span></div></div></div> <div class="divide-y divide-gray-100">`;
  if (loading) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="p-12 text-center"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div> <p class="mt-4 text-sm text-gray-600">Cargando vendedores...</p></div>`;
  } else if (vendedores.length === 0) {
    $$payload.out += "<!--[1-->";
    $$payload.out += `<div class="p-12 text-center">`;
    Icon$1($$payload, {
      icon: Circle_alert,
      size: 48,
      strokeWidth: 2,
      class: "mx-auto text-gray-400 mb-4"
    });
    $$payload.out += `<!----> <p class="text-gray-600">No hay vendedores activos</p></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    const each_array = ensure_array_like(vendedores);
    $$payload.out += `<!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let vendedor = each_array[$$index];
      $$payload.out += `<button class="w-full px-6 py-4 hover:bg-gray-50 transition-colors text-left"><div class="flex items-start justify-between gap-4"><div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-2"><div${attr_class(`w-2 h-2 rounded-full ${stringify(getEstadoColor(vendedor))}`)}></div> <h3 class="font-semibold text-gray-900 truncate">${escape_html(vendedor.nombre)}</h3> <span${attr_class(`px-2 py-1 rounded-full text-xs font-medium ${stringify(getEstadoBadge(vendedor).class)}`)}>${escape_html(getEstadoBadge(vendedor).text)}</span></div> <div class="flex items-center gap-4 text-sm text-gray-600"><div class="flex items-center gap-1">`;
      Icon$1($$payload, { icon: Clock, size: 14, strokeWidth: 2 });
      $$payload.out += `<!----> <span>${escape_html(formatearFecha(vendedor.ultimoPedido?.fecha || null))}</span></div> `;
      if (vendedor.pedidosSinFacturar > 0) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="flex items-center gap-1 text-orange-600 font-medium">`;
        Icon$1($$payload, { icon: File_text, size: 14, strokeWidth: 2.5 });
        $$payload.out += `<!----> <span>${escape_html(vendedor.pedidosSinFacturar)} pedido${escape_html(vendedor.pedidosSinFacturar !== 1 ? "s" : "")} sin facturar</span></div>`;
      } else {
        $$payload.out += "<!--[!-->";
        $$payload.out += `<div class="flex items-center gap-1 text-green-600"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg> <span class="text-sm">Sin pedidos pendientes</span></div>`;
      }
      $$payload.out += `<!--]--></div> `;
      if (vendedor.ultimoPedido) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="mt-1 text-xs text-gray-500">Último: ${escape_html(vendedor.ultimoPedido.numero)} - ${escape_html(vendedor.ultimoPedido.cliente)}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></div> `;
      if (vendedor.pedidosSinFacturar > 0) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="flex-shrink-0"><div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg"><span class="text-white font-bold text-lg">${escape_html(vendedor.pedidosSinFacturar)}</span></div></div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></div></button>`;
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]--></div></div>`;
  pop();
}
function StockCriticoWidget($$payload, $$props) {
  push();
  let {
    sinStock,
    bajoMinimo,
    loading = false
  } = $$props;
  const totalProductosCriticos = sinStock.length + bajoMinimo.length;
  $$payload.out += `<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50"><div class="flex items-center justify-between"><div class="flex items-center gap-2">`;
  Icon$1($$payload, {
    icon: Triangle_alert,
    size: 24,
    strokeWidth: 2.5,
    glass: true
  });
  $$payload.out += `<!----> <h2 class="text-lg font-semibold text-gray-900">Stock Crítico</h2></div> `;
  if (totalProductosCriticos > 0) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span class="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">${escape_html(totalProductosCriticos)} alerta${escape_html(totalProductosCriticos !== 1 ? "s" : "")}</span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div> <div class="max-h-96 overflow-y-auto">`;
  if (loading) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="p-12 text-center"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div> <p class="mt-4 text-sm text-gray-600">Cargando stock...</p></div>`;
  } else if (totalProductosCriticos === 0) {
    $$payload.out += "<!--[1-->";
    $$payload.out += `<div class="p-12 text-center"><svg class="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> <p class="text-gray-900 font-medium mb-1">¡Todo en orden!</p> <p class="text-sm text-gray-600">No hay productos con stock crítico</p></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    if (sinStock.length > 0) {
      $$payload.out += "<!--[-->";
      const each_array = ensure_array_like(sinStock);
      $$payload.out += `<div class="border-b border-gray-200"><div class="px-6 py-3 bg-red-50"><div class="flex items-center gap-2">`;
      Icon$1($$payload, {
        icon: Package_x,
        size: 18,
        strokeWidth: 2.5,
        class: "text-red-600"
      });
      $$payload.out += `<!----> <h3 class="font-semibold text-red-900 text-sm">Sin Stock (${escape_html(sinStock.length)})</h3></div></div> <div class="divide-y divide-gray-100"><!--[-->`;
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let producto = each_array[$$index];
        $$payload.out += `<button class="w-full px-6 py-3 hover:bg-gray-50 transition-colors text-left"><div class="flex items-start justify-between gap-4"><div class="flex-1 min-w-0"><p class="font-medium text-gray-900 truncate">${escape_html(producto.descripcion)}</p> <p class="text-sm text-gray-500">Código: ${escape_html(producto.codigo)}</p></div> <div class="flex-shrink-0 text-right"><div class="px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-semibold">${escape_html(producto.existencia)}</div> <p class="text-xs text-gray-500 mt-1">Mín: ${escape_html(producto.stockMinimo)}</p></div></div></button>`;
      }
      $$payload.out += `<!--]--></div></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> `;
    if (bajoMinimo.length > 0) {
      $$payload.out += "<!--[-->";
      const each_array_1 = ensure_array_like(bajoMinimo);
      $$payload.out += `<div><div class="px-6 py-3 bg-yellow-50"><div class="flex items-center gap-2">`;
      Icon$1($$payload, {
        icon: Package,
        size: 18,
        strokeWidth: 2.5,
        class: "text-yellow-600"
      });
      $$payload.out += `<!----> <h3 class="font-semibold text-yellow-900 text-sm">Bajo Mínimo (${escape_html(bajoMinimo.length)})</h3></div></div> <div class="divide-y divide-gray-100"><!--[-->`;
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let producto = each_array_1[$$index_1];
        $$payload.out += `<button class="w-full px-6 py-3 hover:bg-gray-50 transition-colors text-left"><div class="flex items-start justify-between gap-4"><div class="flex-1 min-w-0"><p class="font-medium text-gray-900 truncate">${escape_html(producto.descripcion)}</p> <p class="text-sm text-gray-500">Código: ${escape_html(producto.codigo)}</p></div> <div class="flex-shrink-0 text-right"><div class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-semibold">${escape_html(producto.existencia)}</div> <p class="text-xs text-gray-500 mt-1">Mín: ${escape_html(producto.stockMinimo)}</p></div></div></button>`;
      }
      $$payload.out += `<!--]--></div></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]--></div></div>`;
  pop();
}
function AccesosRapidosWidget($$payload, $$props) {
  push();
  const acciones = [
    {
      label: "Nueva Factura",
      icon: File_text,
      url: "/ventas/facturas/nueva",
      color: "from-blue-500 to-blue-600",
      description: "Emitir una nueva factura"
    },
    {
      label: "Nuevo Cliente",
      icon: User_plus,
      url: "/clientes",
      color: "from-purple-500 to-purple-600",
      description: "Registrar un cliente"
    },
    {
      label: "Consultar Stock",
      icon: Package,
      url: "/productos",
      color: "from-green-500 to-green-600",
      description: "Ver inventario"
    },
    {
      label: "Cuentas Corrientes",
      icon: Dollar_sign,
      url: "/clientes/cuentascorrientes",
      color: "from-orange-500 to-orange-600",
      description: "Gestionar cobros"
    },
    {
      label: "Sincronizar",
      icon: Refresh_cw,
      url: "/sincronizacion/actualizar-datos",
      color: "from-indigo-500 to-indigo-600",
      description: "Actualizar datos"
    }
  ];
  const each_array = ensure_array_like(acciones);
  $$payload.out += `<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-50"><div class="flex items-center gap-2">`;
  Icon$1($$payload, {
    icon: Zap,
    size: 24,
    strokeWidth: 2.5,
    glass: true
  });
  $$payload.out += `<!----> <h2 class="text-lg font-semibold text-gray-900">Accesos Rápidos</h2></div></div> <div class="p-6"><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let accion = each_array[$$index];
    $$payload.out += `<button class="group relative p-4 rounded-xl border-2 border-gray-200 hover:border-transparent hover:shadow-lg transition-all duration-300 overflow-hidden"><div${attr_class(`absolute inset-0 bg-gradient-to-br ${stringify(accion.color)} opacity-0 group-hover:opacity-10 transition-opacity`)}></div> <div class="relative z-10"><div${attr_class(`w-12 h-12 bg-gradient-to-br ${stringify(accion.color)} rounded-lg flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform`)}>`;
    Icon$1($$payload, {
      icon: accion.icon,
      size: 24,
      strokeWidth: 2.5,
      class: "text-white"
    });
    $$payload.out += `<!----></div> <h3 class="font-semibold text-gray-900 mb-1 text-left">${escape_html(accion.label)}</h3> <p class="text-sm text-gray-600 text-left">${escape_html(accion.description)}</p></div></button>`;
  }
  $$payload.out += `<!--]--></div></div></div>`;
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let loading = true;
  let vendedores = [];
  let stockCritico = {
    sinStock: [],
    bajoMinimo: []
  };
  const userName = store_get($$store_subs ??= {}, "$auth", auth).user?.nombre || "Usuario";
  const companyName = store_get($$store_subs ??= {}, "$auth", auth).empresa?.nombre || "Empresa";
  const horaActual = (/* @__PURE__ */ new Date()).getHours();
  let saludo = "";
  if (horaActual >= 6 && horaActual < 12) {
    saludo = "Buenos días";
  } else if (horaActual >= 12 && horaActual < 20) {
    saludo = "Buenas tardes";
  } else {
    saludo = "Buenas noches";
  }
  const fechaActual = (/* @__PURE__ */ new Date()).toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  $$payload.out += `<div class="space-y-6 pb-8"><div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg"><div class="flex items-start justify-between"><div><h1 class="text-3xl font-bold mb-2">${escape_html(saludo)}, ${escape_html(userName)}! 👋</h1> <p class="text-blue-100 capitalize">${escape_html(fechaActual)} `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></p> <p class="text-sm text-blue-200 mt-1">${escape_html(companyName)}</p></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  AccesosRapidosWidget($$payload);
  $$payload.out += `<!----> <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">`;
  VendedoresWidget($$payload, { vendedores, loading });
  $$payload.out += `<!----> `;
  StockCriticoWidget($$payload, {
    sinStock: stockCritico.sinStock,
    bajoMinimo: stockCritico.bajoMinimo,
    loading
  });
  $$payload.out += `<!----></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
