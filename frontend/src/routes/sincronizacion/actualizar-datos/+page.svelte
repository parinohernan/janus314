<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { auth } from '$lib/stores/authStore';
  import { get } from 'svelte/store';

  interface EstadoActualizacion {
    ultimaActualizacion: string | null;
    estado: 'idle' | 'procesando' | 'completado' | 'error';
    mensaje: string | null;
    tareas: {
      configuracion: boolean;
      articulos: boolean;
      clientes: boolean;
      vendedores: boolean;
    };
  }

  let estado: EstadoActualizacion = {
    ultimaActualizacion: null,
    estado: 'idle',
    mensaje: null,
    tareas: {
      configuracion: false,
      articulos: false,
      clientes: false,
      vendedores: false
    }
  };

  let loading = true;
  let usuarioAutenticado = true; // Para mostrar estado de autenticación

  onMount(async () => {
    try {
      // Verificar autenticación antes de cargar datos
      const authState = get(auth);
      if (!authState.isAuthenticated || !authState.token) {
        console.log('[Actualización] Usuario no autenticado en onMount:', authState);
        usuarioAutenticado = false;
        loading = false;
        return;
      }

      const response = await fetchWithAuth('/sincronizacion/estado-actualizacion');
      if (!response.ok) throw new Error('Error al cargar el estado de actualización');
      
      const data = await response.json();
      estado.ultimaActualizacion = data.data.ultimaActualizacion;
      loading = false;
    } catch (err) {
      // Si es error de autenticación, no mostrar error crítico
      if (err instanceof Error && err.message.includes('token')) {
        console.log('[Actualización] Error de autenticación en carga inicial');
      } else {
        estado.mensaje = err instanceof Error ? err.message : 'Error al cargar el estado de actualización';
      }
      loading = false;
    }
  });

  async function verificarConfiguracion() {
    try {
      const response = await fetchWithAuth('/sincronizacion/verificar-configuracion');
      if (!response.ok) throw new Error('Error al verificar configuración');
      
      const data = await response.json();
      if (!data.data.configCompleta) {
        throw new Error('La configuración de la base de datos de preventa está incompleta');
      }
      estado.tareas.configuracion = true;
      return true;
    } catch (err) {
      estado.estado = 'error';
      estado.mensaje = err instanceof Error ? err.message : 'Error al verificar configuración';
      return false;
    }
  }

  async function actualizarArticulos() {
    try {
      const response = await fetchWithAuth('/sincronizacion/actualizar-articulos', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Error al actualizar artículos');
      
      estado.tareas.articulos = true;
      return true;
    } catch (err) {
      estado.estado = 'error';
      estado.mensaje = err instanceof Error ? err.message : 'Error al actualizar artículos';
      return false;
    }
  }

  async function actualizarClientes() {
    try {
      const response = await fetchWithAuth('/sincronizacion/actualizar-clientes', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Error al actualizar clientes');
      
      estado.tareas.clientes = true;
      return true;
    } catch (err) {
      estado.estado = 'error';
      estado.mensaje = err instanceof Error ? err.message : 'Error al actualizar clientes';
      return false;
    }
  }

  async function actualizarVendedores() {
    try {
      const response = await fetchWithAuth('/sincronizacion/actualizar-vendedores', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Error al actualizar vendedores');
      
      estado.tareas.vendedores = true;
      return true;
    } catch (err) {
      estado.estado = 'error';
      estado.mensaje = err instanceof Error ? err.message : 'Error al actualizar vendedores';
      return false;
    }
  }

  async function finalizarActualizacion() {
    try {
      const response = await fetchWithAuth('/sincronizacion/finalizar-actualizacion', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Error al finalizar actualización');
      
      const data = await response.json();
      estado.ultimaActualizacion = data.data.ultimaActualizacion;
      estado.estado = 'completado';
      estado.mensaje = 'Actualización completada exitosamente';
    } catch (err) {
      estado.estado = 'error';
      estado.mensaje = err instanceof Error ? err.message : 'Error al finalizar actualización';
    }
  }

  async function iniciarActualizacion() {
    // Verificar autenticación antes de iniciar
    const authState = get(auth);
    if (!authState.isAuthenticated || !authState.token) {
      estado.estado = 'error';
      estado.mensaje = 'No estás autenticado. Por favor, inicia sesión nuevamente.';
      console.log('[Actualización] Error de autenticación:', authState);
      return;
    }

    estado.estado = 'procesando';
    estado.mensaje = null;
    estado.tareas = {
      configuracion: false,
      articulos: false,
      clientes: false,
      vendedores: false
    };

    try {
      // Verificar configuración
      if (!await verificarConfiguracion()) return;

      // Actualizar datos
      if (!await actualizarArticulos()) return;
      if (!await actualizarClientes()) return;
      if (!await actualizarVendedores()) return;

      // Finalizar actualización
      await finalizarActualizacion();
    } catch (err) {
      estado.estado = 'error';
      
      // Manejo específico de errores de autenticación
      if (err instanceof Error && err.message.includes('token')) {
        estado.mensaje = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      } else {
        estado.mensaje = err instanceof Error ? err.message : 'Error al iniciar la actualización';
      }
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

        {#if estado.estado !== 'idle'}
          <div class="space-y-4">
            <div class="flex items-center space-x-3">
              <div class="w-6 h-6 rounded-full {estado.tareas.configuracion ? 'bg-green-500' : 'bg-gray-300'}"></div>
              <span>Verificar configuración</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-6 h-6 rounded-full {estado.tareas.articulos ? 'bg-green-500' : 'bg-gray-300'}"></div>
              <span>Actualizar artículos</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-6 h-6 rounded-full {estado.tareas.clientes ? 'bg-green-500' : 'bg-gray-300'}"></div>
              <span>Actualizar clientes</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-6 h-6 rounded-full {estado.tareas.vendedores ? 'bg-green-500' : 'bg-gray-300'}"></div>
              <span>Actualizar vendedores</span>
            </div>
          </div>
        {/if}

        {#if estado.mensaje}
          <div class="p-4 rounded-lg {estado.estado === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">
            {estado.mensaje}
          </div>
        {/if}

        <div class="flex justify-center mt-6 space-x-4">
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
          
          {#if estado.estado === 'error' && estado.mensaje?.includes('autenticado')}
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