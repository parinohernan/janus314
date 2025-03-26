<script lang="ts">
  import { onMount } from 'svelte';
  import { PUBLIC_API_URL } from '$env/static/public';
  import Button from '$lib/components/ui/Button.svelte';
  import { formatDate } from '$lib/utils/dateUtils';
  import { PedidoService } from '$lib/services/PedidoService';
  import type { PedidoCabeza, PedidoFiltros } from '$lib/types';
  
  // Estado
  let pedidos: PedidoCabeza[] = [];
  let loading = true;
  let error: string | null = null;
  
  // Paginación
  let currentPage = 1;
  let totalPages = 0;
  let itemsPerPage = 10;
  let totalItems = 0;
  
  // Filtros
  let filtros: PedidoFiltros = {
    cliente: '',
    tipo: '',
    fechaDesde: '',
    fechaHasta: '',
    pendientes: false
  };
  let filtrosVisibles = false;
  
  // Función para cargar pedidos usando el servicio
  async function cargarPedidos() {
    loading = true;
    error = null;
    
    try {
      const resultado = await PedidoService.listarPedidos(currentPage, itemsPerPage, filtros);
      pedidos = resultado.data;
      totalItems = resultado.meta.totalItems;
      totalPages = resultado.meta.totalPages;
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  }
  
  // Función para cambiar de página
  function cambiarPagina(pagina: number) {
    if (pagina < 1 || pagina > totalPages) return;
    currentPage = pagina;
    cargarPedidos();
  }
  
  // Función para aplicar filtros
  function aplicarFiltros() {
    currentPage = 1; // Volver a la primera página al filtrar
    cargarPedidos();
  }
  
  // Función para limpiar filtros
  function limpiarFiltros() {
    filtros.cliente = '';
    filtros.tipo = '';
    filtros.fechaDesde = '';
    filtros.fechaHasta = '';
    filtros.pendientes = false;
    aplicarFiltros();
  }
  
  // Función para ver detalle de pedido
  function verDetalle(tipo: string, sucursal: string, numero: string) {
    window.location.href = `/pedidos/${tipo}/${sucursal}/${numero}`;
  }
  
  // Cargar datos al montar el componente
  onMount(() => {
    cargarPedidos();
  });
  
  // Generar números de página para paginación
  $: pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => {
      if (totalPages <= 5) return i + 1;
      
      if (currentPage <= 3) return i + 1;
      if (currentPage >= totalPages - 2) return totalPages - 4 + i;
      
      return currentPage - 2 + i;
    }
  );
  
  // Calcular estado del pedido
  function getEstadoPedido(pedido: PedidoCabeza) {
    if (pedido.FechaAnulacion) return 'Anulado';
    if (pedido.FechaEnviado) return 'Enviado';
    if (pedido.FechaEntrega) return 'Programado';
    return 'Pendiente';
  }
  
  // Obtener clase CSS según estado
  function getClaseEstado(estado: string) {
    switch(estado) {
      case 'Anulado': return 'bg-red-100 text-red-800';
      case 'Enviado': return 'bg-green-100 text-green-800';
      case 'Programado': return 'bg-blue-100 text-blue-800';
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Pedidos</h1>
    <Button href="/pedidos/nuevo">Nuevo Pedido</Button>
  </div>
  
  <!-- Filtros -->
  <div class="mb-6">
    <div class="flex justify-between items-center mb-2">
      <h2 class="text-lg font-semibold">Filtros</h2>
      <button 
        class="text-sm text-blue-600 hover:text-blue-800" 
        on:click={() => filtrosVisibles = !filtrosVisibles}
      >
        {filtrosVisibles ? 'Ocultar filtros' : 'Mostrar filtros'}
      </button>
    </div>
    
    {#if filtrosVisibles}
      <div class="bg-white p-4 rounded shadow mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label for="cliente" class="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <input
              type="text"
              id="cliente"
              bind:value={filtros.cliente}
              placeholder="Código de cliente"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label for="tipo" class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              id="tipo"
              bind:value={filtros.tipo}
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="PED">Pedido</option>
              <option value="PRE">Presupuesto</option>
            </select>
          </div>
          
          <div>
            <label for="fechaDesde" class="block text-sm font-medium text-gray-700 mb-1">Fecha desde</label>
            <input
              type="date"
              id="fechaDesde"
              bind:value={filtros.fechaDesde}
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label for="fechaHasta" class="block text-sm font-medium text-gray-700 mb-1">Fecha hasta</label>
            <input
              type="date"
              id="fechaHasta"
              bind:value={filtros.fechaHasta}
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div class="flex items-center mt-4">
          <input
            type="checkbox"
            id="pendientes"
            bind:checked={filtros.pendientes}
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="pendientes" class="ml-2 block text-sm text-gray-900">
            Solo mostrar pedidos pendientes
          </label>
        </div>
        
        <div class="flex justify-end mt-4 space-x-2">
          <Button variant="secondary" on:click={limpiarFiltros}>Limpiar</Button>
          <Button on:click={aplicarFiltros}>Aplicar filtros</Button>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Tabla de pedidos -->
  {#if loading}
    <div class="flex justify-center items-center py-10">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
      <p>{error}</p>
    </div>
  {:else if pedidos.length === 0}
    <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
      <p>No se encontraron pedidos con los filtros aplicados.</p>
    </div>
  {:else}
    <div class="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg mb-4">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nº Pedido
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cliente
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unidad Móvil
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each pedidos as pedido (pedido.DocumentoTipo + pedido.DocumentoSucursal + pedido.DocumentoNumero)}
            {@const estado = getEstadoPedido(pedido)}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {pedido.DocumentoTipo}-{pedido.DocumentoSucursal}-{pedido.DocumentoNumero}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {formatDate(pedido.FechaEmicion)}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {pedido.Cliente ? pedido.Cliente.Descripcion : 'N/A'}
                </div>
                <div class="text-xs text-gray-500">
                  Cód: {pedido.CodigoCliente || 'N/A'}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {pedido.UnidadMovil ? pedido.UnidadMovil.Descripcion : 'N/A'}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getClaseEstado(estado)}`}>
                  {estado}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  class="text-blue-600 hover:text-blue-900 mr-2"
                  on:click={() => verDetalle(pedido.DocumentoTipo, pedido.DocumentoSucursal, pedido.DocumentoNumero)}
                >
                  Ver
                </button>
                
                <button 
                  class="text-green-600 hover:text-green-900"
                  disabled={estado === 'Anulado' || estado === 'Enviado'}
                >
                  Procesar
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    
    <!-- Paginación -->
    {#if totalPages > 1}
      <div class="flex items-center justify-between mt-4">
        <div class="text-sm text-gray-700">
          Mostrando <span class="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a 
          <span class="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de 
          <span class="font-medium">{totalItems}</span> resultados
        </div>
        
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
          
          {#each pageNumbers as pagina}
            {#if pagina === currentPage}
              <button 
                class="z-10 bg-blue-50 border-blue-500 text-blue-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                aria-current="page"
              >
                {pagina}
              </button>
            {:else}
              <button
                class="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                on:click={() => cambiarPagina(pagina)}
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