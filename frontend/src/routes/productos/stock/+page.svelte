<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { goto } from '$app/navigation';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { debounce } from 'lodash-es';
  import { page } from '$app/stores';
  import { navigationState } from '$lib/stores/navigationState';
  import { beforeNavigate } from '$app/navigation';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  
  // Definir interfaces para los tipos
  interface MovimientoStock {
    DocumentoTipo: string;
    DocumentoSucursal: string;
    DocumentoNumero: string;
    Fecha: string;
    MovimientoTipo: string;
    Items: number;
    TotalItems: number;
    Observacion: string;
  }
  
  interface Pagination {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  }
  
  interface Filters {
    search: string;
    field: string;
    order: 'ASC' | 'DESC';
  }
  
  // Estado local
  let movimientos: MovimientoStock[] = [];
  let loading = true;
  let error: string | null = null;
  let initialLoadCompleted = false;
  
  // Estado de filtros y paginación
  let filters: Filters = {
    search: '',
    field: 'Fecha',
    order: 'DESC'
  };
  
  let pagination: Pagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  };
  
  // Función para cargar datos con los filtros actuales
  const loadMovimientos = async (): Promise<void> => {
    try {
      loading = true;
      error = null;
      
      // Usar fetchWithAuth con parámetros
      const response = await fetchWithAuth('/movimientos-stock', {
        params: {
          page: pagination.currentPage,
          limit: pagination.limit,
          search: filters.search,
          field: filters.field,
          order: filters.order
        }
      });
      
      const data = await response.json();
      
      // Actualizar lista y metadatos de paginación
      movimientos = data.items;
      
      // Actualizar información de paginación
      pagination = {
        currentPage: data.meta.currentPage,
        totalPages: data.meta.totalPages,
        totalItems: data.meta.totalItems,
        limit: data.meta.itemsPerPage
      };
      
    } catch (err: unknown) {
      console.error('Error cargando movimientos:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
    
    return Promise.resolve();
  };
  
  // Cargar datos al inicializar el componente
  onMount(() => {
    console.log("Montando componente de movimientos de stock");
    // Recuperar estado guardado al montar el componente
    const savedState = navigationState.getState($page.url.pathname);
    console.log("Estado guardado recuperado:", savedState);
    
    if (savedState?.pagination) {
      console.log("Restaurando paginación:", savedState.pagination);
      pagination = {
        ...pagination,
        ...savedState.pagination
      };
    }
    
    if (savedState?.filters) {
      console.log("Restaurando filtros:", savedState.filters);
      filters = {
        ...filters,
        ...savedState.filters
      };
    }
    
    // Cargar datos con el estado restaurado
    loadMovimientos().then(() => {
      initialLoadCompleted = true;
      
      // Restaurar la posición de scroll después de cargar datos
      if (savedState?.scroll) {
        setTimeout(() => {
          console.log("Restaurando posición de scroll:", savedState.scroll);
          window.scrollTo(0, savedState.scroll);
        }, 100);
      }
    });
  });
  
  // Debounce para la búsqueda
  const debouncedSearch = debounce(() => {
    pagination.currentPage = 1; // Reset a primera página con cada búsqueda
    loadMovimientos();
  }, 300);
  
  // Manejar cambios en el campo de búsqueda
  const handleSearchChange = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    filters.search = target.value;
    debouncedSearch();
    updateState();
  };
  
  // Manejar cambios en el campo de ordenamiento
  const handleSortChange = (field: string): void => {
    if (filters.field === field) {
      filters.order = filters.order === 'ASC' ? 'DESC' : 'ASC';
    } else {
      filters.field = field;
      filters.order = 'ASC';
    }
    loadMovimientos();
    updateState();
  };
  
  // Cambiar de página
  const goToPage = (page: number): void => {
    if (page < 1 || page > pagination.totalPages) return;
    pagination.currentPage = page;
    loadMovimientos();
    updateState();
  };
  
  // Manejar cambio en el límite de resultados por página
  const handleLimitChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    pagination.limit = parseInt(target.value, 10);
    pagination.currentPage = 1;
    loadMovimientos();
    updateState();
  };
  
  // Ver detalle de un movimiento
  const handleVerDetalle = (tipo: string, sucursal: string, numero: string): void => {
    goto(`/productos/stock/${tipo}/${sucursal}/${numero}`);
  };
  
  // Eliminar un movimiento
  const handleEliminar = async (tipo: string, sucursal: string, numero: string): Promise<void> => {
    if (!confirm('¿Está seguro que desea eliminar este movimiento?')) return;
    
    try {
      const response = await fetchWithAuth(`/movimientos-stock/${tipo}/${sucursal}/${numero}`, {
        method: 'DELETE'
      });
      
      alert('Movimiento eliminado correctamente');
      loadMovimientos();
    } catch (err: unknown) {
      console.error('Error eliminando movimiento:', err);
      alert(err instanceof Error ? err.message : 'Error desconocido');
    }
  };
  
  // Al cambiar página o filtros, guardar el estado actual
  const updateState = () => {
    // Solo guardar estado después de la carga inicial
    if (initialLoadCompleted) {
      const state = {
        scroll: window.scrollY,
        pagination: {
          currentPage: pagination.currentPage,
          limit: pagination.limit
        },
        filters: { ...filters }
      };
      console.log("Actualizando estado:", state);
      navigationState.saveState($page.url.pathname, state);
    }
  };
  
  // Asegurarnos de guardar el estado cuando el usuario abandona la página
  beforeNavigate(({ from, to, cancel }) => {
    if (from && from.url.pathname === '/productos/stock') {
      updateState();
    }
  });
  
  // Formatear tipo de movimiento
  const formatMovimientoTipo = (tipo: string | null): string => {
    if (!tipo) return 'Desconocido';
    return tipo === 'ING' ? 'Ingreso' : 'Egreso';
  };
