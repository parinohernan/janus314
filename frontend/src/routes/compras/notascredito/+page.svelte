<script lang="ts">
  import { onMount } from 'svelte';
  import { beforeNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import { navigationState } from '$lib/stores/navigationState';
  import Button from '$lib/components/ui/Button.svelte';
  import { formatDate } from '$lib/utils/dateUtils';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

  interface NC {
    DocumentoTipo: string;
    DocumentoSucursal: string;
    DocumentoNumero: string;
    Fecha: string;
    ImporteTotal: number;
    ImporteUtilizado: number;
    FechaAnulacion: string | null;
    ProveedorRelacion?: { Codigo: string; Descripcion: string };
  }

  let items: NC[] = [];
  let totalItems = 0;
  let currentPage = 1;
  let totalPages = 0;
  let limit = 10;
  let loading = true;
  let error: string | null = null;
  let filtroProveedor = '';
  let filtroFechaDesde = new Date().toISOString().slice(0, 10);
  let filtroFechaHasta = new Date().toISOString().slice(0, 10);
  let proveedores: { Codigo: string; Descripcion: string }[] = [];

  const cargarProveedores = async () => {
    const res = await fetchWithAuth('/proveedores', { params: { limit: 500 } });
    if (!res.ok) return;
    proveedores = (await res.json()).items || [];
  };

  const cargar = async () => {
    try {
      loading = true;
      error = null;
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', String(limit));
      if (filtroProveedor) params.append('proveedorCodigo', filtroProveedor);
      if (filtroFechaDesde) params.append('fechaDesde', filtroFechaDesde);
      if (filtroFechaHasta) params.append('fechaHasta', filtroFechaHasta);
      const res = await fetchWithAuth(`/proveedores-notas-credito?${params}`);
      if (!res.ok) throw new Error('Error al cargar');
      const data = await res.json();
      items = data.items || [];
      totalItems = data.meta?.totalItems ?? 0;
      currentPage = data.meta?.currentPage ?? 1;
      totalPages = data.meta?.totalPages ?? 0;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error';
    } finally {
      loading = false;
    }
  };

  const NC_PROVEEDORES_PATH = '/compras/notascredito';

  onMount(async () => {
    let savedScroll: number | undefined;
    if (browser) {
      const savedState = navigationState.getState(NC_PROVEEDORES_PATH);
      savedScroll = savedState?.scroll;
      const filtersSaved = savedState?.filters as {
        filtroProveedor?: string;
        filtroFechaDesde?: string;
        filtroFechaHasta?: string;
        currentPage?: number;
        limit?: number;
      } | undefined;
      if (filtersSaved?.filtroProveedor !== undefined) filtroProveedor = filtersSaved.filtroProveedor;
      if (filtersSaved?.filtroFechaDesde) filtroFechaDesde = filtersSaved.filtroFechaDesde;
      if (filtersSaved?.filtroFechaHasta) filtroFechaHasta = filtersSaved.filtroFechaHasta;
      if (typeof filtersSaved?.currentPage === 'number' && filtersSaved.currentPage >= 1) currentPage = filtersSaved.currentPage;
      if (typeof filtersSaved?.limit === 'number' && filtersSaved.limit > 0) limit = filtersSaved.limit;
    }
    cargarProveedores();
    await cargar();
    if (typeof savedScroll === 'number' && savedScroll > 0 && typeof window !== 'undefined') {
      requestAnimationFrame(() => window.scrollTo(0, savedScroll));
    }
  });

  beforeNavigate(({ from }) => {
    if (from?.url.pathname === NC_PROVEEDORES_PATH && browser) {
      const currentState = navigationState.getState(NC_PROVEEDORES_PATH) || {};
      navigationState.saveState(NC_PROVEEDORES_PATH, {
        ...currentState,
        scroll: typeof window !== 'undefined' ? window.scrollY : 0,
        filters: { filtroProveedor, filtroFechaDesde, filtroFechaHasta, currentPage, limit }
      });
    }
  });
</script>

<svelte:head>
  <title>Notas de crédito - Proveedores</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
  <h1 class="text-2xl font-semibold text-gray-900 mb-6">Notas de crédito (proveedores)</h1>

  <div class="rounded-lg border bg-white p-4 shadow-sm mb-6">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Proveedor</label>
        <select class="mt-1 block w-full rounded-md border py-2 pl-3 pr-10 text-sm" bind:value={filtroProveedor}>
          <option value="">Todos</option>
          {#each proveedores as p}
            <option value={p.Codigo}>{p.Descripcion}</option>
          {/each}
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Desde</label>
        <input type="date" class="mt-1 block w-full rounded-md border py-2 px-3 text-sm" bind:value={filtroFechaDesde} />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Hasta</label>
        <input type="date" class="mt-1 block w-full rounded-md border py-2 px-3 text-sm" bind:value={filtroFechaHasta} />
      </div>
      <div class="flex items-end">
        <Button on:click={() => { currentPage = 1; cargar(); }} variant="primary">Filtrar</Button>
      </div>
    </div>
  </div>

  {#if error}<p class="text-red-600 text-sm mb-4">{error}</p>{/if}
  {#if loading}
    <p class="text-gray-500">Cargando...</p>
  {:else if items.length === 0}
    <p class="text-gray-500">No hay notas de crédito.</p>
  {:else}
    <div class="overflow-hidden rounded-lg border bg-white shadow">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Documento</th>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Fecha</th>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Proveedor</th>
            <th class="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Total</th>
            <th class="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Utilizado</th>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#each items as nc}
            <tr class="hover:bg-gray-50">
              <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-900">{nc.DocumentoTipo} {nc.DocumentoSucursal}-{nc.DocumentoNumero}</td>
              <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-600">{formatDate(nc.Fecha)}</td>
              <td class="px-4 py-2 text-sm text-gray-600">{nc.ProveedorRelacion?.Descripcion ?? '-'}</td>
              <td class="whitespace-nowrap px-4 py-2 text-right text-sm">{(nc.ImporteTotal ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
              <td class="whitespace-nowrap px-4 py-2 text-right text-sm">{(nc.ImporteUtilizado ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
              <td class="whitespace-nowrap px-4 py-2 text-sm">{#if nc.FechaAnulacion}<span class="text-red-600">Anulada</span>{:else}<span class="text-green-600">Vigente</span>{/if}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#if totalPages > 1}
      <div class="mt-4 flex justify-between text-sm">
        <p class="text-gray-600">Página {currentPage} de {totalPages} ({totalItems} registros)</p>
        <div class="flex gap-2">
          <Button variant="secondary" disabled={currentPage <= 1} on:click={() => { currentPage--; cargar(); }}>Anterior</Button>
          <Button variant="secondary" disabled={currentPage >= totalPages} on:click={() => { currentPage++; cargar(); }}>Siguiente</Button>
        </div>
      </div>
    {/if}
  {/if}
</div>
