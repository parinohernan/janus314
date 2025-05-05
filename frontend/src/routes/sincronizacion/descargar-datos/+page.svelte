<script lang="ts">
  import { onMount } from 'svelte'; // Añadido onMount
  import { PUBLIC_API_URL } from '$env/static/public'; // Añadido PUBLIC_API_URL
  import { fade } from 'svelte/transition'; // Asegúrate que fade esté importado si usas in:fade

  let descargaEstado = 'idle'; // 'idle', 'procesando', 'completado', 'error'
  let descargaMensaje = '';
  let descargaCantidad = 0;
  let ultimaDescargaFecha: string | null = null;
  let loadingDescarga = true; // Para cargar estado inicial

  // Cargar estado inicial de descarga
  onMount(async () => {
    try {
      const response = await fetch(`${PUBLIC_API_URL}/sincronizacion/estado-descarga`);
      if (response.ok) {
        const data = await response.json();
        ultimaDescargaFecha = data.data.ultimaDescarga;
      }
    } catch (err) {
      console.error("Error cargando estado de descarga inicial:", err);
      // No es crítico si falla, simplemente no se mostrará la fecha inicial
    }
    loadingDescarga = false;
  });

  async function iniciarDescarga() {
    descargaEstado = 'procesando';
    descargaMensaje = 'Iniciando descarga...';
    descargaCantidad = 0;
    console.log('[Descarga] Estado inicial:', descargaEstado, 'Mensaje:', descargaMensaje); // Log inicial

    try {
      const startTime = Date.now(); // Opcional: para medir duración
      const response = await fetch(`${PUBLIC_API_URL}/sincronizacion/descargar-preventas`, {
        method: 'POST'
      });

      const data = await response.json(); 
      const endTime = Date.now(); // Opcional
      const duration = ((endTime - startTime) / 1000).toFixed(2); // Opcional

      if (!response.ok) {
        // Error: Usa el mensaje del backend si existe
        throw new Error(data.error || `Error ${response.status}: ${response.statusText || 'Error desconocido del servidor'}`);
      }

      // Éxito
      descargaEstado = 'completado';
      descargaCantidad = data.data?.cantidad || 0;
      ultimaDescargaFecha = data.data?.ultimaDescarga;

      // Mensaje específico si no se procesaron preventas
      if (descargaCantidad === 0) {
        descargaMensaje = `Descarga completada en ${duration}s. No había preventas pendientes para procesar.`;
      } else {
        descargaMensaje = `Descarga completada en ${duration}s. Se procesaron ${descargaCantidad} preventas.`; 
      }
      console.log('[Descarga] Éxito - Estado:', descargaEstado, 'Mensaje:', descargaMensaje); // Log éxito

    } catch (err) {
      console.error("Error en iniciarDescarga:", err);
      descargaEstado = 'error';
      // Muestra el mensaje de error específico
      descargaMensaje = err instanceof Error ? err.message : 'Ocurrió un error desconocido durante la descarga.';
      console.log('[Descarga] Error - Estado:', descargaEstado, 'Mensaje:', descargaMensaje); // Log error
      // Podrías añadir: ` Intenta revisar los logs del servidor.`
    }
  }
</script>

<!-- Asume estructura similar a la de Actualizar -->
<div class="container mx-auto px-4 py-8">
  <div class="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
    <h1 class="text-3xl font-bold text-gray-800 mb-8">Descargar Preventas</h1>

    {#if loadingDescarga}
      <div class="flex justify-center items-center h-32">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    {:else}
      <div class="space-y-6">
        <!-- Mostrar última descarga -->
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
            <!-- Log para depurar si el bloque se renderiza -->
            <!-- { console.log('[Template] Renderizando bloque de mensaje. Estado:', descargaEstado) } -->
            <p>{descargaMensaje}!!!</p>
          </div>
        {/if}

        <!-- Botón de descarga -->
        <div class="flex justify-center mt-6">
          <button
            on:click={iniciarDescarga}
            class="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
      </div>
    {/if}
  </div>
</div> 