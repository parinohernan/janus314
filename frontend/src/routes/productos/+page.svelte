<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { goto } from '$app/navigation';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { debounce } from 'lodash-es';
  import { navigationState } from '$lib/stores/navigationState';
  import { page } from '$app/stores';
  import { beforeNavigate } from '$app/navigation';
  
  // Definir interfaces para los tipos
  interface Articulo {
    Codigo: string;
    Descripcion: string;
    PrecioCosto: number;
    Existencia: number;
    Activo: number;
    Proveedor?: {
      Descripcion: string;
    };
    Rubro?: {
      Descripcion: string;
    };
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
    proveedor: string;
    rubro: string;
    activo: number;
  }
  
  // Estado de filtros y paginación con tipos
  let filters: Filters = {
    search: '',
    field: 'Descripcion',
    order: 'ASC',
    proveedor: '',
    rubro: '',
    activo: 1
  };
  
  let pagination: Pagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  };
  
  let articulos: Articulo[] = [];
  let loading = true;
  let error: string | null = null;
  
  // También agregamos una variable para rastrear si ya cargamos la primera vez
  let initialLoadCompleted = false;
  
  let proveedores: { Codigo: string; Descripcion: string; }[] = [];
  let rubros: { Codigo: string; Descripcion: string; }[] = [];
  
  // Función para cargar datos con los filtros actuales
  const loadArticulos = async (): Promise<void> => {
    try {
      loading = true;
      error = null;
      
      // Construir URL con parámetros de búsqueda y paginación
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        search: filters.search,
        field: filters.field,
        order: filters.order,
        activo: filters.activo.toString()
      });
      
      // Agregar filtros opcionales solo si tienen valor
      if (filters.proveedor) {
        params.append('proveedor', filters.proveedor);
      }
      if (filters.rubro) {
        params.append('rubro', filters.rubro);
      }
      
      const response = await fetch(`${PUBLIC_API_URL}/articulos?${params}`);
      if (!response.ok) throw new Error('Error al cargar los artículos');
      console.log(response);
      const data = await response.json();
      
      // Actualizar lista de artículos y metadatos de paginación
      articulos = data.items;
      
      // Actualizar información de paginación con los metadatos recibidos
      pagination = {
        currentPage: data.meta.currentPage,
        totalPages: data.meta.totalPages,
        totalItems: data.meta.totalItems,
        limit: data.meta.itemsPerPage
      };
      
    } catch (err: unknown) {
      console.error('Error cargando artículos:', err);
      if (err instanceof Error) {
        error = err.message;
      } else {
        error = 'Error desconocido';
      }
    } finally {
      loading = false;
    }
  };
  
  // Cargar datos de proveedores y rubros
  const loadProveedores = async (): Promise<void> => {
    try {
      const response = await fetch(`${PUBLIC_API_URL}/proveedores?limit=500`);
      if (!response.ok) throw new Error('Error al cargar los proveedores');
      const data = await response.json();
      proveedores = data.items;
    } catch (err) {
      console.error('Error cargando proveedores:', err);
    }
  };
  
  const loadRubros = async (): Promise<void> => {
    try {
      const response = await fetch(`${PUBLIC_API_URL}/rubros?limit=500`);
      if (!response.ok) throw new Error('Error al cargar los rubros');
      const data = await response.json();
      rubros = data.items;
    } catch (err) {
      console.error('Error cargando rubros:', err);
    }
  };
  
  // Cargar datos al inicializar el componente
  onMount(() => {
    console.log("Montando componente de productos");
    // Cargar datos de proveedores y rubros
    Promise.all([loadProveedores(), loadRubros()]);
    
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
    loadArticulos().then(() => {
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
    loadArticulos();
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
    loadArticulos();
    updateState();
  };
  
  // Cambiar de página
  const goToPage = (page: number): void => {
    if (page < 1 || page > pagination.totalPages) return;
    pagination.currentPage = page;
    loadArticulos();
    updateState();
  };
  
  // Manejar cambio en el límite de resultados por página
  const handleLimitChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    pagination.limit = parseInt(target.value, 10);
    pagination.currentPage = 1;
    loadArticulos();
    updateState();
  };
  
  const handleEdit = (id: string): void => {
    goto(`/productos/${id}`);
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('¿Está seguro que desea eliminar este artículo?')) return;
    
    try {
      const response = await fetch(`${PUBLIC_API_URL}/articulos/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el artículo');
      }
      
      alert('Artículo eliminado correctamente');
      loadArticulos();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Error desconocido al eliminar');
      }
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
    if (from && from.url.pathname === '/productos') {
      updateState();
    }
  });

  // Manejar cambios en los filtros
  const handleFilterChange = (): void => {
    pagination.currentPage = 1; // Reset a primera página con cada cambio de filtro
    loadArticulos();
    updateState();
  };
</script>

<svelte:head>
  <title>Gestión de Productos</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Encabezado -->
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Gestión de Productos</h1>
    <Button variant="primary" on:click={() => goto('/productos/nuevo')}>
      Nuevo Producto 
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
            placeholder="Buscar por código, descripción o código de barras..."
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
      
      <!-- Filtro de Proveedor -->
      <div class="md:w-48">
        <label for="proveedor" class="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
        <select
          id="proveedor"
          bind:value={filters.proveedor}
          on:change={handleFilterChange}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los proveedores</option>
          {#each proveedores as proveedor}
            <option value={proveedor.Codigo}>{proveedor.Descripcion}</option>
          {/each}
        </select>
      </div>
      
      <!-- Filtro de Rubro -->
      <div class="md:w-48">
        <label for="rubro" class="block text-sm font-medium text-gray-700 mb-1">Rubro</label>
        <select
          id="rubro"
          bind:value={filters.rubro}
          on:change={handleFilterChange}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los rubros</option>
          {#each rubros as rubro}
            <option value={rubro.Codigo}>{rubro.Descripcion}</option>
          {/each}
        </select>
      </div>
      
      <!-- Filtro de Estado -->
      <div class="md:w-48">
        <label for="activo" class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
        <select
          id="activo"
          bind:value={filters.activo}
          on:change={handleFilterChange}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={1}>Activos</option>
          <option value={0}>Inactivos</option>
          <option value={-1}>Todos</option>
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
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  </div>
  
  <!-- Agregar después de los filtros
  <div class="text-right text-xs">
    <button 
      class="text-gray-500 hover:text-gray-700 underline"
      on:click={() => {
        navigationState.clearState($page.url.pathname);
        window.location.reload();
      }}
    >
      Restablecer filtros y paginación
    </button>
  </div> -->
  
  <!-- Tabla / Estado de carga -->
  {#if loading}
    <div class="flex justify-center items-center py-10">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <p>{error}</p>
    </div>
  {:else if articulos.length === 0}
    <div class="bg-white p-8 rounded-md shadow text-center">
      <p class="text-gray-500">No hay productos disponibles</p>
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
              on:click={() => handleSortChange('PrecioCosto')}
            >
              <div class="flex items-center">
                <span>Precio Costo</span>
                {#if filters.field === 'PrecioCosto'}
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
              on:click={() => handleSortChange('Existencia')}
            >
              <div class="flex items-center">
                <span>Existencia</span>
                {#if filters.field === 'Existencia'}
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
              Estado
            </th>
            <th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {#each articulos as articulo (articulo.Codigo)}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                {articulo.Codigo}
              </td>
              <td class="px-6 py-4 border-b border-gray-200">
                {articulo.Descripcion || '-'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                {articulo.PrecioCosto?.toFixed(2) || '0.00'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                {articulo.Existencia?.toFixed(2) || '0.00'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                <span class={articulo.Activo ? 'px-2 py-1 text-xs rounded-full bg-green-100 text-green-800' : 'px-2 py-1 text-xs rounded-full bg-red-100 text-red-800'}>
                  {articulo.Activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right border-b border-gray-200">
                <Button variant="secondary" size="sm" on:click={() => handleEdit(articulo.Codigo)}>
                  Editar
                </Button>
                <Button variant="danger" size="sm" on:click={() => handleDelete(articulo.Codigo)}>
                  Eliminar
                </Button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    
    <!-- Paginación -->
    {#if !loading && !error && articulos.length > 0}
      <div class="mt-4">
        <div class="flex justify-between items-center text-sm">
          <div class="text-gray-600">
            Mostrando {(pagination.currentPage - 1) * pagination.limit + 1} a {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} de {pagination.totalItems} productos
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