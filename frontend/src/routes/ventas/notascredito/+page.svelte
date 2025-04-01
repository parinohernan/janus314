<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { PUBLIC_API_URL } from '$env/static/public';
  import Button from '$lib/components/ui/Button.svelte';
  import { formatDate } from '$lib/utils/dateUtils';
  import { navigationState } from '$lib/stores/navigationState';
  import { writable } from 'svelte/store';
  import { EmpresaService } from '$lib/services/EmpresaService';

  // Definición de interfaces
  interface NotaCredito {
    DocumentoTipo: string;
    DocumentoSucursal: string;
    DocumentoNumero: string;
    Fecha: string;
    ImporteTotal: number;
    FechaAnulacion: string | null;
    afip_cae?: string;
    Cliente?: {
      Codigo: string;
      Descripcion: string;
    }
  }
  
  interface ClienteOption {
    value: string;
    label: string;
    razonSocial: string;
  }
  
  // Definimos el tipo para el store de navegación
  type NavigationStateStore = {
    saveState(path: string, state: any): void;
    getState(path: string): any | null;
  }
  
  // Aseguramos que navigationState es del tipo correcto
  const typedNavigationState = navigationState as unknown as NavigationStateStore;
  
  // Estado para paginación y filtros
  let notasCredito: NotaCredito[] = [];
  let totalItems: number = 0;
  let itemsPerPage: number = 10;
  let currentPage: number = 1;
  let totalPages: number = 0;
  let loading: boolean = true;
  let error: string | null = null;
  
  // Configurar fecha actual para los filtros
  const hoy = new Date();
  const fechaFormateada = hoy.toISOString().substring(0, 10);
  
  // Filtros
  let filtroTipo = '';
  let filtroCliente = '';
  let filtroFechaDesde = fechaFormateada;
  let filtroFechaHasta = fechaFormateada;
  let filtroSucursal = '';
  
  // Tipos de documento
  const tiposDocumento = [
    { value: '', label: 'Todos' },
    { value: 'NCA', label: 'Nota de Crédito A' },
    { value: 'NCB', label: 'Nota de Crédito B' },
    { value: 'NCC', label: 'Nota de Crédito C' }
  ];
  
  // Estado para el selector de clientes
  let clientesOptions: ClienteOption[] = [];
  let clienteBusqueda = '';
  let clientesLoading = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  // Lista de sucursales (puedes cargarla dinámicamente desde el backend si lo prefieres)
  let sucursales = [
    { value: '', label: 'Todas' },
    { value: '0001', label: 'Casa Central' },
    { value: '0002', label: 'Sucursal 1' },
    // Puedes agregar más según necesites
  ];
  
  // Función para obtener la sucursal predeterminada
  const cargarSucursalPredeterminada = async () => {
    try {
      // Solo cargamos si no hay una sucursal ya establecida
      console.log('cargando sucursal predeterminada', filtroSucursal);
      if (!filtroSucursal) {
        filtroSucursal = await EmpresaService.obtenerSucursal();
        console.log('sucursal', filtroSucursal);
      }
    } catch (error) {
      console.error('Error al cargar sucursal predeterminada:', error);
      filtroSucursal = '0001'; // Valor predeterminado
    }
  };
  
  // Cargar notas de crédito
  const cargarNotasCredito = async () => {
    try {
      loading = true;
      error = null;
      
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      params.append('orderBy', 'Fecha');
      params.append('orderDir', 'desc');
      params.append('sucursal', filtroSucursal);

      if (filtroTipo) params.append('tipo', filtroTipo);
      if (filtroCliente) params.append('cliente', filtroCliente);
      if (filtroFechaDesde) params.append('fechaDesde', filtroFechaDesde);
      if (filtroFechaHasta) params.append('fechaHasta', filtroFechaHasta);
      // if (filtroSucursal) params.append('sucursal', filtroSucursal);
      
      const response = await fetch(`${PUBLIC_API_URL}/notascredito?${params}`);
      
      if (!response.ok) {
        if (response.status === 500) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error interno del servidor');
        }
        throw new Error('Error al cargar las notas de crédito');
      }
      
      const data = await response.json();
      notasCredito = data.items;
      totalItems = data.meta.totalItems;
      currentPage = data.meta.currentPage;
      totalPages = data.meta.totalPages;
      
      // Guardar estado con el nuevo filtro
      (navigationState as any).saveState('/ventas/notascredito', {
        currentPage,
        scroll: window.scrollY,
        filters: {
          tipo: filtroTipo,
          cliente: filtroCliente,
          fechaDesde: filtroFechaDesde,
          fechaHasta: filtroFechaHasta,
          sucursal: filtroSucursal
        }
      });
      
    } catch (err) {
      console.error('Error cargando notas de crédito:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };
  
  // Función para cambiar de página
  const cambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPages) {
      currentPage = nuevaPagina;
      cargarNotasCredito();
    }
  };
  
  // Aplicar filtros
  const aplicarFiltros = () => {
    currentPage = 1; // Resetear a primera página al filtrar
    cargarNotasCredito();
  };
  
  // Resetear filtros (incluir la sucursal)
  const resetearFiltros = () => {
    filtroTipo = '';
    filtroCliente = '';
    filtroFechaDesde = fechaFormateada;
    filtroFechaHasta = fechaFormateada;
    filtroSucursal = '';
    cargarSucursalPredeterminada();
    currentPage = 1;
    cargarNotasCredito();
  };
  
  // Ver detalle de nota de crédito
  const verDetalle = (tipo: string, sucursal: string, numero: string) => {
    // Asegurarse de que el número tenga 8 dígitos
    const numeroFormateado = numero.padStart(8, '0');
    // Asegurarse de que la sucursal tenga 4 dígitos
    const sucursalFormateada = sucursal.padStart(4, '0');
    console.log('tipo', tipo);
    console.log('sucursalFormateada', sucursalFormateada);
    console.log('numeroFormateado', numeroFormateado);
    goto(`/ventas/notascredito/imprimir/${tipo}/${sucursalFormateada}/${numeroFormateado}`);
  };
  
  // Anular nota de crédito
  const anularNotaCredito = async (tipo: string, sucursal: string, numero: string) => {
    if (!confirm('¿Está seguro que desea anular esta nota de crédito?')) {
      return;
    }
    
    try {
      const response = await fetch(
        `${PUBLIC_API_URL}/notascredito/anular/${tipo}/${sucursal}/${numero}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al anular la nota de crédito');
      }
      
      alert('Nota de crédito anulada correctamente');
      cargarNotasCredito(); // Recargar la lista
    } catch (err) {
      console.error('Error anulando nota de crédito:', err);
      alert(err instanceof Error ? err.message : 'Error al anular la nota de crédito');
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
        const response = await fetch(`${PUBLIC_API_URL}/clientes?search=${encodeURIComponent(busqueda)}&limit=10`);
        
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
  };
  
  // Limpiar cliente seleccionado
  const limpiarCliente = () => {
    filtroCliente = '';
    clienteBusqueda = '';
    clientesOptions = [];
  };
  
  // Al montar el componente
  onMount(async () => {
    // Recuperar estado guardado si existe
    const savedState = (navigationState as any).getState('/ventas/notascredito');
    
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
        filtroSucursal = filtrosGuardados.sucursal || ''; // Recuperar sucursal guardada
      }
    }
    
    // Cargar sucursal predeterminada si no hay una guardada
    await cargarSucursalPredeterminada();
    
    // Cargar datos
    cargarNotasCredito();
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
    <h1 class="text-2xl font-bold text-gray-800">Notas de Crédito</h1>
    <Button variant="primary" on:click={() => goto('/ventas/notascredito/nueva')}>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Nueva Nota de Crédito
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
      
      <!-- Filtro de sucursal -->
      <!-- <div>
        <label for="filtroSucursal" class="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
        <select 
          id="filtroSucursal" 
          bind:value={filtroSucursal}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {#each sucursales as sucursal}
            <option value={sucursal.value}>{sucursal.label}</option>
          {/each}
        </select>
      </div> -->
      
      <div class="relative w-full md:w-64 mb-4 md:mb-0">
        <label for="filtroCliente" class="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
        <div class="relative">
          <input
            type="text"
            id="filtroCliente"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            placeholder="Buscar cliente..."
            bind:value={clienteBusqueda}
            on:input={() => buscarClientes(clienteBusqueda)}
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
  
  <!-- Loading y Errores -->
  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p>{error}</p>
    </div>
  {:else if notasCredito.length === 0}
    <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
      <p>No se encontraron notas de crédito con los criterios seleccionados.</p>
    </div>
  {:else}
    <!-- Tabla de notas de crédito -->
    <div class="bg-white rounded-lg shadow-sm mb-6 overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CAE</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each notasCredito as nc, i}
            <tr class={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td class="px-4 py-3 whitespace-nowrap">
                <span class={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${nc.DocumentoTipo === 'NCA' ? 'bg-blue-100 text-blue-800' : 
                  nc.DocumentoTipo === 'NCB' ? 'bg-green-100 text-green-800' : 
                  'bg-purple-100 text-purple-800'}`}
                >
                  {nc.DocumentoTipo === 'NCA' ? 'NC A' : 
                   nc.DocumentoTipo === 'NCB' ? 'NC B' :
                   nc.DocumentoTipo === 'NCC' ? 'NC C' : nc.DocumentoTipo}
                </span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                {nc.DocumentoSucursal}-{nc.DocumentoNumero}
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                {nc.Fecha ? new Date(nc.Fecha).toLocaleDateString('es-AR') : ''}
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                {nc.Cliente ? nc.Cliente.Descripcion || 'Cliente no asignado' : 'Cliente no asignado'}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-right">
                {nc.ImporteTotal ? nc.ImporteTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '$0,00'}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-center">
                {#if nc.afip_cae}
                  <span class="text-sm text-gray-700">{nc.afip_cae}</span>
                {:else if !nc.FechaAnulacion && (nc.DocumentoTipo === 'NCA' || nc.DocumentoTipo === 'NCB' || nc.DocumentoTipo === 'NCC')}
                  <button 
                    class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Obtener CAE
                  </button>
                {:else}
                  <span class="text-sm text-gray-400">N/A</span>
                {/if}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-center">
                {#if nc.FechaAnulacion}
                  <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    Anulada
                  </span>
                {:else}
                  <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Activa
                  </span>
                {/if}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-center">
                <div class="flex justify-center space-x-2">
                  <button 
                    class="text-blue-600 hover:text-blue-900"
                    on:click={() => verDetalle(nc.DocumentoTipo, nc.DocumentoSucursal, nc.DocumentoNumero)}
                    aria-label="Ver detalle de nota de crédito"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  
                  {#if !nc.FechaAnulacion}
                    <button 
                      class="text-red-600 hover:text-red-900"
                      on:click={() => anularNotaCredito(nc.DocumentoTipo, nc.DocumentoSucursal, nc.DocumentoNumero)}
                      aria-label="Anular nota de crédito"
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
      </table>
    </div>
    
    <!-- Paginación -->
    {#if totalPages > 1}
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