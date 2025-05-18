<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { goto } from '$app/navigation';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { debounce } from 'lodash-es';
  
  // Definir interfaces para los tipos
  interface Provincia {
    Codigo: string;
    Descripcion: string;
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
  
  // Estado con tipos correctos
  let provincias: Provincia[] = [];
  let loading = true;
  let error: string | null = null;
  
  // Estado de filtros y paginación con tipos
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
  
  // Función para cargar datos con los filtros actuales
  const loadProvincias = async (): Promise<void> => {
    try {
      loading = true;
      error = null;
      
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        search: filters.search,
        field: filters.field,
        order: filters.order
      });
      
      // Obtener el token del localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const response = await fetch(`${PUBLIC_API_URL}/provincias?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error al cargar las provincias');
      
      const data = await response.json();
      
      // Actualizar lista de provincias y metadatos de paginación
      provincias = data.items;
      
      // Actualizar información de paginación
      pagination = {
        currentPage: parseInt(data.currentPage, 10),
        totalPages: parseInt(data.totalPages, 10),
        totalItems: parseInt(data.totalItems, 10),
        limit: parseInt(data.limit || pagination.limit, 10)
      };
      
    } catch (err: unknown) {
      console.error('Error cargando provincias:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };
  
  // Cargar datos al inicializar el componente
  onMount(() => {
    loadProvincias();
  });
  
  // Debounce para la búsqueda
  const debouncedSearch = debounce(() => {
    pagination.currentPage = 1; // Reset a primera página con cada búsqueda
    loadProvincias();
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
    loadProvincias();
  };
  
  // Cambiar de página
  const goToPage = (page: number): void => {
    if (page < 1 || page > pagination.totalPages) return;
    pagination.currentPage = page;
    loadProvincias();
  };
  
  const handleEdit = (id: string): void => {
    goto(`/provincias/${id}`);
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('¿Está seguro que desea eliminar esta provincia?')) return;
    
    try {
      const response = await fetch(`${PUBLIC_API_URL}/provincias/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Error al eliminar la provincia');
      
      // Recargar la tabla después de eliminar
      loadProvincias();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    }
  };
</script>

<svelte:head>
  <title>Gestión de Provincias</title>
</svelte:head>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Gestión de Provincias</h1>
    <Button variant="primary" on:click={() => goto('/provincias/nuevo')}>
      Nueva Provincia
    </Button>
  </div>
  
  <!-- Barra de búsqueda -->
  <div class="mb-6 flex items-center space-x-4">
    <div class="flex-grow">
      <input
        type="text"
        placeholder="Buscar provincias..."
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={filters.search}
        on:input={handleSearchChange}
      />
    </div>
    <div>
      <select
        id="limit"
        bind:value={pagination.limit}
        on:change={loadProvincias}
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
  
  {#if loading}
    <div class="bg-white p-8 rounded-md shadow text-center">
      <p class="text-gray-500">Cargando provincias...</p>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <p>{error}</p>
    </div>
  {:else if provincias.length === 0}
    <div class="bg-white p-8 rounded-md shadow text-center">
      <p class="text-gray-500">No hay provincias disponibles</p>
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
          {#each provincias as provincia (provincia.Codigo)}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                {provincia.Codigo}
              </td>
              <td class="px-6 py-4 border-b border-gray-200">
                {provincia.Descripcion || '-'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right border-b border-gray-200">
                <Button variant="secondary" size="sm" on:click={() => handleEdit(provincia.Codigo)}>
                  Editar
                </Button>
                <Button variant="danger" size="sm" on:click={() => handleDelete(provincia.Codigo)}>
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


                

