import { j as attr, e as escape_html, x as bind_props, c as pop, p as push, g as ensure_array_like, k as attr_class } from "../../../../../chunks/index3.js";
/* empty css                        */
import { z as fallback } from "../../../../../chunks/utils.js";
import "../../../../../chunks/client.js";
function SolicitudForm($$payload, $$props) {
  push();
  let isOpen = fallback($$props["isOpen"], false);
  let nombre = "";
  let email = "";
  let telefono = "";
  let nombreNegocio = "";
  let mensaje = "";
  let isLoading = false;
  if (isOpen) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="modal-overlay svelte-tgpwhg" role="button" tabindex="0" aria-label="Cerrar formulario"><div class="modal-content svelte-tgpwhg" role="dialog" aria-labelledby="modal-title" aria-modal="true" tabindex="-1"><button class="close-button svelte-tgpwhg" aria-label="Cerrar formulario" type="button">×</button> <h2 id="modal-title" class="svelte-tgpwhg">Solicitar Prueba Gratuita</h2> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <form><div class="form-group svelte-tgpwhg"><label for="nombre" class="svelte-tgpwhg">Nombre completo *</label> <input type="text" id="nombre"${attr("value", nombre)} required placeholder="Tu nombre completo" aria-required="true" class="svelte-tgpwhg"></div> <div class="form-group svelte-tgpwhg"><label for="email" class="svelte-tgpwhg">Correo electrónico *</label> <input type="email" id="email"${attr("value", email)} required placeholder="tu@email.com" aria-required="true" class="svelte-tgpwhg"></div> <div class="form-group svelte-tgpwhg"><label for="telefono" class="svelte-tgpwhg">Teléfono *</label> <input type="tel" id="telefono"${attr("value", telefono)} required placeholder="Tu número de teléfono" aria-required="true" class="svelte-tgpwhg"></div> <div class="form-group svelte-tgpwhg"><label for="nombreNegocio" class="svelte-tgpwhg">Nombre del negocio *</label> <input type="text" id="nombreNegocio"${attr("value", nombreNegocio)} required placeholder="Nombre de tu negocio" aria-required="true" class="svelte-tgpwhg"></div> <div class="form-group svelte-tgpwhg"><label for="tipoNegocio" class="svelte-tgpwhg">Tipo de negocio *</label> <select id="tipoNegocio" required aria-required="true" class="svelte-tgpwhg"><option value="">Selecciona un tipo</option><option value="retail">Tienda minorista</option><option value="restaurant">Restaurante/Café</option><option value="services">Servicios</option><option value="other">Otro</option></select></div> <div class="form-group svelte-tgpwhg"><label for="mensaje" class="svelte-tgpwhg">Mensaje (opcional)</label> <textarea id="mensaje" placeholder="Cuéntanos más sobre tu negocio..." rows="3" aria-required="false" class="svelte-tgpwhg">`;
    const $$body = escape_html(mensaje);
    if ($$body) {
      $$payload.out += `${$$body}`;
    }
    $$payload.out += `</textarea></div> <button type="submit" class="submit-button svelte-tgpwhg"${attr("disabled", isLoading, true)}${attr("aria-busy", isLoading)}>${escape_html("Enviar Solicitud")}</button></form></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  bind_props($$props, { isOpen });
  pop();
}
const planes = [
  {
    id: 1,
    nombre: "Plan inicial",
    descripcion: "Ideal para nuevos negocios",
    precio: "6000 ARS/mes",
    precio_promo: "4200 ARS/mes (3 meses)",
    beneficios: [
      { id: 1, name: "Terminales", alcance: "1" },
      { id: 2, name: "Vendedores", alcance: "1" },
      { id: 3, name: "Clientes", alcance: "sin limite" },
      { id: 4, name: "Ventas", alcance: "sin limite" }
    ]
  },
  {
    id: 2,
    nombre: "Plan intermedio",
    descripcion: "Ideal para negocios establecidos",
    precio: "18000 ARS/mes",
    precio_promo: "12000 ARS/mes (3 meses)",
    beneficios: [
      { id: 1, name: "Terminales", alcance: "3" },
      { id: 2, name: "Vendedores", alcance: "3" },
      { id: 3, name: "Clientes", alcance: "sin limite" },
      { id: 4, name: "Ventas", alcance: "sin limite" }
    ]
  },
  {
    id: 3,
    nombre: "Plan avanzado",
    descripcion: "Ideal para negocios establecidos con mas de 3 empleados",
    precio: "28000 ARS/mes",
    precio_promo: "20000 ARS/mes (3 meses)",
    beneficios: [
      { id: 1, name: "Terminales", alcance: "sin limite*" },
      { id: 2, name: "Vendedores", alcance: "sin limite" },
      { id: 3, name: "Clientes", alcance: "sin limite" },
      { id: 4, name: "Ventas", alcance: "sin limite" }
    ]
  }
];
function _page($$payload, $$props) {
  push();
  let isVisible = Array(6).fill(false);
  let mostrarFormulario = false;
  const beneficios = [
    {
      icon: "🚀",
      title: "Ultra Rápido",
      description: "Cobra en segundos. Sin esperas, sin complicaciones."
    },
    {
      icon: "💡",
      title: "Super Simple",
      description: "Interfaz intuitiva que cualquiera puede usar sin capacitación."
    },
    {
      icon: "📱",
      title: "100% Móvil",
      description: "Usa tu teléfono como caja registradora profesional."
    },
    {
      icon: "🔒",
      title: "Seguro",
      description: "Tus datos siempre protegidos y respaldados en la nube."
    }
  ];
  const each_array = ensure_array_like(beneficios);
  const each_array_1 = ensure_array_like(planes);
  $$payload.out += `<div class="landing-container svelte-13br93l"><div class="header svelte-13br93l"><button class="btn-back" aria-label="Volver"><span class="back-icon">←home</span></button></div> <section class="hero svelte-13br93l"><div${attr_class("hero-content animate-on-scroll svelte-13br93l", void 0, { "visible": isVisible[0] })}><div class="hero-flex svelte-13br93l"><div class="hero-text svelte-13br93l"><h1 class="svelte-13br93l">JANO mini POS</h1> <p class="hero-subtitle svelte-13br93l">El punto de venta más simple y poderoso para tu negocio</p> <button class="cta-button svelte-13br93l">¡Pruébalo Gratis!</button></div> <div class="hero-image svelte-13br93l"><img src="/logojano.png" alt="Jano Logo" class="logo-hero svelte-13br93l"></div></div></div></section> <section class="benefits svelte-13br93l"><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let beneficio = each_array[$$index];
    $$payload.out += `<div${attr_class("benefit-card animate-on-scroll svelte-13br93l", void 0, { "visible": isVisible[1] })}><span class="icon svelte-13br93l">${escape_html(beneficio.icon)}</span> <h3>${escape_html(beneficio.title)}</h3> <p>${escape_html(beneficio.description)}</p></div>`;
  }
  $$payload.out += `<!--]--></section> <section class="features svelte-13br93l"><h2 class="svelte-13br93l">Características Destacadas</h2> <div class="features-grid svelte-13br93l"><div${attr_class("feature animate-on-scroll svelte-13br93l", void 0, { "visible": isVisible[4] })}><h4 class="svelte-13br93l">✓ Modo Rápido</h4> <p>Cobra sin buscar productos, ideal para tiendas pequeñas</p></div> <div class="feature svelte-13br93l"><h4 class="svelte-13br93l">✓ Modo Scanner</h4> <p>Lee códigos de barras con la cámara</p></div> <div class="feature svelte-13br93l"><h4 class="svelte-13br93l">✓ Modo Lista</h4> <p>Busca y selecciona de tu catálogo de productos</p></div> <div class="feature svelte-13br93l"><h4 class="svelte-13br93l">✓ Multi-Pago</h4> <p>Efectivo, tarjetas, transferencias y más</p></div> <div class="feature svelte-13br93l"><h4 class="svelte-13br93l">✓ Control de Stock</h4> <p>Actualización automática de inventario</p></div> <div class="feature svelte-13br93l"><h4 class="svelte-13br93l">✓ Reportes Diarios</h4> <p>Resumen de ventas y productos más vendidos</p></div> <div class="feature svelte-13br93l"><h4 class="svelte-13br93l">✓ Comparte comprobantes por WhatsApp</h4> <p>Envía facturas y recibos directamente a tus clientes</p></div></div></section> <section${attr_class("pricing animate-on-scroll svelte-13br93l", void 0, { "visible": isVisible[5] })}><h2 class="svelte-13br93l">Planes y Precios</h2> <div class="pricing-table svelte-13br93l"><!--[-->`;
  for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
    let plan = each_array_1[$$index_2];
    const each_array_2 = ensure_array_like(plan.beneficios);
    $$payload.out += `<div class="pricing-card svelte-13br93l"><h2 class="svelte-13br93l">${escape_html(plan.nombre)}</h2> <p class="plan-description svelte-13br93l">${escape_html(plan.descripcion)}</p> <div class="price svelte-13br93l">${escape_html(plan.precio)}</div> <div class="promo-price svelte-13br93l">${escape_html(plan.precio_promo)}</div> <ul class="svelte-13br93l"><!--[-->`;
    for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
      let beneficio = each_array_2[$$index_1];
      $$payload.out += `<li class="svelte-13br93l">✓ ${escape_html(beneficio.name)}: <span class="alcance svelte-13br93l">${escape_html(beneficio.alcance)}</span></li>`;
    }
    $$payload.out += `<!--]--></ul> <button class="cta-button svelte-13br93l">Comenzar</button></div>`;
  }
  $$payload.out += `<!--]--></div></section> <section class="final-cta svelte-13br93l"><div class="cta-content svelte-13br93l"><h2 class="svelte-13br93l">¿Listo para modernizar tu negocio?</h2> <p class="svelte-13br93l">Únete a cientos de comerciantes que ya usan MiniMonster POS</p> <button class="cta-button svelte-13br93l">Empezar Ahora</button></div></section> `;
  SolicitudForm($$payload, { isOpen: mostrarFormulario });
  $$payload.out += `<!----></div>`;
  pop();
}
export {
  _page as default
};
