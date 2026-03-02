import { m as attr_class, c as pop, p as push } from "../../../../chunks/index3.js";
import "../../../../chunks/client.js";
/* empty css                     */
function _page($$payload, $$props) {
  push();
  let isVisible = Array(6).fill(false);
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="landing-container"><section class="hero"><div${attr_class("hero-content animate-on-scroll", void 0, { "visible": isVisible[0] })}><h1>Facturación Simple desde tu Celular</h1> <p class="hero-subtitle">Tu negocio en la palma de tu mano, sin complicaciones</p> <a href="https://t.me/janus314_bot" class="cta-button">Comenzar Ahora</a></div></section> <section class="benefits"><div${attr_class("benefit-card animate-on-scroll", void 0, { "visible": isVisible[1] })}><span class="icon">📱</span> <h3>Sin PC, Solo tu Celular</h3> <p>Factura desde cualquier lugar usando solo tu teléfono. Sin necesidad de equipos costosos.</p></div> <div${attr_class("benefit-card animate-on-scroll", void 0, { "visible": isVisible[2] })}><span class="icon">⚡</span> <h3>Rápido y Sencillo</h3> <p>Emite facturas en segundos. Interfaz intuitiva diseñada para la velocidad.</p></div> <div${attr_class("benefit-card animate-on-scroll", void 0, { "visible": isVisible[3] })}><span class="icon">🔒</span> <h3>100% Legal y Seguro</h3> <p>Cumple con todas las normativas fiscales. Tus datos siempre seguros.</p></div></section> <section class="features"><h2>Lo que ya puedes hacer</h2> <div class="features-grid"><div${attr_class("feature animate-on-scroll", void 0, { "visible": isVisible[4] })}><h4>✓ Facturación Instantánea</h4> <p>Genera facturas y tickets en segundos</p></div> <div class="feature"><h4>✓ Búsqueda Rápida</h4> <p>Encuentra productos al instante</p></div> <div class="feature"><h4>✓ Lector de Códigos</h4> <p>Escanea códigos de barras con la cámara</p></div> <div class="feature"><h4>✓ Control de Stock</h4> <p>Mantén tu inventario actualizado</p></div> <div class="feature"><h4>✓ Múltiples Formas de Pago</h4> <p>Efectivo, tarjetas y más</p></div> <div class="feature"><h4>✓ Clientes Frecuentes</h4> <p>Gestiona tu base de clientes</p></div></div></section> <section class="coming-soon"><h2>Ademas</h2> <div${attr_class("features-grid animate-on-scroll", void 0, { "visible": isVisible[5] })}><div class="feature future"><h4>🔜 Control de Caja</h4> <p>Gestiona tus ingresos y egresos diarios</p></div> <div class="feature future"><h4>🔜 Reportes Avanzados</h4> <p>Analiza tu negocio con gráficos detallados</p></div> <div class="feature future"><h4>🔜 Fidelización</h4> <p>Sistema de puntos y descuentos</p></div> <div class="feature future"><h4>🔜 Múltiples Sucursales</h4> <p>Gestiona varias ubicaciones</p></div> <div class="feature future"><h4>🔜 Pedidos Online</h4> <p>Recibe pedidos por internet</p></div> <div class="feature future"><h4>🔜 Integración WhatsApp</h4> <p>Envía facturas por WhatsApp</p></div></div></section> <section class="final-cta"><div class="cta-content"><h2>¿Listo para modernizar tu negocio?</h2> <p>Únete a cientos de comerciantes que ya facturan desde su celular</p> <a href="https://t.me/janus314_bot" class="cta-button">Empezar Gratis</a></div></section></div> <style>
    .landing-container {
      max-width: 100%;
      overflow-x: hidden;
      color: var(--tg-theme-text-color, #333);
      background: var(--tg-theme-bg-color, #fff);
    }

    .hero {
      padding: 4rem 1rem;
      text-align: center;
      background: linear-gradient(135deg, #2481cc 0%, #1a5f9e 100%);
      color: white;
    }

    .hero-content {
      max-width: 800px;
      margin: 0 auto;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.6s ease-out;
    }

    .hero-content.visible {
      opacity: 1;
      transform: translateY(0);
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      line-height: 1.2;
    }

    .hero-subtitle {
      font-size: 1.2rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }

    .cta-button {
      display: inline-block;
      padding: 1rem 2rem;
      background: #ff6b6b;
      color: white;
      text-decoration: none;
      border-radius: 50px;
      font-weight: bold;
      transition: transform 0.2s;
      box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
    }

    .cta-button:hover {
      transform: translateY(-2px);
    }

    .benefits {
      padding: 4rem 1rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .benefit-card {
      padding: 2rem;
      background: white;
      border-radius: 15px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      text-align: center;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.6s ease-out;
    }

    .benefit-card.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      display: block;
    }

    .features, .coming-soon {
      padding: 4rem 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    h2 {
      text-align: center;
      margin-bottom: 3rem;
      font-size: 2rem;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.6s ease-out;
    }

    .features-grid.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .feature {
      padding: 1.5rem;
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }

    .feature.future {
      background: #f8f9fa;
      border: 2px dashed #dee2e6;
    }

    .feature h4 {
      color: #2481cc;
      margin-bottom: 0.5rem;
    }

    .feature.future h4 {
      color: #6c757d;
    }

    .final-cta {
      padding: 6rem 1rem;
      text-align: center;
      background: linear-gradient(135deg, #2481cc 0%, #1a5f9e 100%);
      color: white;
    }

    .cta-content {
      max-width: 600px;
      margin: 0 auto;
    }

    .cta-content h2 {
      margin-bottom: 1rem;
    }

    .cta-content p {
      margin-bottom: 2rem;
      opacity: 0.9;
    }

    /* Animaciones */
    .animate-on-scroll {
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.6s ease-out;
    }

    .animate-on-scroll.visible {
      opacity: 1;
      transform: translateY(0);
    }

    @media (max-width: 768px) {
      h1 {
        font-size: 2rem;
      }

      .hero {
        padding: 3rem 1rem;
      }

      .benefits {
        padding: 2rem 1rem;
      }

      .feature {
        padding: 1rem;
      }
    }
  </style>`;
  }
  $$payload.out += `<!--]-->`;
  pop();
}
export {
  _page as default
};
