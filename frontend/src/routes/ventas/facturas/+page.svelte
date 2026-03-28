<script lang="ts">
  import { onMount, onDestroy, afterUpdate, tick } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_API_URL } from '$env/static/public';
  import Button from '$lib/components/ui/Button.svelte';
  import { formatDate } from '$lib/utils/dateUtils';
  import { navigationState } from '$lib/stores/navigationState';
  import { writable } from 'svelte/store';
  import CaeModal from '$lib/components/facturas/CaeModal.svelte';
  import CaeManualModal from '$lib/components/facturas/CaeManualModal.svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { AfipService } from '$lib/services/AfipService';
  import { VendedorService, type VendedorOption as VendedorOptionType } from '$lib/services/VendedorService';
  import { smartNavigate } from '$lib/utils/navigation';
  import { toast, confirm } from '$lib/utils/toast';
  import { syncStackedTableRowHeights } from '$lib/utils/syncTableRowHeights';

  // Definición de interfaces
  interface Factura {
    DocumentoTipo: string;
    DocumentoSucursal: string;
    DocumentoNumero: string;
    Fecha: string;
    ImporteTotal: number;
    FechaAnulacion: string | null;
    afip_cae?: string;
    PagoTipo?: string;
    Cliente?: {
      Codigo: string;
      Descripcion: string;
    };
    Vendedor?: {
      Codigo: string;
      Descripcion: string;
    };
  }
  
  interface ClienteOption {
    value: string;
    label: string;
    razonSocial: string;
  }
  
  // Actualizar la interfaz PageState para que coincida con los datos reales
  interface PageState {
    currentPage: number;
    scroll: number;
    filters: {
      tipo: string;
      cliente: string;
      vendedor: string;
      fechaDesde: string;
      fechaHasta: string;
      clienteBusqueda: string;
    }
  }
  
  // Extiende el tipo en navigationState
  // Definimos el tipo para el store de navegación
  type NavigationStateStore = {
    saveState(path: string, state: any): void;
    getState(path: string): any | null;
  }
  
  // Aseguramos que navigationState es del tipo correcto
  const typedNavigationState = navigationState as unknown as NavigationStateStore;
  
  // Estado para paginación y filtros
  let facturas: Factura[] = [];
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
  let filtroVendedor = '';
  let filtroPagoTipo = '';
  let filtroFechaDesde = fechaFormateada;
  let filtroFechaHasta = fechaFormateada;
  
  // Formas de pago para el filtro
  let formasPago: { value: string; label: string }[] = [];
  
  // Tipos de documento actualizados
  const tiposDocumento = [
    { value: '', label: 'Todos' },
    { value: 'FCA', label: 'Factura A' },
    { value: 'FCB', label: 'Factura B' },
    { value: 'FCC', label: 'Factura C' },
    { value: 'PRF', label: 'Prefactura' },
    { value: 'NCA', label: 'Nota de Crédito A' },
    { value: 'NCB', label: 'Nota de Crédito B' },
    { value: 'NCC', label: 'Nota de Crédito C' }
  ];
  
  // Estado para el selector de clientes
  let clientesOptions: ClienteOption[] = [];
  let clienteBusqueda = '';
  let clientesLoading = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  // Estado para el selector de vendedores
  let vendedoresOptions: VendedorOptionType[] = [];
  let vendedoresLoading = false;
  
  // Cargar facturas
  const cargarFacturas = async () => {
    try {
      loading = true;
      error = null;
      
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      params.append('orderBy', 'Fecha');  // Ordenar por fecha
      params.append('orderDir', 'desc');  // Orden
      
      if (filtroTipo) params.append('tipo', filtroTipo);
      if (filtroCliente) params.append('cliente', filtroCliente);
      if (filtroVendedor) params.append('vendedor', filtroVendedor);
      if (filtroPagoTipo) params.append('pagoTipo', filtroPagoTipo);
      if (filtroFechaDesde) params.append('fechaDesde', filtroFechaDesde);
      if (filtroFechaHasta) params.append('fechaHasta', filtroFechaHasta);
      
      const response = await fetchWithAuth(`/facturas?${params}`);
      
      if (!response.ok) {
        if (response.status === 500) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error interno del servidor');
        }
        throw new Error('Error al cargar las facturas');
      }
      
      const data = await response.json();
      facturas = data.items;
      console.log("facturas", facturas);
      totalItems = data.meta.totalItems;
      currentPage = data.meta.currentPage;
      totalPages = data.meta.totalPages;
      
      // Guardar estado en el store de navegación
      (navigationState as any).saveState('/ventas/facturas', {
        currentPage,
        scroll: window.scrollY,
        filters: {
          tipo: filtroTipo,
          cliente: filtroCliente,
          vendedor: filtroVendedor,
          pagoTipo: filtroPagoTipo,
          fechaDesde: filtroFechaDesde,
          fechaHasta: filtroFechaHasta,
          clienteBusqueda: clienteBusqueda
        }
      });
      
    } catch (err) {
      console.error('Error cargando facturas:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };
  
  // Función para cambiar de página
  const cambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPages) {
      currentPage = nuevaPagina;
      cargarFacturas();
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
        vendedor: filtroVendedor,
        fechaDesde: filtroFechaDesde,
        fechaHasta: filtroFechaHasta,
        clienteBusqueda: clienteBusqueda
      }
    };
    
    console.log('💾 Guardando estado actual:', estadoAGuardar);
    (navigationState as any).saveState('/ventas/facturas', estadoAGuardar);
  };
  
  // Aplicar filtros
  const aplicarFiltros = () => {
    currentPage = 1; // Resetear a primera página al filtrar
    cargarFacturas();
  };
  
  // Resetear filtros
  const resetearFiltros = () => {
    filtroTipo = '';
    filtroCliente = '';
    filtroVendedor = '';
    filtroPagoTipo = '';
    filtroFechaDesde = fechaFormateada;
    filtroFechaHasta = fechaFormateada;
    clienteBusqueda = '';
    currentPage = 1;
    cargarFacturas();
  };
  
  // Ir a nueva factura
  const irANuevaFactura = (event?: MouseEvent) => {
    guardarEstadoActual();
    const url = '/ventas/facturas/nueva';
    const label = 'Nueva Factura';
    const icon = '📝';
    
    if (event) {
      smartNavigate(url, event, { label, icon, type: 'create' });
    } else {
      goto(url);
    }
  };
  
  // Construir query string de filtros y scroll para pasar a vista imprimir y poder volver con estado
  const buildListQueryString = () => {
    const params = new URLSearchParams();
    if (filtroTipo) params.set('tipo', filtroTipo);
    if (filtroCliente) params.set('cliente', filtroCliente);
    if (filtroVendedor) params.set('vendedor', filtroVendedor);
    if (filtroPagoTipo) params.set('pagoTipo', filtroPagoTipo);
    params.set('fechaDesde', filtroFechaDesde);
    params.set('fechaHasta', filtroFechaHasta);
    params.set('page', currentPage.toString());
    params.set('scroll', Math.round(window.scrollY).toString());
    if (clienteBusqueda) params.set('clienteBusqueda', clienteBusqueda);
    return params.toString();
  };

  // Ver detalle de factura (vista previa / imprimir)
  const verDetalle = (tipo: string, sucursal: string, numero: string, event?: MouseEvent) => {
    guardarEstadoActual();
    const queryString = buildListQueryString();
    const url = `/ventas/facturas/imprimir/${tipo}/${sucursal}/${numero}${queryString ? '?' + queryString : ''}`;
    const label = `Factura ${tipo} ${sucursal}-${numero}`;
    const icon = '📄';
    
    if (event) {
      smartNavigate(url, event, { label, icon, type: 'view' });
    } else {
      goto(url);
    }
  };
  
  // Anular factura
  const anularFactura = async (tipo: string, sucursal: string, numero: string) => {
    const ok = await confirm('¿Está seguro que desea anular esta factura?');
    if (!ok) return;
    
    try {
      const response = await fetchWithAuth(
        `/facturas/anular/${tipo}/${sucursal}/${numero}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al anular la factura');
      }
      
      toast.success('Factura anulada correctamente');
      cargarFacturas();
    } catch (err) {
      console.error('Error anulando factura:', err);
      toast.error(err instanceof Error ? err.message : 'Error al anular la factura');
    }
  };

  // Clonar factura
  const clonarFactura = async (tipo: string, sucursal: string, numero: string) => {
    try {
      console.log('🔍 Iniciando clonación de factura:', { tipo, sucursal, numero });
      
      // Guardar el estado actual ANTES de navegar
      guardarEstadoActual();
      
      // Obtener los datos de la factura para clonar
      const response = await fetchWithAuth(`/facturas/${tipo}/${sucursal}/${numero}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener los datos de la factura');
      }
      
      const result = await response.json();
      
      // Guardar los datos de la factura en sessionStorage para que estén disponibles en la página de nueva factura
      sessionStorage.setItem('facturaClonada', JSON.stringify(result.data));
      
      // Redirigir a la página de nueva factura
      goto('/ventas/facturas/nueva?clonada=true');
    } catch (err) {
      console.error('❌ Error obteniendo datos de factura para clonar:', err);
      toast.error(err instanceof Error ? err.message : 'Error al obtener los datos de la factura');
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
    console.log('🔄 Montando componente de facturas...');
    
    // Cargar vendedores
    try {
    vendedoresLoading = true;
      const vendedoresData = await VendedorService.obtenerVendedoresActivos();
      vendedoresOptions = vendedoresData;
    } catch (err) {
      console.error('Error cargando vendedores:', err);
      } finally {
      vendedoresLoading = false;
      }
    
    // Cargar formas de pago para filtro y columna
    try {
      const resPago = await fetchWithAuth('/tipos-pago');
      if (resPago.ok) {
        const dataPago = await resPago.json();
        formasPago = (dataPago.items || []).map((item: { Codigo: string; Descripcion: string }) => ({
          value: item.Codigo,
          label: item.Descripcion
        }));
      }
    } catch (err) {
      console.error('Error cargando formas de pago:', err);
    }
    
    const searchParams = $page.url.searchParams;
    const hasUrlState = searchParams.has('tipo') || searchParams.has('cliente') || searchParams.has('fechaDesde') || searchParams.has('page') || searchParams.has('pagoTipo');
    
    let scrollToRestore: number | null = null;
    
    if (hasUrlState) {
      // Prioridad: estado en la URL (vuelta desde vista imprimir)
      filtroTipo = searchParams.get('tipo') || '';
      filtroCliente = searchParams.get('cliente') || '';
      filtroVendedor = searchParams.get('vendedor') || '';
      filtroPagoTipo = searchParams.get('pagoTipo') || '';
      filtroFechaDesde = searchParams.get('fechaDesde') || fechaFormateada;
      filtroFechaHasta = searchParams.get('fechaHasta') || fechaFormateada;
      clienteBusqueda = searchParams.get('clienteBusqueda') || '';
      const pageParam = searchParams.get('page');
      currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
      const scrollParam = searchParams.get('scroll');
      if (scrollParam) scrollToRestore = Math.max(0, parseInt(scrollParam, 10));
      console.log('✅ Filtros y scroll restaurados desde URL');
    } else {
      // Fallback: estado guardado en store/localStorage
      const savedState = (navigationState as any).getState('/ventas/facturas');
      console.log('📦 Estado recuperado del store:', savedState);
      if (savedState) {
        currentPage = savedState.currentPage || 1;
        const filtrosGuardados = savedState.filters;
        if (filtrosGuardados) {
          filtroTipo = filtrosGuardados.tipo || '';
          filtroCliente = filtrosGuardados.cliente || '';
          filtroVendedor = filtrosGuardados.vendedor || '';
          filtroFechaDesde = filtrosGuardados.fechaDesde || fechaFormateada;
          filtroFechaHasta = filtrosGuardados.fechaHasta || fechaFormateada;
          clienteBusqueda = filtrosGuardados.clienteBusqueda || '';
        }
        if (typeof savedState.scroll === 'number') scrollToRestore = savedState.scroll;
      }
    }
    
    await cargarFacturas();
    
    if (scrollToRestore != null) {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollToRestore!);
      });
    }
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
    if (!browser || loading || facturas.length === 0) return;
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
  
  // Modificar la función para abrir modal CAE
  let mostrarModalCAE = false;
  let mostrarModalCAEManual = false;
  let facturaSeleccionada: { 
    DocumentoTipo: string, 
    DocumentoSucursal: string, 
    DocumentoNumero: string 
  } | null = null;

  const abrirModalCAE = (tipo: string, sucursal: string, numero: string) => {
    facturaSeleccionada = { 
      DocumentoTipo: tipo, 
      DocumentoSucursal: sucursal, 
      DocumentoNumero: numero 
    };
    mostrarModalCAE = true;
  };

  const abrirModalCAEManual = (tipo: string, sucursal: string, numero: string) => {
    facturaSeleccionada = { 
      DocumentoTipo: tipo, 
      DocumentoSucursal: sucursal, 
      DocumentoNumero: numero 
    };
    mostrarModalCAEManual = true;
  };

  const cerrarModalCAE = () => {
    mostrarModalCAE = false;
    facturaSeleccionada = null;
  };

  const cerrarModalCAEManual = () => {
    mostrarModalCAEManual = false;
    facturaSeleccionada = null;
  };

  const handleCaeObtenido = () => {
    cargarFacturas(); // Recargar la lista después de obtener el CAE
    cerrarModalCAE();
  };

  const handleCaeGuardado = () => {
    cargarFacturas(); // Recargar la lista después de guardar el CAE
    cerrarModalCAEManual();
  };