</script>

<svelte:head>
  <title>Movimientos de Stock</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Encabezado -->
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Gestión de Movimientos de Stock</h1>
    <div class="space-x-2">
      <Button variant="primary" on:click={() => goto('/productos/stock/nuevo/ingreso')}>
        Nuevo Ingreso
      </Button>
      <Button variant="secondary" on:click={() => goto('/productos/stock/nuevo/egreso')}>
        Nuevo Egreso
      </Button>
    </div>
  </div>
  
  <!-- Filtros -->
  <div class="mb-6 bg-white p-4 rounded-lg shadow-sm">
    <div class="flex flex-col md:flex-row gap-4">
      <div class="flex-grow">
        <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
        <div class="relative">
          <input
            type="text"
            id="search"
            placeholder="Buscar por número, observación..."
            value={filters.search}
            on:input={handleSearchChange}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      <!-- Selector de resultados por página -->
      <div class="md:w-48">
        <label for="limit" class="block text-sm font-medium text-gray-700 mb-1">Resultados por página</label>
        <select
          id="limit"
          bind:value={pagination.limit}
          on:change={handleLimitChange}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  </div>
  
  <!-- Tabla / Estado de carga -->
  {#if loading}
    <div class="flex justify-center items-center py-10">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <p>{error}</p>
    </div>
  {:else if movimientos.length === 0}
    <div class="bg-white p-8 rounded-md shadow text-center">
      <p class="text-gray-500">No hay movimientos de stock disponibles</p>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th 
              class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              on:click={() => handleSortChange('DocumentoTipo')}
            >
              <div class="flex items-center">
                <span>Tipo</span>
                {#if filters.field === 'DocumentoTipo'}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    {#if filters.order === 'ASC'}
                      <path fill-rule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    {:else}
                      <path fill-rule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    {/if}
                  </svg>
                {/if}
              </div>
            </th>
            <th 
              class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              on:click={() => handleSortChange('DocumentoNumero')}
            >
              <div class="flex items-center">
                <span>Documento</span>
                {#if filters.field === 'DocumentoNumero'}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    {#if filters.order === 'ASC'}
                      <path fill-rule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    {:else}
                      <path fill-rule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    {/if}
                  </svg>
                {/if}
              </div>
            </th>
            <th 
              class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              on:click={() => handleSortChange('Fecha')}
            >
              <div class="flex items-center">
                <span>Fecha</span>
                {#if filters.field === 'Fecha'}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    {#if filters.order === 'ASC'}
                      <path fill-rule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    {:else}
                      <path fill-rule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    {/if}
                  </svg>
                {/if}
              </div>
            </th>
            <th 
              class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              on:click={() => handleSortChange('MovimientoTipo')}
            >
              <div class="flex items-center">
                <span>Tipo Movimiento</span>
                {#if filters.field === 'MovimientoTipo'}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    {#if filters.order === 'ASC'}
                      <path fill-rule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    {:else}
                      <path fill-rule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    {/if}
                  </svg>
                {/if}
              </div>
            </th>
            <th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Items
            </th>
            <th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Observación
            </th>
            <th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {#each movimientos as movimiento (movimiento.DocumentoTipo + movimiento.DocumentoSucursal + movimiento.DocumentoNumero)}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                {movimiento.DocumentoTipo}
              </td>
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                {movimiento.DocumentoSucursal}-{movimiento.DocumentoNumero}
              </td>
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                {new Date(movimiento.Fecha).toLocaleDateString()}
              </td>
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                <span 
                  class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 
                  {movimiento.MovimientoTipo === 'ING' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}"
                >
                  {formatMovimientoTipo(movimiento.MovimientoTipo)}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                {movimiento.Items} (Total: {Math.abs(movimiento.TotalItems)})
              </td>
              <td class="px-6 py-4 border-b border-gray-200 truncate max-w-xs">
                {movimiento.Observacion || '-'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right border-b border-gray-200">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  on:click={() => handleVerDetalle(
                    movimiento.DocumentoTipo, 
                    movimiento.DocumentoSucursal, 
                    movimiento.DocumentoNumero
                  )}
                >
                  Ver
                </Button>
                
                <button 
                  class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm ml-2"
                  on:click={() => handleEliminar(
                    movimiento.DocumentoTipo, 
                    movimiento.DocumentoSucursal, 
                    movimiento.DocumentoNumero
                  )}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    
    <!-- Paginación -->
    {#if pagination.totalPages > 1}
      <div class="mt-4 flex justify-between items-center">
        <div class="text-sm text-gray-700">
          Mostrando {Math.min((pagination.currentPage - 1) * pagination.limit + 1, pagination.totalItems)} a {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} de {pagination.totalItems} resultados
        </div>
        
        <div class="flex space-x-1">
          <button 
            class="px-3 py-1 border rounded {pagination.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}"
            on:click={() => goToPage(1)}
            disabled={pagination.currentPage === 1}
          >
            &laquo;
          </button>
          <button 
            class="px-3 py-1 border rounded {pagination.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}"
            on:click={() => goToPage(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
          >
            &lsaquo;
          </button>
          
          {#each Array(pagination.totalPages > 5 ? 5 : pagination.totalPages) as _, i}
            {@const pageIndex = pagination.totalPages > 5
              ? pagination.currentPage > 2 && pagination.currentPage < pagination.totalPages - 1
                ? i + pagination.currentPage - 2
                : pagination.currentPage > pagination.totalPages - 3
                  ? pagination.totalPages - 4 + i
                  : i + 1
              : i + 1}
            
            {#if pageIndex > 0 && pageIndex <= pagination.totalPages}
              <button 
                class="px-3 py-1 border rounded {pagination.currentPage === pageIndex ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'}"
                on:click={() => goToPage(pageIndex)}
              >
                {pageIndex}
              </button>
            {/if}
          {/each}
          
          <button 
            class="px-3 py-1 border rounded {pagination.currentPage === pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}"
            on:click={() => goToPage(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            &rsaquo;
          </button>
          <button 
            class="px-3 py-1 border rounded {pagination.currentPage === pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}"
            on:click={() => goToPage(pagination.totalPages)}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            &raquo;
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div> 