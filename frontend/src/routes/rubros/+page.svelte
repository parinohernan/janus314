<script lang="ts">
  import { onMount } from 'svelte';
  import { beforeNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import Button from '$lib/components/ui/Button.svelte';
  import { goto } from '$app/navigation';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { debounce } from 'lodash-es'; // Necesitarás instalar: npm install lodash-es
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { toast, confirm } from '$lib/utils/toast';
  import { navigationState } from '$lib/stores/navigationState';

  const PAGE_PATH = '/rubros';
  
  interface Rubro {
    Codigo: string;
    Descripcion: string;
  }

  interface Filters {
    search: string;
    field: string;
    order: 'ASC' | 'DESC';
  }

  interface Pagination {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  }
  
  // Estado de filtros y paginación
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
  
  let rubros: Rubro[] = [];
  let loading = true;
  let error: string | null = null;
  
  // Función para cargar datos con los filtros actuales
  const loadRubros = async () => {
    try {
      loading = true;
      error = null;
      
      // Construir parámetros de búsqueda y paginación
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        search: filters.search,
        field: filters.field,
        order: filters.order
      };
      
      const response = await fetchWithAuth('/rubros', { params });
      const data = await response.json();
      
      // Actualizar estado con datos y metadata de paginación
      rubros = data.items;
      pagination = {
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalItems: data.totalItems,
        limit: pagination.limit
      };
      
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error cargando rubros:', err);
    } finally {
      loading = false;
    }
  };
  
  // Debounce para la búsqueda
  const debouncedSearch = debounce(() => {
    pagination.currentPage = 1; // Reset a primera página con cada búsqueda
    loadRubros();
  }, 300);
  
  // Manejar cambios en el campo de búsqueda
  const handleSearchChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    filters.search = target.value;
    debouncedSearch();
  };
  
  // Manejar cambios en el campo de ordenamiento
  const handleSortChange = (field: string) => {
    if (filters.field === field) {
      // Invertir orden si hacemos clic en el mismo campo
      filters.order = filters.order === 'ASC' ? 'DESC' : 'ASC';
    } else {
      filters.field = field;
      filters.order = 'ASC';
    }
    loadRubros();
  };
  
  // Cambiar de página
  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    pagination.currentPage = page;
    loadRubros();
  };
  
  const handleEdit = (id: string) => {
    goto(`/rubros/${id}`);
  };
  
  const handleDelete = async (id: string) => {
    const ok = await confirm('¿Está seguro que desea eliminar este rubro?');
    if (!ok) return;
    
    try {
      const response = await fetchWithAuth(`/rubros/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Error al eliminar el rubro');
      
      // Recargar la tabla después de eliminar
      loadRubros();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error desconocido');
    }
  };
  
  // Cargar datos iniciales
  onMount(async () => {
    let savedScroll: number | undefined;
    if (browser) {
      const savedState = navigationState.getState(PAGE_PATH);
      savedScroll = savedState?.scroll;
      const savedFilters = savedState?.filters as { search?: string; field?: string; order?: 'ASC' | 'DESC' } | undefined;
      const pag = savedState?.pagination as { currentPage?: number; limit?: number } | undefined;
      if (savedFilters?.search !== undefined) filters.search = savedFilters.search;
      if (savedFilters?.field) filters.field = savedFilters.field;
      if (savedFilters?.order) filters.order = savedFilters.order;
      if (pag?.currentPage && pag.currentPage >= 1) pagination.currentPage = pag.currentPage;
      if (pag?.limit && pag.limit > 0) pagination.limit = pag.limit;
    }
    await loadRubros();
    if (typeof savedScroll === 'number' && savedScroll > 0 && typeof window !== 'undefined') {
      requestAnimationFrame(() => window.scrollTo(0, savedScroll));
    }
  });

  beforeNavigate(({ from }) => {
    if (from?.url.pathname === PAGE_PATH && browser) {
      const currentState = navigationState.getState(PAGE_PATH) || {};
      navigationState.saveState(PAGE_PATH, {
        ...currentState,
        scroll: typeof window !== 'undefined' ? window.scrollY : 0,
        pagination: {
          currentPage: pagination.currentPage,
          limit: pagination.limit
        },
        filters: { ...filters }
      });
    }
  });
</script>

<svelte:head>
  <title>Gestión de Rubros</title>
</svelte:head>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Gestión de Rubros</h1>
    <Button variant="primary" on:click={() => goto('/rubros/nuevo')}>
      Nuevo Rubro
    </Button>
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
            placeholder="Buscar por código o descripción..."
            value={filters.search}
            on:input={handleSearchChange}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {#if filters.search}
            <button 
              class="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              on:click={() => { filters.search = ''; debouncedSearch(); }}
              aria-label="Limpiar búsqueda"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </button>
          {/if}
        </div>
      </div>
      
      <div class="w-32">
        <label for="limit" class="block text-sm font-medium text-gray-700 mb-1">Mostrar</label>
        <select
          id="limit"
          bind:value={pagination.limit}
          on:change={loadRubros}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </select>
      </div>
    </div>
  </div>
  
  {#if loading}
    <div class="text-center py-4">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      <p class="mt-2">Cargando rubros...</p>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <p>{error}</p>
    </div>
  {:else if rubros.length === 0}
    <div class="bg-gray-50 text-center py-10 rounded-lg border border-gray-200">
      <p class="text-gray-500">No se encontraron rubros con los criterios de búsqueda.</p>
      {#if filters.search}
        <button 
          class="mt-2 text-blue-500 hover:underline"
          on:click={() => { filters.search = ''; debouncedSearch(); }}
        >
          Limpiar filtros
        </button>
      {/if}
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th 
              class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              on:click={() => handleSortChange('Codigo')}
            >
              <div class="flex items-center">
                <span>Código</span>
                {#if filters.field === 'Codigo'}
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
              on:click={() => handleSortChange('Descripcion')}
            >
              <div class="flex items-center">
                <span>Descripción</span>
                {#if filters.field === 'Descripcion'}
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
            <th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {#each rubros as rubro (rubro.Codigo)}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                {rubro.Codigo}
              </td>
              <td class="px-6 py-4 border-b border-gray-200">
                {rubro.Descripcion || '-'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right border-b border-gray-200">
                <Button variant="secondary" size="sm" on:click={() => handleEdit(rubro.Codigo)}>
                  Editar
                </Button>
                <Button variant="danger" size="sm" on:click={() => handleDelete(rubro.Codigo)}>
                  Eliminar
                </Button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    
    <!-- Paginación -->
    {#if pagination.totalPages > 1}
      <div class="flex justify-between items-center mt-4">
        <div class="text-sm text-gray-700">
          Mostrando <span class="font-medium">{(pagination.currentPage - 1) * pagination.limit + 1}</span> a 
          <span class="font-medium">{Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)}</span> de 
          <span class="font-medium">{pagination.totalItems}</span> resultados
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
    {/if}
  {/if}
</div> 