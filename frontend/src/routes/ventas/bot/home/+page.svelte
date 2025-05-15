<script lang="ts">
  import { onMount } from 'svelte';
  import { goto as navigate } from '$app/navigation';
  import '../../../../app.css';

  // Interfaz para el objeto Telegram WebApp
  interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
      user?: {
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
      };
    };
    expand: () => void;
    close: () => void;
    enableClosingConfirmation: () => void;
    sendData: (data: string) => void;
  }

  // Referencia al objeto de Telegram WebApp
  let tg: TelegramWebApp | null = null;
  let userName: string = '';
  // Por ahora usamos vendedor fijo = 1 hasta implementar login
  const VENDEDOR_DEFAULT = '1';

  // Interface para las estadísticas
  interface Stat {
    label: string;
    value: string;
    icon: string;
    displayValue: number;
    targetValue: number;
  }

  // Funciones principales de la aplicación
  const mainFeatures = [
    {
      icon: '🛒',
      title: 'Nueva Venta',
      description: 'Registra ventas rápidamente',
      route: '/ventas/bot/nueva'
    },
    {
      icon: '📄',
      title: 'Comprobantes',
      description: 'Consulta y comparte facturas',
      route: '/ventas/bot/comprobantes'
    },
    {
      icon: 'ℹ️',
      title: 'Sobre Nosotros',
      description: 'Conoce más sobre MiniMonster',
      route: '/ventas/bot/minimonster'
    }
  ];

  // Estadísticas rápidas con valores de animación
  let quickStats: Stat[] = [
    {
      label: 'Ventas Hoy',
      value: '0',
      icon: '📈',
      displayValue: 0,
      targetValue: 0
    },
    {
      label: 'Mis Ventas',
      value: '0',
      icon: '🎯',
      displayValue: 0,
      targetValue: 0
    },
    {
      label: 'Clientes',
      value: '0',
      icon: '👥',
      displayValue: 0,
      targetValue: 0
    }
  ];

  function obtenerFechaHoy(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const fechaFormateada = `${año}-${mes}-${dia}`;
    console.log('Fecha actual formateada:', fechaFormateada);
    return fechaFormateada;
  }

  async function cargarEstadisticas() {
    try {
      const fechaHoy = obtenerFechaHoy();

      // Cargar cantidad de clientes activos
      const responseClientes = await fetch('https://janus314-api.osvi.lat/api/clientes?page=1&limit=1&Activo=1', {
        credentials: 'include',
        mode: 'cors'
      });
      
      if (responseClientes.ok) {
        const dataClientes = await responseClientes.json();
        console.log('Respuesta clientes - totalItems:', dataClientes.meta?.totalItems);
        if (dataClientes.meta?.totalItems !== undefined) {
          quickStats[2].value = dataClientes.meta.totalItems.toString();
        }
      }

      // Cargar ventas totales del día
      const urlVentasHoy = `https://janus314-api.osvi.lat/api/facturas?page=1&limit=1&tipo=PRF&fecha=${fechaHoy}`;
      console.log('URL ventas hoy:', urlVentasHoy);
      const responseVentasHoy = await fetch(urlVentasHoy, {
        credentials: 'include',
        mode: 'cors'
      });

      if (responseVentasHoy.ok) {
        const dataVentasHoy = await responseVentasHoy.json();
        console.log('Respuesta ventas hoy - totalItems:', dataVentasHoy.meta?.totalItems);
        if (dataVentasHoy.meta?.totalItems !== undefined) {
          quickStats[0].value = dataVentasHoy.meta.totalItems.toString();
        }
      } else {
        console.error('Error en respuesta ventas hoy:', await responseVentasHoy.text());
      }

      // Cargar ventas del vendedor por defecto
      const urlVentasVendedor = `https://janus314-api.osvi.lat/api/facturas?page=1&limit=1&tipo=PRF&fecha=${fechaHoy}&vendedor=${VENDEDOR_DEFAULT}`;
      console.log('URL ventas vendedor:', urlVentasVendedor);
      const responseVentasVendedor = await fetch(urlVentasVendedor, {
        credentials: 'include',
        mode: 'cors'
      });

      if (responseVentasVendedor.ok) {
        const dataVentasVendedor = await responseVentasVendedor.json();
        console.log('Respuesta ventas vendedor - totalItems:', dataVentasVendedor.meta?.totalItems);
        if (dataVentasVendedor.meta?.totalItems !== undefined) {
          quickStats[1].value = dataVentasVendedor.meta.totalItems.toString();
        }
      } else {
        console.error('Error en respuesta ventas vendedor:', await responseVentasVendedor.text());
      }

      // Forzar actualización de la vista
      quickStats = [...quickStats];
      
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }

  onMount(async () => {
    if (typeof window !== 'undefined' && 'Telegram' in window) {
      const telegram = (window as any).Telegram;
      if (telegram?.WebApp) {
        const webApp = telegram.WebApp as TelegramWebApp;
        tg = webApp;
        
        if (tg) {
          tg.expand();
          
          const user = tg.initDataUnsafe?.user;
          if (user) {
            userName = user.first_name + (user.last_name ? ` ${user.last_name}` : '');
          }
        }
      }
    }

    // Cargar estadísticas al montar el componente
    await cargarEstadisticas();
  });

  function navigateTo(route: string) {
    navigate(route);
  }
</script>

<svelte:head>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</svelte:head>

<div class="home-container">
  <!-- Header con saludo personalizado -->
  <header class="header">
    <div class="app-title">
      <h1>Janus MiniMonster</h1>
      {#if userName}
        <p class="welcome-text">¡Hola, {userName}! 👋</p>
      {:else}
        <p class="welcome-text">¡Bienvenido! 👋</p>
      {/if}
    </div>
  </header>

  <!-- Estadísticas Rápidas -->
  <div class="quick-stats">
    {#each quickStats as stat (stat.label)}
      <div class="stat-card">
        <span class="stat-icon">{stat.icon}</span>
        <span class="stat-value">{stat.value}</span>
        <span class="stat-label">{stat.label}</span>
      </div>
    {/each}
  </div>

  <!-- Funciones Principales -->
  <div class="features-grid">
    {#each mainFeatures as feature}
      <button 
        class="feature-card"
        on:click={() => navigateTo(feature.route)}
      >
        <span class="feature-icon">{feature.icon}</span>
        <h3>{feature.title}</h3>
        <p>{feature.description}</p>
      </button>
    {/each}
  </div>
</div>

<style>
  .home-container {
    padding: 16px;
    max-width: 100%;
    min-height: 100vh;
    color: var(--tg-theme-text-color, #000);
    background: var(--tg-theme-bg-color, #fff);
  }

  .header {
    margin-bottom: 24px;
  }

  .app-title h1 {
    font-size: 1.8rem;
    margin: 0;
    color: var(--tg-theme-text-color, #000);
    font-weight: bold;
  }

  .welcome-text {
    margin: 8px 0 0 0;
    color: var(--tg-theme-hint-color, #999);
    font-size: 1.1rem;
  }

  .quick-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    padding: 16px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    transition: transform 0.3s ease;
  }

  .stat-card:hover {
    transform: translateY(-2px);
  }

  .stat-icon {
    font-size: 1.5rem;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 1.4rem;
    font-weight: bold;
    color: var(--tg-theme-button-color, #2481cc);
    transition: color 0.3s ease;
    min-height: 1.4em; /* Evitar saltos en el layout durante la animación */
  }

  .stat-label {
    font-size: 0.9rem;
    color: var(--tg-theme-hint-color, #999);
    margin-top: 4px;
  }

  .features-grid {
    display: grid;
    gap: 16px;
  }

  .feature-card {
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    padding: 20px;
    border-radius: 12px;
    border: none;
    text-align: left;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 16px;
    align-items: center;
    cursor: pointer;
    transition: transform 0.2s ease;
    width: 100%;
  }

  .feature-card:active {
    transform: scale(0.98);
  }

  .feature-icon {
    font-size: 2rem;
    grid-row: span 2;
  }

  .feature-card h3 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--tg-theme-text-color, #000);
  }

  .feature-card p {
    margin: 4px 0 0 0;
    font-size: 0.9rem;
    color: var(--tg-theme-hint-color, #999);
  }

  @media (max-width: 360px) {
    .quick-stats {
      grid-template-columns: 1fr;
    }

    .stat-card {
      padding: 12px;
    }

    .feature-card {
      padding: 16px;
    }
  }
</style> 