import { l as ensure_array_like, e as escape_html, k as attr, c as pop, p as push } from "../../../../../chunks/index3.js";
import { o as onDestroy } from "../../../../../chunks/index-server.js";
import "../../../../../chunks/client.js";
/* empty css                        */
import { a as auth } from "../../../../../chunks/authStore.js";
import { L as LogoJano } from "../../../../../chunks/LogoJano.js";
function _page($$payload, $$props) {
  push();
  if (typeof window !== "undefined" && !localStorage.getItem("authToken")) {
    localStorage.setItem("authToken", "bot-telegram-token-temporal");
  }
  let vendedorNombre = "";
  let codigoVendedor = "2";
  let isAuthenticated = false;
  let dataInitialized = false;
  let mostrarModalLogin = false;
  let usuario = "";
  let password = "";
  let empresa = "";
  let errorLogin = "";
  let cargandoLogin = false;
  let unsubscribe = auth.subscribe((state) => {
    if (isAuthenticated !== state.isAuthenticated) {
      isAuthenticated = state.isAuthenticated;
      if (isAuthenticated && mostrarModalLogin) {
        mostrarModalLogin = false;
      }
    }
    if (state.user) {
      if (!state.user.activo) {
        mostrarError("Su cuenta no está activa. Contacte al administrador.");
        cerrarSesion();
        return;
      }
      const nuevoNombre = `${state.user.nombre} ${state.user.apellido || ""}`.trim();
      if (vendedorNombre !== nuevoNombre) {
        vendedorNombre = nuevoNombre;
      }
      if (state.user.codigoVendedor && codigoVendedor !== state.user.usuario) {
        codigoVendedor = state.user.usuario;
      }
      if (!dataInitialized) {
        guardarDatosVendedor(state.user);
        dataInitialized = true;
      }
    } else if (!dataInitialized) {
      recuperarDatosVendedor();
      dataInitialized = true;
    }
  });
  function recuperarDatosVendedor() {
    const nombreGuardado = localStorage.getItem("botVendedorNombre");
    const apellidoGuardado = localStorage.getItem("botVendedorApellido");
    const codigoGuardado = localStorage.getItem("botVendedorCodigo");
    if (nombreGuardado) {
      vendedorNombre = `${nombreGuardado} ${apellidoGuardado || ""}`.trim();
      if (codigoGuardado) {
        codigoVendedor = codigoGuardado;
      }
    }
  }
  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
  async function cerrarSesion() {
    try {
      await auth.logout();
      usuario = "";
      password = "";
      mostrarModalLogin = true;
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  }
  function guardarDatosVendedor(usuario2) {
    if (usuario2) {
      localStorage.setItem("botVendedorNombre", usuario2.nombre || "Vendedor");
      localStorage.setItem("botVendedorApellido", usuario2.apellido || "");
      localStorage.setItem("botVendedorCodigo", usuario2.usuario || "1");
    }
  }
  function mostrarError(mensaje) {
    errorLogin = mensaje;
    mostrarModalLogin = true;
  }
  const mainFeatures = [
    {
      icon: "🛒",
      title: "Nueva Venta",
      description: "Registra ventas rápidamente",
      route: "/ventas/bot/nueva"
    }
    // {
  ];
  let quickStats = [
    {
      label: "Ver comprobantes",
      value: "Ventas",
      icon: "🛍️",
      displayValue: 0,
      targetValue: 0,
      route: "/ventas/bot/comprobantes"
    },
    {
      label: "Gestion de Clientes",
      value: "Clientes",
      icon: "👥",
      displayValue: 0,
      targetValue: 0,
      route: "/ventas/bot/clientes"
      // Otros iconos recomendados:
    },
    {
      label: "Centro de Estadísticas",
      value: "Estadisticas",
      icon: "📈",
      displayValue: 0,
      targetValue: 0,
      route: "/ventas/bot/estadisticas"
    },
    {
      label: "Gestion de Productos",
      value: "Productos",
      icon: "📦",
      displayValue: 0,
      targetValue: 0,
      route: "/ventas/bot/productos"
    },
    {
      label: "Alerta de Stock",
      value: "Alertas",
      icon: "🔔",
      displayValue: 0,
      targetValue: 0,
      route: "/ventas/bot/alerta-stock"
    },
    {
      label: "Caja",
      value: "Caja",
      icon: "💰",
      displayValue: 0,
      targetValue: 0,
      route: "/ventas/bot/caja"
    },
    {
      label: "Recibos",
      value: "Recibos",
      icon: "🧾",
      displayValue: 0,
      targetValue: 0,
      route: "/ventas/bot/recibos"
    },
    {
      label: "Sobre Nosotros",
      value: "Jano miniPOS",
      icon: "ℹ️",
      displayValue: 0,
      targetValue: 0,
      route: "/ventas/bot/minimonster"
    }
  ];
  (() => {
    const fecha = /* @__PURE__ */ new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${año}-${mes}-${dia}`;
  })();
  const each_array = ensure_array_like(mainFeatures);
  const each_array_1 = ensure_array_like(quickStats);
  $$payload.out += `<div class="telegram-webapp svelte-1usn7d"><header class="header svelte-1usn7d"><div class="app-title svelte-1usn7d">`;
  LogoJano($$payload, { size: "large", animated: true });
  $$payload.out += `<!----> `;
  if (vendedorNombre && isAuthenticated) {
    $$payload.out += "<!--[1-->";
    $$payload.out += `<div class="welcome-container svelte-1usn7d"><p class="welcome-text svelte-1usn7d">Hola, ${escape_html(vendedorNombre)}! 👋</p> <button class="logout-button svelte-1usn7d" title="Cerrar sesión"><span class="logout-icon svelte-1usn7d">🚪</span></button></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="welcome-container svelte-1usn7d"><p class="welcome-text svelte-1usn7d">¡Bienvenido! 👋</p> <button class="login-button svelte-1usn7d" title="Iniciar sesión"><span class="login-icon svelte-1usn7d">🔑</span></button></div>`;
  }
  $$payload.out += `<!--]--></div></header> <div class="features-grid svelte-1usn7d"><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let feature = each_array[$$index];
    $$payload.out += `<button class="feature-card svelte-1usn7d"><span class="feature-icon svelte-1usn7d">${escape_html(feature.icon)}</span> <h3 class="svelte-1usn7d">${escape_html(feature.title)}</h3> <p class="svelte-1usn7d">${escape_html(feature.description)}</p></button>`;
  }
  $$payload.out += `<!--]--></div> <div class="stats-container svelte-1usn7d"><!--[-->`;
  for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
    let stat = each_array_1[$$index_1];
    if (stat.route) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<button class="stat-card clickable svelte-1usn7d"${attr("aria-label", `Ver ${stat.label}`)}><div class="stat-icon svelte-1usn7d">${escape_html(stat.icon)}</div> <div class="stat-content svelte-1usn7d"><div class="stat-value svelte-1usn7d">${escape_html(stat.value)}</div> <div class="stat-label svelte-1usn7d">${escape_html(stat.label)}</div> `;
      if (stat.label === "Ventas") {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="stat-sublabel svelte-1usn7d">Mis ventas / Total del día</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></div></button>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<div class="stat-card svelte-1usn7d"><div class="stat-icon svelte-1usn7d">${escape_html(stat.icon)}</div> <div class="stat-content svelte-1usn7d"><div class="stat-value svelte-1usn7d">${escape_html(stat.value)}</div> <div class="stat-label svelte-1usn7d">${escape_html(stat.label)}</div></div></div>`;
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]--></div> `;
  if (mostrarModalLogin) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="modal-overlay svelte-1usn7d"><div class="modal-content svelte-1usn7d"><h2 class="svelte-1usn7d">Iniciar Sesión</h2> `;
    if (errorLogin) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="error-message svelte-1usn7d">${escape_html(errorLogin)}</div> <div class="error-message svelte-1usn7d">Puedes usar Empresa 1, Usuario 1 y Contraseña 1234 para probar la aplicación</div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <form><div class="form-group svelte-1usn7d"><label for="empresa" class="svelte-1usn7d">Empresa</label> <input type="text" id="empresa"${attr("value", empresa)} placeholder="Ingrese el código de empresa" required class="svelte-1usn7d"></div> <div class="form-group svelte-1usn7d"><label for="usuario" class="svelte-1usn7d">Usuario</label> <input type="text" id="usuario"${attr("value", usuario)} placeholder="Ingrese su usuario" required class="svelte-1usn7d"></div> <div class="form-group svelte-1usn7d"><label for="password" class="svelte-1usn7d">Contraseña</label> <input type="password" id="password"${attr("value", password)} placeholder="Ingrese su contraseña" required class="svelte-1usn7d"></div> <div class="form-actions svelte-1usn7d"><button type="button" class="btn-cancelar svelte-1usn7d"${attr("disabled", cargandoLogin, true)}>Cancelar</button> <button type="submit" class="btn-login svelte-1usn7d"${attr("disabled", cargandoLogin, true)}>${escape_html("Iniciar Sesión")}</button></div></form></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
