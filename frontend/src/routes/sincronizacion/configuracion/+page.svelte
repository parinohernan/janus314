<script lang="ts">
  import { onMount } from 'svelte';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { fade } from 'svelte/transition';

  interface Configuracion {
    servidor: string;
    baseDatos: string;
    usuario: string;
    password: string;
  }

  let configuracion: Configuracion = {
    servidor: '',
    baseDatos: '',
    usuario: '',
    password: ''
  };

  let loading = true;
  let saving = false;
  let error: string | null = null;
  let successMessage: string | null = null;

  onMount(async () => {
    try {
      const response = await fetch(`${PUBLIC_API_URL}/sincronizacion/configuracion`);
      if (!response.ok) throw new Error('Error al cargar la configuración');
      
      const data = await response.json();
      if (data.data) {
        configuracion = {
          servidor: data.data.servidor || '',
          baseDatos: data.data.baseDatos || '',
          usuario: data.data.usuario || '',
          password: data.data.password || ''
        };
      }
      loading = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al cargar la configuración';
      loading = false;
    }
  });

  async function handleSubmit() {
    saving = true;
    error = null;
    successMessage = null;

    try {
      const response = await fetch(`${PUBLIC_API_URL}/sincronizacion/configuracion`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configuracion)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar la configuración');
      }

      const data = await response.json();
      successMessage = data.message || 'Configuración guardada correctamente';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al guardar la configuración';
    } finally {
      saving = false;
    }
  }
</script>

<div class="container mx-auto px-4 py-8" in:fade>
  <div class="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
    <h1 class="text-3xl font-bold text-gray-800 mb-8">Configuración de Sincronización Móvil</h1>

    {#if loading}
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    {:else}
      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <div class="grid grid-cols-1 gap-6">
          <div class="form-group">
            <label for="servidor" class="block text-sm font-medium text-gray-700 mb-1">Servidor</label>
            <input
              type="text"
              id="servidor"
              bind:value={configuracion.servidor}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Ej: localhost"
            />
          </div>

          <div class="form-group">
            <label for="baseDatos" class="block text-sm font-medium text-gray-700 mb-1">Base de Datos</label>
            <input
              type="text"
              id="baseDatos"
              bind:value={configuracion.baseDatos}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Ej: db_preventas"
            />
          </div>

          <div class="form-group">
            <label for="usuario" class="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              type="text"
              id="usuario"
              bind:value={configuracion.usuario}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Ej: usuario_preventas"
            />
          </div>

          <div class="form-group">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              id="password"
              bind:value={configuracion.password}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Ingrese la contraseña"
            />
          </div>
        </div>

        {#if error}
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span class="block sm:inline">{error}</span>
          </div>
        {/if}

        {#if successMessage}
          <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span class="block sm:inline">{successMessage}</span>
          </div>
        {/if}

        <div class="flex justify-end mt-6">
          <button
            type="submit"
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {#if saving}
              <span class="flex items-center">
                <span class="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                Guardando...
              </span>
            {:else}
              Guardar Configuración
            {/if}
          </button>
        </div>
      </form>
    {/if}
  </div>
</div> 