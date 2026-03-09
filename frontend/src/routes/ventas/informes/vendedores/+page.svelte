<script lang="ts">
  import { onMount } from 'svelte';
  import { beforeNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import Button from '$lib/components/ui/Button.svelte';
  import { VendedorService, type VendedorOption } from '$lib/services/VendedorService';
  import { UserCircle } from 'lucide-svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { navigationState } from '$lib/stores/navigationState';

  const PAGE_PATH = '/ventas/informes/vendedores';

  // Interfaces

  interface Factura {
    tipo: string;
    numero: string;
    fecha: string;
    clienteCodigo: string;
    clienteDescripcion: string;
    importe: number;
  }

  interface NotaCredito {
    tipo: string;
    numero: string;
    fecha: string;
    clienteCodigo: string;
    clienteDescripcion: string;
    importe: number;
    facturaRelacionada: string;
  }

  interface InformeData {
    vendedor: {
      codigo: string;
      descripcion: string;
    };
    periodo: {
      fechaDesde: string;
      fechaHasta: string;
    };
    facturas: Factura[];
    notasCredito: NotaCredito[];
    totales: {
      facturas: {
        cantidad: number;
        importe: number;
      };
      notasCredito: {
        cantidad: number;
        importe: number;
      };
      general: number;
    };
  }

  // Estado del formulario
  let vendedorSeleccionado = '';
  let vendedoresOptions: VendedorOption[] = [];
  let vendedoresLoading = false;

  // Fechas
  const hoy = new Date();
  hoy.setHours(hoy.getHours() - 3); // Ajustar a GMT-3
  const fechaFormateada = hoy.toISOString().substring(0, 10);
  
  let fechaDesde = fechaFormateada;
  let fechaHasta = fechaFormateada;

  // Estado del informe
  let informeData: InformeData | null = null;
  let loading = false;
  let error: string | null = null;
  let mostrarInforme = false;

  // Generar informe
  const generarInforme = async () => {
    if (!vendedorSeleccionado) {
      error = 'Debe seleccionar un vendedor';
      return;
    }

    if (!fechaDesde || !fechaHasta) {
      error = 'Debe seleccionar las fechas';
      return;
    }

    try {
      loading = true;
      error = null;
      mostrarInforme = false;

      const params = new URLSearchParams();
      params.append('vendedorCodigo', vendedorSeleccionado);
      params.append('fechaDesde', fechaDesde);
      params.append('fechaHasta', fechaHasta);

      const response = await fetchWithAuth(`/informes/vendedores/informe-completo?${params}`);

      if (!response.ok) {
        throw new Error('Error al generar el informe');
      }

      const result = await response.json();
      informeData = result.data;
      mostrarInforme = true;
    } catch (err) {
      console.error('Error generando informe:', err);
      error = err instanceof Error ? err.message : 'Error al generar el informe';
      informeData = null;
      mostrarInforme = false;
    } finally {
      loading = false;
    }
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    vendedorSeleccionado = '';
    fechaDesde = fechaFormateada;
    fechaHasta = fechaFormateada;
    mostrarInforme = false;
    informeData = null;
    error = null;
  };

  // Descargar PDF
  const descargarPDF = async () => {
    if (!vendedorSeleccionado || !fechaDesde || !fechaHasta) {
      error = 'Debe seleccionar un vendedor y las fechas';
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('vendedorCodigo', vendedorSeleccionado);
      params.append('fechaDesde', fechaDesde);
      params.append('fechaHasta', fechaHasta);

      const response = await fetchWithAuth(`/informes/vendedores/informe-pdf?${params}`);

      if (!response.ok) {
        throw new Error('Error al generar el PDF');
      }

      // Obtener el blob del PDF
      const blob = await response.blob();
      
      // Crear un enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe-vendedor-${vendedorSeleccionado}-${fechaDesde}-${fechaHasta}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error descargando PDF:', err);
      error = err instanceof Error ? err.message : 'Error al descargar el PDF';
    }
  };

  // Cargar vendedores al montar el componente
  onMount(async () => {
    let savedScroll: number | undefined;
    if (browser) {
      const savedState = navigationState.getState(PAGE_PATH);
      savedScroll = savedState?.scroll;
      const filters = savedState?.filters as { vendedorSeleccionado?: string; fechaDesde?: string; fechaHasta?: string } | undefined;
      if (filters?.vendedorSeleccionado) vendedorSeleccionado = filters.vendedorSeleccionado;
      if (filters?.fechaDesde) fechaDesde = filters.fechaDesde;
      if (filters?.fechaHasta) fechaHasta = filters.fechaHasta;
    }
    try {
      vendedoresLoading = true;
      const vendedoresData = await VendedorService.obtenerVendedoresActivos();
      vendedoresOptions = vendedoresData;
    } catch (err) {
      console.error('Error cargando vendedores:', err);
      error = 'Error al cargar la lista de vendedores';
    } finally {
      vendedoresLoading = false;
    }
    if (vendedorSeleccionado && fechaDesde && fechaHasta) {
      await generarInforme();
    }
    if (typeof savedScroll === 'number' && savedScroll > 0 && typeof window !== 'undefined') {
      requestAnimationFrame(() => window.scrollTo(0, savedScroll));
    }
  });

  beforeNavigate(({ from }) => {
    if (from?.url.pathname === PAGE_PATH && browser) {
      const currentState = navigationState.getState(PAGE_PATH) || {};
      navigationState.saveState(PAGE_PATH, {
        ...currentState,
        scroll: typeof window !== 'undefined' ? window.scrollY : 0,
        filters: {
          vendedorSeleccionado,
          fechaDesde,
          fechaHasta
        }
      });
    }
  });
</script>

<div class="container mx-auto px-4 py-6">
  <h1 class="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
    <Icon icon={UserCircle} size={32} strokeWidth={2.5} glass={true} />
    Informe de Ventas por Vendedor
  </h1>

  <!-- Formulario de filtros -->
  <div class="bg-white p-6 rounded-lg shadow-md mb-6">
    <h2 class="text-xl font-semibold text-gray-700 mb-4">Filtros</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Selector de vendedor -->
      <div>
        <label for="vendedor" class="block text-sm font-medium text-gray-700 mb-1">
          Vendedor <span class="text-red-500">*</span>
        </label>
        <select
          id="vendedor"
          bind:value={vendedorSeleccionado}
          disabled={vendedoresLoading}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Seleccione un vendedor...</option>
          {#each vendedoresOptions as vendedor}
            <option value={vendedor.value}>{vendedor.label}</option>
          {/each}
        </select>
        {#if vendedoresLoading}
          <p class="mt-1 text-xs text-gray-500">Cargando vendedores...</p>
        {/if}
      </div>

      <!-- Fecha desde -->
      <div>
        <label for="fechaDesde" class="block text-sm font-medium text-gray-700 mb-1">
          Fecha Desde <span class="text-red-500">*</span>
        </label>
        <input 
          id="fechaDesde" 
          type="date" 
          bind:value={fechaDesde}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Fecha hasta -->
      <div>
        <label for="fechaHasta" class="block text-sm font-medium text-gray-700 mb-1">
          Fecha Hasta <span class="text-red-500">*</span>
        </label>
        <input 
          id="fechaHasta" 
          type="date" 
          bind:value={fechaHasta}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <!-- Botones -->
    <div class="flex justify-end space-x-3 mt-6">
      <Button variant="secondary" on:click={limpiarFormulario}>
        Limpiar
      </Button>
      {#if mostrarInforme}
        <Button variant="success" on:click={descargarPDF}>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Descargar PDF
        </Button>
      {/if}
      <Button variant="primary" on:click={generarInforme} disabled={loading || !vendedorSeleccionado}>
        {#if loading}
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
        {/if}
        Generar Informe
      </Button>
    </div>
  </div>

  <!-- Mensajes de error -->
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {/if}

  <!-- Informe -->
  {#if mostrarInforme && informeData}
    <div class="space-y-6">
      <!-- Encabezado del informe -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">
          {informeData.vendedor.descripcion}
        </h2>
        <p class="text-gray-600">
          Período: {informeData.periodo.fechaDesde} - {informeData.periodo.fechaHasta}
        </p>
      </div>

      <!-- Resumen de totales -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Total Facturas -->
        <div class="bg-green-50 p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 class="text-sm font-medium text-green-800 uppercase">Facturas</h3>
          <p class="text-3xl font-bold text-green-900 mt-2">
            {informeData.totales.facturas.importe.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
          </p>
          <p class="text-sm text-green-700 mt-1">
            {informeData.totales.facturas.cantidad} comprobante{informeData.totales.facturas.cantidad !== 1 ? 's' : ''}
          </p>
        </div>

        <!-- Total Notas de Crédito -->
        <div class="bg-red-50 p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <h3 class="text-sm font-medium text-red-800 uppercase">Notas de Crédito</h3>
          <p class="text-3xl font-bold text-red-900 mt-2">
            {informeData.totales.notasCredito.importe.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
          </p>
          <p class="text-sm text-red-700 mt-1">
            {informeData.totales.notasCredito.cantidad} comprobante{informeData.totales.notasCredito.cantidad !== 1 ? 's' : ''}
          </p>
        </div>

        <!-- Total General -->
        <div class="bg-blue-50 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 class="text-sm font-medium text-blue-800 uppercase">Total Neto</h3>
          <p class="text-3xl font-bold text-blue-900 mt-2">
            {informeData.totales.general.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
          </p>
          <p class="text-sm text-blue-700 mt-1">
            Total de ventas - NC
          </p>
        </div>
      </div>

      <!-- Tabla de Facturas -->
      {#if informeData.facturas.length > 0}
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-xl font-semibold text-gray-800 mb-4">Facturas</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Importe</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each informeData.facturas as factura}
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{factura.tipo}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{factura.numero}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{factura.fecha}</td>
                    <td class="px-4 py-3 text-sm text-gray-900">
                      <div class="font-medium">{factura.clienteDescripcion}</div>
                      <div class="text-xs text-gray-500">{factura.clienteCodigo}</div>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-green-600">
                      {factura.importe.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}

      <!-- Tabla de Notas de Crédito -->
      {#if informeData.notasCredito.length > 0}
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-xl font-semibold text-gray-800 mb-4">Notas de Crédito</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factura Relacionada</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Importe</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each informeData.notasCredito as nc}
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{nc.tipo}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{nc.numero}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{nc.fecha}</td>
                    <td class="px-4 py-3 text-sm text-gray-900">
                      <div class="font-medium">{nc.clienteDescripcion}</div>
                      <div class="text-xs text-gray-500">{nc.clienteCodigo}</div>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{nc.facturaRelacionada}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-red-600">
                      {nc.importe.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}

      <!-- Mensaje si no hay datos -->
      {#if informeData.facturas.length === 0 && informeData.notasCredito.length === 0}
        <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          <p>No se encontraron comprobantes para el vendedor y período seleccionados.</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

