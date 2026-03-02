<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { formatDate } from '$lib/utils/dateUtils';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { toast, confirm } from '$lib/utils/toast';

  interface ReciboProv {
    DocumentoTipo: string;
    DocumentoSucursal: string;
    DocumentoNumero: string;
    Fecha: string;
    ImporteTotal: number;
    FechaAnulacion: string | null;
    ProveedorRelacion?: { Codigo: string; Descripcion: string };
  }

  let recibos: ReciboProv[] = [];
  let totalItems = 0;
  let currentPage = 1;
  let totalPages = 0;
  let itemsPerPage = 10;
  let loading = true;
  let error: string | null = null;
  let filtroProveedor = '';
  let filtroFechaDesde = new Date().toISOString().slice(0, 10);
  let filtroFechaHasta = new Date().toISOString().slice(0, 10);
  let proveedores: { Codigo: string; Descripcion: string }[] = [];

  const cargarProveedores = async () => {
    try {
      const res = await fetchWithAuth('/proveedores', { params: { limit: 500 } });
      if (!res.ok) return;
      const data = await res.json();
      proveedores = data.items || [];
    } catch (_) {}
  };

  const cargarRecibos = async () => {
    try {
      loading = true;
      error = null;
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', String(itemsPerPage));
      if (filtroProveedor) params.append('proveedorCodigo', filtroProveedor);
      if (filtroFechaDesde) params.append('fechaDesde', filtroFechaDesde);
      if (filtroFechaHasta) params.append('fechaHasta', filtroFechaHasta);
      const res = await fetchWithAuth(`/proveedores-recibos?${params}`);
      if (!res.ok) throw new Error('Error al cargar recibos');
      const data = await res.json();
      recibos = data.items || [];
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
    cargarRecibos();
  };

  const anular = async (r: ReciboProv) => {
    const ok = await confirm('¿Anular este recibo?');
    if (!ok) return;
    try {
      const res = await fetchWithAuth(
        `/proveedores-recibos/${r.DocumentoTipo}/${r.DocumentoSucursal}/${r.DocumentoNumero}/anular`,
        { method: 'PUT' }
      );
      if (!res.ok) throw new Error((await res.json()).message || 'Error al anular');
      toast.success('Recibo anulado correctamente');
      await cargarRecibos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al anular');
    }
  };

  onMount(() => {
    cargarProveedores();
    cargarRecibos();
  });
</script>

<svelte:head>
  <title>Comprobantes de pago (recibos)</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <h1 class="text-2xl font-semibold text-gray-900">Comprobantes de pago (recibos)</h1>
    <Button on:click={() => goto('/compras/recibos/nueva')} variant="primary">Nuevo comprobante de pago</Button>
  </div>

  <div class="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label for="prov" class="block text-sm font-medium text-gray-700">Proveedor</label>
        <select
          id="prov"
          class="mt-1 block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm"
          bind:value={filtroProveedor}
        >
          <option value="">Todos</option>
          {#each proveedores as p}
            <option value={p.Codigo}>{p.Descripcion}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="fd" class="block text-sm font-medium text-gray-700">Desde</label>
        <input id="fd" type="date" class="mt-1 block w-full rounded-md border py-2 px-3 text-sm" bind:value={filtroFechaDesde} />
      </div>
      <div>
        <label for="fh" class="block text-sm font-medium text-gray-700">Hasta</label>
        <input id="fh" type="date" class="mt-1 block w-full rounded-md border py-2 px-3 text-sm" bind:value={filtroFechaHasta} />
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
    <p class="mt-6 text-gray-500">Cargando...</p>
  {:else if recibos.length === 0}
    <p class="mt-6 text-gray-500">No hay comprobantes de pago.</p>
  {:else}
    <div class="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Documento</th>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Fecha</th>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Proveedor</th>
            <th class="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Importe</th>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
            <th class="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#each recibos as r}
            <tr class="hover:bg-gray-50">
              <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-900">
                {r.DocumentoTipo} {r.DocumentoSucursal}-{r.DocumentoNumero}
              </td>
              <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-600">{formatDate(r.Fecha)}</td>
              <td class="px-4 py-2 text-sm text-gray-600">{r.ProveedorRelacion?.Descripcion ?? '-'}</td>
              <td class="whitespace-nowrap px-4 py-2 text-right text-sm text-gray-900">
                {(r.ImporteTotal ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </td>
              <td class="whitespace-nowrap px-4 py-2 text-sm">
                {#if r.FechaAnulacion}
                  <span class="text-red-600">Anulado</span>
                {:else}
                  <span class="text-green-600">Vigente</span>
                {/if}
              </td>
              <td class="whitespace-nowrap px-4 py-2">
                {#if !r.FechaAnulacion}
                  <button type="button" class="text-red-600 hover:underline text-sm" on:click={() => anular(r)}>Anular</button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#if totalPages > 1}
      <div class="mt-4 flex justify-between items-center text-sm">
        <p class="text-gray-600">Página {currentPage} de {totalPages} ({totalItems} registros)</p>
        <div class="flex gap-2">
          <Button variant="secondary" disabled={currentPage <= 1} on:click={() => { currentPage--; cargarRecibos(); }}>Anterior</Button>
          <Button variant="secondary" disabled={currentPage >= totalPages} on:click={() => { currentPage++; cargarRecibos(); }}>Siguiente</Button>
        </div>
      </div>
    {/if}
  {/if}
</div>
