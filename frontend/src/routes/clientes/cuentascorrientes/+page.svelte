<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { goto } from '$app/navigation';
  import { debounce } from 'lodash-es';
  import { page } from '$app/stores';
  import { navigationState } from '$lib/stores/navigationState';
  import { 
    ClienteService, 
    type ClienteCuentaCorriente, 
    type Comprobante 
  } from '$lib/services/ClienteService';
  
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
  
  let filters: Filters = {
    search: '',
    field: 'Descripcion',
    order: 'ASC'
  };
  
  let pagination: Pagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  };
  
  let clientes: ClienteCuentaCorriente[] = [];
  let comprobantes: Comprobante[] = [];
  let loading = true;
  let error: string | null = null;
  let showResumen = false;
  let clienteSeleccionado: ClienteCuentaCorriente | null = null;
  
  const loadClientes = async (): Promise<void> => {
    try {
      loading = true;
      error = null;
      
      const result = await ClienteService.obtenerCuentasCorrientes({
        page: pagination.currentPage,
        limit: pagination.limit,
        search: filters.search,
        field: filters.field,
        order: filters.order
      });
      
      clientes = result.items;
      pagination = {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalItems,
        limit: result.limit
      };
      
    } catch (err: unknown) {
      console.error('Error cargando cuentas corrientes:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };
  
  const loadComprobantes = async (codigoCliente: string): Promise<void> => {
    try {
      loading = true;
      error = null;
      
      comprobantes = await ClienteService.obtenerComprobantes(codigoCliente);
      
    } catch (err: unknown) {
      console.error('Error cargando comprobantes:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };
  
  onMount(() => {
    const savedState = navigationState.getState($page.url.pathname);
    
    if (savedState?.pagination) {
      pagination = {
        ...pagination,
        ...savedState.pagination
      };
    }
    
    if (savedState?.filters) {
      filters = {
        ...filters,
        ...savedState.filters
      };
    }
    
    loadClientes();
    
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn("Carga de datos demasiado lenta - finalizando estado de carga");
        loading = false;
        if (!error) {
          error = "Tiempo de espera agotado. Verifique la conexión al servidor.";
        }
      }
    }, 10000);

    return () => {
      clearTimeout(loadingTimeout);
    };
  });
  
  const debouncedSearch = debounce(() => {
    pagination.currentPage = 1;
    loadClientes();
  }, 300);
  
  const handleSearchChange = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    filters.search = target.value;
    debouncedSearch();
    updateState();
  };
  
  const toggleOrderBy = (field: string): void => {
    if (filters.field === field) {
      filters.order = filters.order === 'ASC' ? 'DESC' : 'ASC';
    } else {
      filters.field = field;
      filters.order = 'ASC';
    }
    loadClientes();
    updateState();
  };
  
  const goToPage = (page: number): void => {
    if (page < 1 || page > pagination.totalPages) return;
    pagination.currentPage = page;
    loadClientes();
    updateState();
  };
  
  const handleLimitChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    pagination.limit = parseInt(target.value, 10);
    pagination.currentPage = 1;
    loadClientes();
    updateState();
  };
  
  const handleShowResumen = async (cliente: ClienteCuentaCorriente): Promise<void> => {
    clienteSeleccionado = cliente;
    showResumen = true;
    await loadComprobantes(cliente.Codigo);
  };
  
  const updateState = () => {
    navigationState.saveState($page.url.pathname, {
      scroll: window.scrollY,
      pagination: {
        currentPage: pagination.currentPage,
        limit: pagination.limit
      },
      filters: { ...filters }
    });
  };
</script>

<svelte:head>
  <title>Cuentas Corrientes</title>
</svelte:head>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-4">
    <h1 class="text-2xl font-bold">Cuentas Corrientes</h1>
  </div>
  
  <div class="mb-6 bg-white p-4 rounded-lg shadow-sm">
    <div class="flex flex-col md:flex-row gap-4">
      <div class="flex-grow">
        <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
        <div class="relative">
          <input
            type="text"
            id="search"
            placeholder="Buscar por código o descripción..."
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
      
      <div class="md:w-48">
        <label for="limit" class="block text-sm font-medium text-gray-700 mb-1">Mostrar</label>
        <select
          id="limit"
          bind:value={pagination.limit}
          on:change={handleLimitChange}
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={5}>5 por página</option>
          <option value={10}>10 por página</option>
          <option value={25}>25 por página</option>
          <option value={50}>50 por página</option>
        </select>
      </div>
    </div>
  </div>
  
  {#if loading}
    <div class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      <p class="mt-2 text-gray-600">Cargando...</p>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p class="font-bold">Error al cargar los datos</p>
      <p>{error}</p>
      <button 
        class="mt-2 bg-red-200 hover:bg-red-300 text-red-800 px-3 py-1 rounded"
        on:click={loadClientes}>
        Reintentar
      </button>
    </div>
  {:else if clientes.length === 0}
    <div class="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-8 rounded mb-4 text-center">
      <p>No se encontraron cuentas corrientes que coincidan con los criterios de búsqueda.</p>
    </div>
  {:else}
    <div class="overflow-x-auto bg-white rounded-lg shadow">
      <table class="min-w-full">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button class="flex items-center" on:click={() => toggleOrderBy('Codigo')}>
                Código
                {#if filters.field === 'Codigo'}
                  <span class="ml-1">
                    {filters.order === 'ASC' ? '↑' : '↓'}
                  </span>
                {/if}
              </button>
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button class="flex items-center" on:click={() => toggleOrderBy('Descripcion')}>
                Descripción
                {#if filters.field === 'Descripcion'}
                  <span class="ml-1">
                    {filters.order === 'ASC' ? '↑' : '↓'}
                  </span>
                {/if}
              </button>
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button class="flex items-center" on:click={() => toggleOrderBy('Saldo')}>
                Saldo
                {#if filters.field === 'Saldo'}
                  <span class="ml-1">
                    {filters.order === 'ASC' ? '↑' : '↓'}
                  </span>
                {/if}
              </button>
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {#each clientes as cliente (cliente.Codigo)}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                {cliente.Codigo}
              </td>
              <td class="px-6 py-4 border-b border-gray-200">
                {cliente.Descripcion}
              </td>
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                ${cliente.Saldo.toFixed(2)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right border-b border-gray-200">
                <Button variant="secondary" size="sm" on:click={() => goto(`/clientes/cuentascorrientes/${cliente.Codigo}`)}>
                  Mostrar Resumen
                </Button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    
    <!-- Paginación -->
    {#if !loading && !error && clientes.length > 0}
      <div class="mt-4">
        <div class="flex justify-between items-center text-sm">
          <div class="text-gray-600">
            Mostrando {(pagination.currentPage - 1) * pagination.limit + 1} a {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} de {pagination.totalItems} clientes
          </div>
          
          <div class="flex space-x-1">
            <button 
              class="px-3 py-1 rounded border {pagination.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}"
              on:click={() => goToPage(1)}
              disabled={pagination.currentPage === 1}
            >
              &laquo;
            </button>
            
            <button 
              class="px-3 py-1 rounded border {pagination.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}"
              on:click={() => goToPage(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              &lsaquo;
            </button>
            
            {#each Array(Math.min(5, pagination.totalPages)) as _, i}
              {@const pageNum = pagination.currentPage <= 3 
                ? i + 1 
                : pagination.currentPage >= pagination.totalPages - 2 
                  ? pagination.totalPages - 4 + i 
                  : pagination.currentPage - 2 + i}
              
              {#if pageNum > 0 && pageNum <= pagination.totalPages}
                <button 
                  class="px-3 py-1 rounded border {pageNum === pagination.currentPage ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white hover:bg-gray-50'}"
                  on:click={() => goToPage(pageNum)}
                >
                  {pageNum}
                </button>
              {/if}
            {/each}
            
            <button 
              class="px-3 py-1 rounded border {pagination.currentPage === pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}"
              on:click={() => goToPage(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              &rsaquo;
            </button>
            
            <button 
              class="px-3 py-1 rounded border {pagination.currentPage === pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}"
              on:click={() => goToPage(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>
