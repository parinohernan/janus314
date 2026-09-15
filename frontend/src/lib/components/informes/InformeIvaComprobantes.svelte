<script lang="ts">
  import { onMount } from 'svelte';
  import { beforeNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import DatePicker from '$lib/components/DatePicker.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { formatDate } from '$lib/utils/dateUtils';
  import { FileSpreadsheet, FileText } from 'lucide-svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { navigationState } from '$lib/stores/navigationState';
  import {
    exportarInformeIva,
    type ComprobanteIva
  } from '$lib/utils/exportarInformeIva';

  interface TotalesIva {
    cantidad: number;
    importe: number;
    iva105: number;
    iva21: number;
  }

  interface Props {
    titulo: string;
    descripcion: string;
    endpoint: string;
    pagePath: string;
    nombreExcel: string;
  }

  let { titulo, descripcion, endpoint, pagePath, nombreExcel }: Props = $props();

  let loading = $state(false);
  let error = $state<string | null>(null);
  let comprobantes = $state<ComprobanteIva[]>([]);
  let totales = $state<TotalesIva>({ cantidad: 0, importe: 0, iva105: 0, iva21: 0 });
  let fechaDesde = $state(new Date());
  let fechaHasta = $state(new Date());

  function formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(valor || 0);
  }

  function formatearIva(valor: number | null): string {
    if (valor === null || valor === undefined) return '';
    return formatearMoneda(valor);
  }

  async function cargarDatos() {
    try {
      loading = true;
      error = null;
      const params = new URLSearchParams({
        fechaDesde: fechaDesde.toISOString().split('T')[0],
        fechaHasta: fechaHasta.toISOString().split('T')[0]
      });
      const response = await fetchWithAuth(`${endpoint}?${params}`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Error al cargar el informe');
      }
      comprobantes = result.comprobantes || [];
      totales = result.totales || { cantidad: 0, importe: 0, iva105: 0, iva21: 0 };
    } catch (err) {
      console.error(err);
      error = err instanceof Error ? err.message : 'Error al cargar el informe';
      comprobantes = [];
      totales = { cantidad: 0, importe: 0, iva105: 0, iva21: 0 };
    } finally {
      loading = false;
    }
  }

  function descargarExcel() {
    exportarInformeIva(comprobantes, nombreExcel);
  }

  onMount(async () => {
    let savedScroll: number | undefined;
    if (browser) {
      const savedState = navigationState.getState(pagePath);
      savedScroll = savedState?.scroll;
      const filters = savedState?.filters as { fechaDesde?: string; fechaHasta?: string } | undefined;
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
    if (from?.url.pathname === pagePath && browser) {
      const currentState = navigationState.getState(pagePath) || {};
      navigationState.saveState(pagePath, {
        ...currentState,
        scroll: typeof window !== 'undefined' ? window.scrollY : 0,
        filters: {
          fechaDesde: fechaDesde.toISOString().split('T')[0],
          fechaHasta: fechaHasta.toISOString().split('T')[0]
        }
      });
    }
  });
</script>

<div class="space-y-6">
  <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">{titulo}</h1>
      <p class="text-gray-600 mt-1">{descripcion}</p>
    </div>
    <Button
      variant="success"
      disabled={loading || comprobantes.length === 0}
      on:click={descargarExcel}
    >
      <span class="inline-flex items-center gap-2">
        <Icon icon={FileSpreadsheet} size={18} strokeWidth={2.5} />
        Descargar Excel
      </span>
    </Button>
  </div>

  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h2 class="text-lg font-semibold mb-4">Filtros</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
      <div>
        <label for="fechaDesde" class="block text-sm font-medium text-gray-700 mb-2">Fecha desde</label>
        <DatePicker id="fechaDesde" bind:value={fechaDesde} />
      </div>
      <div>
        <label for="fechaHasta" class="block text-sm font-medium text-gray-700 mb-2">Fecha hasta</label>
        <DatePicker id="fechaHasta" bind:value={fechaHasta} />
      </div>
      <Button variant="primary" disabled={loading} on:click={cargarDatos}>
        {loading ? 'Consultando...' : 'Consultar'}
      </Button>
    </div>
  </div>

  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
      <p class="font-semibold">Error</p>
      <p class="text-sm">{error}</p>
    </div>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-sm text-gray-500">Comprobantes</p>
      <p class="text-2xl font-bold text-gray-900">{totales.cantidad}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-sm text-gray-500">Importe</p>
      <p class="text-2xl font-bold text-gray-900">{formatearMoneda(totales.importe)}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-sm text-gray-500">IVA 10,50 %</p>
      <p class="text-2xl font-bold text-gray-900">{formatearMoneda(totales.iva105)}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-sm text-gray-500">IVA 21,00 %</p>
      <p class="text-2xl font-bold text-gray-900">{formatearMoneda(totales.iva21)}</p>
    </div>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    {#if loading}
      <div class="p-12 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-sm text-gray-600">Cargando comprobantes...</p>
      </div>
    {:else if comprobantes.length === 0}
      <div class="p-12 text-center text-gray-600">
        <Icon icon={FileText} size={40} strokeWidth={2} class="mx-auto mb-3 text-gray-400" />
        <p>No hay comprobantes en el período seleccionado</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Fecha</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Tipo</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">N°</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Cliente</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-700">Importe</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-700">IVA 10,50 %</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-700">IVA 21,00 %</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">Inscripción</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700">CUIT</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            {#each comprobantes as item (`${item.tipo}-${item.sucursal}-${item.numero}`)}
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-2 whitespace-nowrap">{formatDate(item.fecha)}</td>
                <td class="px-4 py-2 whitespace-nowrap">{item.tipo} {item.sucursal}</td>
                <td class="px-4 py-2 whitespace-nowrap font-mono">{item.numero}</td>
                <td class="px-4 py-2">{item.cliente}</td>
                <td class="px-4 py-2 text-right whitespace-nowrap">{formatearMoneda(item.importe)}</td>
                <td class="px-4 py-2 text-right whitespace-nowrap">{formatearIva(item.iva105)}</td>
                <td class="px-4 py-2 text-right whitespace-nowrap">{formatearIva(item.iva21)}</td>
                <td class="px-4 py-2 whitespace-nowrap">{item.inscripcion}</td>
                <td class="px-4 py-2 whitespace-nowrap font-mono">{item.cuit}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
