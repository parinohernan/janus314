    <script lang="ts">
    import { onMount } from 'svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import { goto } from '$app/navigation';
    import { PUBLIC_API_URL } from '$env/static/public';
    import { debounce } from 'lodash-es';
    import { page } from '$app/stores';
    import { navigationState } from '$lib/stores/navigationState';
    import type { TipoDePago } from '$lib/types/tipoDePago';
    import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  
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
  
    let tiposDePago: TipoDePago[] = [];
    let loading = true;
    let error: string | null = null;
  
    // Función para cargar datos con los filtros actuales
    const loadTiposDePago = async (): Promise<void> => {
      try {
        loading = true;
        error = null;
        
        // Construir parámetros con la API correcta
        const params = {
          page: pagination.currentPage.toString(),
          limit: pagination.limit.toString(),
          search: filters.search,
          field: filters.field,
          order: filters.order
        };
        
        // Usar fetchWithAuth y corregir la ruta sin guiones
        const response = await fetchWithAuth('/tipos-pago', { params });
        
        if (!response.ok) throw new Error('Error al cargar los tipos de pago');
        
        const data = await response.json();
        
        // Actualizar lista de tipos de pago
        tiposDePago = data.items || [];
        
        // Actualizar paginación
        pagination = {
          currentPage: parseInt(data.currentPage || data.meta?.currentPage || pagination.currentPage, 10),
          totalPages: parseInt(data.totalPages || data.meta?.totalPages || 1, 10),
          totalItems: parseInt(data.totalItems || data.meta?.totalItems || 0, 10),
          limit: parseInt(data.limit || data.meta?.itemsPerPage || pagination.limit, 10)
        };
        
      } catch (err: unknown) {
        console.error('Error cargando tipos de pago:', err);
        error = err instanceof Error ? err.message : 'Error desconocido';
      } finally {
        loading = false;
      }
    };
  
    // Cargar datos al inicializar el componente
    onMount(() => {
      // Recuperar estado guardado al montar el componente
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
      
      // Cargar datos con el estado restaurado
      loadTiposDePago();
      
      // Timeout de seguridad para evitar carga infinita
      const loadingTimeout = setTimeout(() => {
        if (loading) {
          loading = false;
          if (!error) {
            error = "Tiempo de espera agotado. Verifique la conexión al servidor.";
          }
        }
      }, 10000); // 10 segundos
  
      return () => {
        clearTimeout(loadingTimeout);
      };
    });
  
    // Manejar cambio en la búsqueda con debounce
    const debouncedSearch = debounce(() => {
      pagination.currentPage = 1; // Volver a la primera página al buscar
      loadTiposDePago();
    }, 300);
  
    const handleSearchChange = (event: Event): void => {
      const target = event.target as HTMLInputElement;
      filters.search = target.value;
      debouncedSearch();
      updateState();
    };
  
    // Cambiar ordenamiento
    const toggleOrderBy = (field: string): void => {
      if (filters.field === field) {
        filters.order = filters.order === 'ASC' ? 'DESC' : 'ASC';
      } else {
        filters.field = field;
        filters.order = 'ASC';
      }
      loadTiposDePago();
      updateState();
    };
  
    // Manejar cambio de página
    const changePage = (page: number): void => {
      pagination.currentPage = page;
      loadTiposDePago();
      updateState();
    };
  
    // Manejar cambio de límite por página
    const handleLimitChange = (): void => {
      pagination.currentPage = 1; // Resetear a la primera página al cambiar límite
      loadTiposDePago();
      updateState();
    };
  
    // Guardar estado de navegación
    const updateState = (): void => {
      // navigationState.saveState($page.url.pathname, {
      //   pagination,
      //   filters
      // });
    };
    // Funciones para acciones
    const handleCreate = (): void => {
      goto('/general/tablas/tipodepago/nuevo');
    };
  
    const handleEdit = (codigo: string): void => {
      goto(`/general/tablas/tipodepago/${codigo}`);
    };
  
    const handleToggleActivo = async (codigo: string, activoActual: number): Promise<void> => {
      try {
        // Usar fetchWithAuth y corregir la ruta sin guiones
        const response = await fetchWithAuth(`/tipos-pago/${codigo}/toggle-activo`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          }
        });
  
        if (!response.ok) {
          throw new Error('Error al cambiar el estado del tipo de pago');
        }
        
        // Actualizar el estado local después de un cambio exitoso
        tiposDePago = tiposDePago.map(tipo => 
          tipo.Codigo === codigo ? { ...tipo, Activo: activoActual === 1 ? 0 : 1 } : tipo
        );
        
      } catch (err: unknown) {
        console.error('Error al cambiar estado activo:', err);
        error = err instanceof Error ? err.message : 'Error desconocido';
      }
    };
  
    </script>
  
    <svelte:head>
      <title>Tipos de Pago</title>
    </svelte:head>
  
    <div class="container mx-auto px-4 py-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Tipos de Pago</h1>
        <Button variant="primary" on:click={handleCreate}>Nuevo Tipo de Pago</Button>
      </div>
  
      <!-- Filtros y búsqueda -->
      <div class="mb-6 flex flex-col md:flex-row gap-4">
        <div class="flex-grow">
          <input
            type="text"
            placeholder="Buscar tipos de pago..."
            class="w-full px-4 py-2 border rounded-md"
            value={filters.search}
            on:input={handleSearchChange}
          />
        </div>
        <div class="flex items-center">
          <label for="limit" class="mr-2">Mostrar:</label>
          <select
            id="limit"
            bind:value={pagination.limit}
            on:change={handleLimitChange}
            class="px-3 py-2 border rounded-md"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
  
      <!-- Mensaje de error -->
      {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      {/if}
  
      <!-- Tabla de tipos de pago -->
      <div class="overflow-x-auto bg-white rounded-lg shadow">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th 
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                on:click={() => toggleOrderBy('Codigo')}
              >
                Código
                {#if filters.field === 'Codigo'}
                  <span>{filters.order === 'ASC' ? '↑' : '↓'}</span>
                {/if}
              </th>
              <th 
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                on:click={() => toggleOrderBy('Descripcion')}
              >
                Descripción
                {#if filters.field === 'Descripcion'}
                  <span>{filters.order === 'ASC' ? '↑' : '↓'}</span>
                {/if}
              </th>
              <th 
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                on:click={() => toggleOrderBy('Activo')}
              >
                Estado
                {#if filters.field === 'Activo'}
                  <span>{filters.order === 'ASC' ? '↑' : '↓'}</span>
                {/if}
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#if loading}
              <tr>
                <td colspan="4" class="px-6 py-4 text-center">
                  <div class="flex justify-center">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            {:else if tiposDePago.length === 0}
              <tr>
                <td colspan="4" class="px-6 py-4 text-center text-gray-500">
                  No se encontraron tipos de pago
                </td>
              </tr>
            {:else}
              {#each tiposDePago as tipo}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">{tipo.Codigo}</td>
                  <td class="px-6 py-4">{tipo.Descripcion}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class={tipo.Activo === 1 ? 'text-green-600' : 'text-red-600'}>
                      {tipo.Activo === 1 ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      class="text-blue-600 hover:text-blue-900 mr-3"
                      on:click={() => handleEdit(tipo.Codigo)}
                    >
                      Editar
                    </button>
                    <button 
                      class={tipo.Activo === 1 ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                      on:click={() => handleToggleActivo(tipo.Codigo, tipo.Activo)}
                    >
                      {tipo.Activo === 1 ? 'Desactivar' : 'Activar'}
                    </button>
                  
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
  
      <!-- Paginación -->
      {#if pagination.totalPages > 1}
        <div class="flex justify-between items-center mt-6">
          <div class="text-sm text-gray-700">
            Mostrando <span class="font-medium">{(pagination.currentPage - 1) * pagination.limit + 1}</span> a 
            <span class="font-medium">
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)}
            </span> de 
            <span class="font-medium">{pagination.totalItems}</span> resultados
          </div>
          <div class="flex space-x-2">
            <button 
              class="px-3 py-1 border rounded-md disabled:opacity-50"
              disabled={pagination.currentPage === 1}
              on:click={() => changePage(pagination.currentPage - 1)}
            >
              Anterior
            </button>
            
            {#each Array(Math.min(5, pagination.totalPages)) as _, i}
              {#if pagination.totalPages <= 5 || 
                  (i === 0) || 
                  (i === 4 && pagination.totalPages > 5) ||
                  (pagination.currentPage - 3 + i >= 1 && pagination.currentPage - 3 + i <= pagination.totalPages)}
                <button 
                  class={`px-3 py-1 border rounded-md ${pagination.currentPage === (pagination.totalPages <= 5 ? i + 1 : pagination.currentPage - 3 + i) ? 'bg-blue-500 text-white' : ''}`}
                  on:click={() => changePage(pagination.totalPages <= 5 ? i + 1 : pagination.currentPage - 3 + i)}
                >
                  {pagination.totalPages <= 5 ? i + 1 : pagination.currentPage - 3 + i}
                </button>
              {/if}
            {/each}
            
            <button 
              class="px-3 py-1 border rounded-md disabled:opacity-50"
              disabled={pagination.currentPage === pagination.totalPages}
              on:click={() => changePage(pagination.currentPage + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      {/if}
    </div> 