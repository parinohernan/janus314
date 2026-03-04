<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { formatDate } from '$lib/utils/dateUtils';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

  interface OrdenCompra {
    DocumentoTipo: string;
    DocumentoSucursal: string;
    DocumentoNumero: string;
    Fecha: string;
    FechaFormateada?: string;
    FechaDeEntrega?: string;
    FechaDeEntregaFormateada?: string;
    ImporteTotal: number;
    FechaAnulacion: string | null;
    ProveedorRelacion?: { Codigo: string; Descripcion: string };
  }

  let ordenes: OrdenCompra[] = [];
  let totalItems = 0;
  let itemsPerPage = 10;
  let currentPage = 1;
  let totalPages = 0;
  let loading = true;
  let error: string | null = null;

  const hoy = new Date().toISOString().slice(0, 10);
  let filtroProveedor = '';
  let filtroFechaDesde = hoy;
  let filtroFechaHasta = hoy;

  let proveedores: { Codigo: string; Descripcion: string }[] = [];

  const cargarProveedores = async () => {
    try {
      const res = await fetchWithAuth('/proveedores', { params: { limit: 500 } });
      if (!res.ok) return;
      const data = await res.json();
      proveedores = data.items || [];
    } catch (_) {}
  };

  const cargarOrdenes = async () => {
    try {
      loading = true;
      error = null;
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', String(itemsPerPage));
      if (filtroProveedor) params.append('proveedor', filtroProveedor);
      if (filtroFechaDesde) params.append('fechaDesde', filtroFechaDesde);
      if (filtroFechaHasta) params.append('fechaHasta', filtroFechaHasta);

      const response = await fetchWithAuth(`/ordenes-compra?${params}`);
      if (!response.ok) throw new Error('Error al cargar órdenes');
      const data = await response.json();
      ordenes = data.items || [];
      totalItems = data.meta?.totalItems ?? 0;
      currentPage = data.meta?.currentPage ?? 1;
      totalPages = data.meta?.totalPages ?? 0;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };

  const filtrar = () => {
    currentPage = 1;
    cargarOrdenes();
  };

  const verDetalle = (o: OrdenCompra) => {
    goto(`/compras/ordenes/${o.DocumentoTipo}/${o.DocumentoSucursal}/${o.DocumentoNumero}`);
  };

  onMount(() => {
    cargarProveedores();
    cargarOrdenes();
  });
</script>

<svelte:head>
  <title>Órdenes de compra</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <h1 class="text-2xl font-semibold text-gray-900">Órdenes de compra</h1>
    <Button on:click={() => goto('/compras/ordenes/nueva')} variant="primary">Nueva orden</Button>
  </div>

  <!-- Filtros -->
  <div class="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label for="proveedor" class="block text-sm font-medium text-gray-700">Proveedor</label>
        <select
          id="proveedor"
          class="mt-1 block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          bind:value={filtroProveedor}
        >
          <option value="">Todos</option>
          {#each proveedores as p}
            <option value={p.Codigo}>{p.Descripcion}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="fechaDesde" class="block text-sm font-medium text-gray-700">Desde</label>
        <input
          id="fechaDesde"
          type="date"
          class="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
          bind:value={filtroFechaDesde}
        />
      </div>
      <div>
        <label for="fechaHasta" class="block text-sm font-medium text-gray-700">Hasta</label>
        <input
          id="fechaHasta"
          type="date"
          class="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
          bind:value={filtroFechaHasta}
        />
      </div>
      <div class="flex items-end">
        <Button on:click={filtrar} variant="primary">Filtrar</Button>
      </div>
    </div>
  </div>

  {#if error}
    <p class="mt-4 text-sm text-red-600">{error}</p>
  {/if}

  {#if loading}
    <p class="mt-6 text-gray-500">Cargando órdenes...</p>
  {:else if ordenes.length === 0}
    <p class="mt-6 text-gray-500">No hay órdenes de compra con los filtros indicados.</p>
  {:else}
    <div class="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Número</th>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Fecha</th>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Proveedor</th>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Fecha entrega</th>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
            <th class="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          {#each ordenes as o}
            <tr class="hover:bg-gray-50">
              <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-900">
                {o.DocumentoTipo} {o.DocumentoSucursal}-{o.DocumentoNumero}
              </td>
              <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-600">
                {formatDate(o.FechaFormateada || o.Fecha)}
              </td>
              <td class="px-4 py-2 text-sm text-gray-600">
                {o.ProveedorRelacion?.Descripcion ?? o.ProveedorCodigo ?? '-'}
              </td>
              <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-600">
                {o.FechaDeEntregaFormateada || o.FechaDeEntrega ? formatDate(o.FechaDeEntregaFormateada || o.FechaDeEntrega) : '-'}
              </td>
              <td class="whitespace-nowrap px-4 py-2 text-sm">
                {#if o.FechaAnulacion}
                  <span class="text-red-600">Anulada</span>
                {:else}
                  <span class="text-green-600">Vigente</span>
                {/if}
              </td>
              <td class="whitespace-nowrap px-4 py-2">
                <button
                  type="button"
                  class="text-indigo-600 hover:text-indigo-900"
                  on:click={() => verDetalle(o)}
                >
                  Ver
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#if totalPages > 1}
      <div class="mt-4 flex items-center justify-between">
        <p class="text-sm text-gray-700">
          Página {currentPage} de {totalPages} ({totalItems} registros)
        </p>
        <div class="flex gap-2">
          <Button
            variant="secondary"
            disabled={currentPage <= 1}
            on:click={() => { currentPage--; cargarOrdenes(); }}
          >
            Anterior
          </Button>
          <Button
            variant="secondary"
            disabled={currentPage >= totalPages}
            on:click={() => { currentPage++; cargarOrdenes(); }}
          >
            Siguiente
          </Button>
        </div>
      </div>
    {/if}
  {/if}
</div>
