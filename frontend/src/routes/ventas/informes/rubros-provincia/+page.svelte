<script lang="ts">
  import { onMount } from 'svelte';
  import { beforeNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import DatePicker from '$lib/components/DatePicker.svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { navigationState } from '$lib/stores/navigationState';
  import { Download, MapPinned, RefreshCw, Table2 } from 'lucide-svelte';
  import Icon from '$lib/components/ui/Icon.svelte';

  const PAGE_PATH = '/ventas/informes/rubros-provincia';

  interface TotalesIva {
    ri105: number;
    ri21: number;
    rm105: number;
    rm21: number;
    otros105: number;
    otros21: number;
    total: number;
    cantidadTotal: number;
  }

  interface RubroProvincia extends TotalesIva {
    codigo: string;
    descripcion: string;
  }

  interface ProvinciaInforme {
    codigo: string;
    descripcion: string;
    rubros: RubroProvincia[];
    subtotales: TotalesIva;
  }

  interface InformeRubrosProvincia {
    provincias: ProvinciaInforme[];
    totales: TotalesIva;
    totalVentas: number;
    titulo?: string;
    tipoInforme?: 'facturas' | 'notasCredito';
    periodo: {
      fechaDesde: string;
      fechaHasta: string;
    };
  }

  let fechaDesde: Date = new Date();
  let fechaHasta: Date = new Date();
  let tipoComprobante: 'facturas' | 'notasCredito' = 'facturas';
  let filtroPagoTipo = '';
  let formasPago: { value: string; label: string }[] = [];
  let datosInforme: InformeRubrosProvincia | null = null;
  let loading = false;
  let error: string | null = null;

  function inicializarPeriodoMesActual() {
    const hoy = new Date();
    fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    fechaHasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  }

  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(valor || 0);
  }

  function formatearNumero(valor: number): string {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor || 0);
  }

  function totalRubros(): number {
    return datosInforme?.provincias.reduce((total, provincia) => total + provincia.rubros.length, 0) || 0;
  }

  function tituloInforme(): string {
    return tipoComprobante === 'notasCredito'
      ? 'Notas de Crédito por Rubro y Provincia'
      : 'Ventas por Rubro y Provincia';
  }

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

  async function cargarInforme() {
    if (!fechaDesde || !fechaHasta) {
      error = 'Debe seleccionar fecha desde y fecha hasta';
      return;
    }

    try {
      loading = true;
      error = null;

      const params = new URLSearchParams({
        fechaDesde: formatDate(fechaDesde),
        fechaHasta: formatDate(fechaHasta),
        tipo: tipoComprobante
      });
      if (filtroPagoTipo && tipoComprobante === 'facturas') params.append('pagoTipo', filtroPagoTipo);

      const response = await fetchWithAuth(`/informes/ventas-rubros-provincia?${params}`);
      if (!response.ok) {
        throw new Error('Error al cargar el informe');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Error en el servidor');
      }

      datosInforme = result.data;
    } catch (err) {
      console.error('Error cargando informe por provincia:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
      datosInforme = null;
    } finally {
      loading = false;
    }
  }

  async function descargarPDF() {
    if (!fechaDesde || !fechaHasta) {
      error = 'Debe seleccionar fecha desde y fecha hasta';
      return;
    }

    try {
      error = null;
      const fechaDesdeParam = formatDate(fechaDesde);
      const fechaHastaParam = formatDate(fechaHasta);
      const params = new URLSearchParams({
        fechaDesde: fechaDesdeParam,
        fechaHasta: fechaHastaParam,
        tipo: tipoComprobante
      });
      if (filtroPagoTipo && tipoComprobante === 'facturas') params.append('pagoTipo', filtroPagoTipo);

      const response = await fetchWithAuth(`/informes/ventas-rubros-provincia/pdf?${params}`);
      if (!response.ok) {
        throw new Error('Error al generar el PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const prefijo = tipoComprobante === 'notasCredito' ? 'notas-credito-rubros-provincia' : 'ventas-rubros-provincia';
      a.download = `${prefijo}-${fechaDesdeParam}-${fechaHastaParam}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error descargando PDF:', err);
      error = err instanceof Error ? err.message : 'Error al descargar el PDF';
    }
  }

  function limpiarFiltros() {
    inicializarPeriodoMesActual();
    filtroPagoTipo = '';
    tipoComprobante = 'facturas';
    datosInforme = null;
    error = null;
  }

  onMount(async () => {
    inicializarPeriodoMesActual();

    let savedScroll: number | undefined;
    if (browser) {
      const savedState = navigationState.getState(PAGE_PATH);
      savedScroll = savedState?.scroll;
      const filters = savedState?.filters as {
        fechaDesde?: string;
        fechaHasta?: string;
        pagoTipo?: string;
        tipoComprobante?: 'facturas' | 'notasCredito';
      } | undefined;

      if (filters?.fechaDesde) fechaDesde = new Date(filters.fechaDesde);
      if (filters?.fechaHasta) fechaHasta = new Date(filters.fechaHasta);
      if (filters?.pagoTipo) filtroPagoTipo = filters.pagoTipo;
      if (filters?.tipoComprobante) tipoComprobante = filters.tipoComprobante;
    }

    await cargarFormasPago();

    if (browser && navigationState.getState(PAGE_PATH)?.filters) {
      await cargarInforme();
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
          fechaDesde: formatDate(fechaDesde),
          fechaHasta: formatDate(fechaHasta),
          pagoTipo: filtroPagoTipo,
          tipoComprobante
        }
      });
    }
  });
</script>

<svelte:head>
  <title>{tituloInforme()}</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
        <Icon icon={MapPinned} size={32} strokeWidth={2.5} glass={true} />
        {tituloInforme()}
      </h1>
      <p class="text-gray-600 mt-2">Importes por rubro separados por provincia, categoria IVA y alicuota. Solo comprobantes con CAE.</p>
    </div>
  </div>

  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h2 class="text-lg font-semibold mb-4">Filtros</h2>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      <div>
        <label for="tipoComprobante" class="block text-sm font-medium text-gray-700 mb-2">Tipo de comprobante</label>
        <select
          id="tipoComprobante"
          bind:value={tipoComprobante}
          onchange={() => {
            if (tipoComprobante === 'notasCredito') filtroPagoTipo = '';
          }}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="facturas">Facturas</option>
          <option value="notasCredito">Notas de Crédito</option>
        </select>
      </div>
      <div>
        <label for="fechaDesde" class="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
        <DatePicker id="fechaDesde" bind:value={fechaDesde} />
      </div>
      <div>
        <label for="fechaHasta" class="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label>
        <DatePicker id="fechaHasta" bind:value={fechaHasta} />
      </div>
      <div>
        <label for="filtroPagoTipo" class="block text-sm font-medium text-gray-700 mb-2">Forma de pago</label>
        <select
          id="filtroPagoTipo"
          bind:value={filtroPagoTipo}
          disabled={tipoComprobante === 'notasCredito'}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">Todas</option>
          {#each formasPago as formaPago}
            <option value={formaPago.value}>{formaPago.label}</option>
          {/each}
        </select>
        {#if tipoComprobante === 'notasCredito'}
          <p class="mt-1 text-xs text-gray-500">No aplica para notas de crédito.</p>
        {/if}
      </div>
    </div>

    <div class="flex justify-end gap-3">
      <button
        type="button"
        onclick={limpiarFiltros}
        disabled={loading}
        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
      >
        Limpiar
      </button>
      <button
        type="button"
        onclick={descargarPDF}
        disabled={loading}
        class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 flex items-center gap-2"
      >
        <Icon icon={Download} size={16} />
        Descargar PDF
      </button>
      <button
        type="button"
        onclick={cargarInforme}
        disabled={loading}
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
      >
        {#if loading}
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Buscando...
        {:else}
          <Icon icon={RefreshCw} size={16} />
          Generar informe
        {/if}
      </button>
    </div>
  </div>

  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      {error}
    </div>
  {/if}

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  {:else if datosInforme}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
        <p class="text-blue-100 text-sm font-medium">Provincias</p>
        <p class="text-3xl font-bold">{datosInforme.provincias.length}</p>
      </div>
      <div class="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
        <p class="text-indigo-100 text-sm font-medium">Rubros informados</p>
        <p class="text-3xl font-bold">{totalRubros()}</p>
      </div>
      <div class="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
        <p class="text-green-100 text-sm font-medium">
          {tipoComprobante === 'notasCredito' ? 'Total notas de crédito' : 'Total ventas'}
        </p>
        <p class="text-3xl font-bold">{formatearMoneda(datosInforme.totalVentas)}</p>
      </div>
    </div>

    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Icon icon={Table2} size={20} strokeWidth={2.5} glass={true} />
        Detalle por provincia
      </h2>

      {#if datosInforme.provincias.length === 0}
        <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          No se encontraron comprobantes con CAE para el periodo seleccionado.
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
              <tr class="border-b border-gray-200">
                <th class="px-3 py-3 text-left font-semibold text-gray-700">Provincia / Rubro</th>
                <th class="px-3 py-3 text-right font-semibold text-gray-700">R.I. 10.5%</th>
                <th class="px-3 py-3 text-right font-semibold text-gray-700">R.I. 21%</th>
                <th class="px-3 py-3 text-right font-semibold text-gray-700">R.M. 10.5%</th>
                <th class="px-3 py-3 text-right font-semibold text-gray-700">R.M. 21%</th>
                <th class="px-3 py-3 text-right font-semibold text-gray-700">Otros 10.5%</th>
                <th class="px-3 py-3 text-right font-semibold text-gray-700">Otros 21%</th>
                <th class="px-3 py-3 text-right font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {#each datosInforme.provincias as provincia}
                <tr class="bg-slate-100 border-t border-slate-200">
                  <td class="px-3 py-3 font-bold text-slate-900" colspan="8">
                    {provincia.descripcion}
                  </td>
                </tr>
                {#each provincia.rubros as rubro}
                  <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="px-3 py-2">
                      <div class="font-medium text-gray-900">{rubro.descripcion}</div>
                      <div class="text-xs text-gray-500">{rubro.codigo}</div>
                    </td>
                    <td class="px-3 py-2 text-right tabular-nums">{formatearNumero(rubro.ri105)}</td>
                    <td class="px-3 py-2 text-right tabular-nums">{formatearNumero(rubro.ri21)}</td>
                    <td class="px-3 py-2 text-right tabular-nums">{formatearNumero(rubro.rm105)}</td>
                    <td class="px-3 py-2 text-right tabular-nums">{formatearNumero(rubro.rm21)}</td>
                    <td class="px-3 py-2 text-right tabular-nums">{formatearNumero(rubro.otros105)}</td>
                    <td class="px-3 py-2 text-right tabular-nums">{formatearNumero(rubro.otros21)}</td>
                    <td class="px-3 py-2 text-right tabular-nums font-semibold">{formatearNumero(rubro.total)}</td>
                  </tr>
                {/each}
                <tr class="bg-slate-50 border-b-2 border-slate-200 font-semibold">
                  <td class="px-3 py-2 text-right">Sub-Total:</td>
                  <td class="px-3 py-2 text-right tabular-nums">{formatearNumero(provincia.subtotales.ri105)}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{formatearNumero(provincia.subtotales.ri21)}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{formatearNumero(provincia.subtotales.rm105)}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{formatearNumero(provincia.subtotales.rm21)}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{formatearNumero(provincia.subtotales.otros105)}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{formatearNumero(provincia.subtotales.otros21)}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{formatearNumero(provincia.subtotales.total)}</td>
                </tr>
              {/each}
            </tbody>
            <tfoot>
              <tr class="bg-gray-900 text-white font-bold">
                <td class="px-3 py-3 text-right">Totales:</td>
                <td class="px-3 py-3 text-right tabular-nums">{formatearNumero(datosInforme.totales.ri105)}</td>
                <td class="px-3 py-3 text-right tabular-nums">{formatearNumero(datosInforme.totales.ri21)}</td>
                <td class="px-3 py-3 text-right tabular-nums">{formatearNumero(datosInforme.totales.rm105)}</td>
                <td class="px-3 py-3 text-right tabular-nums">{formatearNumero(datosInforme.totales.rm21)}</td>
                <td class="px-3 py-3 text-right tabular-nums">{formatearNumero(datosInforme.totales.otros105)}</td>
                <td class="px-3 py-3 text-right tabular-nums">{formatearNumero(datosInforme.totales.otros21)}</td>
                <td class="px-3 py-3 text-right tabular-nums">{formatearNumero(datosInforme.totales.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      {/if}
    </div>
  {:else}
    <div class="text-center py-12 bg-white rounded-xl border border-gray-200">
      <Icon icon={MapPinned} size={64} strokeWidth={2} glass={true} />
      <h3 class="text-xl font-semibold text-gray-900 mt-4 mb-2">Selecciona un rango de fechas</h3>
      <p class="text-gray-600">Genera el informe para ver las ventas por rubro agrupadas por provincia.</p>
    </div>
  {/if}
</div>

<style>
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
