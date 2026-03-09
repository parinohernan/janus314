<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { goto, beforeNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import { navigationState } from '$lib/stores/navigationState';
  import { debounce } from 'lodash-es';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { ProveedorService, type Proveedor } from '$lib/services/ProveedorService';
  import { toast, confirm } from '$lib/utils/toast';
  
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
    activo: 'activos' | 'inactivos' | 'todos';
  }
  
  // Estado de filtros y paginación con tipos
  let filters: Filters = {
    search: '',
    field: 'Descripcion',
    order: 'ASC',
    activo: 'activos'
  };
  
  let pagination: Pagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  };
  
  let proveedores: Proveedor[] = [];
  let loading = true;
  let error: string | null = null;
  
  // Función para cargar datos con los filtros actuales
  const loadProveedores = async (): Promise<void> => {
    try {
      loading = true;
      error = null;
      
      // Usar fetchWithAuth para mejorar rendimiento con caché de tokens
      const response = await fetchWithAuth('/proveedores', {
        params: {
          page: pagination.currentPage,
          limit: pagination.limit,
          search: filters.search,
          field: filters.field,
          order: filters.order,
          activo: filters.activo
        }
      });
      
      if (!response.ok) throw new Error('Error al cargar los proveedores');
      
      const data = await response.json();
      
      // Actualizar lista de proveedores y metadatos de paginación
      proveedores = data.items;
      
      // Actualizar información de paginación con los metadatos recibidos
      pagination = {
        currentPage: data.meta.currentPage,
        totalPages: data.meta.totalPages,
        totalItems: data.meta.totalItems,
        limit: data.meta.itemsPerPage
      };
      
    } catch (err: unknown) {
      console.error('Error cargando proveedores:', err);
      if (err instanceof Error) {
        error = err.message;
      } else {
        error = 'Error desconocido';
      }
    } finally {
      loading = false;
    }
  };
  
  // Precarga inicial de proveedores activos para operaciones rápidas (selectores)
  let todosProveedores: Proveedor[] = [];
  const precargarProveedores = async () => {
    try {
      todosProveedores = await ProveedorService.obtenerProveedores(500, 'activos');
      console.log(`Precargados ${todosProveedores.length} proveedores activos para uso rápido`);
    } catch (err) {
      console.error('Error al precargar lista de proveedores:', err);
    }
  };
  
  const PROVEEDORES_PATH = '/compras/proveedores';

  // Cargar datos al inicializar el componente
  onMount(async () => {
    let savedScroll: number | undefined;
    if (browser) {
      const savedState = navigationState.getState(PROVEEDORES_PATH);
      savedScroll = savedState?.scroll;
      const filtersSaved = savedState?.filters as { filters?: Filters; pagination?: Pagination } | undefined;
      if (filtersSaved?.filters) filters = { ...filters, ...filtersSaved.filters };
      if (filtersSaved?.pagination) pagination = { ...pagination, ...filtersSaved.pagination };
    }
    await loadProveedores();
    precargarProveedores();
    if (typeof savedScroll === 'number' && savedScroll > 0 && typeof window !== 'undefined') {
      requestAnimationFrame(() => window.scrollTo(0, savedScroll));
    }
  });

  beforeNavigate(({ from }) => {
    if (from?.url.pathname === PROVEEDORES_PATH && browser) {
      const currentState = navigationState.getState(PROVEEDORES_PATH) || {};
      navigationState.saveState(PROVEEDORES_PATH, {
        ...currentState,
        scroll: typeof window !== 'undefined' ? window.scrollY : 0,
        filters: { filters: { ...filters }, pagination: { ...pagination } }
      });
    }
  });
  
  // Debounce mejorado para la búsqueda
  const debouncedSearch = debounce(() => {
    pagination.currentPage = 1; // Reset a primera página con cada búsqueda
    loadProveedores();
  }, 300);
  
  // Manejar cambios en el campo de búsqueda
  const handleSearchChange = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    filters.search = target.value;
    debouncedSearch();
  };
  
  // Manejar cambios en el campo de ordenamiento
  const handleSortChange = (field: string): void => {
    if (filters.field === field) {
      // Invertir orden si hacemos clic en el mismo campo
      filters.order = filters.order === 'ASC' ? 'DESC' : 'ASC';
    } else {
      filters.field = field;
      filters.order = 'ASC';
    }
    loadProveedores();
  };
  
  // Cambiar de página
  const goToPage = (page: number): void => {
    if (page < 1 || page > pagination.totalPages) return;
    pagination.currentPage = page;
    loadProveedores();
  };
  
  const handleEdit = (id: string): void => {
    goto(`/compras/proveedores/${id}`);
  };

  const handleToggleActivo = async (proveedor: Proveedor): Promise<void> => {
    const esActivo = proveedor.Activo !== false;
    const accion = esActivo ? 'desactivar' : 'activar';
    const ok = await confirm(`¿Está seguro que desea ${accion} este proveedor?`);
    if (!ok) return;
    
    try {
      await ProveedorService.toggleActivoProveedor(proveedor.Codigo, !esActivo);
      toast.success(esActivo ? 'Proveedor desactivado correctamente' : 'Proveedor activado correctamente');
      loadProveedores();
      precargarProveedores();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error desconocido al actualizar el estado');
    }
  };

  // Manejar cambio en el límite de resultados por página
  const handleLimitChange = (): void => {
    pagination.currentPage = 1; // Volver a la primera página cuando se cambia el límite
    loadProveedores();
  };
</script>

<svelte:head>
  <title>Gestión de Proveedores</title>
</svelte:head>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Gestión de Proveedores</h1>
    <Button variant="primary" on:click={() => goto('/compras/proveedores/nuevo')}>
      Nuevo Proveedor
    </Button>
    <!-- <Button variant="primary" on:click={() => goto('/localidades/nuevo')}>
        Nueva Localidad
      </Button> -->
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
            placeholder="Buscar por código, descripción o CUIT..."
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
      
      <!-- Filtro por estado Activo -->
      <div class="md:w-40">
        <label for="activo" class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
        <select
          id="activo"
          bind:value={filters.activo}
          on:change={() => { pagination.currentPage = 1; loadProveedores(); }}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
          <option value="todos">Todos</option>
        </select>
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
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
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
  {:else if proveedores.length === 0}
    <div class="bg-white p-8 rounded-md shadow text-center">
      <p class="text-gray-500">No hay proveedores disponibles</p>
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
            <th 
              class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              on:click={() => handleSortChange('Activo')}
            >
              <div class="flex items-center">
                <span>Estado</span>
                {#if filters.field === 'Activo'}
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
          {#each proveedores as proveedor (proveedor.Codigo)}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                {proveedor.Codigo}
              </td>
              <td class="px-6 py-4 border-b border-gray-200">
                {proveedor.Descripcion || '-'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full {proveedor.Activo !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                  {proveedor.Activo !== false ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right border-b border-gray-200">
                <Button variant="secondary" size="sm" on:click={() => handleEdit(proveedor.Codigo)}>
                  Editar
                </Button>
                <Button 
                  variant={proveedor.Activo !== false ? 'danger' : 'primary'} 
                  size="sm" 
                  on:click={() => handleToggleActivo(proveedor)}
                >
                  {proveedor.Activo !== false ? 'Desactivar' : 'Activar'}
                </Button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    
    <!-- Paginación -->
    {#if !loading && !error && proveedores.length > 0}
      <div class="mt-4">
        <div class="flex justify-between items-center text-sm">
          <div class="text-gray-600">
            Mostrando {(pagination.currentPage - 1) * pagination.limit + 1} a {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} de {pagination.totalItems} proveedores
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