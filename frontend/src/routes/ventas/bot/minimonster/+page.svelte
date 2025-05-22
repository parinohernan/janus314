<script lang="ts">
  import { onMount } from 'svelte';
  import '../../../../app.css';
  import SolicitudForm from '../components/SolicitudForm.svelte';
  import { planes } from './planes.js';

  let isVisible = Array(6).fill(false);
  let mostrarFormulario = false;
  let currentSlide = 0;
  let autoplayInterval: ReturnType<typeof setInterval>;
  let currentPriceSlide = 0;
  let priceAutoplayInterval: ReturnType<typeof setInterval>;
  
  // Beneficios principales
  const beneficios = [
    {
      icon: '🚀',
      title: 'Ultra Rápido',
      description: 'Cobra en segundos. Sin esperas, sin complicaciones.'
    },
    {
      icon: '💡',
      title: 'Super Simple',
      description: 'Interfaz intuitiva que cualquiera puede usar sin capacitación.'
    },
    {
      icon: '📱',
      title: '100% Móvil',
      description: 'Usa tu teléfono como caja registradora profesional.'
    },
    {
      icon: '🔒',
      title: 'Seguro',
      description: 'Tus datos siempre protegidos y respaldados en la nube.'
    }
  ];

  function nextSlide() {
    currentSlide = (currentSlide + 1) % beneficios.length;
  }

  function prevSlide() {
    currentSlide = (currentSlide - 1 + beneficios.length) % beneficios.length;
  }

  function goToSlide(index: number) {
    currentSlide = index;
  }

  function startAutoplay() {
    autoplayInterval = setInterval(nextSlide, 5000);
  }

  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
    }
  }

  function nextPriceSlide() {
    currentPriceSlide = (currentPriceSlide + 1) % planes.length;
  }

  function prevPriceSlide() {
    currentPriceSlide = (currentPriceSlide - 1 + planes.length) % planes.length;
  }

  function goToPriceSlide(index: number) {
    currentPriceSlide = index;
  }

  function startPriceAutoplay() {
    priceAutoplayInterval = setInterval(nextPriceSlide, 5000);
  }

  function stopPriceAutoplay() {
    if (priceAutoplayInterval) {
      clearInterval(priceAutoplayInterval);
    }
  }

  function handleIntersection(index: number) {
    return (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          isVisible[index] = true;
        }
      });
    };
  }

  function abrirFormulario() {
    mostrarFormulario = true;
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

    startPriceAutoplay();

    return () => {
      observers.forEach(observer => observer.disconnect());
      stopPriceAutoplay();
    };
  });
</script>

<div class="landing-container">
  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-content animate-on-scroll" class:visible={isVisible[0]}>
      <h1>JANO mini POS</h1>
      <p class="hero-subtitle">El punto de venta más simple y poderoso para tu negocio</p>
      <button class="cta-button" on:click={abrirFormulario}>¡Pruébalo Gratis!</button>
    </div>
  </section>

  <!-- Beneficios Principales -->
  <section class="benefits">
    {#each beneficios as beneficio}
      <div class="benefit-card animate-on-scroll" class:visible={isVisible[1]}>
        <span class="icon">{beneficio.icon}</span>
        <h3>{beneficio.title}</h3>
        <p>{beneficio.description}</p>
      </div>
    {/each}
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
      <div class="feature">
        <h4>✓ Comparte comprobantes por WhatsApp</h4>
        <p>Envía facturas y recibos directamente a tus clientes</p>
      </div>
    </div>
  </section>

  <!-- Precios -->
  <section class="pricing animate-on-scroll" class:visible={isVisible[5]}>
    <h2>Planes y Precios</h2>
    <div class="pricing-table">
      {#each planes as plan}
        <div class="pricing-card">
          <h2>{plan.nombre}</h2>
          <p class="plan-description">{plan.descripcion}</p>
          <div class="price">
            {plan.precio}
          </div>
          <div class="promo-price">
            {plan.precio_promo}
          </div>
          <ul>
            {#each plan.beneficios as beneficio}
              <li>✓ {beneficio.name}: <span class="alcance">{beneficio.alcance}</span></li>
            {/each}
          </ul>
          <button class="cta-button" on:click={abrirFormulario}>
            Comenzar
          </button>
        </div>
      {/each}
    </div>
  </section>

  <!-- CTA Final -->
  <section class="final-cta">
    <div class="cta-content">
      <h2>¿Listo para modernizar tu negocio?</h2>
      <p>Únete a cientos de comerciantes que ya usan MiniMonster POS</p>
      <button class="cta-button" on:click={abrirFormulario}>Empezar Ahora</button>
    </div>
  </section>

  <SolicitudForm 
    isOpen={mostrarFormulario}
    on:close={() => mostrarFormulario = false}
  />
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
    border: none;
    border-radius: 50px;
    font-weight: bold;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(255, 255, 255, 0.3);
    cursor: pointer;
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
    overflow: hidden;
  }

  .pricing h2 {
    margin-bottom: 3rem;
    font-size: 2.5rem;
  }

  .pricing-table {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .pricing-card {
    flex: 1;
    min-width: 250px;
    max-width: 350px;
    padding: 2rem;
    background: white;
    border-radius: 15px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
  }

  .pricing-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  }

  .plan-description {
    color: #666;
    font-style: italic;
    margin-bottom: 1rem;
    min-height: 50px;
  }

  .price {
    font-size: 2rem;
    /* font-weight: unset; */
    color: var(--tg-theme-button-color, #3f3636);
    margin: 1rem 0 0.5rem;
    text-decoration: line-through;
  }

  .promo-price {
    font-size: 1.5rem;
    color: #28a745;
    margin-bottom: 1rem;
    font-weight: bold;
  }

  .pricing-card ul {
    list-style: none;
    padding: 0;
    margin: 2rem 0;
    text-align: left;
    flex-grow: 1;
  }

  .pricing-card li {
    margin: 1rem 0;
    padding-left: 1.5rem;
    position: relative;
  }

  .alcance {
    font-weight: bold;
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

    .pricing-table {
      flex-direction: column;
      align-items: center;
    }

    .pricing-card {
      width: 100%;
      max-width: 100%;
    }

    .price {
      font-size: 1.8rem;
    }
    
    .promo-price {
      font-size: 1.3rem;
    }

    .benefits {
      padding: 2rem 1rem;
      grid-template-columns: 1fr;
    }
  }
</style> 