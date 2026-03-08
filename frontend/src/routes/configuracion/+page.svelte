<script lang="ts">
  import { onMount } from 'svelte';
  import { ConfiguracionService } from '$lib/services/ConfiguracionService';
  import type { Configuracion } from '$lib/types';
  import { menuVisibilityStore, MENU_ENTRIES } from '$lib/stores/menuVisibilityStore';
  
  let configuraciones = $state<Configuracion[]>([]);
  let cargando = $state(true);
  let guardando = $state(false);
  let mensaje = $state('');
  let mensajeTipo: 'success' | 'error' = $state('success');
  
  // Valores editables
  let valores: Record<string, string> = $state({});
  
  // Configuraciones que queremos mostrar
  const configuracionesVisibles = ['CANT_ITEMS'];
  
  onMount(async () => {
    await cargarConfiguraciones();
  });
  
  async function cargarConfiguraciones() {
    try {
      cargando = true;
      const todasLasConfigs = await ConfiguracionService.obtenerConfiguraciones();
      
      // Filtrar solo las configuraciones visibles
      configuraciones = todasLasConfigs.filter(c => 
        configuracionesVisibles.includes(c.Codigo)
      );
      
      // Inicializar valores
      configuraciones.forEach(config => {
        valores[config.Codigo] = config.ValorConfig || '';
      });
      
    } catch (error) {
      console.error('Error al cargar configuraciones:', error);
      mostrarMensaje('Error al cargar las configuraciones', 'error');
    } finally {
      cargando = false;
    }
  }
  
  async function guardarConfiguracion(codigo: string) {
    try {
      guardando = true;
      const exito = await ConfiguracionService.actualizarConfiguracion(
        codigo,
        valores[codigo]
      );
      
      if (exito) {
        mostrarMensaje('Configuración guardada correctamente', 'success');
        await cargarConfiguraciones();
      } else {
        mostrarMensaje('Error al guardar la configuración', 'error');
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      mostrarMensaje('Error al guardar la configuración', 'error');
    } finally {
      guardando = false;
    }
  }
  
  function mostrarMensaje(msg: string, tipo: 'success' | 'error') {
    mensaje = msg;
    mensajeTipo = tipo;
    setTimeout(() => {
      mensaje = '';
    }, 3000);
  }
  
  function obtenerDescripcionAmigable(codigo: string): string {
    const descripciones: Record<string, string> = {
      'CANT_ITEMS': 'Cantidad de Items por Página'
    };
    return descripciones[codigo] || codigo;
  }
  
  function obtenerTipoInput(codigo: string): string {
    const tipos: Record<string, string> = {
      'CANT_ITEMS': 'number'
    };
    return tipos[codigo] || 'text';
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-800">Configuración del Sistema</h1>
    <p class="text-gray-600 mt-2">Gestiona los parámetros generales del sistema</p>
  </div>
  
  {#if mensaje}
    <div 
      class="mb-4 p-4 rounded-lg {mensajeTipo === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}"
    >
      {mensaje}
    </div>
  {/if}
  
  {#if cargando}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  {:else}
    <!-- Configuración de Menú -->
    <div class="bg-white rounded-lg shadow-md mb-6">
      <div class="p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Configuración de Menú</h2>
        <p class="text-sm text-gray-500 mb-6">
          Elige qué elementos del menú lateral (principales y submenús) quieres mostrar u ocultar.
        </p>
        <div class="space-y-6">
          {#each MENU_ENTRIES.filter((e) => !e.parentId) as mainEntry}
            <div>
              <div class="flex items-center justify-between py-2 border-b border-gray-200">
                <span class="font-semibold text-gray-800">{mainEntry.label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-label="Mostrar u ocultar {mainEntry.label}"
                  aria-checked={$menuVisibilityStore[mainEntry.id] ?? true}
                  class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    {($menuVisibilityStore[mainEntry.id] ?? true) ? 'bg-blue-600' : 'bg-gray-200'}"
                  onclick={() => menuVisibilityStore.setVisible(mainEntry.id, !($menuVisibilityStore[mainEntry.id] ?? true))}
                >
                  <span
                    class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                      {($menuVisibilityStore[mainEntry.id] ?? true) ? 'translate-x-5' : 'translate-x-1'}"
                    aria-hidden="true"
                  ></span>
                </button>
              </div>
              <div class="ml-4 mt-2 space-y-2">
                {#each MENU_ENTRIES.filter((e) => e.parentId === mainEntry.id) as subEntry}
                  <div class="flex items-center justify-between py-2 pl-4 border-l-2 border-gray-100">
                    <label for={`menu-${subEntry.id}`} class="text-sm text-gray-600 cursor-pointer flex-1">
                      {subEntry.label}
                    </label>
                    <button
                      id={`menu-${subEntry.id}`}
                      type="button"
                      role="switch"
                      aria-label="Mostrar u ocultar {subEntry.label}"
                      aria-checked={$menuVisibilityStore[subEntry.id] ?? true}
                      class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        {($menuVisibilityStore[subEntry.id] ?? true) ? 'bg-blue-600' : 'bg-gray-200'}"
                      onclick={() => menuVisibilityStore.setVisible(subEntry.id, !($menuVisibilityStore[subEntry.id] ?? true))}
                    >
                      <span
                        class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                          {($menuVisibilityStore[subEntry.id] ?? true) ? 'translate-x-4' : 'translate-x-0.5'}"
                        aria-hidden="true"
                      ></span>
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
        <div class="mt-6">
          <button
            type="button"
            onclick={() => menuVisibilityStore.resetToDefault()}
            class="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Restaurar todos visibles
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-md">
      <div class="p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Parámetros generales</h2>
        {#if configuraciones.length === 0}
          <p class="text-center text-gray-500 py-8">No hay configuraciones disponibles</p>
        {:else}
          <div class="space-y-6">
            {#each configuraciones as config}
              <div class="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div class="flex-1">
                    <label 
                      for={config.Codigo}
                      class="block text-lg font-semibold text-gray-700 mb-1"
                    >
                      {obtenerDescripcionAmigable(config.Codigo)}
                    </label>
                    {#if config.Descripcion}
                      <p class="text-sm text-gray-500">{config.Descripcion}</p>
                    {/if}
                  </div>
                  
                  <div class="flex items-center gap-3 md:w-1/3">
                    <input
                      type={obtenerTipoInput(config.Codigo)}
                      id={config.Codigo}
                      bind:value={valores[config.Codigo]}
                      class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={guardando}
                    />
                    
                    <button
                      onclick={() => guardarConfiguracion(config.Codigo)}
                      disabled={guardando || valores[config.Codigo] === config.ValorConfig}
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      {#if guardando}
                        Guardando...
                      {:else}
                        Guardar
                      {/if}
                    </button>
                  </div>
                </div>
                
                <div class="mt-2 text-xs text-gray-400">
                  Código: {config.Codigo}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
    
    <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 class="font-semibold text-blue-800 mb-2">Información</h3>
      <ul class="text-sm text-blue-700 space-y-1">
        <li>• Los cambios se guardan individualmente al presionar el botón "Guardar"</li>
        <li>• Asegúrate de ingresar valores válidos para cada configuración</li>
        <li>• Los cambios pueden afectar el comportamiento del sistema</li>
      </ul>
    </div>
  {/if}
</div>

<style>
  /* Estilos adicionales si son necesarios */
</style>