</script>

<div>
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">Facturas</h1>
    <Button 
      variant="primary" 
      on:click={(e) => irANuevaFactura(e)}
      title="Click para crear, Ctrl+Click para abrir en nuevo tab"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Nueva Factura
    </Button>
  </div>
  
  <!-- Filtros -->
  <div class="bg-white p-4 rounded-lg shadow-sm mb-6">
    <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
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
      
      <div class="w-full md:w-64 mb-4 md:mb-0">
        <label for="filtroVendedor" class="block text-sm font-medium text-gray-700 mb-1">Vendedor</label>
        <select
            id="filtroVendedor"
          bind:value={filtroVendedor}
          disabled={vendedoresLoading}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos</option>
              {#each vendedoresOptions as vendedor}
            <option value={vendedor.value}>{vendedor.label}</option>
              {/each}
        </select>
        {#if vendedoresLoading}
          <p class="mt-1 text-xs text-gray-500">Cargando vendedores...</p>
        {/if}
      </div>
      
      <div>
        <label for="filtroPagoTipo" class="block text-sm font-medium text-gray-700 mb-1">Pago</label>
        <select
          id="filtroPagoTipo"
          bind:value={filtroPagoTipo}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas</option>
          {#each formasPago as fp}
            <option value={fp.value}>{fp.label}</option>
          {/each}
        </select>
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
      
      <div class="md:col-span-6 flex justify-end space-x-2">
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
  {:else if facturas.length === 0}
    <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
      <p>No se encontraron facturas con los criterios seleccionados.</p>
    </div>
  {:else}
    <!-- Tabla de facturas: datos con scroll; acciones fuera del scroll, siempre al borde derecho -->
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
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pago</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CAE</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each facturas as factura, i}
            <tr class={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td class="px-4 py-3 whitespace-nowrap">
                <span class={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${factura.DocumentoTipo === 'FCA' ? 'bg-blue-100 text-blue-800' : 
                  factura.DocumentoTipo === 'FCB' ? 'bg-green-100 text-green-800' : 
                  factura.DocumentoTipo === 'FCC' ? 'bg-purple-100 text-purple-800' : 
                  factura.DocumentoTipo === 'PRF' ? 'bg-yellow-100 text-yellow-800' : 
                  factura.DocumentoTipo === 'NCA' || factura.DocumentoTipo === 'NCB' ? 'bg-green-100 text-green-800' : 
                  'bg-purple-100 text-purple-800'}`}
                >
                  {factura.DocumentoTipo === 'FCA' ? 'Factura A' : 
                   factura.DocumentoTipo === 'FCB' ? 'Factura B' :
                   factura.DocumentoTipo === 'FCC' ? 'Factura C' :
                   factura.DocumentoTipo === 'PRF' ? 'Prefactura' :
                   factura.DocumentoTipo === 'NCA' ? 'NC A' :
                   factura.DocumentoTipo === 'NCB' ? 'NC B' :
                   factura.DocumentoTipo === 'NCC' ? 'NC C' : factura.DocumentoTipo}
                </span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                {factura.DocumentoSucursal}-{factura.DocumentoNumero}
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                {factura.Fecha}
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                {factura.Cliente ? factura.Cliente.Descripcion || 'Cliente no asignado' : 'Cliente no asignado'}
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                {factura.Vendedor ? factura.Vendedor.Descripcion || 'Vendedor no asignado' : 'Vendedor no asignado'}
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                {factura.PagoTipo ? (formasPago.find(fp => fp.value === factura.PagoTipo)?.value ?? factura.PagoTipo) : '—'}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-right">
                {factura.ImporteTotal ? factura.ImporteTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '$0,00'}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-center">
                {#if factura.afip_cae}
                  <span class="text-sm text-gray-700">{factura.afip_cae}</span>
                {:else if !factura.FechaAnulacion && (factura.DocumentoTipo === 'FCA' || factura.DocumentoTipo === 'FCB' || factura.DocumentoTipo === 'NCA' || factura.DocumentoTipo === 'NCB')}
                  <div class="flex flex-col space-y-1">
                    <button 
                      class="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      on:click={() => abrirModalCAE(factura.DocumentoTipo, factura.DocumentoSucursal, factura.DocumentoNumero)}
                    >
                      Obtener CAE
                    </button>
                    <button 
                      class="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      on:click={() => abrirModalCAEManual(factura.DocumentoTipo, factura.DocumentoSucursal, factura.DocumentoNumero)}
                    >
                      Colocar Manualmente
                    </button>
                  </div>
                {:else}
                  <span class="text-sm text-gray-400">N/A</span>
                {/if}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-center">
                {#if factura.FechaAnulacion}
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
          <table bind:this={rightTableEl} class="min-w-[7.5rem] border-separate border-spacing-0">
            <thead>
              <tr class="bg-gray-50">
                <th class="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {#each facturas as factura, i}
                <tr class={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td class="px-2 py-3 text-center align-middle">
                    <div class="flex justify-center gap-1">
                      <button
                        class="text-blue-600 hover:text-blue-900"
                        on:click={(e) => verDetalle(factura.DocumentoTipo, factura.DocumentoSucursal, factura.DocumentoNumero, e)}
                        aria-label="Imprimir factura"
                        title="Click para ver, Ctrl+Click para abrir en nuevo tab"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                      </button>
                      {#if !factura.FechaAnulacion}
                        <button
                          class="text-green-600 hover:text-green-900"
                          on:click={() => clonarFactura(factura.DocumentoTipo, factura.DocumentoSucursal, factura.DocumentoNumero)}
                          aria-label="Clonar factura"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          class="text-red-600 hover:text-red-900"
                          on:click={() => anularFactura(factura.DocumentoTipo, factura.DocumentoSucursal, factura.DocumentoNumero)}
                          aria-label="Anular factura"
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

<!-- Usar el componente CaeModal importado -->
{#if mostrarModalCAE && facturaSeleccionada}
  <CaeModal 
    show={mostrarModalCAE} 
    factura={facturaSeleccionada} 
    on:close={cerrarModalCAE}
    on:caeObtenido={handleCaeObtenido}
  />
{/if}

<!-- Usar el componente CaeManualModal importado -->
{#if mostrarModalCAEManual && facturaSeleccionada}
  <CaeManualModal 
    show={mostrarModalCAEManual} 
    factura={facturaSeleccionada} 
    on:close={cerrarModalCAEManual}
    on:caeGuardado={handleCaeGuardado}
  />
{/if}

