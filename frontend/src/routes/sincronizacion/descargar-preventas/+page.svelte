<script lang="ts">
  import { onMount } from 'svelte';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { fade } from 'svelte/transition';

  interface EstadoDescarga {
    ultimaDescarga: string | null;
    estado: 'idle' | 'procesando' | 'completado' | 'error';
    mensaje: string | null;
  }

  let estado: EstadoDescarga = {
    ultimaDescarga: null,
    estado: 'idle',
    mensaje: null
  };

  let loading = true;

  onMount(async () => {
    try {
      const response = await fetch(`${PUBLIC_API_URL}/sincronizacion/estado-descarga`);
      if (!response.ok) throw new Error('Error al cargar el estado de descarga');
      
      const data = await response.json();
      estado.ultimaDescarga = data.data.ultimaDescarga;
      loading = false;
    } catch (err) {
      estado.mensaje = err instanceof Error ? err.message : 'Error al cargar el estado de descarga';
      loading = false;
    }
  });

  async function iniciarDescarga() {
    estado.estado = 'procesando';
    estado.mensaje = null;

    try {
      const response = await fetch(`${PUBLIC_API_URL}/sincronizacion/descargar-preventas`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Error al iniciar la descarga');
      }

      const data = await response.json();
      estado.ultimaDescarga = new Date().toISOString();
      estado.estado = 'completado';
      estado.mensaje = 'Descarga completada exitosamente';
    } catch (err) {
      estado.estado = 'error';
      estado.mensaje = err instanceof Error ? err.message : 'Error al iniciar la descarga';
    }
  }
</script>

<div class="container mx-auto px-4 py-8" in:fade>
  <div class="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
    <h1 class="text-3xl font-bold text-gray-800 mb-8">Descargar Preventas</h1>

    {#if loading}
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    {:else}
      <div class="space-y-6">
        <div class="bg-gray-50 p-4 rounded-lg">
          <h2 class="text-lg font-semibold text-gray-700 mb-2">Última Descarga</h2>
          <p class="text-gray-600">
            {#if estado.ultimaDescarga}
              {new Date(estado.ultimaDescarga).toLocaleString()}
            {:else}
              No se ha realizado ninguna descarga
            {/if}
          </p>
        </div>

        {#if estado.mensaje}
          <div class="p-4 rounded-lg {estado.estado === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">
            {estado.mensaje}
          </div>
        {/if}

        <div class="flex justify-center mt-6">
          <button
            on:click={iniciarDescarga}
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={estado.estado === 'procesando'}
          >
            {#if estado.estado === 'procesando'}
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