<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto as navigate } from '$app/navigation';
  import '../../../../app.css';
  import QuickStats from '../components/QuickStats.svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { auth } from '$lib/stores/authStore';
  import { get } from 'svelte/store';

  // Asegurar que haya un token para el bot de Telegram - Ejecutar solo en cliente
  if (typeof window !== 'undefined' && !localStorage.getItem('authToken')) {
    localStorage.setItem('authToken', 'bot-telegram-token-temporal');
  }
  
  let userName: string = '';
  let vendedorNombre: string = '';
  let codigoVendedor: string = '2';
  let isAuthenticated: boolean = false;
  let dataInitialized = false; // Flag para evitar inicializaciones redundantes
  
  // Estado del modal de login
  let mostrarModalLogin = false;
  let usuario = '';
  let password = '';
  let empresa = '';
  let errorLogin = '';
  let cargandoLogin = false;
  
  // Suscripción al store de autenticación con optimización para evitar re-renders innecesarios
  let unsubscribe = auth.subscribe((state) => {
    // Solo actualizar si hay cambios reales en isAuthenticated
    if (isAuthenticated !== state.isAuthenticated) {
      isAuthenticated = state.isAuthenticated;
      
      // Si el usuario acaba de autenticarse, cerrar el modal de login
      if (isAuthenticated && mostrarModalLogin) {
        mostrarModalLogin = false;
      }
    }
    
    if (state.user) {
      // Verificar si el usuario está activo
      if (!state.user.activo) {
        mostrarError('Su cuenta no está activa. Contacte al administrador.');
        cerrarSesion();
        return;
      }
      
      // Actualizar datos del vendedor solo si han cambiado
      const nuevoNombre = `${state.user.nombre} ${state.user.apellido || ''}`.trim();
      if (vendedorNombre !== nuevoNombre) {
        vendedorNombre = nuevoNombre;
      }
      
      // Obtener el código del vendedor si existe
      if (state.user.codigoVendedor && codigoVendedor !== state.user.usuario) {
        codigoVendedor = state.user.usuario;
      }
      
      // Guardar los datos del vendedor en localStorage una sola vez
      if (!dataInitialized) {
        guardarDatosVendedor(state.user);
        dataInitialized = true;
      }
    } else if (!dataInitialized) {
      // Recuperar datos de localStorage solo si es necesario
      recuperarDatosVendedor();
      dataInitialized = true;
    }
  });

  // Recuperar datos del vendedor desde localStorage, de forma separada para no repetir la lógica
  function recuperarDatosVendedor() {
    const nombreGuardado = localStorage.getItem('botVendedorNombre');
    const apellidoGuardado = localStorage.getItem('botVendedorApellido');
    const codigoGuardado = localStorage.getItem('botVendedorCodigo');
    
    if (nombreGuardado) {
      vendedorNombre = `${nombreGuardado} ${apellidoGuardado || ''}`.trim();
      if (codigoGuardado) {
        codigoVendedor = codigoGuardado;
      }
    }
  }

  // Limpiar suscripción cuando el componente se destruye
  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  // Función para cerrar sesión
  async function cerrarSesion() {
    try {
      await auth.logout();
      
      // Limpiar los campos del formulario de login
      usuario = '';
      password = '';
      
      // Mostrar el modal de login después de cerrar sesión
      mostrarModalLogin = true;
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
  
  // Función para guardar datos del vendedor en localStorage
  function guardarDatosVendedor(usuario: any) {
    if (usuario) {
      localStorage.setItem('botVendedorNombre', usuario.nombre || 'Vendedor');
      localStorage.setItem('botVendedorApellido', usuario.apellido || '');
      localStorage.setItem('botVendedorCodigo', usuario.usuario || '1');
    }
  }

  // Función para iniciar sesión desde el modal
  async function iniciarSesion() {
    try {
      errorLogin = '';
      cargandoLogin = true;
      
      // Validar campos
      if (!usuario || !password || !empresa) {
        errorLogin = 'Por favor, complete todos los campos';
        cargandoLogin = false;
        return;
      }
      
      const resultado = await auth.login({
        usuario,
        password,
        empresa
      });
      
      if (!resultado.success) {
        errorLogin = resultado.message || 'Error al iniciar sesión';
        return;
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      errorLogin = 'Error al iniciar sesión, por favor intente de nuevo';
    } finally {
      cargandoLogin = false;
    }
  }

  // Función para mostrar mensaje de error
  function mostrarError(mensaje: string) {
    errorLogin = mensaje;
    mostrarModalLogin = true;
  }

  // Interface para las estadísticas
  interface Stat {
    label: string;
    value: string;
    icon: string;
    displayValue: number;
    targetValue: number;
    route?: string;
  }

  // Funciones principales de la aplicación
  const mainFeatures = [
    {
      icon: '🛒',
      title: 'Nueva Venta',
      description: 'Registra ventas rápidamente',
      route: '/ventas/bot/nueva'
    },
    // {
    //   icon: '📄',
    //   title: 'Comprobantes',
    //   description: 'Consulta y comparte facturas',
    //   route: '/ventas/bot/comprobantes'
    // },
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
      label: 'Ver comprobantes',
      value: 'Ventas',
      icon: '🛍️',
      displayValue: 0,
      targetValue: 0,
      route: '/ventas/bot/comprobantes'
    },
    {
      label: 'Gestion de Clientes',
      value: 'Clientes', 
      icon: '👥',
      displayValue: 0,
      targetValue: 0,
      route: '/ventas/bot/clientes'
      // Otros iconos recomendados:
      // 👥 - Siluetas de personas
      // 🤝 - Apretón de manos (relación comercial)
      // 💼 - Maletín (negocios)
      // 🏢 - Edificio (empresas/clientes corporativos)
    },
    {
      label: 'Centro de Estadísticas',
      value: 'Estadisticas',
      icon: '📈',
      displayValue: 0,
      targetValue: 0,
      route: '/ventas/bot/estadisticas'
    },
    {
      label: 'Gestion de Productos',
      value: 'Productos',
      icon: '📦',
      displayValue: 0,
      targetValue: 0,
      route: '/ventas/bot/productos'
    }
  ];

  // Variables para almacenar las estadísticas separadas
  let ventasHoy = 0;
  let ventasVendedor = 0;

  // Optimizado para memorizar el valor
  const fechaHoy = (() => {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  })();

  // async function cargarEstadisticas() {
    // try {
    //   // Realizar peticiones en paralelo para mejorar rendimiento
    //   const [responseVentasHoy, responseVentasVendedor] = await Promise.all([
    //     // Petición 1: Ventas totales del día
    //     fetchWithAuth('/facturas', {
    //       params: {
    //         page: 1,
    //         limit: 1,
    //         tipo: 'PRF',
    //         fecha: fechaHoy
    //       }
    //     }),
        
    //     // Petición 2: Ventas del vendedor
    //     fetchWithAuth('/facturas', {
    //       params: {
    //         page: 1,
    //         limit: 1,
    //         tipo: 'PRF',
    //         fecha: fechaHoy,
    //         codigoVendedor: codigoVendedor
    //       }
    //     })
    //   ]);

    //   // Procesar respuestas en paralelo
    //   const resultados = await Promise.all([
    //     responseVentasHoy.ok ? responseVentasHoy.json() : null,
    //     responseVentasVendedor.ok ? responseVentasVendedor.json() : null
    //   ]);

    //   // Almacenar valores individuales
    //   if (resultados[0] && resultados[0].meta?.totalItems !== undefined) {
    //     ventasHoy = resultados[0].meta.totalItems;
    //   }
      
    //   if (resultados[1] && resultados[1].meta?.totalItems !== undefined) {
    //     ventasVendedor = resultados[1].meta.totalItems;
    //   }

    //   // Actualizar la estadística combinada
    //   // quickStats[0].value = `${ventasVendedor} / ${ventasHoy}`;
    //   quickStats[0].targetValue = ventasVendedor + ventasHoy;
    //   quickStats[0].displayValue = ventasVendedor + ventasHoy;

    //   // Actualizar la vista una sola vez
    //   quickStats = [...quickStats];
    // } catch (error) {
    //   console.error('Error al cargar estadísticas:', error);
    // }
  

  onMount(async () => {
    // Una sola verificación de autenticación al inicio
    const authState = get(auth);
    
    if (!authState.isAuthenticated) {
      try {
        await auth.verifySession();
        const nuevoAuthState = get(auth);
        
        if (!nuevoAuthState.isAuthenticated) {
          mostrarModalLogin = true;
        }
      } catch (error) {
        console.error("Error al verificar sesión:", error);
        mostrarModalLogin = true;
      }
    }
    
    // Cargar estadísticas inmediatamente
    // cargarEstadisticas();
  });

  function navigateTo(route: string) {
    // Asegurar que la ruta sea absoluta
    const absoluteRoute = route.startsWith('/') ? route : `/${route}`;
    navigate(absoluteRoute);
  }
</script>

<!-- Comentado para desvincular el bot de Telegram
<svelte:head>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</svelte:head>
-->

<div class="home-container">
  <!-- Header con saludo personalizado -->
  <header class="header">
    <div class="app-title">
      <h1>Janus MiniMonster</h1>
      {#if userName}
        <p class="welcome-text">¡Hola, {userName}! 👋</p>
      {:else if vendedorNombre && isAuthenticated}
        <div class="welcome-container">
          <p class="welcome-text">Hola, {vendedorNombre}! 👋</p>
          <button class="logout-button" on:click={cerrarSesion} title="Cerrar sesión">
            <span class="logout-icon">🚪</span>
          </button>
        </div>
      {:else}
        <div class="welcome-container">
          <p class="welcome-text">¡Bienvenido! 👋</p>
          <button class="login-button" on:click={() => mostrarModalLogin = true} title="Iniciar sesión">
            <span class="login-icon">🔑</span>
          </button>
        </div>
      {/if}
    </div>
  </header>

  <!-- Estadísticas Rápidas -->
  <div class="stats-container">
    {#each quickStats as stat}
      {#if stat.route}
        <button 
          class="stat-card clickable"
          on:click={() => navigateTo(stat.route as string)}
          aria-label={`Ver ${stat.label}`}
        >
          <div class="stat-icon">{stat.icon}</div>
          <div class="stat-content">
            <div class="stat-value">{stat.value}</div>
            <div class="stat-label">{stat.label}</div>
            {#if stat.label === 'Ventas'}
              <div class="stat-sublabel">Mis ventas / Total del día</div>
            {/if}
          </div>
        </button>
      {:else}
        <div class="stat-card">
          <div class="stat-icon">{stat.icon}</div>
          <div class="stat-content">
            <div class="stat-value">{stat.value}</div>
            <div class="stat-label">{stat.label}</div>
          </div>
        </div>
      {/if}
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
  
  <!-- Modal de inicio de sesión -->
  {#if mostrarModalLogin}
    <div class="modal-overlay">
      <div class="modal-content">
        <h2>Iniciar Sesión</h2>
        
        {#if errorLogin}
          <div class="error-message">{errorLogin}</div>
          <div class="error-message">Puedes usar Empresa 1, Usuario 1 y Contraseña 1234 para probar la aplicación</div>
        {/if}
        
        <form on:submit|preventDefault={iniciarSesion}>
          <div class="form-group">
            <label for="empresa">Empresa</label>
            <input 
              type="text" 
              id="empresa" 
              bind:value={empresa}
              placeholder="Ingrese el código de empresa"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="usuario">Usuario</label>
            <input 
              type="text" 
              id="usuario" 
              bind:value={usuario}
              placeholder="Ingrese su usuario"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              bind:value={password}
              placeholder="Ingrese su contraseña"
              required
            />
          </div>
          
          <div class="form-actions">
            <button 
              type="button" 
              class="btn-cancelar" 
              on:click={() => navigateTo('/ventas/bot/minimonster')}
              disabled={cargandoLogin}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              class="btn-login"
              disabled={cargandoLogin}
            >
              {cargandoLogin ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
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

  .welcome-container {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .welcome-text {
    margin: 8px 0 0 0;
    color: var(--tg-theme-hint-color, #999);
    font-size: 1.1rem;
  }

  .logout-button,
  .login-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s ease;
  }

  .logout-button:hover,
  .login-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .logout-icon,
  .login-icon {
    font-size: 1.2rem;
  }

  /* Estilos para las estadísticas */
  .stats-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    font-family: inherit;
    font-size: inherit;
    border: none;
    width: 100%;
    height: 90px; /* Altura fija para todas las tarjetas */
  }

  .clickable {
    cursor: pointer;
    transition: transform 0.2s ease, background-color 0.2s ease;
  }

  .clickable:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }

  .clickable:active {
    transform: scale(0.98);
    background-color: rgba(0, 0, 0, 0.03);
  }

  .clickable:focus {
    outline: 2px solid var(--tg-theme-button-color, #2481cc);
    outline-offset: 2px;
  }

  .stat-icon {
    font-size: 1.8rem;
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--tg-theme-text-color, #000);
  }

  .stat-label {
    font-size: 0.9rem;
    color: var(--tg-theme-hint-color, #999);
    margin-top: 4px;
  }

  .stat-sublabel {
    font-size: 0.7rem;
    color: var(--tg-theme-hint-color, #999);
    margin-top: 2px;
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

  /* Estilos para el modal de login */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background-color: var(--tg-theme-bg-color, #fff);
    padding: 24px;
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .modal-content h2 {
    margin: 0 0 20px 0;
    font-size: 1.5rem;
    color: var(--tg-theme-text-color, #000);
    text-align: center;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: var(--tg-theme-text-color, #000);
  }

  .form-group input {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--tg-theme-hint-color, #ccc);
    border-radius: 6px;
    font-size: 1rem;
    background-color: var(--tg-theme-bg-color, #fff);
    color: var(--tg-theme-text-color, #000);
  }

  .form-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 24px;
  }

  .btn-cancelar {
    padding: 10px 16px;
    background: none;
    border: 1px solid var(--tg-theme-hint-color, #ccc);
    border-radius: 6px;
    color: var(--tg-theme-text-color, #000);
    cursor: pointer;
    font-size: 1rem;
  }

  .btn-login {
    padding: 10px 16px;
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
  }

  .btn-login:disabled,
  .btn-cancelar:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .error-message {
    background-color: #ffebee;
    color: #d32f2f;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 0.9rem;
  }

  @media (max-width: 360px) {
    .feature-card {
      padding: 16px;
    }
    
    .modal-content {
      padding: 16px;
    }
  }
</style> 