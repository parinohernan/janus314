<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto as navigate } from '$app/navigation';
  import '../../../../app.css';
  import QuickStats from '../components/QuickStats.svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { auth } from '$lib/stores/authStore';
  import { get } from 'svelte/store';

  // Asegurar que haya un token para el bot de Telegram
  if (typeof localStorage !== 'undefined' && !localStorage.getItem('authToken')) {
    // Si no hay token, establece uno temporal para el bot
    localStorage.setItem('authToken', 'bot-telegram-token-temporal');
  }

  // Función para probar el inicio de sesión directamente
  async function probarInicioSesion() {
    try {
      console.log("Intentando inicio de sesión para el bot...");
      
      // Usar credenciales de bot para el inicio de sesión
      // Puedes ajustar estos valores según tu sistema
      const resultado = await auth.login({
        usuario: "vendedorbot",
        password: "botpassword",
        empresa: "1"  // Ajustar según corresponda
      });
      
      console.log("Resultado de inicio de sesión:", resultado);
      return resultado.success;
    } catch (error) {
      console.error("Error en inicio de sesión para bot:", error);
      return false;
    }
  }

  // Inicializar datos del vendedor para el contexto del bot
  async function inicializarDatosVendedorBot() {
    try {
      // Intentar obtener información del vendedor para el bot
      const response = await fetchWithAuth('/telegram/datos');
      if (response.ok) {
        const data = await response.json();
        console.log("Datos del bot de Telegram:", data);
        
        if (data.success && data.data && data.data.vendedor) {
          const vendedor = data.data.vendedor;
          // Almacenar información del vendedor en localStorage para usarla
          localStorage.setItem('botVendedorNombre', vendedor.nombre || 'Vendedor');
          localStorage.setItem('botVendedorApellido', vendedor.apellido || '');
          localStorage.setItem('botVendedorCodigo', vendedor.codigo || '1');
          
          // Forzar actualización de variables
          vendedorNombre = `${vendedor.nombre || 'Vendedor'} ${vendedor.apellido || ''}`.trim();
          codigoVendedor = vendedor.codigo || '1';
          
          // Intentar verificar la sesión para ver si podemos obtener datos de usuario
          await auth.verifySession();
          
          return true;
        }
      } else {
        console.error("Error al obtener datos del bot:", await response.text());
      }
      
      // Si no se pudo obtener datos, usar datos por defecto
      localStorage.setItem('botVendedorNombre', 'Vendedor');
      localStorage.setItem('botVendedorApellido', 'Bot');
      localStorage.setItem('botVendedorCodigo', '1');
      
      // Actualizar variables locales
      vendedorNombre = 'Vendedor Bot';
      codigoVendedor = '1';
      
      return true;
    } catch (error) {
      console.error("Error al inicializar datos del vendedor:", error);
      // Establecer valores por defecto
      vendedorNombre = 'Vendedor Bot';
      codigoVendedor = '1';
      return false;
    }
  }

  // Interfaz para el objeto Telegram WebApp
  /* 
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
  */
  
  let userName: string = '';
  let vendedorNombre: string = '';
  let codigoVendedor: string = '2';
  let isAuthenticated: boolean = false;
  
  // Estado del modal de login
  let mostrarModalLogin = false;
  let usuario = '';
  let password = '';
  let empresa = ''; // Cambio a cadena vacía para que el usuario introduzca el valor
  let errorLogin = '';
  let cargandoLogin = false;
  
  // Suscripción al store de autenticación
  let unsubscribe = auth.subscribe((state) => {
    console.log("Estado de autenticación:", state);
    isAuthenticated = state.isAuthenticated;
    
    if (state.user) {
      // Verificar si el usuario está activo
      if (!state.user.activo) {
        // Si el usuario no está activo, mostrar error y cerrar sesión
        mostrarError('Su cuenta no está activa. Contacte al administrador.');
        cerrarSesion();
        return;
      }
      
      vendedorNombre = `${state.user.nombre} ${state.user.apellido || ''}`.trim();
      // Obtener el código del vendedor si existe
      if (state.user.codigoVendedor) {
        codigoVendedor = state.user.usuario;
      }
      
      // Guardar los datos del vendedor en localStorage
      guardarDatosVendedor(state.user);
      
      // Si el usuario está autenticado, cerrar el modal de login si estaba abierto
      mostrarModalLogin = false;
    
    } else {
      // Intentar recuperar datos del vendedor de localStorage si existen
      const nombreGuardado = localStorage.getItem('botVendedorNombre');
      const apellidoGuardado = localStorage.getItem('botVendedorApellido');
      const codigoGuardado = localStorage.getItem('botVendedorCodigo');
      
      if (nombreGuardado) {
        vendedorNombre = `${nombreGuardado} ${apellidoGuardado || ''}`.trim();
        if (codigoGuardado) {
          codigoVendedor = codigoGuardado;
        }
        console.log("Datos del vendedor recuperados de localStorage:", vendedorNombre, codigoVendedor);
      }
    }
  });

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
      // Mantenemos empresa para facilidad del usuario
      
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
      console.log("Datos de vendedor guardados en localStorage:", usuario.usuario);
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
      
      // Verificación adicional de usuario activo después del login
      // (La comprobación principal se realiza en el subscribe)
      const authState = get(auth);
      if (authState.user && !authState.user.activo) {
        errorLogin = 'Su cuenta no está activa. Contacte al administrador.';
        await auth.logout();
      } else if (authState.user) {
        // Guardar datos del usuario en localStorage
        guardarDatosVendedor(authState.user);
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

      // Cargar datos básicos desde la API centralizada de Telegram
      // const responseDatosTelegram = await fetchWithAuth('/telegram/datos');
      
      // if (responseDatosTelegram.ok) {
      //   const telegramData = await responseDatosTelegram.json();
        
      //   if (telegramData.success && telegramData.data) {
      //     // Si hay estadísticas disponibles, actualizarlas
      //     if (telegramData.data.stats) {
      //       if (telegramData.data.stats.clientesActivos !== undefined) {
      //         quickStats[2].value = telegramData.data.stats.clientesActivos.toString();
      //         quickStats[2].targetValue = telegramData.data.stats.clientesActivos;
      //       }
      //     }
          
      //     // Guardar la sucursal para uso posterior
      //     if (telegramData.data.sucursal) {
      //       localStorage.setItem('sucursalActual', telegramData.data.sucursal);
      //     }
      //   }
      // }

      // Cargar ventas totales del día
      const responseVentasHoy = await fetchWithAuth('/facturas', {
        params: {
          page: 1,
          limit: 1,
          tipo: 'PRF',
          fecha: fechaHoy
        }
      });

      if (responseVentasHoy.ok) {
        const dataVentasHoy = await responseVentasHoy.json();
        console.log('Respuesta ventas hoy - totalItems:', dataVentasHoy.meta?.totalItems);
        if (dataVentasHoy.meta?.totalItems !== undefined) {
          quickStats[0].value = dataVentasHoy.meta.totalItems.toString();
          quickStats[0].targetValue = dataVentasHoy.meta.totalItems;
        }
      } else {
        console.error('Error en respuesta ventas hoy:', await responseVentasHoy.text());
      }

      // Cargar ventas del vendedor usando el código de vendedor del usuario logueado
      const responseVentasVendedor = await fetchWithAuth('/facturas', {
        params: {
          page: 1,
          limit: 1,
          tipo: 'PRF',
          fecha: fechaHoy,
          codigoVendedor: "2"
        }
      });

      if (responseVentasVendedor.ok) {
        const dataVentasVendedor = await responseVentasVendedor.json();
        console.log('Respuesta ventas vendedor ' + codigoVendedor + ' - totalItems:', dataVentasVendedor.meta?.totalItems);
        if (dataVentasVendedor.meta?.totalItems !== undefined) {
          quickStats[1].value = dataVentasVendedor.meta.totalItems.toString();
          quickStats[1].targetValue = dataVentasVendedor.meta.totalItems;
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
    // Verificar estado actual de autenticación
    const authState = get(auth);
    console.log("Estado inicial de autenticación:", authState);
    
    // Verificar si el usuario está autenticado
    if (!authState.isAuthenticated) {
      // Intentar verificar la sesión
      await auth.verifySession();
      
      // Verificar de nuevo después de verificar la sesión
      const nuevoAuthState = get(auth);
      
      // Si aún no está autenticado, mostrar el modal de login
      if (!nuevoAuthState.isAuthenticated) {
        mostrarModalLogin = true;
      }
    }
    
    /* Código de integración con Telegram, comentado para desvincular el bot
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
    */

    // Cargar estadísticas al montar el componente
    await cargarEstadisticas();
  });

  function navigateTo(route: string) {
    navigate(route);
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
  <QuickStats codigoVendedor={codigoVendedor} />

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