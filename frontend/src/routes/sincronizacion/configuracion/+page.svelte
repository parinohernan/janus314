<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

  interface Configuracion {
    servidor: string;
    baseDatos: string;
    usuario: string;
    password: string;
    puerto: string;
  }

  let configuracion: Configuracion = {
    servidor: '',
    baseDatos: '',
    usuario: '',
    password: '',
    puerto: '3306'
  };

  let loading = true;
  let saving = false;
  let testingConnection = false;
  let error: string | null = null;
  let successMessage: string | null = null;
  let connectionResult: any = null;

  onMount(async () => {
    try {
      const response = await fetchWithAuth('/sincronizacion/configuracion');
      if (!response.ok) throw new Error('Error al cargar la configuración');
      
      const data = await response.json();
      if (data.data) {
        configuracion = {
          servidor: data.data.servidor || '',
          baseDatos: data.data.baseDatos || '',
          usuario: data.data.usuario || '',
          password: data.data.password || '',
          puerto: data.data.puerto || '3306'
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
      const response = await fetchWithAuth('/sincronizacion/configuracion', {
        method: 'PUT',
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

  async function testConnection() {
    testingConnection = true;
    error = null;
    successMessage = null;
    connectionResult = null;

    try {
      const response = await fetchWithAuth('/sincronizacion/verificar-conexion');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al verificar la conexión');
      }

      const data = await response.json();
      connectionResult = data;
      successMessage = data.message;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al verificar la conexión';
    } finally {
      testingConnection = false;
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
            <label for="puerto" class="block text-sm font-medium text-gray-700 mb-1">Puerto</label>
            <input
              type="number"
              id="puerto"
              bind:value={configuracion.puerto}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Ej: 3306"
              min="1"
              max="65535"
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

        {#if connectionResult}
          <div class="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 class="text-lg font-semibold text-gray-800 mb-3">Resultado de la Verificación</h3>
            
            {#if connectionResult.data?.conexionExitosa}
              <div class="space-y-3">
                <div class="flex items-center text-green-600">
                  <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                  </svg>
                  Conexión exitosa
                </div>
                
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="font-medium">Servidor:</span> {connectionResult.data.config.PreventasServidor}
                  </div>
                  <div>
                    <span class="font-medium">Base de datos:</span> {connectionResult.data.config.PreventasBaseDeDatos}
                  </div>
                  <div>
                    <span class="font-medium">Usuario:</span> {connectionResult.data.config.PreventaUsuario}
                  </div>
                  <div>
                    <span class="font-medium">Preventas pendientes:</span> {connectionResult.data.preventasPendientes || 0}
                  </div>
                </div>

                {#if connectionResult.data.tablasExistentes?.length}
                  <div>
                    <span class="font-medium">Tablas encontradas:</span>
                    <div class="mt-1 flex flex-wrap gap-1">
                      {#each connectionResult.data.tablasExistentes as tabla}
                        <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">{tabla}</span>
                      {/each}
                    </div>
                  </div>
                {/if}

                {#if connectionResult.data.tablasFaltantes?.length}
                  <div>
                    <span class="font-medium text-orange-600">Tablas faltantes:</span>
                    <div class="mt-1 flex flex-wrap gap-1">
                      {#each connectionResult.data.tablasFaltantes as tabla}
                        <span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">{tabla}</span>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {:else}
              <div class="flex items-center text-red-600">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                </svg>
                Error de conexión
              </div>
              {#if connectionResult.error}
                <div class="mt-2 text-sm text-red-600">
                  {connectionResult.error}
                </div>
              {/if}
            {/if}
          </div>
        {/if}

        <div class="flex justify-between mt-6">
          <button
            type="button"
            on:click={testConnection}
            class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={testingConnection}
          >
            {#if testingConnection}
              <span class="flex items-center">
                <span class="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                Verificando...
              </span>
            {:else}
              Verificar Conexión
            {/if}
          </button>

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