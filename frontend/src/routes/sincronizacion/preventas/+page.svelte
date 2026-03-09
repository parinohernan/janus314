<script lang="ts">
  import { onMount } from 'svelte';
  import { beforeNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import { fade } from 'svelte/transition';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { auth } from '$lib/stores/authStore';
  import { get } from 'svelte/store';
  import { navigationState } from '$lib/stores/navigationState';

  const PAGE_PATH = '/sincronizacion/preventas';

  // Estado específico para la descarga
  let descargaEstado = 'idle'; // 'idle', 'procesando', 'completado', 'error'
  let descargaMensaje = '';
  let descargaCantidad = 0;
  let ultimaDescargaFecha: string | null = null;
  let loadingDescarga = true; // Para cargar estado inicial
  let usuarioAutenticado = true; // Para mostrar estado de autenticación

  // Cargar estado inicial de descarga
  onMount(async () => {
    let savedScroll: number | undefined;
    if (browser) {
      const savedState = navigationState.getState(PAGE_PATH);
      savedScroll = savedState?.scroll;
    }
    try {
      // Verificar autenticación antes de cargar datos
      const authState = get(auth);
      if (!authState.isAuthenticated || !authState.token) {
        console.log('[Preventas] Usuario no autenticado en onMount:', authState);
        usuarioAutenticado = false;
        loadingDescarga = false;
        return;
      }

      const response = await fetchWithAuth('/sincronizacion/estado-descarga');
      if (response.ok) {
        const data = await response.json();
        ultimaDescargaFecha = data.data.ultimaDescarga;
      } else {
        console.warn('No se pudo cargar el estado inicial de descarga');
      }
    } catch (err) {
      console.error("Error cargando estado de descarga inicial:", err);
      // Si es error de autenticación, no mostrar error crítico
      if (err instanceof Error && err.message.includes('token')) {
        console.log('[Preventas] Error de autenticación en carga inicial');
        usuarioAutenticado = false;
      }
    }
    loadingDescarga = false;
    if (typeof savedScroll === 'number' && savedScroll > 0 && typeof window !== 'undefined') {
      requestAnimationFrame(() => window.scrollTo(0, savedScroll));
    }
  });

  beforeNavigate(({ from }) => {
    if (from?.url.pathname === PAGE_PATH && browser) {
      const currentState = navigationState.getState(PAGE_PATH) || {};
      navigationState.saveState(PAGE_PATH, {
        ...currentState,
        scroll: typeof window !== 'undefined' ? window.scrollY : 0
      });
    }
  });

  async function iniciarDescarga() {
    // Verificar autenticación antes de iniciar
    const authState = get(auth);
    if (!authState.isAuthenticated || !authState.token) {
      descargaEstado = 'error';
      descargaMensaje = 'No estás autenticado. Por favor, inicia sesión nuevamente.';
      console.log('[Preventas] Error de autenticación:', authState);
      return;
    }

    descargaEstado = 'procesando';
    descargaMensaje = 'Iniciando descarga...';
    descargaCantidad = 0;
    console.log('[Descarga] Estado inicial:', descargaEstado, 'Mensaje:', descargaMensaje);

    try {
      const startTime = Date.now(); 
      const response = await fetchWithAuth('/sincronizacion/descargar-preventas', {
        method: 'POST'
      });

      const data = await response.json(); 
      const endTime = Date.now(); 
      const duration = ((endTime - startTime) / 1000).toFixed(2); 

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}: ${response.statusText || 'Error desconocido del servidor'}`);
      }

      // Éxito
      descargaEstado = 'completado';
      descargaCantidad = data.data?.cantidad || 0;
      ultimaDescargaFecha = data.data?.ultimaDescarga; // Actualizar fecha

      // Mensaje específico si no se procesaron preventas
      if (descargaCantidad === 0) {
        descargaMensaje = `Descarga completada en ${duration}s. No había preventas pendientes para procesar.`;
      } else {
        descargaMensaje = `Descarga completada en ${duration}s. Se procesaron ${descargaCantidad} preventas.`; 
      }
      console.log('[Descarga] Éxito - Estado:', descargaEstado, 'Mensaje:', descargaMensaje);

    } catch (err) {
      console.error("Error en iniciarDescarga:", err);
      descargaEstado = 'error';
      
      // Manejo específico de errores de autenticación
      if (err instanceof Error && err.message.includes('token')) {
        descargaMensaje = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      } else {
        descargaMensaje = err instanceof Error ? err.message : 'Ocurrió un error desconocido durante la descarga.';
      }
      
      console.log('[Descarga] Error - Estado:', descargaEstado, 'Mensaje:', descargaMensaje);
    }
  }
</script>

<div class="container mx-auto px-4 py-8" in:fade>
  <div class="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
    <h1 class="text-3xl font-bold text-gray-800 mb-8">Descargar Preventas</h1>

    {#if loadingDescarga}
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    {:else if !usuarioAutenticado}
      <div class="text-center space-y-4">
        <div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p class="font-medium">No estás autenticado</p>
          <p class="text-sm">Para usar esta función, necesitas iniciar sesión.</p>
        </div>
        <a
          href="/login"
          class="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Ir al Login
        </a>
      </div>
    {:else}
      <div class="space-y-6">
        <!-- Sección Última Descarga -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h2 class="text-lg font-semibold text-gray-700 mb-2">Última Descarga</h2>
          <p class="text-gray-600">
            {#if ultimaDescargaFecha}
              {new Date(ultimaDescargaFecha).toLocaleString()}
            {:else}
              No se ha realizado ninguna descarga
            {/if}
          </p>
        </div>

        <!-- Mostrar estado/resultado de la descarga -->
        {#if descargaEstado !== 'idle'}
           {@const bgColor = descargaEstado === 'error' ? 'bg-red-100 text-red-700' :
                           (descargaEstado === 'completado' && descargaCantidad === 0 ? 'bg-yellow-100 text-yellow-800' : 
                           (descargaEstado === 'completado' ? 'bg-green-100 text-green-700' :
                           'bg-blue-100 text-blue-700'))}
           <div class="p-4 rounded-lg {bgColor}">
            <p class="font-medium">Estado: {descargaEstado === 'completado' ? 'Completado' : (descargaEstado === 'error' ? 'Error' : 'Procesando')}</p>
            <p>{descargaMensaje}</p>
          </div>
        {/if}

        <!-- Botón de descarga -->
        <div class="flex justify-center mt-6 space-x-4">
          <button
            on:click={iniciarDescarga}
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={descargaEstado === 'procesando'}
          >
            {#if descargaEstado === 'procesando'}
              <span class="flex items-center">
                <span class="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                Descargando...
              </span>
            {:else}
              Iniciar Descarga
            {/if}
          </button>
          
          {#if descargaEstado === 'error' && descargaMensaje?.includes('autenticado')}
            <a
              href="/login"
              class="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Ir al Login
            </a>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div> 