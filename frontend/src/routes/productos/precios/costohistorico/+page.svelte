<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

  interface ActualizacionCosto {
    Fecha: string;
    PrecioCosto: number;
  }

  interface FilaCosto {
    Codigo: string;
    Descripcion: string;
    FechaActualizacionCosto: string | null;
    PrecioCosto: number | null;
    historial: ActualizacionCosto[];
  }

  let search = '';
  let loading = true;
  let error = '';
  let items: FilaCosto[] = [];
  let page = 1;
  let totalPages = 1;
  let totalItems = 0;
  const limit = 20;

  function formatearFecha(valor: string | null | undefined): string {
    if (!valor) return '—';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '—';
    return fecha.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
  }

  function formatearCosto(valor: number | null | undefined): string {
    if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return '—';
    return `$${Number(valor).toFixed(2)}`;
  }

  async function cargar(pagina = page) {
    loading = true;
    error = '';
    try {
      const params = new URLSearchParams({
        page: String(pagina),
        limit: String(limit),
        search
      });
      const response = await fetchWithAuth(`/articulos/costo-historico?${params}`);
      if (!response.ok) throw new Error('No se pudo cargar el historial de costos');
      const data = await response.json();
      items = data.items || [];
      page = data.meta?.currentPage || pagina;
      totalPages = data.meta?.totalPages || 0;
      totalItems = data.meta?.totalItems || 0;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error desconocido';
      items = [];
    } finally {
      loading = false;
    }
  }

  function buscar(event: Event) {
    event.preventDefault();
    cargar(1);
  }

  onMount(() => {
    cargar(1);
  });
</script>

<div class="p-4">
  <h1 class="text-2xl font-semibold text-gray-800 mb-4">Costo histórico</h1>
  <p class="text-sm text-gray-600 mb-4">Últimas 3 actualizaciones del precio de costo de cada artículo.</p>

  <form class="mb-4 flex gap-2" on:submit={buscar}>
    <input
      type="search"
      bind:value={search}
      placeholder="Código o descripción"
      class="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
      Buscar
    </button>
  </form>

  {#if loading}
    <div class="flex justify-center items-center py-10">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <p>{error}</p>
    </div>
  {:else if items.length === 0}
    <div class="bg-white p-8 rounded-md shadow text-center">
      <p class="text-gray-500">No hay artículos para mostrar</p>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th class="px-4 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
            <th class="px-4 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
            <th class="px-4 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Actualización</th>
            <th class="px-4 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">1</th>
            <th class="px-4 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">2</th>
            <th class="px-4 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">3</th>
          </tr>
        </thead>
        <tbody>
          {#each items as articulo (articulo.Codigo)}
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-3 whitespace-nowrap border-b border-gray-200">{articulo.Codigo}</td>
              <td class="px-4 py-3 border-b border-gray-200">{articulo.Descripcion || '—'}</td>
              <td class="px-4 py-3 whitespace-nowrap border-b border-gray-200">{formatearFecha(articulo.FechaActualizacionCosto)}</td>
              {#each [0, 1, 2] as indice}
                <td class="px-4 py-3 whitespace-nowrap border-b border-gray-200 text-sm">
                  {#if articulo.historial[indice]}
                    <div>{formatearCosto(articulo.historial[indice].PrecioCosto)}</div>
                    <div class="text-gray-500">{formatearFecha(articulo.historial[indice].Fecha)}</div>
                  {:else if indice === 0}
                    <span class="text-gray-400">Sin actualizaciones de costo</span>
                  {:else}
                    <span class="text-gray-400">—</span>
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-between items-center text-sm">
      <div class="text-gray-600">{totalItems} artículos</div>
      <div class="flex gap-2">
        <button
          type="button"
          class="px-3 py-1 rounded border {page <= 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}"
          disabled={page <= 1}
          on:click={() => cargar(page - 1)}
        >
          Anterior
        </button>
        <span class="px-2 py-1 text-gray-600">{page} / {Math.max(totalPages, 1)}</span>
        <button
          type="button"
          class="px-3 py-1 rounded border {page >= totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}"
          disabled={page >= totalPages}
          on:click={() => cargar(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  {/if}
</div>
