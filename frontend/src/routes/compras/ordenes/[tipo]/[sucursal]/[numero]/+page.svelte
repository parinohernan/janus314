<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Button from '$lib/components/ui/Button.svelte';
  import { formatDate } from '$lib/utils/dateUtils';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

  interface Item {
    DocumentoTipo: string;
    DocumentoSucursal: string;
    DocumentoNumero: string;
    CodigoArticulo: string;
    Cantidad: number;
    PrecioCostoUnitario: number;
    Articulo?: { Codigo: string; Descripcion: string };
    /** Unidades al proveedor (persistida en prv_orden_compra_items o calculada) */
    CantidadProveedor?: number | string | null;
    Relacion?: number | null;
  }

  function fmtCantProveedor(n: number | string | null | undefined): string {
    if (n == null || n === '') return '—';
    const v = Number(n);
    if (Number.isNaN(v)) return '—';
    if (Number.isInteger(v)) return String(v);
    return v.toFixed(4).replace(/\.?0+$/, '');
  }

  interface OrdenDetalle {
    DocumentoTipo: string;
    DocumentoSucursal: string;
    DocumentoNumero: string;
    Fecha: string;
    FechaFormateada?: string;
    FechaDeEntrega?: string;
    FechaDeEntregaFormateada?: string;
    ProveedorCodigo: string;
    ProveedorRelacion?: { Codigo: string; Descripcion: string; Cuit?: string; Telefono?: string };
    ImporteTotal: number;
    FechaAnulacion: string | null;
    Observacion?: string;
    RemitoNro?: string;
    Items: Item[];
  }

  const tipo = $page.params.tipo;
  const sucursal = $page.params.sucursal;
  const numero = $page.params.numero;

  let orden: OrdenDetalle | null = null;
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      loading = true;
      error = null;
      const response = await fetchWithAuth(`/ordenes-compra/${tipo}/${sucursal}/${numero}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Orden no encontrada');
        throw new Error('Error al cargar la orden');
      }
      orden = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  });

  const volver = () => goto('/compras/ordenes');
</script>

<svelte:head>
  <title>Orden de compra {tipo} {sucursal}-{numero}</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
  {#if loading}
    <p class="text-gray-500">Cargando orden...</p>
  {:else if error}
    <p class="text-red-600">{error}</p>
    <Button on:click={volver} variant="secondary" class="mt-4">Volver al listado</Button>
  {:else if orden}
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-semibold text-gray-900">
        Orden de compra {orden.DocumentoTipo} {orden.DocumentoSucursal}-{orden.DocumentoNumero}
      </h1>
      <div class="flex gap-2">
        <Button
          variant="primary"
          on:click={() => orden && goto(`/compras/ordenes/imprimir/${orden.DocumentoTipo}/${orden.DocumentoSucursal}/${orden.DocumentoNumero}`)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Ver / Imprimir PDF
        </Button>
        <Button on:click={volver} variant="secondary">Volver al listado</Button>
      </div>
    </div>

    <div class="mt-6 rounded-lg border border-gray-200 bg-white shadow">
      <div class="border-b border-gray-200 px-4 py-3">
        <h2 class="text-lg font-medium text-gray-900">Datos de la orden</h2>
      </div>
      <dl class="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2">
        <div>
          <dt class="text-sm font-medium text-gray-500">Fecha</dt>
          <dd class="mt-1 text-sm text-gray-900">{formatDate(orden.FechaFormateada || orden.Fecha || '')}</dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500">Fecha de entrega</dt>
          <dd class="mt-1 text-sm text-gray-900">
            {orden.FechaDeEntregaFormateada || orden.FechaDeEntrega
              ? formatDate(orden.FechaDeEntregaFormateada || orden.FechaDeEntrega || '')
              : '-'}
          </dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500">Proveedor</dt>
          <dd class="mt-1 text-sm text-gray-900">
            {orden.ProveedorRelacion?.Descripcion ?? orden.ProveedorCodigo}
          </dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500">Estado</dt>
          <dd class="mt-1 text-sm">
            {#if orden.FechaAnulacion}
              <span class="text-red-600">Anulada</span>
            {:else}
              <span class="text-green-600">Vigente</span>
            {/if}
          </dd>
        </div>
        {#if orden.RemitoNro}
          <div>
            <dt class="text-sm font-medium text-gray-500">Nº Remito</dt>
            <dd class="mt-1 text-sm text-gray-900">{orden.RemitoNro}</dd>
          </div>
        {/if}
      </dl>
      {#if orden.Observacion}
        <div class="border-t border-gray-100 px-4 py-2">
          <dt class="text-sm font-medium text-gray-500">Observación</dt>
          <dd class="mt-1 text-sm text-gray-700">{orden.Observacion}</dd>
        </div>
      {/if}
    </div>

    <div class="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
      <div class="border-b border-gray-200 px-4 py-3">
        <h2 class="text-lg font-medium text-gray-900">Ítems</h2>
        <p class="mt-1 text-sm text-gray-500">
          <span class="font-medium text-gray-700">Cant. proveedor</span>: unidades pedidas al proveedor (dato de la orden
          o calculado con la relación artículo–proveedor).
        </p>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Código</th>
              <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Artículo</th>
              <th class="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Cant. empresa</th>
              <th class="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Cant. proveedor</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            {#each orden.Items || [] as item}
              <tr>
                <td class="whitespace-nowrap px-4 py-2 font-mono text-sm text-gray-800">
                  {item.CodigoArticulo ?? '—'}
                </td>
                <td class="px-4 py-2 text-sm text-gray-900">
                  {item.Articulo?.Descripcion ?? '—'}
                </td>
                <td class="whitespace-nowrap px-4 py-2 text-right text-sm text-gray-700">
                  {item.Cantidad ?? 0}
                </td>
                <td class="whitespace-nowrap px-4 py-2 text-right text-sm text-gray-900">
                  {fmtCantProveedor(item.CantidadProveedor)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
