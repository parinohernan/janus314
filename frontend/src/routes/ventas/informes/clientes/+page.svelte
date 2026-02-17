<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import DatePicker from '$lib/components/DatePicker.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { formatDate } from '$lib/utils/dateUtils';
  import { Users, BarChart3 } from 'lucide-svelte';
  import Icon from '$lib/components/ui/Icon.svelte';

  // Estado
  let loading = false;
  let error: string | null = null;
  let datos: any = null;
  let vendedores: any[] = [];
  let categoriasIva: any[] = [];
  let localidadesDisponibles: string[] = [];

  // Filtros
  let fechaDesde = new Date();
  let fechaHasta = new Date();
  let localidad = '';
  let vendedorCodigo = '';
  let categoriaIva = '';

  // Vista detallada de cliente
  let clienteSeleccionado: any = null;

  // Inicializar fechas al mes actual
  onMount(async () => {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    fechaDesde = primerDiaMes;
    fechaHasta = ultimoDiaMes;

    // Cargar datos iniciales
    await cargarVendedores();
    await cargarCategoriasIva();
  });

  // Función para cargar vendedores
  async function cargarVendedores() {
    try {
      const response = await fetchWithAuth('/vendedores');
      if (!response.ok) throw new Error('Error al cargar vendedores');
      
      const result = await response.json();
      if (result.success) {
        vendedores = result.data;
      }
    } catch (err) {
      console.error('Error cargando vendedores:', err);
    }
  }

  // Función para cargar categorías IVA
  async function cargarCategoriasIva() {
    try {
      const response = await fetchWithAuth('/categorias-iva');
      if (!response.ok) throw new Error('Error al cargar categorías IVA');
      
      const result = await response.json();
      if (result.success) {
        categoriasIva = result.data;
      }
    } catch (err) {
      console.error('Error cargando categorías IVA:', err);
    }
  }

  // Función para cargar datos del informe
  async function cargarDatos() {
    try {
      loading = true;
      error = null;
      clienteSeleccionado = null;

      const params = new URLSearchParams({
        fechaDesde: fechaDesde.toISOString().split('T')[0],
        fechaHasta: fechaHasta.toISOString().split('T')[0]
      });

      if (localidad) params.append('localidad', localidad);
      if (vendedorCodigo) params.append('vendedorCodigo', vendedorCodigo);
      if (categoriaIva) params.append('categoriaIva', categoriaIva);

      const response = await fetchWithAuth(`/informes/ventas-por-clientes?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar los datos');
      }

      const result = await response.json();
      
      if (result.success) {
        datos = result.data;
        
        // Extraer localidades únicas de los clientes
        const localidadesSet = new Set<string>();
        datos.clientes.forEach((cliente: any) => {
          if (cliente.localidad && cliente.localidad !== 'Sin localidad') {
            localidadesSet.add(cliente.localidad);
          }
        });
        localidadesDisponibles = Array.from(localidadesSet).sort();
        
        console.log("Datos recibidos:", datos);
      } else {
        throw new Error(result.message || 'Error en el servidor');
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  }

  // Función para limpiar filtros
  function limpiarFiltros() {
    localidad = '';
    vendedorCodigo = '';
    categoriaIva = '';
    cargarDatos();
  }

  // Función para formatear moneda
  function formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(valor);
  }

  // Función para mostrar detalles del cliente
  function mostrarDetalleCliente(cliente: any) {
    clienteSeleccionado = cliente;
  }

  // Función para cerrar detalle
  function cerrarDetalle() {
    clienteSeleccionado = null;
  }

  // Reactive statement para cargar datos cuando cambien los filtros principales
  $: if (fechaDesde && fechaHasta) {
    cargarDatos();
  }
</script>

<svelte:head>
  <title>Informe de Ventas por Clientes</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
  <!-- Encabezado -->
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
        <Icon icon={Users} size={32} strokeWidth={2.5} glass={true} />
        Informe de Ventas por Clientes
      </h1>
      <p class="text-gray-600 mt-2">Análisis detallado de ventas por cliente con filtros avanzados</p>
    </div>
    
    <div class="flex gap-3">
      <Button variant="secondary" on:click={limpiarFiltros} disabled={loading}>
        🔄 Limpiar Filtros
      </Button>
      <Button variant="primary" on:click={cargarDatos} disabled={loading}>
        {loading ? '🔄 Cargando...' : '🔍 Buscar'}
      </Button>
    </div>
  </div>

  <!-- Filtros -->
  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h2 class="text-lg font-semibold mb-4">🔍 Filtros</h2>
    
    <!-- Filtros de fecha -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label for="fechaDesde" class="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
        <DatePicker id="fechaDesde" bind:value={fechaDesde} />
      </div>
      <div>
        <label for="fechaHasta" class="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label>
        <DatePicker id="fechaHasta" bind:value={fechaHasta} />
      </div>
    </div>

    <!-- Filtros adicionales -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label for="localidad" class="block text-sm font-medium text-gray-700 mb-2">🏙️ Localidad</label>
        <input
          type="text"
          id="localidad"
          bind:value={localidad}
          placeholder="Filtrar por localidad..."
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          list="localidades-list"
        />
        {#if localidadesDisponibles.length > 0}
          <datalist id="localidades-list">
            {#each localidadesDisponibles as loc}
              <option value={loc}></option>
            {/each}
          </datalist>
        {/if}
      </div>

      <div>
        <label for="vendedor" class="block text-sm font-medium text-gray-700 mb-2">👤 Vendedor</label>
        <select
          id="vendedor"
          bind:value={vendedorCodigo}
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Todos los vendedores</option>
          {#each vendedores as vendedor}
            <option value={vendedor.Codigo}>{vendedor.Descripcion}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="categoriaIva" class="block text-sm font-medium text-gray-700 mb-2">📋 Categoría IVA</label>
        <select
          id="categoriaIva"
          bind:value={categoriaIva}
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Todas las categorías</option>
          {#each categoriasIva as cat}
            <option value={cat.Codigo}>{cat.Descripcion}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Filtros aplicados -->
    {#if datos && datos.filtrosAplicados}
      <div class="mt-4 flex flex-wrap gap-2">
        <span class="text-sm font-medium text-gray-700">Filtros aplicados:</span>
        {#if datos.filtrosAplicados.localidad !== 'Todos'}
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            Localidad: {datos.filtrosAplicados.localidad}
          </span>
        {/if}
        {#if datos.filtrosAplicados.vendedor !== 'Todos'}
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Vendedor: {datos.filtrosAplicados.vendedor}
          </span>
        {/if}
        {#if datos.filtrosAplicados.categoriaIva !== 'Todas'}
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            IVA: {datos.filtrosAplicados.categoriaIva}
          </span>
        {/if}
      </div>
    {/if}
  </div>

  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      <p>❌ {error}</p>
    </div>
  {/if}

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  {:else if datos}
    <!-- Estadísticas Generales -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-100 text-sm font-medium">Total Clientes</p>
            <p class="text-3xl font-bold">{datos.estadisticasGenerales.totalClientes}</p>
          </div>
          <div class="text-4xl">👥</div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-100 text-sm font-medium">Total Ventas</p>
            <p class="text-3xl font-bold">{formatearMoneda(datos.estadisticasGenerales.totalVentas)}</p>
          </div>
          <div class="text-4xl">💰</div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-purple-100 text-sm font-medium">Total Facturas</p>
            <p class="text-3xl font-bold">{datos.estadisticasGenerales.totalFacturas}</p>
          </div>
          <div class="text-4xl">📄</div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-orange-100 text-sm font-medium">Promedio x Cliente</p>
            <p class="text-3xl font-bold">{formatearMoneda(datos.estadisticasGenerales.promedioVentaCliente)}</p>
          </div>
          <Icon icon={BarChart3} size={40} strokeWidth={2} glass={true} />
        </div>
      </div>
    </div>

    <!-- Lista de Clientes -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 class="text-xl font-semibold mb-6">📋 Ventas por Cliente</h2>
      
      {#if datos.clientes.length === 0}
        <div class="text-center py-12">
          <div class="text-6xl mb-4">🔍</div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No hay datos</h3>
          <p class="text-gray-600">No se encontraron ventas de clientes con los filtros seleccionados.</p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 font-semibold">#</th>
                <th class="text-left py-3 px-4 font-semibold">Cliente</th>
                <th class="text-left py-3 px-4 font-semibold">CUIT</th>
                <th class="text-left py-3 px-4 font-semibold">Localidad</th>
                <th class="text-left py-3 px-4 font-semibold">Vendedor</th>
                <th class="text-left py-3 px-4 font-semibold">Cat. IVA</th>
                <th class="text-right py-3 px-4 font-semibold">Facturas</th>
                <th class="text-right py-3 px-4 font-semibold">Total</th>
                <th class="text-center py-3 px-4 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {#each datos.clientes as cliente, i}
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="py-3 px-4">
                    <div class="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {i + 1}
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <div class="font-medium">{cliente.descripcion}</div>
                    <div class="text-sm text-gray-500">Código: {cliente.codigo}</div>
                  </td>
                  <td class="py-3 px-4 text-gray-600">{cliente.cuit || 'N/A'}</td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {cliente.localidad}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-gray-600">{cliente.vendedorDescripcion}</td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {cliente.categoriaIvaDescripcion}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right text-gray-600">{cliente.cantidadFacturas}</td>
                  <td class="py-3 px-4 text-right font-semibold text-green-600">{formatearMoneda(cliente.totalVentas)}</td>
                  <td class="py-3 px-4 text-center">
                    <button
                      on:click={() => mostrarDetalleCliente(cliente)}
                      class="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                      👁️ Ver Detalle
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {:else if !loading}
    <div class="text-center py-12">
      <div class="text-6xl mb-4">👥</div>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">Selecciona los filtros</h3>
      <p class="text-gray-600">Configura los filtros y presiona "Buscar" para ver el informe.</p>
    </div>
  {/if}
</div>

<!-- Modal de Detalle del Cliente -->
{#if clienteSeleccionado}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" on:click={cerrarDetalle}>
    <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" on:click|stopPropagation>
      <!-- Header del Modal -->
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-2xl font-bold mb-2">{clienteSeleccionado.descripcion}</h3>
            <div class="space-y-1 text-blue-100">
              <p>Código: {clienteSeleccionado.codigo}</p>
              <p>CUIT: {clienteSeleccionado.cuit || 'N/A'}</p>
              <p>Localidad: {clienteSeleccionado.localidad}</p>
            </div>
          </div>
          <button
            on:click={cerrarDetalle}
            class="text-white hover:bg-blue-700 rounded-full p-2 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Contenido del Modal -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
        <!-- Resumen -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-blue-50 p-4 rounded-lg">
            <p class="text-sm text-blue-600 font-medium mb-1">Total Ventas</p>
            <p class="text-2xl font-bold text-blue-900">{formatearMoneda(clienteSeleccionado.totalVentas)}</p>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <p class="text-sm text-green-600 font-medium mb-1">Cantidad Facturas</p>
            <p class="text-2xl font-bold text-green-900">{clienteSeleccionado.cantidadFacturas}</p>
          </div>
          <div class="bg-purple-50 p-4 rounded-lg">
            <p class="text-sm text-purple-600 font-medium mb-1">Promedio Factura</p>
            <p class="text-2xl font-bold text-purple-900">
              {formatearMoneda(clienteSeleccionado.totalVentas / clienteSeleccionado.cantidadFacturas)}
            </p>
          </div>
        </div>

        <!-- Información Adicional -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 class="font-semibold mb-3">Información del Cliente</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-gray-600">Vendedor:</span>
              <span class="font-medium ml-2">{clienteSeleccionado.vendedorDescripcion}</span>
            </div>
            <div>
              <span class="text-gray-600">Categoría IVA:</span>
              <span class="font-medium ml-2">{clienteSeleccionado.categoriaIvaDescripcion}</span>
            </div>
            <div>
              <span class="text-gray-600">Total IVA:</span>
              <span class="font-medium ml-2">{formatearMoneda(clienteSeleccionado.totalIva)}</span>
            </div>
          </div>
        </div>

        <!-- Lista de Facturas -->
        <div>
          <h4 class="font-semibold mb-3">Facturas del Período</h4>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200 bg-gray-50">
                  <th class="text-left py-2 px-3 text-sm font-semibold">Tipo</th>
                  <th class="text-left py-2 px-3 text-sm font-semibold">Número</th>
                  <th class="text-left py-2 px-3 text-sm font-semibold">Fecha</th>
                  <th class="text-right py-2 px-3 text-sm font-semibold">Importe</th>
                </tr>
              </thead>
              <tbody>
                {#each clienteSeleccionado.facturas as factura}
                  <tr class="border-b border-gray-100">
                    <td class="py-2 px-3">
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {factura.tipo}
                      </span>
                    </td>
                    <td class="py-2 px-3 text-sm">{factura.numero}</td>
                    <td class="py-2 px-3 text-sm text-gray-600">
                      {new Date(factura.fecha).toLocaleDateString('es-AR')}
                    </td>
                    <td class="py-2 px-3 text-sm text-right font-semibold">{formatearMoneda(factura.importe)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer del Modal -->
      <div class="p-4 bg-gray-50 border-t border-gray-200">
        <Button variant="secondary" on:click={cerrarDetalle} class="w-full">
          Cerrar
        </Button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Animaciones suaves */
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>

