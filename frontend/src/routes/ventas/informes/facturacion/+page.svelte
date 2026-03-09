<script lang="ts">
  import { onMount } from 'svelte';
  import { beforeNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import DatePicker from '$lib/components/DatePicker.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Chart from '$lib/components/Chart.svelte';
  import { formatDate } from '$lib/utils/dateUtils';
  import { PieChart, TrendingUp, FileText } from 'lucide-svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { navigationState } from '$lib/stores/navigationState';

  const PAGE_PATH = '/ventas/informes/facturacion';

  // Estado
  let loading = false;
  let error: string | null = null;
  let datos: any = null;

  // Filtros
  let fechaDesde = new Date();
  let fechaHasta = new Date();
  let agruparPor: 'dia' | 'semana' | 'mes' = 'dia';

  // Inicializar fechas al mes actual
  onMount(async () => {
    let savedScroll: number | undefined;
    if (browser) {
      const savedState = navigationState.getState(PAGE_PATH);
      savedScroll = savedState?.scroll;
      const filters = savedState?.filters as { fechaDesde?: string; fechaHasta?: string; agruparPor?: 'dia' | 'semana' | 'mes' } | undefined;
      if (filters?.fechaDesde) fechaDesde = new Date(filters.fechaDesde);
      else {
        const hoy = new Date();
        fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      }
      if (filters?.fechaHasta) fechaHasta = new Date(filters.fechaHasta);
      else {
        const hoy = new Date();
        fechaHasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      }
      if (filters?.agruparPor) agruparPor = filters.agruparPor;
    } else {
      const hoy = new Date();
      fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      fechaHasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    }
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
          fechaDesde: fechaDesde.toISOString().split('T')[0],
          fechaHasta: fechaHasta.toISOString().split('T')[0],
          agruparPor
        }
      });
    }
  });

  // Función para cargar datos
  async function cargarDatos() {
    try {
      loading = true;
      error = null;

      const params = new URLSearchParams({
        fechaDesde: fechaDesde.toISOString().split('T')[0],
        fechaHasta: fechaHasta.toISOString().split('T')[0],
        agruparPor: agruparPor
      });

      const response = await fetchWithAuth(`/informes/facturacion?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar los datos');
      }

      const result = await response.json();
      
      if (result.success) {
        datos = result.data;
        console.log("Datos recibidos:", datos);
        console.log("Evolución de ventas:", datos.evolucionVentas);
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

  // Función para formatear moneda
  function formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(valor);
  }

  // Función para obtener color según el tipo de documento
  function getColorTipo(tipo: string): string {
    const colores: Record<string, string> = {
      'FCA': '#3B82F6', // Azul
      'FCB': '#10B981', // Verde
      'FCC': '#F59E0B', // Amarillo
      'NCA': '#EF4444', // Rojo
      'NCB': '#8B5CF6', // Púrpura
      'NCC': '#F97316'  // Naranja
    };
    return colores[tipo] || '#6B7280';
  }

  // Función para obtener porcentaje de crecimiento
  function calcularCrecimiento(actual: number, anterior: number): number {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return ((actual - anterior) / anterior) * 100;
  }

  // Reactive statement para cargar datos cuando cambien los filtros
  $: if (fechaDesde && fechaHasta) {
    cargarDatos();
  }
</script>

<svelte:head>
  <title>Informe de Facturación</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
  <!-- Encabezado -->
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
        <Icon icon={PieChart} size={32} strokeWidth={2.5} glass={true} />
        Informe de Facturación
      </h1>
      <p class="text-gray-600 mt-2">Análisis completo de ventas y facturación</p>
    </div>
    
    <div class="flex flex-col sm:flex-row gap-3">
      <select 
        bind:value={agruparPor}
        class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="dia">Por Día</option>
        <option value="semana">Por Semana</option>
        <option value="mes">Por Mes</option>
      </select>
      
      <Button variant="primary" on:click={cargarDatos} disabled={loading}>
        {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
      </Button>
    </div>
  </div>

  <!-- Filtros -->
  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h2 class="text-lg font-semibold mb-4">📅 Filtros de Fecha</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="fechaDesde" class="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
        <DatePicker id="fechaDesde" bind:value={fechaDesde} />
      </div>
      <div>
        <label for="fechaHasta" class="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label>
        <DatePicker id="fechaHasta" bind:value={fechaHasta} />
      </div>
    </div>
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
            <p class="text-blue-100 text-sm font-medium">Total Facturas</p>
            <p class="text-3xl font-bold">{datos.estadisticasGenerales.totalFacturas}</p>
          </div>
          <div class="text-4xl">📄</div>
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
            <p class="text-purple-100 text-sm font-medium">Promedio Ticket</p>
            <p class="text-3xl font-bold">{formatearMoneda(datos.estadisticasGenerales.promedioTicket)}</p>
          </div>
          <div class="text-4xl">🎫</div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-orange-100 text-sm font-medium">Total IVA</p>
            <p class="text-3xl font-bold">{formatearMoneda(datos.estadisticasGenerales.totalIva)}</p>
          </div>
          <div class="text-4xl">🏛️</div>
        </div>
      </div>
    </div>

    <!-- Gráfico de Evolución de Ventas -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 class="text-xl font-semibold mb-6">📈 Evolución de Ventas</h2>
      {#if datos.evolucionVentas && datos.evolucionVentas.length > 0}
        {@const chartData = {
          labels: datos.evolucionVentas.map((item: any) => {
            if (agruparPor === 'dia') {
              return new Date(item.periodo).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
            } else if (agruparPor === 'semana') {
              return `Sem ${item.periodo.split('-W')[1]}`;
            } else {
              return new Date(item.periodo + '-01').toLocaleDateString('es-AR', { month: 'short' });
            }
          }),
          datasets: [{
            label: 'Ventas ($)',
            data: datos.evolucionVentas.map((item: any) => item.monto),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false,
          }]
        }}
        
        {@const chartOptions = {
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  const item = datos.evolucionVentas[context.dataIndex];
                  if (item) {
                    return [
                      `Ventas: ${formatearMoneda(context.parsed.y)}`,
                      `Facturas: ${item.cantidad}`,
                      `Fecha: ${item.periodo}`
                    ];
                  }
                  return `Ventas: ${formatearMoneda(context.parsed.y)}`;
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
        
        <Chart 
          data={chartData} 
          type="bar" 
          options={chartOptions}
          height="400px"
        />
      {:else}
        <div class="h-80 flex items-center justify-center text-gray-500">
          <div class="text-center">
            <div class="mb-4">
              <Icon icon={TrendingUp} size={40} strokeWidth={2} glass={true} />
            </div>
            <p>No hay datos de evolución de ventas para el período seleccionado</p>
          </div>
        </div>
      {/if}
    </div>

    <!-- Distribución por Tipo de Documento -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 class="text-xl font-semibold mb-6">📋 Distribución por Tipo</h2>
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

      <!-- Top Vendedores -->
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 class="text-xl font-semibold mb-6">👥 Top Vendedores</h2>
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

    <!-- Top Clientes -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 class="text-xl font-semibold mb-6">🏆 Top 10 Clientes</h2>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 font-semibold">#</th>
              <th class="text-left py-3 px-4 font-semibold">Cliente</th>
              <th class="text-right py-3 px-4 font-semibold">Cantidad</th>
              <th class="text-right py-3 px-4 font-semibold">Total</th>
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

    <!-- Estadísticas de CAE -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 class="text-xl font-semibold mb-6">✅ Estado CAE</h2>
        <div class="flex items-center justify-center">
          <div class="relative w-32 h-32">
            <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e5e7eb"
                stroke-width="2"
              />
              {#if datos.estadisticasGenerales.totalFacturas > 0}
                {@const porcentaje = (datos.estadisticasGenerales.facturasConCae / datos.estadisticasGenerales.totalFacturas) * 100}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  stroke-width="2"
                  stroke-dasharray="{porcentaje}, 100"
                />
              {/if}
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">
                  {datos.estadisticasGenerales.totalFacturas > 0 ? 
                    ((datos.estadisticasGenerales.facturasConCae / datos.estadisticasGenerales.totalFacturas) * 100).toFixed(1) : '0'}%
                </div>
                <div class="text-sm text-gray-500">Con CAE</div>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4 text-center">
          <div class="text-sm text-gray-600">
            {datos.estadisticasGenerales.facturasConCae} de {datos.estadisticasGenerales.totalFacturas} facturas
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 class="text-xl font-semibold mb-6 flex items-center gap-2">
          <Icon icon={FileText} size={20} strokeWidth={2.5} glass={true} />
          Resumen Financiero
        </h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Ventas Brutas:</span>
            <span class="font-semibold">{formatearMoneda(datos.estadisticasGenerales.totalVentas + datos.estadisticasGenerales.totalBonificaciones)}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Bonificaciones:</span>
            <span class="font-semibold text-red-600">-{formatearMoneda(datos.estadisticasGenerales.totalBonificaciones)}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">IVA:</span>
            <span class="font-semibold text-blue-600">+{formatearMoneda(datos.estadisticasGenerales.totalIva)}</span>
          </div>
          <hr class="border-gray-200">
          <div class="flex justify-between items-center text-lg font-bold">
            <span>Total Neto:</span>
            <span class="text-green-600">{formatearMoneda(datos.estadisticasGenerales.totalVentas)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de Facturas Recientes -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 class="text-xl font-semibold mb-6">📋 Facturas Recientes</h2>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 font-semibold">Número</th>
              <th class="text-left py-3 px-4 font-semibold">Fecha</th>
              <th class="text-left py-3 px-4 font-semibold">Cliente</th>
              <th class="text-left py-3 px-4 font-semibold">Vendedor</th>
              <th class="text-right py-3 px-4 font-semibold">Monto</th>
              <th class="text-center py-3 px-4 font-semibold">CAE</th>
            </tr>
          </thead>
          <tbody>
            {#each datos.facturas.slice(-10).reverse() as factura}
              <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-3 px-4">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        style="background-color: {getColorTipo(factura.tipo)}20; color: {getColorTipo(factura.tipo)}">
                    {factura.numero}
                  </span>
                </td>
                <td class="py-3 px-4 text-gray-600">
                  {new Date(factura.fecha).toLocaleDateString('es-AR')}
                </td>
                <td class="py-3 px-4 font-medium">{factura.cliente}</td>
                <td class="py-3 px-4 text-gray-600">{factura.vendedor}</td>
                <td class="py-3 px-4 text-right font-semibold">{formatearMoneda(factura.monto)}</td>
                <td class="py-3 px-4 text-center">
                  {#if factura.tieneCae}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✅
                    </span>
                  {:else}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      ❌
                    </span>
                  {/if}
                </td>
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
      <h3 class="text-xl font-semibold text-gray-900 mb-2">Selecciona un rango de fechas</h3>
      <p class="text-gray-600">Para ver el informe de facturación, selecciona las fechas de inicio y fin.</p>
    </div>
  {/if}
</div>

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