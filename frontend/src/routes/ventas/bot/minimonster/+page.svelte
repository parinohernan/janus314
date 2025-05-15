<script lang="ts">
  import { onMount } from 'svelte';
  import '../../../../app.css';
  import SolicitudForm from '../components/SolicitudForm.svelte';

  let isVisible = Array(6).fill(false);
  let mostrarFormulario = false;
  let currentSlide = 0;
  let autoplayInterval: number;
  let currentPriceSlide = 0;
  let priceAutoplayInterval: number;
  
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

  const planes = [
    {
      nombre: 'Plan Gratuito',
      precio: '0',
      periodo: 'mes',
      caracteristicas: [
        'Hasta 100 productos',
        'Hasta 50 ventas por mes',
        'Reportes básicos',
        '1 usuario'
      ]
    },
    {
      nombre: 'Plan Básico',
      precio: '19.99',
      periodo: 'mes',
      caracteristicas: [
        'Hasta 500 productos',
        'Ventas ilimitadas',
        'Reportes avanzados',
        '3 usuarios',
        'Soporte por chat'
      ]
    },
    {
      nombre: 'Plan Pro',
      precio: '39.99',
      periodo: 'mes',
      caracteristicas: [
        'Productos ilimitados',
        'Ventas ilimitadas',
        'Reportes personalizados',
        'Usuarios ilimitados',
        'Soporte prioritario',
        'API de integración'
      ]
    },
    {
      nombre: 'Plan Empresa',
      precio: 'Consultar',
      periodo: '',
      caracteristicas: [
        'Todo lo del Plan Pro',
        'Instalación personalizada',
        'Capacitación del personal',
        'Soporte 24/7',
        'Personalización total',
        'SLA garantizado'
      ]
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
      <h1>MiniMonster POS</h1>
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
    </div>
  </section>

  <!-- Precios
  <section class="pricing animate-on-scroll" class:visible={isVisible[5]}>
    <h2>Planes y Precios</h2>
    <div class="carousel-container">
      <button 
        class="carousel-button prev" 
        on:click={() => {
          stopPriceAutoplay();
          prevPriceSlide();
        }}
        aria-label="Plan anterior"
      >
        ❮
      </button>

      <div class="carousel-track" style="transform: translateX(-{currentPriceSlide * 100}%)">
        {#each planes as plan, i}
          <div 
            class="pricing-card" 
            class:active={i === currentPriceSlide}
          >
            <h3>{plan.nombre}</h3>
            <div class="price">
              {#if plan.precio === 'Consultar'}
                {plan.precio}
              {:else}
                ${plan.precio}
                <span class="period">/{plan.periodo}</span>
              {/if}
            </div>
            <ul>
              {#each plan.caracteristicas as caracteristica}
                <li>✓ {caracteristica}</li>
              {/each}
            </ul>
            <button class="cta-button" on:click={abrirFormulario}>
              {plan.precio === 'Consultar' ? 'Contactar' : 'Comenzar'}
            </button>
          </div>
        {/each}
      </div>

      <button 
        class="carousel-button next" 
        on:click={() => {
          stopPriceAutoplay();
          nextPriceSlide();
        }}
        aria-label="Siguiente plan"
      >
        ❯
      </button>

      <div class="carousel-indicators">
        {#each planes as _, i}
          <button
            class="indicator"
            class:active={i === currentPriceSlide}
            on:click={() => {
              stopPriceAutoplay();
              goToPriceSlide(i);
            }}
            aria-label="Ir a plan {i + 1}"
            aria-current={i === currentPriceSlide}
          ></button>
        {/each}
      </div>
    </div>
  </section> -->

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
/* 
  .pricing {
    padding: 4rem 1rem;
    text-align: center;
    background: white;
    overflow: hidden;
  }

  .pricing h2 {
    margin-bottom: 3rem;
    font-size: 2.5rem;
  } */

  /* .carousel-container {
    position: relative;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 40px;
  }

  .carousel-track {
    display: flex;
    transition: transform 0.5s ease-in-out;
    gap: 2rem;
  }

  .pricing-card {
    min-width: 100%;
    padding: 2rem;
    background: white;
    border-radius: 15px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    opacity: 0.7;
    transform: scale(0.95);
  }

  .pricing-card.active {
    opacity: 1;
    transform: scale(1);
  } */

  /* .price {
    font-size: 3rem;
    color: var(--tg-theme-button-color, #FF6B6B);
    margin: 1rem 0;
  }

  .period {
    font-size: 1.2rem;
    opacity: 0.7;
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

  .carousel-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: var(--tg-theme-button-color, #FF6B6B);
    color: white;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    z-index: 2;
    transition: all 0.3s ease;
  }

  .carousel-button:hover {
    background: var(--tg-theme-button-color, #ff8585);
    transform: translateY(-50%) scale(1.1);
  }

  .carousel-button.prev {
    left: 0;
  }

  .carousel-button.next {
    right: 0;
  } */

  /* .carousel-indicators {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 2rem;
  } */

  /* .indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--tg-theme-hint-color, #ddd);
    border: none;
    padding: 0;
    cursor: pointer;
    transition: all 0.3s ease;
  } 
  .indicator.active {
    background: var(--tg-theme-button-color, #FF6B6B);
    transform: scale(1.2);
  }*/


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

    /* .carousel-container {
      padding: 0 30px;
    } */

    /* .carousel-button {
      width: 30px;
      height: 30px;
      font-size: 0.8em;
    } */

    .feature {
      padding: 1rem;
    }

    /* .price {
      font-size: 2.5rem;
    } 

    .period {
      font-size: 1rem;
    }*/

    .benefits {
      padding: 2rem 1rem;
      grid-template-columns: 1fr;
    }
  }
</style> 