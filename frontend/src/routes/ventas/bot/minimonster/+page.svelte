<script lang="ts">
  import { onMount } from 'svelte';
  import '../../../../app.css';

  let isVisible = Array(6).fill(false);
  
  function handleIntersection(index: number) {
    return (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          isVisible[index] = true;
        }
      });
    };
  }

  onMount(() => {
    const observers = isVisible.map((_, index) => {
      const observer = new IntersectionObserver(handleIntersection(index), {
        threshold: 0.2
      });
      return observer;
    });

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el, index) => {
      if (observers[index]) {
        observers[index].observe(el);
      }
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  });
</script>

<div class="landing-container">
  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-content animate-on-scroll" class:visible={isVisible[0]}>
      <h1>MiniMonster POS</h1>
      <p class="hero-subtitle">El punto de venta más simple y poderoso para tu negocio</p>
      <a href="https://t.me/janus314_bot" class="cta-button">¡Pruébalo Gratis!</a>
    </div>
  </section>

  <!-- Beneficios Principales -->
  <section class="benefits">
    <div class="benefit-card animate-on-scroll" class:visible={isVisible[1]}>
      <span class="icon">🚀</span>
      <h3>Ultra Rápido</h3>
      <p>Cobra en segundos. Sin esperas, sin complicaciones.</p>
    </div>
    <div class="benefit-card animate-on-scroll" class:visible={isVisible[2]}>
      <span class="icon">💡</span>
      <h3>Super Simple</h3>
      <p>Interfaz intuitiva que cualquiera puede usar sin capacitación.</p>
    </div>
    <div class="benefit-card animate-on-scroll" class:visible={isVisible[3]}>
      <span class="icon">📱</span>
      <h3>100% Móvil</h3>
      <p>Usa tu teléfono como caja registradora profesional.</p>
    </div>
  </section>

  <!-- Características -->
  <section class="features">
    <h2>Características Destacadas</h2>
    <div class="features-grid">
      <div class="feature animate-on-scroll" class:visible={isVisible[4]}>
        <h4>✓ Modo Rápido</h4>
        <p>Cobra sin buscar productos, ideal para tiendas pequeñas</p>
      </div>
      <div class="feature">
        <h4>✓ Modo Scanner</h4>
        <p>Lee códigos de barras con la cámara</p>
      </div>
      <div class="feature">
        <h4>✓ Modo Lista</h4>
        <p>Busca y selecciona de tu catálogo de productos</p>
      </div>
      <div class="feature">
        <h4>✓ Multi-Pago</h4>
        <p>Efectivo, tarjetas, transferencias y más</p>
      </div>
      <div class="feature">
        <h4>✓ Control de Stock</h4>
        <p>Actualización automática de inventario</p>
      </div>
      <div class="feature">
        <h4>✓ Reportes Diarios</h4>
        <p>Resumen de ventas y productos más vendidos</p>
      </div>
    </div>
  </section>

  <!-- Precios -->
  <section class="pricing animate-on-scroll" class:visible={isVisible[5]}>
    <h2>Simple y Accesible</h2>
    <div class="pricing-card">
      <h3>Plan Gratuito</h3>
      <div class="price">$0/mes</div>
      <ul>
        <li>✓ Hasta 100 productos</li>
        <li>✓ Hasta 50 ventas por mes</li>
        <li>✓ Reportes básicos</li>
        <li>✓ 1 usuario</li>
      </ul>
      <a href="https://t.me/janus314_bot" class="cta-button">Comenzar Gratis</a>
    </div>
  </section>

  <!-- CTA Final -->
  <section class="final-cta">
    <div class="cta-content">
      <h2>¿Listo para modernizar tu negocio?</h2>
      <p>Únete a cientos de comerciantes que ya usan MiniMonster POS</p>
      <a href="https://t.me/janus314_bot" class="cta-button">Empezar Ahora</a>
    </div>
  </section>
</div>

<style>
  .landing-container {
    max-width: 100%;
    overflow-x: hidden;
    color: var(--tg-theme-text-color, #333);
    background: var(--tg-theme-bg-color, #fff);
  }

  .hero {
    padding: 4rem 1rem;
    text-align: center;
    background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
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
    font-size: 3.5rem;
    margin-bottom: 1rem;
    line-height: 1.2;
  }

  .hero-subtitle {
    font-size: 1.5rem;
    margin-bottom: 2rem;
    opacity: 0.9;
  }

  .cta-button {
    display: inline-block;
    padding: 1rem 2rem;
    background: white;
    color: #FF6B6B;
    text-decoration: none;
    border-radius: 50px;
    font-weight: bold;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(255, 255, 255, 0.3);
  }

  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 255, 255, 0.4);
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

  .features {
    padding: 4rem 1rem;
    background: #f8f9fa;
  }

  .features h2 {
    text-align: center;
    margin-bottom: 3rem;
    font-size: 2.5rem;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .feature {
    padding: 1.5rem;
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }

  .feature h4 {
    color: #FF6B6B;
    margin-bottom: 0.5rem;
    font-size: 1.2rem;
  }

  .pricing {
    padding: 4rem 1rem;
    text-align: center;
    background: white;
  }

  .pricing h2 {
    margin-bottom: 3rem;
    font-size: 2.5rem;
  }

  .pricing-card {
    max-width: 400px;
    margin: 0 auto;
    padding: 2rem;
    background: white;
    border-radius: 15px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .price {
    font-size: 3rem;
    color: #FF6B6B;
    margin: 1rem 0;
  }

  .pricing-card ul {
    list-style: none;
    padding: 0;
    margin: 2rem 0;
    text-align: left;
  }

  .pricing-card li {
    margin: 1rem 0;
    padding-left: 1.5rem;
    position: relative;
  }

  .final-cta {
    padding: 6rem 1rem;
    text-align: center;
    background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
    color: white;
  }

  .cta-content {
    max-width: 600px;
    margin: 0 auto;
  }

  .cta-content h2 {
    margin-bottom: 1rem;
    font-size: 2.5rem;
  }

  .cta-content p {
    margin-bottom: 2rem;
    opacity: 0.9;
    font-size: 1.2rem;
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
      font-size: 2.5rem;
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

    .pricing-card {
      margin: 0 1rem;
    }
  }
</style> 