<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { goto } from '$app/navigation';
  import { debounce } from 'lodash-es';
  import { page } from '$app/stores';
  import { navigationState } from '$lib/stores/navigationState';
  import { ClienteService } from '$lib/services/ClienteService';
  import type { Cliente } from '$lib/types/cliente';
  import { smartNavigate } from '$lib/utils/navigation';
   
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
    localidad: string;
  }
  
  // Estado de filtros y paginación con tipos
  let filters: Filters = {
    search: '',
    field: 'Descripcion',
    order: 'ASC',
    localidad: ''
  };
  
  let localidadesOptions: string[] = [];
  let generatingPdf = false;
  
  let pagination: Pagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  };
  
  let clientes: Cliente[] = [];
  let loading = true;
  let error: string | null = null;
  
  // Función para cargar datos con los filtros actuales
  const loadClientes = async (): Promise<void> => {
    try {
      loading = true;
      error = null;
      
      const data = await ClienteService.obtenerClientes({
        page: pagination.currentPage,
        limit: pagination.limit,
        search: filters.search,
        field: filters.field,
        order: filters.order,
        localidad: filters.localidad || undefined
      });
      
      // Actualizar lista de clientes y paginación
      clientes = data.items;
      pagination = {
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalItems: data.totalItems,
        limit: data.limit
      };
      
    } catch (err: unknown) {
      console.error('Error cargando clientes:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };
  
  // Cargar localidades para el filtro
  const loadLocalidades = async () => {
    localidadesOptions = await ClienteService.obtenerLocalidadesDistinct();
  };

  // Generar PDF del listado de clientes con jsPDF (evita PDF en blanco de html2canvas)
  const handleExportarPdf = async () => {
    try {
      generatingPdf = true;
      const data = await ClienteService.obtenerClientes({
        page: 1,
        limit: 5000,
        search: filters.search,
        field: filters.field,
        order: filters.order,
        localidad: filters.localidad || undefined
      });
      const items = data.items || [];
      if (items.length === 0) {
        alert('No hay clientes para exportar con los filtros actuales.');
        return;
      }
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 10;
      let y = margin;
      const fontSize = 9;
      doc.setFontSize(14);
      doc.text('Listado de clientes', margin, y);
      y += 8;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generado: ${new Date().toLocaleString('es-AR')}${filters.localidad ? ` · Localidad: ${filters.localidad}` : ''}`, margin, y);
      y += 8;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(fontSize);
      const colW = [(pageW - 2 * margin) * 0.08, (pageW - 2 * margin) * 0.22, (pageW - 2 * margin) * 0.18, (pageW - 2 * margin) * 0.12, (pageW - 2 * margin) * 0.15, (pageW - 2 * margin) * 0.1, (pageW - 2 * margin) * 0.15];
      const headers = ['Código', 'Razón Social', 'Nombre Fantasía', 'CUIT', 'Localidad', 'Deuda', 'Estado'];
      let x = margin;
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y, pageW - 2 * margin, 7, 'F');
      headers.forEach((h, i) => {
        doc.text(h, x + 2, y + 5);
        x += colW[i];
      });
      y += 8;
      for (const c of items) {
        if (y > pageH - 15) {
          doc.addPage('a4', 'l');
          y = margin;
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, y, pageW - 2 * margin, 7, 'F');
          x = margin;
          headers.forEach((h, i) => {
            doc.text(h, x + 2, y + 5);
            x += colW[i];
          });
          y += 8;
        }
        x = margin;
        const row = [
          String(c.Codigo ?? ''),
          String((c.Descripcion ?? '-').slice(0, 35)),
          String((c.NombreFantasia ?? '-').slice(0, 30)),
          String((c.Cuit ?? '-').slice(0, 15)),
          String((c.Localidad ?? '-').slice(0, 25)),
          String((c.ImporteDeuda?.toFixed(2) ?? '0.00')),
          c.Activo ? 'Activo' : 'Inactivo'
        ];
        row.forEach((cell, i) => {
          doc.text(cell, x + 2, y + 4);
          x += colW[i];
        });
        y += 6;
      }
      doc.save(`clientes-${filters.localidad ? filters.localidad.replace(/\s/g, '-') : 'listado'}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('Error al generar el PDF. Intente de nuevo.');
    } finally {
      generatingPdf = false;
    }
  };
  
  // Cargar datos al inicializar el componente
  onMount(() => {
    loadLocalidades();
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
    loadClientes();
    
    // Timeout de seguridad para evitar carga infinita
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn("Carga de datos demasiado lenta - finalizando estado de carga");
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
  
  // Manejar cambio en la búsqueda con debounce para evitar muchas peticiones
  const debouncedSearch = debounce(() => {
    pagination.currentPage = 1; // Volver a la primera página al buscar
    loadClientes();
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
    loadClientes();
    updateState();
  };
  
  // Cambiar de página
  const goToPage = (page: number): void => {
    if (page < 1 || page > pagination.totalPages) return;
    pagination.currentPage = page;
    loadClientes();
    updateState();
  };
  
  // Manejar cambio en el límite de resultados por página
  const handleLimitChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    pagination.limit = parseInt(target.value, 10);
    pagination.currentPage = 1;
    loadClientes();
    updateState();
  };

  // Cambio de filtro por localidad (leer valor del evento para evitar desfase con bind)
  const handleLocalidadChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    filters.localidad = target.value ?? '';
    pagination.currentPage = 1;
    loadClientes();
    updateState();
  };
  
  // Navegar a editar
  const handleEdit = (id: string, descripcion: string, event?: MouseEvent): void => {
    const url = `/clientes/${id}`;
    const label = `Cliente: ${descripcion}`;
    const icon = '👤';
    
    if (event) {
      smartNavigate(url, event, { label, icon, type: 'edit' });
    } else {
      goto(url);
    }
  };
  
  // Cambiar estado del cliente
  const handleToggleActivo = async (codigo: string, estadoActual: number) => {
    if (confirm(`¿Está seguro que desea ${estadoActual ? 'desactivar' : 'activar'} este cliente?`)) {
      try {
        await ClienteService.toggleActivo(codigo);
        // Recargar la lista de clientes
        await loadClientes();
      } catch (error) {
        console.error('Error:', error);
        alert('Ha ocurrido un error al cambiar el estado del cliente.');
      }
    }
  };
  
  // Al cambiar página o filtros, guardar el estado actual
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
  <title>Clientes</title>
</svelte:head>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-4">
    <h1 class="text-2xl font-bold">Clientes</h1>
    <div class="flex gap-2">
      <Button
        variant="secondary"
        on:click={handleExportarPdf}
        disabled={generatingPdf || loading}
      >
        {generatingPdf ? 'Generando PDF...' : 'Exportar PDF'}
      </Button>
      <Button variant="primary" on:click={() => goto('/clientes/nuevo')}>
        Nuevo Cliente
      </Button>
    </div>
  </div>
  
  <div class="mb-6 bg-white p-4 rounded-lg shadow-sm">
    <div class="flex flex-col md:flex-row gap-4">
      <div class="flex-grow">
        <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
        <div class="relative">
          <input
            type="text"
            id="search"
            placeholder="Buscar por código, descripción, nombre fantasía, CUIT o localidad..."
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
      
      <!-- Filtro por localidad -->
      <div class="md:w-52">
        <label for="localidad" class="block text-sm font-medium text-gray-700 mb-1">Localidad</label>
        <select
          id="localidad"
          bind:value={filters.localidad}
          on:change={handleLocalidadChange}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas</option>
          {#each localidadesOptions as loc}
            <option value={loc}>{loc}</option>
          {/each}
        </select>
      </div>
      
      <!-- Selector de resultados por página -->
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
          <option value={100}>100 por página</option>
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
      <p>No se encontraron clientes que coincidan con los criterios de búsqueda.</p>
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
                Razón Social
                {#if filters.field === 'Descripcion'}
                  <span class="ml-1">
                    {filters.order === 'ASC' ? '↑' : '↓'}
                  </span>
                {/if}
              </button>
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button class="flex items-center" on:click={() => toggleOrderBy('NombreFantasia')}>
                Nombre Fantasía
                {#if filters.field === 'NombreFantasia'}
                  <span class="ml-1">
                    {filters.order === 'ASC' ? '↑' : '↓'}
                  </span>
                {/if}
              </button>
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              CUIT
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Localidad
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button class="flex items-center" on:click={() => toggleOrderBy('ImporteDeuda')}>
                Deuda
                {#if filters.field === 'ImporteDeuda'}
                  <span class="ml-1">
                    {filters.order === 'ASC' ? '↑' : '↓'}
                  </span>
                {/if}
              </button>
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button class="flex items-center" on:click={() => toggleOrderBy('Activo')}>
                Estado
                {#if filters.field === 'Activo'}
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
                {cliente.Descripcion || '-'}
              </td>
              <td class="px-6 py-4 border-b border-gray-200">
                {cliente.NombreFantasia || '-'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                {cliente.Cuit || '-'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                {cliente.Localidad || '-'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                ${cliente.ImporteDeuda?.toFixed(2) || '0.00'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                <span 
                  class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {cliente.Activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}"
                >
                  {cliente.Activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right border-b border-gray-200">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  on:click={(e) => handleEdit(cliente.Codigo, cliente.Descripcion || 'Sin nombre', e)}
                  title="Click para editar, Ctrl+Click para abrir en nuevo tab"
                >
                  Editar
                </Button>
                
                <button 
                  class="{cliente.Activo ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white px-2 py-1 rounded text-sm ml-2"
                  on:click={() => handleToggleActivo(cliente.Codigo, cliente.Activo ?? 0)}
                >
                  {cliente.Activo ? 'Desactivar' : 'Activar'}
                </button>
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