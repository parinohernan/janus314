<script lang="ts">
  import { onMount } from 'svelte';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { fade } from 'svelte/transition';

  interface EstadoActualizacion {
    ultimaActualizacion: string | null;
    estado: 'idle' | 'procesando' | 'completado' | 'error';
    mensaje: string | null;
  }

  let estado: EstadoActualizacion = {
    ultimaActualizacion: null,
    estado: 'idle',
    mensaje: null
  };

  let loading = true;

  onMount(async () => {
    try {
      const response = await fetch(`${PUBLIC_API_URL}/sincronizacion/estado-actualizacion`);
      if (!response.ok) throw new Error('Error al cargar el estado de actualización');
      
      const data = await response.json();
      estado.ultimaActualizacion = data.data.ultimaActualizacion;
      loading = false;
    } catch (err) {
      estado.mensaje = err instanceof Error ? err.message : 'Error al cargar el estado de actualización';
      loading = false;
    }
  });

  async function iniciarActualizacion() {
    estado.estado = 'procesando';
    estado.mensaje = null;

    try {
      const response = await fetch(`${PUBLIC_API_URL}/sincronizacion/actualizar-datos`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Error al iniciar la actualización');
      }

      const data = await response.json();
      estado.ultimaActualizacion = new Date().toISOString();
      estado.estado = 'completado';
      estado.mensaje = 'Actualización completada exitosamente';
    } catch (err) {
      estado.estado = 'error';
      estado.mensaje = err instanceof Error ? err.message : 'Error al iniciar la actualización';
    }
  }
</script>

<div class="container mx-auto px-4 py-8" in:fade>
  <div class="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
    <h1 class="text-3xl font-bold text-gray-800 mb-8">Actualizar Datos</h1>

    {#if loading}
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    {:else}
      <div class="space-y-6">
        <div class="bg-gray-50 p-4 rounded-lg">
          <h2 class="text-lg font-semibold text-gray-700 mb-2">Última Actualización</h2>
          <p class="text-gray-600">
            {#if estado.ultimaActualizacion}
              {new Date(estado.ultimaActualizacion).toLocaleString()}
            {:else}
              No se ha realizado ninguna actualización
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
            on:click={iniciarActualizacion}
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={estado.estado === 'procesando'}
          >
            {#if estado.estado === 'procesando'}
              <span class="flex items-center">
                <span class="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                Actualizando...
              </span>
            {:else}
              Iniciar Actualización
            {/if}
          </button>
        </div>
      </div>
    {/if}
  </div>
</div> 