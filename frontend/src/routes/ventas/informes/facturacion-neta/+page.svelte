<script lang="ts">
  import { onMount } from 'svelte';
  import { beforeNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import FechaCampos from '$lib/components/ui/FechaCampos.svelte';
  import RangosFecha from '$lib/components/ui/RangosFecha.svelte';
  import { aISOFecha, deISOFecha } from '$lib/utils/fechaCampos';
  import { rangoFecha } from '$lib/utils/rangosFecha';
  import Button from '$lib/components/ui/Button.svelte';
  import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
  import Chart from '$lib/components/Chart.svelte';
  import { PieChart, TrendingUp, FileText } from 'lucide-svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { navigationState } from '$lib/stores/navigationState';

  const PAGE_PATH = '/ventas/informes/facturacion-neta';

  let loading = false;
  let error: string | null = null;
  let datos: any = null;

  const periodoInicial = rangoFecha('mes_actual');
  let fechaDesde: Date = periodoInicial.desde;
  let fechaHasta: Date = periodoInicial.hasta;
  let agruparPor: 'dia' | 'semana' | 'mes' = 'dia';
  let filtroPagoTipo = '';
  let formasPago: { value: string; label: string }[] = [];
  let localidades: { value: string; label: string }[] = [];
  let localidadesSeleccionadas: string[] = [];

  // Filtros con los que se armó el informe visible, para avisar cuando cambian
  let filtrosBuscados: string | null = null;
  let agruparPorBuscado: 'dia' | 'semana' | 'mes' = 'dia';

  function firmaFiltros(
    desde: Date,
    hasta: Date,
    agrupar: string,
    pago: string,
    locs: string[]
  ): string {
    return JSON.stringify([
      aISOFecha(desde),
      aISOFecha(hasta),
      agrupar,
      pago,
      [...locs].sort()
    ]);
  }

  $: filtrosActuales = firmaFiltros(fechaDesde, fechaHasta, agruparPor, filtroPagoTipo, localidadesSeleccionadas);
  $: filtrosPendientes = filtrosBuscados !== null && filtrosActuales !== filtrosBuscados;

  async function cargarLocalidades() {
    try {
      const response = await fetchWithAuth('/clientes/localidades');
      if (!response.ok) return;
      const result: string[] = await response.json();
      localidades = (result || []).map((nombre) => ({ value: nombre, label: nombre }));
    } catch (err) {
      console.error('Error cargando localidades:', err);
      localidades = [];
    }
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

  onMount(async () => {
    let savedScroll: number | undefined;
    if (browser) {
      const savedState = navigationState.getState(PAGE_PATH);
      savedScroll = savedState?.scroll;
      const filters = savedState?.filters as {
        fechaDesde?: string;
        fechaHasta?: string;
        agruparPor?: 'dia' | 'semana' | 'mes';
        pagoTipo?: string;
        localidades?: string[];
      } | undefined;
      if (filters?.pagoTipo) filtroPagoTipo = filters.pagoTipo;
      if (Array.isArray(filters?.localidades)) localidadesSeleccionadas = filters.localidades;
      fechaDesde = deISOFecha(filters?.fechaDesde ?? '') ?? fechaDesde;
      fechaHasta = deISOFecha(filters?.fechaHasta ?? '', fechaHasta) ?? fechaHasta;
      if (filters?.agruparPor) agruparPor = filters.agruparPor;
    }
    await Promise.all([cargarFormasPago(), cargarLocalidades()]);
    await cargarDatos();
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
          fechaDesde: aISOFecha(fechaDesde),
          fechaHasta: aISOFecha(fechaHasta),
          agruparPor,
          pagoTipo: filtroPagoTipo,
          localidades: localidadesSeleccionadas
        }
      });
    }
  });

  async function cargarDatos() {
    try {
      loading = true;
      error = null;
      filtrosBuscados = firmaFiltros(fechaDesde, fechaHasta, agruparPor, filtroPagoTipo, localidadesSeleccionadas);

      const params = new URLSearchParams({
        fechaDesde: aISOFecha(fechaDesde),
        fechaHasta: aISOFecha(fechaHasta),
        agruparPor: agruparPor
      });
      if (filtroPagoTipo) params.append('pagoTipo', filtroPagoTipo);
      for (const localidad of localidadesSeleccionadas) params.append('localidad', localidad);

      const response = await fetchWithAuth(`/informes/facturacion-neta?${params}`);

      if (!response.ok) {
        throw new Error('Error al cargar los datos');
      }

      const result = await response.json();

      if (result.success) {
        datos = result.data;
        agruparPorBuscado = params.get('agruparPor') as 'dia' | 'semana' | 'mes';
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

  function formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(valor);
  }

  function getColorTipo(tipo: string): string {
    const colores: Record<string, string> = {
      FCA: '#3B82F6',
      FCB: '#10B981',
      FCC: '#F59E0B',
      NCA: '#EF4444',
      NCB: '#8B5CF6',
      NCF: '#F97316'
    };
    return colores[tipo] || '#6B7280';
  }
</script>

<svelte:head>
  <title>Facturación neta</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
        <Icon icon={PieChart} size={32} strokeWidth={2.5} glass={true} />
        Facturación neta
      </h1>
      <p class="text-gray-600 mt-2">
        Ventas del período menos notas de crédito asociadas a esas facturas
      </p>
    </div>

  </div>

  <div
    class="bg-white p-6 rounded-xl shadow-sm border transition-colors {filtrosPendientes
      ? 'border-amber-400'
      : 'border-gray-200'}"
  >
    <h2 class="text-lg font-semibold mb-4">Filtros</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="md:col-span-3">
        <p class="block text-sm font-medium text-gray-700 mb-2">Período</p>
        <RangosFecha bind:desde={fechaDesde} bind:hasta={fechaHasta} className="mb-3" />
        <div class="flex flex-wrap items-end gap-2">
          <div>
            <label for="fechaDesde" class="mb-1 block text-xs text-gray-500">Desde</label>
            <FechaCampos id="fechaDesde" bind:value={fechaDesde} ariaLabel="Fecha desde" />
          </div>
          <span class="mb-2 select-none text-gray-300" aria-hidden="true">→</span>
          <div>
            <label for="fechaHasta" class="mb-1 block text-xs text-gray-500">Hasta</label>
            <FechaCampos id="fechaHasta" bind:value={fechaHasta} ariaLabel="Fecha hasta" />
          </div>
        </div>
      </div>
      <div>
        <label for="filtroPagoTipo" class="block text-sm font-medium text-gray-700 mb-2">Forma de pago</label>
        <select
          id="filtroPagoTipo"
          bind:value={filtroPagoTipo}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Todas</option>
          {#each formasPago as fp}
            <option value={fp.value}>{fp.label}</option>
          {/each}
        </select>
      </div>
      <div role="group" aria-labelledby="localidades-label">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label id="localidades-label" class="block text-sm font-medium text-gray-700 mb-2">Localidad</label>
        <MultiSelect
          items={localidades}
          bind:selectedValues={localidadesSeleccionadas}
          placeholder="Todas las localidades..."
        />
      </div>
      <div>
        <label for="agruparPor" class="block text-sm font-medium text-gray-700 mb-2">Agrupar</label>
        <select
          id="agruparPor"
          bind:value={agruparPor}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="dia">Por Día</option>
          <option value="semana">Por Semana</option>
          <option value="mes">Por Mes</option>
        </select>
      </div>
    </div>
    <div class="mt-4 flex flex-wrap items-center justify-end gap-3">
      {#if filtrosPendientes}
        <p class="text-sm font-medium text-amber-700">
          Cambiaste los filtros. Presioná Buscar para actualizar el informe.
        </p>
      {/if}
      <Button
        variant="primary"
        on:click={cargarDatos}
        disabled={loading}
        className={filtrosPendientes ? 'ring-4 ring-amber-400 animate-pulse' : ''}
      >
        {loading ? 'Buscando...' : 'Buscar'}
      </Button>
    </div>
  </div>

  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      <p>{error}</p>
    </div>
  {/if}

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  {:else if datos}
    {#if datos.observacion?.cantidad > 0}
      <div class="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-4 rounded-xl">
        <p class="font-semibold">
          Observación: hay {datos.observacion.cantidad}
          {datos.observacion.cantidad === 1 ? 'nota de crédito' : 'notas de crédito'}
          del período sin asociar a facturas de este rango
          ({formatearMoneda(datos.observacion.importe)}).
        </p>
        <p class="text-sm mt-1 text-amber-800">
          No se descontaron del neto. Revisá si faltan vincular o si la factura origen está fuera de las fechas.
        </p>
        <div class="overflow-x-auto mt-3">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-amber-200">
                <th class="text-left py-2 pr-3">Número</th>
                <th class="text-left py-2 pr-3">Fecha</th>
                <th class="text-left py-2 pr-3">Cliente</th>
                <th class="text-left py-2 pr-3">Motivo</th>
                <th class="text-right py-2">Monto</th>
              </tr>
            </thead>
            <tbody>
              {#each datos.observacion.notas as nc}
                <tr class="border-b border-amber-100">
                  <td class="py-2 pr-3">{nc.numero}</td>
                  <td class="py-2 pr-3">{new Date(nc.fecha).toLocaleDateString('es-AR')}</td>
                  <td class="py-2 pr-3">{nc.cliente}</td>
                  <td class="py-2 pr-3">
                    {nc.motivo === 'factura_fuera_periodo'
                      ? 'Factura origen fuera del período'
                      : 'Sin factura origen'}
                  </td>
                  <td class="py-2 text-right font-medium">{formatearMoneda(nc.monto)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
        <p class="text-blue-100 text-sm font-medium">Total Facturas</p>
        <p class="text-3xl font-bold">{datos.estadisticasGenerales.totalFacturas}</p>
      </div>
      <div class="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
        <p class="text-green-100 text-sm font-medium">Ventas brutas</p>
        <p class="text-3xl font-bold">{formatearMoneda(datos.estadisticasGenerales.totalVentas)}</p>
      </div>
      <div class="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
        <p class="text-red-100 text-sm font-medium">NC asociadas</p>
        <p class="text-3xl font-bold">{formatearMoneda(datos.estadisticasGenerales.totalNotasCredito)}</p>
        <p class="text-red-100 text-sm mt-1">{datos.estadisticasGenerales.cantidadNotasCredito} notas</p>
      </div>
      <div class="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white p-6 rounded-xl shadow-lg">
        <p class="text-emerald-100 text-sm font-medium">Ventas netas</p>
        <p class="text-3xl font-bold">{formatearMoneda(datos.estadisticasGenerales.totalVentasNetas)}</p>
      </div>
      <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
        <p class="text-purple-100 text-sm font-medium">Promedio Ticket</p>
        <p class="text-3xl font-bold">{formatearMoneda(datos.estadisticasGenerales.promedioTicket)}</p>
      </div>
      <div class="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
        <p class="text-orange-100 text-sm font-medium">IVA neto</p>
        <p class="text-3xl font-bold">{formatearMoneda(datos.estadisticasGenerales.totalIva)}</p>
      </div>
    </div>

    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 class="text-xl font-semibold mb-6">Evolución de ventas netas</h2>
      {#if datos.evolucionVentas && datos.evolucionVentas.length > 0}
        {@const chartData = {
          labels: datos.evolucionVentas.map((item: any) => {
            if (agruparPorBuscado === 'dia') {
              return new Date(item.periodo).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
            } else if (agruparPorBuscado === 'semana') {
              return `Sem ${item.periodo.split('-W')[1]}`;
            } else {
              return new Date(item.periodo + '-01').toLocaleDateString('es-AR', { month: 'short' });
            }
          }),
          datasets: [{
            label: 'Ventas netas ($)',
            data: datos.evolucionVentas.map((item: any) => item.monto),
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false,
          }]
        }}

        {@const chartOptions = {
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  const item = datos.evolucionVentas[context.dataIndex];
                  if (item) {
                    return [
                      `Neto: ${formatearMoneda(context.parsed.y)}`,
                      `Facturas: ${item.cantidad}`,
                      `Fecha: ${item.periodo}`
                    ];
                  }
                  return `Neto: ${formatearMoneda(context.parsed.y)}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  if (typeof value === 'number') {
                    return formatearMoneda(value);
                  }
                  return value;
                }
              }
            }
          }
        }}

        <Chart data={chartData} type="bar" options={chartOptions} height="400px" />
      {:else}
        <div class="h-80 flex items-center justify-center text-gray-500">
          <div class="text-center">
            <div class="mb-4">
              <Icon icon={TrendingUp} size={40} strokeWidth={2} glass={true} />
            </div>
            <p>No hay datos de evolución para el período seleccionado</p>
          </div>
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 class="text-xl font-semibold mb-6">Distribución por Tipo (neto)</h2>
        <div class="space-y-4">
          {#each datos.agrupacionPorTipo as item}
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="w-4 h-4 rounded-full"
                  style="background-color: {getColorTipo(item.tipo)}"
                ></div>
                <span class="font-medium">{item.tipo}</span>
              </div>
              <div class="text-right">
                <div class="font-semibold">{formatearMoneda(item.monto)}</div>
                <div class="text-sm text-gray-500">{item.cantidad} facturas</div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 class="text-xl font-semibold mb-6">Top Vendedores (neto)</h2>
        <div class="space-y-4">
          {#each datos.agrupacionPorVendedor.slice(0, 5) as vendedor, i}
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {i + 1}
                </div>
                <div>
                  <div class="font-medium">{vendedor.nombre}</div>
                  <div class="text-sm text-gray-500">{vendedor.cantidad} ventas</div>
                </div>
              </div>
              <div class="text-right font-semibold">
                {formatearMoneda(vendedor.monto)}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 class="text-xl font-semibold mb-6">Top 10 Clientes (neto)</h2>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 font-semibold">#</th>
              <th class="text-left py-3 px-4 font-semibold">Cliente</th>
              <th class="text-right py-3 px-4 font-semibold">Cantidad</th>
              <th class="text-right py-3 px-4 font-semibold">Total neto</th>
            </tr>
          </thead>
          <tbody>
            {#each datos.agrupacionPorCliente as cliente, i}
              <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-3 px-4">
                  <div class="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {i + 1}
                  </div>
                </td>
                <td class="py-3 px-4 font-medium">{cliente.nombre}</td>
                <td class="py-3 px-4 text-right text-gray-600">{cliente.cantidad}</td>
                <td class="py-3 px-4 text-right font-semibold">{formatearMoneda(cliente.monto)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 class="text-xl font-semibold mb-6 flex items-center gap-2">
          <Icon icon={FileText} size={20} strokeWidth={2.5} glass={true} />
          Resumen financiero
        </h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Ventas:</span>
            <span class="font-semibold">{formatearMoneda(datos.estadisticasGenerales.totalVentas)}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">NC asociadas:</span>
            <span class="font-semibold text-red-600">-{formatearMoneda(datos.estadisticasGenerales.totalNotasCredito)}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">IVA neto:</span>
            <span class="font-semibold text-blue-600">{formatearMoneda(datos.estadisticasGenerales.totalIva)}</span>
          </div>
          <hr class="border-gray-200">
          <div class="flex justify-between items-center text-lg font-bold">
            <span>Total neto:</span>
            <span class="text-green-600">{formatearMoneda(datos.estadisticasGenerales.totalVentasNetas)}</span>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 class="text-xl font-semibold mb-6">NC asociadas</h2>
        {#if datos.notasCredito?.length}
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-2 px-3 font-semibold">Número</th>
                  <th class="text-left py-2 px-3 font-semibold">Fecha</th>
                  <th class="text-left py-2 px-3 font-semibold">Factura origen</th>
                  <th class="text-right py-2 px-3 font-semibold">Monto</th>
                </tr>
              </thead>
              <tbody>
                {#each datos.notasCredito.slice(-10).reverse() as nc}
                  <tr class="border-b border-gray-100">
                    <td class="py-2 px-3">
                      <span
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        style="background-color: {getColorTipo(nc.tipo)}20; color: {getColorTipo(nc.tipo)}"
                      >
                        {nc.numero}
                      </span>
                    </td>
                    <td class="py-2 px-3 text-gray-600">{new Date(nc.fecha).toLocaleDateString('es-AR')}</td>
                    <td class="py-2 px-3 text-gray-600">{nc.facturaOrigen}</td>
                    <td class="py-2 px-3 text-right font-semibold text-red-600">-{formatearMoneda(nc.monto)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <p class="text-gray-500 text-sm">No hay notas de crédito asociadas a facturas de este período.</p>
        {/if}
      </div>
    </div>

    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 class="text-xl font-semibold mb-6">Facturas recientes</h2>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 font-semibold">Número</th>
              <th class="text-left py-3 px-4 font-semibold">Fecha</th>
              <th class="text-left py-3 px-4 font-semibold">Cliente</th>
              <th class="text-left py-3 px-4 font-semibold">Vendedor</th>
              <th class="text-right py-3 px-4 font-semibold">Monto</th>
            </tr>
          </thead>
          <tbody>
            {#each datos.facturas.slice(-10).reverse() as factura}
              <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-3 px-4">
                  <span
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    style="background-color: {getColorTipo(factura.tipo)}20; color: {getColorTipo(factura.tipo)}"
                  >
                    {factura.numero}
                  </span>
                </td>
                <td class="py-3 px-4 text-gray-600">{new Date(factura.fecha).toLocaleDateString('es-AR')}</td>
                <td class="py-3 px-4 font-medium">{factura.cliente}</td>
                <td class="py-3 px-4 text-gray-600">{factura.vendedor}</td>
                <td class="py-3 px-4 text-right font-semibold">{formatearMoneda(factura.monto)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {:else if !loading}
    <div class="text-center py-12">
      <div class="mb-4">
        <Icon icon={PieChart} size={64} strokeWidth={2} glass={true} />
      </div>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">Seleccioná un rango de fechas</h3>
      <p class="text-gray-600">Para ver el informe neto, elegí las fechas de inicio y fin.</p>
    </div>
  {/if}
</div>
