<script lang="ts">
  import { onMount, onDestroy, afterUpdate, tick } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { formatDate } from '$lib/utils/dateUtils';
  import { navigationState } from '$lib/stores/navigationState';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { VendedorService, type VendedorOption as VendedorOptionType } from '$lib/services/VendedorService';
  import { toast, confirm } from '$lib/utils/toast';
  import { syncStackedTableRowHeights } from '$lib/utils/syncTableRowHeights';

  // Definición de interfaces
  interface NotaDebito {
    DocumentoTipo: string;
    DocumentoSucursal: string;
    DocumentoNumero: string;
    Fecha: string;
    ImporteTotal: number;
    FechaAnulacion: string | null;
    ClienteRelacion?: {
      Codigo: string;
      Descripcion: string;
    };
    VendedorRelacion?: {
      Codigo: string;
      Descripcion: string;
    };
  }
  
  interface ClienteOption {
    value: string;
    label: string;
    razonSocial: string;
  }
  
  interface PageState {
    currentPage: number;
    scroll: number;
    filters: {
      tipo: string;
      cliente: string;
      fechaDesde: string;
      fechaHasta: string;
      clienteBusqueda: string;
    }
  }
  
  // Estado para paginación y filtros
  let notasDebito: NotaDebito[] = [];
  let totalItems: number = 0;
  let itemsPerPage: number = 10;
  let currentPage: number = 1;
  let totalPages: number = 0;
  let loading: boolean = true;
  let error: string | null = null;
  
  // Configurar fecha actual para los filtros
  const hoy = new Date();
  hoy.setHours(hoy.getHours() - 3); // Ajustar a GMT-3
  const fechaFormateada = hoy.toISOString().substring(0, 10);
  
  // Filtros
  let filtroTipo = '';
  let filtroCliente = '';
  let filtroFechaDesde = fechaFormateada;
  let filtroFechaHasta = fechaFormateada;
  
  // Tipos de documento de notas de débito
  const tiposDocumento = [
    { value: '', label: 'Todos' },
    { value: 'NDA', label: 'Nota de Débito A' },
    { value: 'NDB', label: 'Nota de Débito B' },
    { value: 'NDF', label: 'Nota de Débito F' }
  ];
  
  // Estado para el selector de clientes
  let clientesOptions: ClienteOption[] = [];
  let clienteBusqueda = '';
  let clientesLoading = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  // Cargar notas de débito
  const cargarNotasDebito = async () => {
    try {
      loading = true;
      error = null;
      
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      params.append('field', 'Fecha');  // Ordenar por fecha
      params.append('order', 'DESC');  // Orden descendente
      
      if (filtroTipo) params.append('tipo', filtroTipo);
      if (filtroCliente) params.append('clienteCodigo', filtroCliente);
      if (filtroFechaDesde) params.append('fechaDesde', filtroFechaDesde);
      if (filtroFechaHasta) params.append('fechaHasta', filtroFechaHasta);
      
      const response = await fetchWithAuth(`/notasdebito?${params}`);
      
      if (!response.ok) {
        if (response.status === 500) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error interno del servidor');
        }
        throw new Error('Error al cargar las notas de débito');
      }
      
      const data = await response.json();
      notasDebito = data.items;
      console.log("notasDebito", notasDebito);
      totalItems = data.meta.totalItems;
      currentPage = data.meta.currentPage;
      totalPages = data.meta.totalPages;
      
      // Guardar estado en el store de navegación
      (navigationState as any).saveState('/ventas/notasdebito', {
        currentPage,
        scroll: window.scrollY,
        filters: {
          tipo: filtroTipo,
          cliente: filtroCliente,
          fechaDesde: filtroFechaDesde,
          fechaHasta: filtroFechaHasta,
          clienteBusqueda: clienteBusqueda
        }
      });
      
    } catch (err) {
      console.error('Error cargando notas de débito:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };
  
  // Función para cambiar de página
  const cambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPages) {
      currentPage = nuevaPagina;
      cargarNotasDebito();
    }
  };
  
  // Función auxiliar para guardar el estado actual
  const guardarEstadoActual = () => {
    const estadoAGuardar = {
      currentPage,
      scroll: window.scrollY,
      filters: {
        tipo: filtroTipo,
        cliente: filtroCliente,
        fechaDesde: filtroFechaDesde,
        fechaHasta: filtroFechaHasta,
        clienteBusqueda: clienteBusqueda
      }
    };
    
    console.log('💾 Guardando estado actual:', estadoAGuardar);
    (navigationState as any).saveState('/ventas/notasdebito', estadoAGuardar);
  };
  
  // Aplicar filtros
  const aplicarFiltros = () => {
    currentPage = 1; // Resetear a primera página al filtrar
    cargarNotasDebito();
  };
  
  // Resetear filtros
  const resetearFiltros = () => {
    filtroTipo = '';
    filtroCliente = '';
    filtroFechaDesde = fechaFormateada;
    filtroFechaHasta = fechaFormateada;
    clienteBusqueda = '';
    currentPage = 1;
    cargarNotasDebito();
  };
  
  // Ir a nueva nota de débito
  const irANuevaNota = () => {
    guardarEstadoActual();
    goto('/ventas/notasdebito/nueva');
  };
  
  // Ver detalle de nota de débito
  const verDetalle = (tipo: string, sucursal: string, numero: string) => {
    guardarEstadoActual();
    goto(`/ventas/notasdebito/imprimir/${tipo}/${sucursal}/${numero}`);
  };
  
  // Anular nota de débito
  const anularNotaDebito = async (tipo: string, sucursal: string, numero: string) => {
    const ok = await confirm('¿Está seguro que desea anular esta nota de débito?');
    if (!ok) return;
    
    try {
      const response = await fetchWithAuth(
        `/notasdebito/${tipo}/${sucursal}/${numero}/anular`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al anular la nota de débito');
      }
      
      toast.success('Nota de débito anulada correctamente');
      cargarNotasDebito();
    } catch (err) {
      console.error('Error anulando nota de débito:', err);
      toast.error(err instanceof Error ? err.message : 'Error al anular la nota de débito');
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
        const response = await fetchWithAuth(`/clientes`, {
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
  };
  
  // Limpiar cliente seleccionado
  const limpiarCliente = () => {
    filtroCliente = '';
    clienteBusqueda = '';
    clientesOptions = [];
  };
  
  // Al montar el componente
  onMount(async () => {
    console.log('🔄 Montando componente de notas de débito...');
    
    // Recuperar estado guardado si existe
    const savedState = (navigationState as any).getState('/ventas/notasdebito');
    console.log('📦 Estado recuperado:', savedState);
    
    if (savedState) {
      currentPage = savedState.currentPage || 1;
      
      const filtrosGuardados = savedState.filters;
      if (filtrosGuardados) {
        filtroTipo = filtrosGuardados.tipo || '';
        filtroCliente = filtrosGuardados.cliente || '';
        filtroFechaDesde = filtrosGuardados.fechaDesde || fechaFormateada;
        filtroFechaHasta = filtrosGuardados.fechaHasta || fechaFormateada;
        clienteBusqueda = filtrosGuardados.clienteBusqueda || '';
        
        console.log('✅ Filtros restaurados:', {
          filtroTipo,
          filtroCliente,
          filtroFechaDesde,
          filtroFechaHasta,
          clienteBusqueda
        });
      }
    } else {
      console.log('⚠️ No se encontró estado guardado');
    }
    
    cargarNotasDebito();
  });
  
  // Al destruir el componente, limpiar timeout si existe
  onDestroy(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });

  let leftTableEl: HTMLTableElement | undefined;
  let rightTableEl: HTMLTableElement | undefined;

  const runSyncStackedTables = () => {
    if (!browser || !leftTableEl || !rightTableEl) return;
    syncStackedTableRowHeights(leftTableEl, rightTableEl);
  };

  afterUpdate(() => {
    if (!browser || loading || notasDebito.length === 0) return;
    tick().then(runSyncStackedTables);
  });

  onMount(() => {
    if (!browser) return;
    const onResize = () => runSyncStackedTables();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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
    <h1 class="text-2xl font-bold text-gray-800">Notas de Débito</h1>
    <Button variant="primary" on:click={irANuevaNota}>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Nueva Nota de Débito
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
        <div class="relative">
          <input
            type="text"
            id="filtroCliente"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
  {:else if notasDebito.length === 0}
    <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
      <p>No se encontraron notas de débito con los criterios seleccionados.</p>
    </div>
  {:else}
    <!-- Tabla de notas de débito: datos con scroll; acciones fuera del scroll -->
    <div class="mb-6">
      <p class="table-scroll-hint" role="note">
        <svg class="mt-0.5 h-5 w-5 shrink-0 text-amber-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span><strong>Acciones</strong> quedan siempre visibles a la derecha. Deslizá la tabla para ver el resto de las columnas.</span>
      </p>
      <div class="flex min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div class="table-scroll-wrap min-w-0 flex-1">
          <table bind:this={leftTableEl} class="min-w-max w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each notasDebito as nota, i}
            <tr class={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td class="px-4 py-3 whitespace-nowrap">
                <span class={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${nota.DocumentoTipo === 'NDA' ? 'bg-red-100 text-red-800' : 
                  nota.DocumentoTipo === 'NDB' ? 'bg-orange-100 text-orange-800' : 
                  'bg-pink-100 text-pink-800'}`}
                >
                  {nota.DocumentoTipo === 'NDA' ? 'ND A' : 
                   nota.DocumentoTipo === 'NDB' ? 'ND B' :
                   nota.DocumentoTipo === 'NDF' ? 'ND F' : nota.DocumentoTipo}
                </span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                {nota.DocumentoSucursal}-{nota.DocumentoNumero}
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                {nota.Fecha}
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                {nota.ClienteRelacion ? nota.ClienteRelacion.Descripcion || 'Cliente no asignado' : 'Cliente no asignado'}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-right">
                {nota.ImporteTotal ? nota.ImporteTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '$0,00'}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-center">
                {#if nota.FechaAnulacion}
                  <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    Anulada
                  </span>
                {:else}
                  <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Activa
                  </span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
        </div>
        <div class="shrink-0 border-l border-gray-200 bg-gray-50 shadow-[-6px_0_10px_-6px_rgba(0,0,0,0.12)]">
          <table bind:this={rightTableEl} class="min-w-[6.5rem] border-separate border-spacing-0">
            <thead>
              <tr class="bg-gray-50">
                <th class="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {#each notasDebito as nota, i}
                <tr class={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td class="px-2 py-3 text-center align-middle">
                    <div class="flex justify-center gap-1">
                      <button
                        class="text-blue-600 hover:text-blue-900"
                        on:click={() => verDetalle(nota.DocumentoTipo, nota.DocumentoSucursal, nota.DocumentoNumero)}
                        aria-label="Imprimir nota de débito"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                      </button>
                      {#if !nota.FechaAnulacion}
                        <button
                          class="text-red-600 hover:text-red-900"
                          on:click={() => anularNotaDebito(nota.DocumentoTipo, nota.DocumentoSucursal, nota.DocumentoNumero)}
                          aria-label="Anular nota de débito"
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
      </div>
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
