<script lang="ts">
  import { onMount } from 'svelte';
  import { ConfiguracionService } from '$lib/services/ConfiguracionService';
  import type { Configuracion } from '$lib/types';
  
  let configuraciones: Configuracion[] = [];
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
    <div class="bg-white rounded-lg shadow-md">
      <div class="p-6">
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
