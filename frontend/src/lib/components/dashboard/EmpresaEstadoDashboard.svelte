<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { ShoppingCart, TrendingUp, Package, Users, FileWarning } from 'lucide-svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { auth } from '$lib/stores/authStore';

  import DashboardCard from '$lib/components/dashboard/DashboardCard.svelte';
  import VendedoresWidget from '$lib/components/dashboard/VendedoresWidget.svelte';
  import StockCriticoWidget from '$lib/components/dashboard/StockCriticoWidget.svelte';
  import ComprobantesSinCaeWidget from '$lib/components/dashboard/ComprobantesSinCaeWidget.svelte';
  import AccesosRapidosWidget from '$lib/components/dashboard/AccesosRapidosWidget.svelte';

  let {
    resumenVentasEnCantidad = false,
    mostrarTicketPromedio = true
  }: {
    resumenVentasEnCantidad?: boolean;
    mostrarTicketPromedio?: boolean;
  } = $props();

  let loading = $state(true);
  let error = $state<string | null>(null);

  let resumenDia = $state<any>(null);
  let vendedores = $state<any[]>([]);
  let stockCritico = $state<any>({ sinStock: [], bajoMinimo: [], pagination: null });
  let stockPage = $state(1);
  let comprobantesSinCae = $state<any>({
    comprobantes: [],
    cantidad: 0,
    cantidadFacturas: 0,
    cantidadNotas: 0
  });
  let serverTime = $state<string>('');

  const userName = $derived($auth.user?.nombre || 'Usuario');
  const companyName = $derived($auth.empresa?.nombre || 'Empresa');

  const horaActual = new Date().getHours();
  let saludo = $state('');

  if (horaActual >= 6 && horaActual < 12) {
    saludo = 'Buenos días';
  } else if (horaActual >= 12 && horaActual < 20) {
    saludo = 'Buenas tardes';
  } else {
    saludo = 'Buenas noches';
  }

  const fechaActual = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let horaLocal = $state('');

  function actualizarHoraLocal() {
    horaLocal = new Date().toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  async function cargarDashboard() {
    try {
      loading = true;
      error = null;

      const [resumenData, vendedoresData, stockData, serverTimeData, sinCaeData] = await Promise.all([
        fetchWithAuth('/dashboard/resumen-dia').then((r) => r.json()),
        fetchWithAuth('/dashboard/vendedores-estado').then((r) => r.json()),
        fetchWithAuth(`/dashboard/stock-critico?page=${stockPage}&limit=10`).then((r) => r.json()),
        fetchWithAuth('/dashboard/server-time').then((r) => r.json()),
        fetchWithAuth('/dashboard/comprobantes-sin-cae?limit=12')
          .then((r) => r.json())
          .catch(() => ({ success: false }))
      ]);

      if (resumenData.success) {
        resumenDia = resumenData;
      }

      if (vendedoresData.success) {
        vendedores = vendedoresData.vendedores || [];
      }

      if (stockData.success) {
        stockCritico = {
          sinStock: stockData.sinStock || [],
          bajoMinimo: stockData.bajoMinimo || [],
          pagination: stockData.pagination || null
        };
      }

      if (sinCaeData.success) {
        comprobantesSinCae = {
          comprobantes: sinCaeData.comprobantes || [],
          cantidad: sinCaeData.cantidad || 0,
          cantidadFacturas: sinCaeData.cantidadFacturas || 0,
          cantidadNotas: sinCaeData.cantidadNotas || 0
        };
      }

      if (serverTimeData.success) {
        const serverDate = new Date(serverTimeData.serverTime);
        serverTime = serverDate.toLocaleString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC'
        });
      }
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
      error = 'Error al cargar los datos del dashboard';
    } finally {
      loading = false;
    }
  }

  async function handleStockPageChange(newPage: number) {
    stockPage = newPage;
    try {
      const stockData = await fetchWithAuth(`/dashboard/stock-critico?page=${stockPage}&limit=10`).then((r) =>
        r.json()
      );

      if (stockData.success) {
        stockCritico = {
          sinStock: stockData.sinStock || [],
          bajoMinimo: stockData.bajoMinimo || [],
          pagination: stockData.pagination || null
        };
      }
    } catch (err) {
      console.error('Error al cambiar página de stock:', err);
    }
  }

  onMount(() => {
    actualizarHoraLocal();
    const horaInterval = setInterval(actualizarHoraLocal, 1000);

    cargarDashboard();
    const dashboardInterval = setInterval(cargarDashboard, 5 * 60 * 1000);

    return () => {
      clearInterval(horaInterval);
      clearInterval(dashboardInterval);
    };
  });
