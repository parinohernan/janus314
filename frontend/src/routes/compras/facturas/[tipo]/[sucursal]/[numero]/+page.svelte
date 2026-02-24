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
  }

  interface CompraDetalle {
    DocumentoTipo: string;
    DocumentoSucursal: string;
    DocumentoNumero: string;
    Fecha: string;
    FechaFormateada?: string;
    ProveedorCodigo: string;
    ProveedorRelacion?: { Codigo: string; Descripcion: string; Cuit?: string; Telefono?: string };
    ImporteBruto?: number;
    ImporteNeto?: number;
    ImporteTotal: number;
    ImportePagado: number;
    Saldo: number;
    FechaAnulacion: string | null;
    Observacion?: string;
    Items: Item[];
  }

  const tipo = $page.params.tipo;
  const sucursal = $page.params.sucursal;
  const numero = $page.params.numero;

  let compra: CompraDetalle | null = null;
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      loading = true;
      error = null;
      const response = await fetchWithAuth(`/compras/${tipo}/${sucursal}/${numero}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Factura no encontrada');
        throw new Error('Error al cargar la factura');
      }
      compra = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  });

  const volver = () => goto('/compras/facturas');
</script>

<svelte:head>
  <title>Factura de compra {tipo} {sucursal}-{numero}</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
  {#if loading}
    <p class="text-gray-500">Cargando factura...</p>
  {:else if error}
    <p class="text-red-600">{error}</p>
    <Button on:click={volver} variant="secondary" class="mt-4">Volver al listado</Button>
  {:else if compra}
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-semibold text-gray-900">
        Factura de compra {compra.DocumentoTipo} {compra.DocumentoSucursal}-{compra.DocumentoNumero}
      </h1>
      <Button on:click={volver} variant="secondary">Volver al listado</Button>
    </div>

    <div class="mt-6 rounded-lg border border-gray-200 bg-white shadow">
      <div class="border-b border-gray-200 px-4 py-3">
        <h2 class="text-lg font-medium text-gray-900">Datos del comprobante</h2>
      </div>
      <dl class="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2">
        <div>
          <dt class="text-sm font-medium text-gray-500">Fecha</dt>
          <dd class="mt-1 text-sm text-gray-900">{formatDate(compra.FechaFormateada || compra.Fecha)}</dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500">Proveedor</dt>
          <dd class="mt-1 text-sm text-gray-900">
            {compra.ProveedorRelacion?.Descripcion ?? compra.ProveedorCodigo}
          </dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500">Importe total</dt>
          <dd class="mt-1 text-sm text-gray-900">
            {(compra.ImporteTotal ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
          </dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500">Importe pagado</dt>
          <dd class="mt-1 text-sm text-gray-900">
            {(compra.ImportePagado ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
          </dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500">Saldo</dt>
          <dd class="mt-1 text-sm text-gray-900">
            {(compra.Saldo ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
          </dd>
        </div>
        <div>
          <dt class="text-sm font-medium text-gray-500">Estado</dt>
          <dd class="mt-1 text-sm">
            {#if compra.FechaAnulacion}
              <span class="text-red-600">Anulada</span>
            {:else}
              <span class="text-green-600">Vigente</span>
            {/if}
          </dd>
        </div>
      </dl>
      {#if compra.Observacion}
        <div class="border-t border-gray-100 px-4 py-2">
          <dt class="text-sm font-medium text-gray-500">Observación</dt>
          <dd class="mt-1 text-sm text-gray-700">{compra.Observacion}</dd>
        </div>
      {/if}
    </div>

    <div class="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
      <div class="border-b border-gray-200 px-4 py-3">
        <h2 class="text-lg font-medium text-gray-900">Ítems</h2>
      </div>
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Artículo</th>
            <th class="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Cantidad</th>
            <th class="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">P. unit.</th>
            <th class="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Subtotal</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          {#each compra.Items || [] as item}
            <tr>
              <td class="px-4 py-2 text-sm text-gray-900">
                {item.Articulo?.Descripcion ?? item.CodigoArticulo}
              </td>
              <td class="whitespace-nowrap px-4 py-2 text-right text-sm text-gray-600">
                {item.Cantidad ?? 0}
              </td>
              <td class="whitespace-nowrap px-4 py-2 text-right text-sm text-gray-600">
                {(item.PrecioCostoUnitario ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </td>
              <td class="whitespace-nowrap px-4 py-2 text-right text-sm text-gray-900">
                {((item.Cantidad ?? 0) * (item.PrecioCostoUnitario ?? 0)).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
