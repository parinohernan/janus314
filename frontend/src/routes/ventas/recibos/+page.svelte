<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { PUBLIC_API_URL } from '$env/static/public';
  import Button from '$lib/components/ui/Button.svelte';
  import { formatDate } from '$lib/utils/dateUtils';
  import { navigationState } from '$lib/stores/navigationState';
  import { writable } from 'svelte/store';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

  // Definición de interfaces
  interface Recibo {
    DocumentoTipo: string;
    DocumentoSucursal: string;
    DocumentoNumero: string;
    Fecha: string;
    ImporteTotal: number;
    FechaAnulacion: string | null;
    ClienteRelacion?: {
      Descripcion: string;
      NombreFantasia: string;
    }
  }
  
  interface ClienteOption {
    value: string;
    label: string;
    razonSocial: string;
  }
  
  // Actualizar la interfaz PageState para que coincida con los datos reales
  interface PageState {
    currentPage: number;
    scroll: number;
    filters: {
      tipo: string;
      cliente: string;
      fechaDesde: string;
      fechaHasta: string;
    }
  }
  
  // Extiende el tipo en navigationState
  // Definimos el tipo para el store de navegación
  type NavigationStateStore = {
    saveState(path: string, state: any): void;
    getState(path: string): any | null;
  }
  
  // Aseguramos que navigationState es del tipo correcto
  const typedNavigationState = navigationState as unknown as NavigationStateStore;
  
  // Estado para paginación y filtros
  let recibos: Recibo[] = [];
  let totalItems: number = 0;
  let itemsPerPage: number = -1; // Por defecto mostrar todos
  let currentPage: number = 1;
  let totalPages: number = 0;
  let loading: boolean = true;
  let error: string | null = null;
  
  // Opciones de elementos por página
  const itemsPerPageOptions = [
    { value: 10, label: '10 por página' },
    { value: 25, label: '25 por página' },
    { value: 50, label: '50 por página' },
    { value: 100, label: '100 por página' },
    { value: -1, label: 'Todos' }
  ];
  
  // Configurar fecha actual para los filtros
  const hoy = new Date();
  hoy.setHours(hoy.getHours() - 3);
  const fechaFormateada = hoy.toISOString().substring(0, 10);
  
  // Filtros
  let filtroTipo = '';
  let filtroCliente = '';
  let filtroFechaDesde = fechaFormateada;
  let filtroFechaHasta = fechaFormateada;
  
  // Tipos de documento actualizados
  const tiposDocumento = [
    { value: '', label: 'Todos' },
    { value: 'REC', label: 'Recibo' }
  ];
  
  // Estado para el selector de clientes
  let clientesOptions: ClienteOption[] = [];
  let clienteBusqueda = '';
  let clientesLoading = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  // Variables para totales y estadísticas
  let totalGeneral = 0;
  let totalActivos = 0;
  let totalAnulados = 0;
  let cantidadActivos = 0;
  let cantidadAnulados = 0;
  
  // Función para calcular totales y estadísticas
  const calcularTotales = () => {
    totalGeneral = 0;
    totalActivos = 0;
    totalAnulados = 0;
    cantidadActivos = 0;
    cantidadAnulados = 0;
    
    recibos.forEach(recibo => {
      const importe = recibo.ImporteTotal || 0;
      totalGeneral += importe;
      
      if (recibo.FechaAnulacion) {
        totalAnulados += importe;
        cantidadAnulados++;
      } else {
        totalActivos += importe;
        cantidadActivos++;
      }
    });
  };
  
  // Cargar recibos
  const cargarRecibos = async () => {
    try {
      loading = true;
      error = null;
      
      // Construir parámetros para fetchWithAuth
      const params: Record<string, string | number> = {
        page: currentPage,
        orderBy: 'Fecha',
        orderDir: 'desc'
      };
      
      // Si itemsPerPage es -1 (Todos), no enviar limit para obtener todos los registros
      if (itemsPerPage !== -1) {
        params.limit = itemsPerPage;
      } else {
        // Para debug: agregar un parámetro que indique que queremos todos
        params.all = 'true';
        // También asegurar que no se envíe page cuando queremos todos
        delete params.page;
      }
      
      if (filtroTipo) params.tipo = filtroTipo;
      if (filtroCliente) params.clienteCodigo = filtroCliente;
      if (filtroFechaDesde) params.fechaDesde = filtroFechaDesde;
      if (filtroFechaHasta) params.fechaHasta = filtroFechaHasta;
      
      console.log('🔍 Parámetros enviados:', params);
      console.log('🔍 itemsPerPage:', itemsPerPage);
      console.log('🔍 filtroCliente:', filtroCliente);
      console.log('🔍 clienteCodigo enviado:', params.clienteCodigo);
      
      const response = await fetchWithAuth('/recibos', { params });
      
      if (!response.ok) {
        throw new Error('Error al cargar los recibos');
      }
      
      const data = await response.json();
      recibos = data.items;
      console.log("recibos", recibos);
      totalItems = data.meta.totalItems;
      currentPage = data.meta.currentPage;
      totalPages = data.meta.totalPages;
      
      // Si se seleccionó "Todos", ajustar la página actual
      if (itemsPerPage === -1) {
        currentPage = 1;
        totalPages = 1;
      }
      
      // Calcular totales y estadísticas
      calcularTotales();
      
      // Guardar estado en el store de navegación
      (navigationState as any).saveState('/ventas/recibos', {
        currentPage,
        scroll: window.scrollY,
        filters: {
          tipo: filtroTipo,
          cliente: filtroCliente,
          fechaDesde: filtroFechaDesde,
          fechaHasta: filtroFechaHasta
        }
      });
      
    } catch (err) {
      console.error('Error cargando recibos:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };
  
  // Función para cambiar de página
  const cambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPages) {
      currentPage = nuevaPagina;
      cargarRecibos();
    }
  };
  
  // Función para cambiar elementos por página
  const cambiarElementosPorPagina = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    const nuevoValor = parseInt(target.value);
    itemsPerPage = nuevoValor;
    
    // Si se selecciona "Todos", ir a la página 1
    if (nuevoValor === -1) {
      currentPage = 1;
    }
    
    cargarRecibos();
  };
  
  // Aplicar filtros
  const aplicarFiltros = () => {
    currentPage = 1; // Resetear a primera página al filtrar
    cargarRecibos();
  };
  
  // Resetear filtros
  const resetearFiltros = () => {
    filtroTipo = '';
    filtroCliente = '';
    filtroFechaDesde = fechaFormateada;
    filtroFechaHasta = fechaFormateada;
    currentPage = 1;
    cargarRecibos();
  };
  
  // Ver detalle de recibo
  const verDetalle = (tipo: string, sucursal: string, numero: string) => {
    goto(`/ventas/recibos/imprimir/${tipo}/${sucursal}/${numero}`);
  };
  
  // Anular recibo
  const anularRecibo = async (tipo: string, sucursal: string, numero: string) => {
    if (!confirm('¿Está seguro que desea anular este recibo?')) {
      return;
    }
    
    try {
      const response = await fetchWithAuth(`/recibos/${tipo}/${sucursal}/${numero}/anular`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al anular el recibo');
      }
      
      alert('Recibo anulado correctamente');
      cargarRecibos(); // Recargar la lista
    } catch (err) {
      console.error('Error anulando recibo:', err);
      alert(err instanceof Error ? err.message : 'Error al anular el recibo');
    }
  };
  
  // Función para buscar clientes
  const buscarClientes = async (busqueda = '') => {
    if (timeoutId) clearTimeout(timeoutId);
    
    if (!busqueda || busqueda.length < 2) {
      clientesOptions = [];
      return;
    }
    
    clientesLoading = true;
    
    timeoutId = setTimeout(async () => {
      try {
        const response = await fetchWithAuth('/clientes', {
          params: {
            search: busqueda,
            limit: 10
          }
        });
        
        if (!response.ok) {
          throw new Error('Error al buscar clientes');
        }
        
        const data = await response.json();
        clientesOptions = data.items.map((cliente: any) => {
          const nombreCliente = cliente.RazonSocial || cliente.Descripcion || 'Sin nombre';
          return {
            value: cliente.Codigo,
            label: `${cliente.Codigo} - ${nombreCliente}`,
            razonSocial: nombreCliente
          };
        });
      } catch (error) {
        console.error('Error buscando clientes:', error);
        clientesOptions = [];
      } finally {
        clientesLoading = false;
      }
    }, 300);
  };
  
  // Seleccionar cliente
  const seleccionarCliente = (codigo: string, razonSocial: string) => {
    filtroCliente = codigo;
    clienteBusqueda = `${codigo} - ${razonSocial}`;
    clientesOptions = [];
    // Aplicar filtro automáticamente al seleccionar cliente
    aplicarFiltros();
  };
  
  // Limpiar cliente seleccionado
  const limpiarCliente = () => {
    filtroCliente = '';
    clienteBusqueda = '';
    clientesOptions = [];
    // Aplicar filtro automáticamente al limpiar cliente
    aplicarFiltros();
  };
  
  // Buscar información de un cliente por código (para restaurar estado)
  const buscarClienteInfo = async (codigo: string) => {
    try {
      const response = await fetchWithAuth(`/clientes/${codigo}`);
      
      if (response.ok) {
        const cliente = await response.json();
        const nombreCliente = cliente.RazonSocial || cliente.Descripcion || 'Sin nombre';
        clienteBusqueda = `${codigo} - ${nombreCliente}`;
      }
    } catch (error) {
      console.error('Error obteniendo información del cliente:', error);
      // Si no se puede obtener la info, mostrar al menos el código
      clienteBusqueda = `${codigo} - Cliente`;
    }
  };
  
  // Cerrar dropdown de clientes
  const cerrarDropdownClientes = () => {
    clientesOptions = [];
  };
  
  // Al montar el componente
  onMount(() => {
    // Recuperar estado guardado si existe
    const savedState = (navigationState as any).getState('/ventas/recibos');
    
    if (savedState) {
      // Usar currentPage si existe, o 1 por defecto
      currentPage = savedState.currentPage || 1;
      
      // Usar filters si existe
      const filtrosGuardados = savedState.filters;
      if (filtrosGuardados) {
        filtroTipo = filtrosGuardados.tipo || '';
        filtroCliente = filtrosGuardados.cliente || '';
        filtroFechaDesde = filtrosGuardados.fechaDesde || fechaFormateada;
        filtroFechaHasta = filtrosGuardados.fechaHasta || fechaFormateada;
        
        // Si hay un cliente seleccionado, buscar su información para mostrar en el campo
        if (filtroCliente) {
          buscarClienteInfo(filtroCliente);
        }
      }
    }
    
    // Asegurar que por defecto se muestren todos
    if (itemsPerPage !== -1) {
      itemsPerPage = -1;
    }
    
    // Agregar evento para cerrar dropdown al hacer click fuera
    const handleClickOutside = () => {
      cerrarDropdownClientes();
    };
    
    document.addEventListener('click', handleClickOutside);
    
    cargarRecibos();
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
  
  // Al destruir el componente, limpiar timeout si existe
  onDestroy(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
  
  // Estados visuales
  $: paginasVisibles = getPaginasVisibles(currentPage, totalPages);
  
  // Función para determinar qué páginas mostrar en la paginación
  function getPaginasVisibles(actual: number, total: number): (number | string)[] {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    
    if (actual <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    
    if (actual >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    
    return [1, '...', actual - 1, actual, actual + 1, '...', total];
  }
</script>

<div>
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">Recibos</h1>
    <Button variant="primary" on:click={() => goto('/ventas/recibos/nueva')}>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Nuevo Recibo
    </Button>
  </div>
  
  <!-- Filtros -->
  <div class="bg-white p-4 rounded-lg shadow-sm mb-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label for="filtroTipo" class="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
        <select 
          id="filtroTipo" 
          bind:value={filtroTipo}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {#each tiposDocumento as tipo}
            <option value={tipo.value}>{tipo.label}</option>
          {/each}
        </select>
      </div>
      
      <div class="relative w-full md:w-64 mb-4 md:mb-0">
        <label for="filtroCliente" class="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
        <div class="relative" role="search">
          <input
            type="text"
            id="filtroCliente"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Buscar cliente..."
            bind:value={clienteBusqueda}
            on:input={(e) => {
              const target = e.target as HTMLInputElement;
              if (target) {
                buscarClientes(target.value);
              }
            }}
            autocomplete="off"
          />
          {#if filtroCliente}
            <button 
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              on:click={limpiarCliente}
              aria-label="Limpiar selección de cliente"
            >
              <svg class="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </button>
          {/if}
        </div>
        
        {#if clientesOptions.length > 0}
          <div class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
            <ul>
              {#each clientesOptions as cliente}
                <li>
                  <button 
                    class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 w-full text-left"
                    on:click={() => seleccionarCliente(cliente.value, cliente.razonSocial)}
                  >
                    <div class="flex items-center">
                      <span class="font-normal block truncate">{cliente.label}</span>
                    </div>
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
        
        {#if clientesLoading}
          <div class="absolute right-3 top-1/2 -translate-y-1/2">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        {/if}
      </div>
      
      <div>
        <label for="filtroFechaDesde" class="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
        <input 
          id="filtroFechaDesde" 
          type="date" 
          bind:value={filtroFechaDesde}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label for="filtroFechaHasta" class="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
        <input 
          id="filtroFechaHasta" 
          type="date" 
          bind:value={filtroFechaHasta}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div class="md:col-span-4 flex justify-end space-x-2">
        <Button variant="secondary" on:click={resetearFiltros}>Limpiar Filtros</Button>
        <Button variant="primary" on:click={aplicarFiltros}>Aplicar Filtros</Button>
      </div>
    </div>
  </div>
  
  <!-- Información del período -->
  {#if !loading && recibos.length > 0}
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="text-sm font-medium text-blue-800">
              Período: {new Date(filtroFechaDesde).toLocaleDateString('es-AR')} - {new Date(filtroFechaHasta).toLocaleDateString('es-AR')}
            </span>
          </div>
          {#if filtroCliente}
            <div class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="text-sm font-medium text-blue-800">
                Cliente: {filtroCliente}
              </span>
            </div>
          {/if}
        </div>
        <div class="mt-2 md:mt-0">
          <span class="text-sm text-blue-600">
            {#if itemsPerPage === -1}
              <span class="font-medium">Mostrando todos los {totalItems} recibos</span>
            {:else}
              Mostrando página {currentPage} de {totalPages} ({totalItems} recibos en total)
            {/if}
          </span>
        </div>
      </div>
    </div>
  {/if}

  <!-- Tarjetas de Resumen -->
  {#if !loading && recibos.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Total General -->
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm p-4 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-100 text-sm font-medium">Total General</p>
            <p class="text-2xl font-bold">
              {totalGeneral.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
            </p>
            <p class="text-blue-100 text-xs mt-1">{totalItems} recibos</p>
          </div>
          <div class="bg-blue-400 bg-opacity-30 rounded-full p-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Total Activos -->
      <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm p-4 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-100 text-sm font-medium">Recibos Activos</p>
            <p class="text-2xl font-bold">
              {totalActivos.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
            </p>
            <p class="text-green-100 text-xs mt-1">{cantidadActivos} recibos</p>
          </div>
          <div class="bg-green-400 bg-opacity-30 rounded-full p-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Total Anulados -->
      <div class="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-sm p-4 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-red-100 text-sm font-medium">Recibos Anulados</p>
            <p class="text-2xl font-bold">
              {totalAnulados.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
            </p>
            <p class="text-red-100 text-xs mt-1">{cantidadAnulados} recibos</p>
          </div>
          <div class="bg-red-400 bg-opacity-30 rounded-full p-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Promedio por Recibo -->
      <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-sm p-4 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-purple-100 text-sm font-medium">Promedio por Recibo</p>
            <p class="text-2xl font-bold">
              {totalItems > 0 ? (totalGeneral / totalItems).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '$0,00'}
            </p>
            <p class="text-purple-100 text-xs mt-1">Valor promedio</p>
          </div>
          <div class="bg-purple-400 bg-opacity-30 rounded-full p-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Loading y Errores -->
  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p>{error}</p>
    </div>
  {:else if recibos.length === 0}
    <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
      <p>No se encontraron recibos con los criterios seleccionados.</p>
    </div>
  {:else}
    <!-- Tabla de recibos -->
    <div class="bg-white rounded-lg shadow-sm mb-6 overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each recibos as recibo, i}
            <tr class={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td class="px-4 py-3 whitespace-nowrap">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  Recibo
                </span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                {recibo.DocumentoSucursal}-{recibo.DocumentoNumero}
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                {formatDate(recibo.Fecha)}
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                {recibo.ClienteRelacion ? recibo.ClienteRelacion.Descripcion || 'Cliente no asignado' : 'Cliente no asignado'}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-right">
                <span class="font-semibold text-gray-900">
                  {recibo.ImporteTotal ? recibo.ImporteTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '$0,00'}
                </span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-center">
                {#if recibo.FechaAnulacion}
                  <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    Anulado
                  </span>
                {:else}
                  <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Activo
                  </span>
                {/if}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-center">
                <div class="flex justify-center space-x-2">
                  <button 
                    class="text-blue-600 hover:text-blue-900"
                    on:click={() => verDetalle(recibo.DocumentoTipo, recibo.DocumentoSucursal, recibo.DocumentoNumero)}
                    aria-label="Ver detalle de recibo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  
                  {#if !recibo.FechaAnulacion}
                    <button 
                      class="text-red-600 hover:text-red-900"
                      on:click={() => anularRecibo(recibo.DocumentoTipo, recibo.DocumentoSucursal, recibo.DocumentoNumero)}
                      aria-label="Anular recibo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
        <!-- Resumen de la página actual -->
        <tfoot class="bg-gray-50 border-t-2 border-gray-200">
          <tr>
            <td colspan="4" class="px-4 py-3 text-sm font-semibold text-gray-700">
              Total de esta página ({recibos.length} recibos):
            </td>
            <td class="px-4 py-3 text-right text-sm font-bold text-gray-900">
              {recibos.reduce((sum, recibo) => sum + (recibo.ImporteTotal || 0), 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
            </td>
            <td colspan="2" class="px-4 py-3"></td>
          </tr>
        </tfoot>
      </table>
    </div>
    
    <!-- Controles de paginación -->
    <div class="flex flex-col sm:flex-row justify-between items-center gap-4 py-4 border-t border-gray-200">
      <!-- Selector de elementos por página -->
      <div class="flex items-center gap-2">
        <label for="itemsPerPage" class="text-sm text-gray-700">Elementos por página:</label>
        <div class="relative">
          <select
          id="itemsPerPage"
          bind:value={itemsPerPage}
          on:change={cambiarElementosPorPagina}
          class="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 {itemsPerPage === -1 ? 'border-blue-500 bg-blue-50' : ''}"
        >
          {#each itemsPerPageOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
        
        {#if itemsPerPage === -1}
          <div class="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        {/if}
        </div>
      </div>
      
      <!-- Información de resultados -->
      <div class="text-sm text-gray-600">
        {#if itemsPerPage === -1}
          <span class="font-medium text-blue-600">Mostrando todos los {totalItems} recibos</span>
        {:else}
          Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} recibos
        {/if}
      </div>
    </div>
    
    <!-- Paginación -->
    {#if totalPages > 1 && itemsPerPage !== -1}
      <div class="flex justify-center mt-4">
        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          <button 
            class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            on:click={() => cambiarPagina(1)}
            disabled={currentPage === 1}
          >
            <span class="sr-only">Primera</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            class="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            on:click={() => cambiarPagina(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <span class="sr-only">Anterior</span>
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          
          {#each paginasVisibles as pagina}
            {#if pagina === '...'}
              <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                ...
              </span>
            {:else}
              <button
                class={`relative inline-flex items-center px-4 py-2 border ${currentPage === pagina ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'} text-sm font-medium`}
                on:click={() => cambiarPagina(Number(pagina))}
              >
                {pagina}
              </button>
            {/if}
          {/each}
          
          <button 
            class="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            on:click={() => cambiarPagina(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <span class="sr-only">Siguiente</span>
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <button 
            class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            on:click={() => cambiarPagina(totalPages)}
            disabled={currentPage === totalPages}
          >
            <span class="sr-only">Última</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </nav>
      </div>
    {/if}
  {/if}
</div> 