</script>

<div class="space-y-6 pb-8" transition:fade={{ duration: 200 }}>
  <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-3xl font-bold mb-2">{saludo}, {userName}! 👋</h1>
        <p class="text-blue-100 capitalize">
          {fechaActual}
          {#if horaLocal}
            <span class="ml-3 font-semibold">• {horaLocal}</span>
          {/if}
        </p>
        <p class="text-sm text-blue-200 mt-1">{companyName}</p>
      </div>
      {#if serverTime}
        <div class="text-right">
          <p class="text-xs text-blue-200 mb-1">Hora del servidor (UTC)</p>
          <p class="text-lg font-semibold">{serverTime}</p>
        </div>
      {/if}
    </div>
  </div>

  {#if !loading && resumenDia}
    <div
      class={`grid grid-cols-1 md:grid-cols-2 gap-6 ${mostrarTicketPromedio ? 'xl:grid-cols-5' : 'xl:grid-cols-4'}`}
    >
      <DashboardCard
        title="Ventas del Día"
        value={resumenVentasEnCantidad
          ? new Intl.NumberFormat('es-AR').format(resumenDia.ventasHoy?.cantidad || 0)
          : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
              resumenDia.ventasHoy?.monto || 0
            )}
        subtitle={resumenVentasEnCantidad
          ? 'comprobantes'
          : `${resumenDia.ventasHoy?.cantidad || 0} facturas`}
        icon={ShoppingCart}
        color="green"
        trend={parseFloat(resumenDia.ventasHoy?.comparativa || 0)}
      />

      {#if mostrarTicketPromedio}
        <DashboardCard
          title="Ticket Promedio"
          value={new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
            resumenDia.ticketPromedio || 0
          )}
          subtitle="Por factura"
          icon={TrendingUp}
          color="blue"
        />
      {/if}

      <DashboardCard
        title="Stock Crítico"
        value={(
          stockCritico.pagination?.totalSinStock + stockCritico.pagination?.totalBajoMinimo ||
          stockCritico.sinStock.length + stockCritico.bajoMinimo.length
        ).toString()}
        subtitle="Productos alertados"
        icon={Package}
        color={stockCritico.sinStock.length > 0
          ? 'red'
          : stockCritico.bajoMinimo.length > 0
            ? 'orange'
            : 'green'}
      />

      <DashboardCard
        title="Vendedores Activos"
        value={vendedores.filter((v: any) => v.activo).length.toString()}
        subtitle={`de ${vendedores.length} vendedores`}
        icon={Users}
        color="purple"
      />

      <DashboardCard
        title="Sin autorizar"
        value={comprobantesSinCae.cantidad.toString()}
        subtitle="Facturas A/B/C y NC A/B sin CAE"
        icon={FileWarning}
        color={comprobantesSinCae.cantidad > 0 ? 'orange' : 'green'}
      />
    </div>
  {/if}

  <AccesosRapidosWidget />

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <VendedoresWidget {vendedores} {loading} />

    <StockCriticoWidget
      sinStock={stockCritico.sinStock}
      bajoMinimo={stockCritico.bajoMinimo}
      pagination={stockCritico.pagination}
      {loading}
      onPageChange={handleStockPageChange}
    />

    <ComprobantesSinCaeWidget
      comprobantes={comprobantesSinCae.comprobantes}
      cantidad={comprobantesSinCae.cantidad}
      cantidadFacturas={comprobantesSinCae.cantidadFacturas}
      cantidadNotas={comprobantesSinCae.cantidadNotas}
      {loading}
    />
  </div>

  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
      <p class="font-semibold">Error</p>
      <p class="text-sm">{error}</p>
      <button class="mt-2 text-sm underline hover:no-underline" onclick={cargarDashboard}> Reintentar </button>
    </div>
  {/if}
</div>
