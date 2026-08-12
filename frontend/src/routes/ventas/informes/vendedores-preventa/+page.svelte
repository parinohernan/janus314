<script lang="ts">
  import { onMount } from 'svelte';
  import { beforeNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import Button from '$lib/components/ui/Button.svelte';
  import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
  import { VendedorService, type VendedorOption } from '$lib/services/VendedorService';
  import { ClipboardList } from 'lucide-svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { navigationState } from '$lib/stores/navigationState';

  const PAGE_PATH = '/ventas/informes/vendedores-preventa';

  const TIPOS_FACTURA_OPTIONS = [
    { value: 'FCA', label: 'Factura A (FCA)' },
    { value: 'FCB', label: 'Factura B (FCB)' },
    { value: 'FCC', label: 'Factura C (FCC)' },
    { value: 'PRF', label: 'Prefactura (PRF)' }
  ];

  const TIPOS_NC_OPTIONS = [
    { value: 'NCA', label: 'Nota de crédito A (NCA)' },
    { value: 'NCB', label: 'Nota de crédito B (NCB)' },
    { value: 'NCF', label: 'Nota de crédito F (NCF)' }
  ];

  const TODOS_TIPOS_FACTURA = TIPOS_FACTURA_OPTIONS.map((o) => o.value);
  const TODOS_TIPOS_NC = TIPOS_NC_OPTIONS.map((o) => o.value);

  interface Factura {
    tipo: string;
    numero: string;
    fecha: string;
    clienteCodigo: string;
    clienteDescripcion: string;
    importe: number;
    preventa?: { tipo: string; sucursal: string; numero: string; label: string };
    vendedorFactura?: string | null;
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
    origen?: string;
    titulo?: string;
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

  let vendedorSeleccionado = '';
  let vendedoresOptions: VendedorOption[] = [];
  let vendedoresLoading = false;

  const hoy = new Date();
  hoy.setHours(hoy.getHours() - 3);
  const fechaFormateada = hoy.toISOString().substring(0, 10);

  let fechaDesde = fechaFormateada;
  let fechaHasta = fechaFormateada;
  let filtroPagoTipo = '';
  let formasPago: { value: string; label: string }[] = [];
  let tiposFacturaSeleccionados: string[] = [...TODOS_TIPOS_FACTURA];
  let tiposNcSeleccionados: string[] = [...TODOS_TIPOS_NC];

  async function cargarFormasPago() {
    try {
      const response = await fetchWithAuth('/tipos-pago');
      if (!response.ok) return;
      const result = await response.json();
      formasPago = (result.items || []).map((item: { Codigo: string; Descripcion: string }) => ({
        value: item.Codigo,
        label: item.Descripcion
      }));
    } catch (err) {
      console.error('Error cargando formas de pago:', err);
      formasPago = [];
    }
  }

  let informeData: InformeData | null = null;
  let loading = false;
  let error: string | null = null;
  let mostrarInforme = false;

  const generarInforme = async () => {
    if (!vendedorSeleccionado) {
      error = 'Debe seleccionar un preventista';
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
      params.append('tiposFactura', tiposFacturaSeleccionados.join(','));
      params.append('tiposNotaCredito', tiposNcSeleccionados.join(','));
      if (filtroPagoTipo) params.append('pagoTipo', filtroPagoTipo);

      const response = await fetchWithAuth(
        `/informes/vendedores/informe-completo-preventa?${params}`
      );

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

  const limpiarFormulario = () => {
    vendedorSeleccionado = '';
    fechaDesde = fechaFormateada;
    fechaHasta = fechaFormateada;
    filtroPagoTipo = '';
    tiposFacturaSeleccionados = [...TODOS_TIPOS_FACTURA];
    tiposNcSeleccionados = [...TODOS_TIPOS_NC];
    mostrarInforme = false;
    informeData = null;
    error = null;
  };

  const descargarPDF = async () => {
    if (!vendedorSeleccionado || !fechaDesde || !fechaHasta) {
      error = 'Debe seleccionar un preventista y las fechas';
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('vendedorCodigo', vendedorSeleccionado);
      params.append('fechaDesde', fechaDesde);
      params.append('fechaHasta', fechaHasta);
      params.append('tiposFactura', tiposFacturaSeleccionados.join(','));
      params.append('tiposNotaCredito', tiposNcSeleccionados.join(','));
      if (filtroPagoTipo) params.append('pagoTipo', filtroPagoTipo);

      const response = await fetchWithAuth(`/informes/vendedores/informe-pdf-preventa?${params}`);

      if (!response.ok) {
        throw new Error('Error al generar el PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe-preventista-${vendedorSeleccionado}-${fechaDesde}-${fechaHasta}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error descargando PDF:', err);
      error = err instanceof Error ? err.message : 'Error al descargar el PDF';
    }
  };

  onMount(async () => {
    let savedScroll: number | undefined;
    if (browser) {
      const savedState = navigationState.getState(PAGE_PATH);
      savedScroll = savedState?.scroll;
      const filters = savedState?.filters as {
        vendedorSeleccionado?: string;
        fechaDesde?: string;
        fechaHasta?: string;
        pagoTipo?: string;
        tiposFactura?: string[];
        tiposNotaCredito?: string[];
      } | undefined;
      if (filters?.vendedorSeleccionado) vendedorSeleccionado = filters.vendedorSeleccionado;
      if (filters?.fechaDesde) fechaDesde = filters.fechaDesde;
      if (filters?.fechaHasta) fechaHasta = filters.fechaHasta;
      if (filters?.pagoTipo) filtroPagoTipo = filters.pagoTipo;
      if (Array.isArray(filters?.tiposFactura)) tiposFacturaSeleccionados = filters.tiposFactura;
      if (Array.isArray(filters?.tiposNotaCredito)) tiposNcSeleccionados = filters.tiposNotaCredito;
    }
    await cargarFormasPago();
    try {
      vendedoresLoading = true;
      const vendedoresData = await VendedorService.obtenerVendedoresActivos();
      vendedoresOptions = vendedoresData;
    } catch (err) {
      console.error('Error cargando vendedores:', err);
      error = 'Error al cargar la lista de preventistas';
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
          fechaHasta,
          pagoTipo: filtroPagoTipo,
          tiposFactura: tiposFacturaSeleccionados,
          tiposNotaCredito: tiposNcSeleccionados
        }
      });
    }
  });
</script>

<div class="container mx-auto px-4 py-6">
  <h1 class="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
    <Icon icon={ClipboardList} size={32} strokeWidth={2.5} glass={true} />
    Informe de Ventas por Preventista
  </h1>
  <p class="text-gray-600 mb-6 text-sm max-w-3xl">
    Atribuye cada factura al vendedor de la <strong>preventa</strong> que la originó (no al vendedor
    grabado en la factura). Solo incluye facturas con preventa asociada en el período.
  </p>

  <div class="bg-white p-6 rounded-lg shadow-md mb-6">
    <h2 class="text-xl font-semibold text-gray-700 mb-4">Filtros</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <label for="vendedor" class="block text-sm font-medium text-gray-700 mb-1">
          Preventista <span class="text-red-500">*</span>
        </label>
        <select
          id="vendedor"
          bind:value={vendedorSeleccionado}
          disabled={vendedoresLoading}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Seleccione un preventista...</option>
          {#each vendedoresOptions as vendedor}
            <option value={vendedor.value}>{vendedor.label}</option>
          {/each}
        </select>
        {#if vendedoresLoading}
          <p class="mt-1 text-xs text-gray-500">Cargando...</p>
        {/if}
      </div>

      <div>
        <label for="filtroPagoTipo" class="block text-sm font-medium text-gray-700 mb-1"
          >Forma de pago</label
        >
        <select
          id="filtroPagoTipo"
          bind:value={filtroPagoTipo}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">Todas</option>
          {#each formasPago as fp}
            <option value={fp.value}>{fp.label}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="fechaDesde" class="block text-sm font-medium text-gray-700 mb-1">
          Fecha factura desde <span class="text-red-500">*</span>
        </label>
        <input
          id="fechaDesde"
          type="date"
          bind:value={fechaDesde}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="fechaHasta" class="block text-sm font-medium text-gray-700 mb-1">
          Fecha factura hasta <span class="text-red-500">*</span>
        </label>
        <input
          id="fechaHasta"
          type="date"
          bind:value={fechaHasta}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div>
        <span class="block text-sm font-medium text-gray-700 mb-1">Tipos de factura</span>
        <MultiSelect
          items={TIPOS_FACTURA_OPTIONS}
          bind:selectedValues={tiposFacturaSeleccionados}
          placeholder="Todos los tipos de factura..."
        />
      </div>
      <div>
        <span class="block text-sm font-medium text-gray-700 mb-1">Tipos de nota de crédito</span>
        <MultiSelect
          items={TIPOS_NC_OPTIONS}
          bind:selectedValues={tiposNcSeleccionados}
          placeholder="Todos los tipos de NC..."
        />
      </div>
    </div>

    <div class="flex justify-end space-x-3 mt-6">
      <Button variant="secondary" on:click={limpiarFormulario}>Limpiar</Button>
      {#if mostrarInforme}
        <Button variant="success" on:click={descargarPDF}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Descargar PDF
        </Button>
      {/if}
      <Button
        variant="primary"
        on:click={generarInforme}
        disabled={loading || !vendedorSeleccionado}
      >
        {#if loading}
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
        {/if}
        Generar Informe
      </Button>
    </div>
  </div>

  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {/if}

  {#if mostrarInforme && informeData}
    <div class="space-y-6">
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">
          {informeData.vendedor.descripcion}
        </h2>
        <p class="text-gray-600">
          Período (fecha factura): {informeData.periodo.fechaDesde} - {informeData.periodo.fechaHasta}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-green-50 p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 class="text-sm font-medium text-green-800 uppercase">Facturas</h3>
          <p class="text-3xl font-bold text-green-900 mt-2">
            {informeData.totales.facturas.importe.toLocaleString('es-AR', {
              style: 'currency',
              currency: 'ARS'
            })}
          </p>
          <p class="text-sm text-green-700 mt-1">
            {informeData.totales.facturas.cantidad} comprobante{informeData.totales.facturas
              .cantidad !== 1
              ? 's'
              : ''}
          </p>
        </div>

        <div class="bg-red-50 p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <h3 class="text-sm font-medium text-red-800 uppercase">Notas de Crédito</h3>
          <p class="text-3xl font-bold text-red-900 mt-2">
            {informeData.totales.notasCredito.importe.toLocaleString('es-AR', {
              style: 'currency',
              currency: 'ARS'
            })}
          </p>
          <p class="text-sm text-red-700 mt-1">
            {informeData.totales.notasCredito.cantidad} comprobante{informeData.totales.notasCredito
              .cantidad !== 1
              ? 's'
              : ''}
          </p>
        </div>

        <div class="bg-blue-50 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 class="text-sm font-medium text-blue-800 uppercase">Total Neto</h3>
          <p class="text-3xl font-bold text-blue-900 mt-2">
            {informeData.totales.general.toLocaleString('es-AR', {
              style: 'currency',
              currency: 'ARS'
            })}
          </p>
          <p class="text-sm text-blue-700 mt-1">Total de ventas - NC</p>
        </div>
      </div>

      {#if informeData.facturas.length > 0}
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-xl font-semibold text-gray-800 mb-4">Facturas</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >Tipo</th
                  >
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >Número</th
                  >
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >Fecha</th
                  >
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >Cliente</th
                  >
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >Preventa</th
                  >
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >Vend. factura</th
                  >
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"
                    >Importe</th
                  >
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each informeData.facturas as factura}
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{factura.tipo}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900"
                      >{factura.numero}</td
                    >
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{factura.fecha}</td>
                    <td class="px-4 py-3 text-sm text-gray-900">
                      <div class="font-medium">{factura.clienteDescripcion}</div>
                      <div class="text-xs text-gray-500">{factura.clienteCodigo}</div>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600"
                      >{factura.preventa?.label || '—'}</td
                    >
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {factura.vendedorFactura || '—'}
                      {#if factura.vendedorFactura && factura.vendedorFactura !== informeData.vendedor.codigo}
                        <span class="text-amber-600 text-xs block">≠ preventista</span>
                      {/if}
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-green-600">
                      {factura.importe.toLocaleString('es-AR', {
                        style: 'currency',
                        currency: 'ARS'
                      })}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}

      {#if informeData.notasCredito.length > 0}
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-xl font-semibold text-gray-800 mb-4">Notas de Crédito</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >Tipo</th
                  >
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >Número</th
                  >
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >Fecha</th
                  >
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >Cliente</th
                  >
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >Factura Relacionada</th
                  >
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"
                    >Importe</th
                  >
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
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600"
                      >{nc.facturaRelacionada}</td
                    >
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-red-600">
                      {nc.importe.toLocaleString('es-AR', {
                        style: 'currency',
                        currency: 'ARS'
                      })}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}

      {#if informeData.facturas.length === 0 && informeData.notasCredito.length === 0}
        <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          <p>
            No se encontraron facturas con preventa de este preventista en el período seleccionado.
          </p>
        </div>
      {/if}
    </div>
  {/if}
</div>
