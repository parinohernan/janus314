<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import {
    ProveedorService,
    type ComprobanteProveedor,
    type ProveedorCuentaCorriente
  } from '$lib/services/ProveedorService';

  const proveedorId = $page.params.id;
  let comprobantes: ComprobanteProveedor[] = [];
  let proveedorNombre = '';
  let saldoTotal = 0;
  let loading = true;
  let error: string | null = null;

  let currentPage = 1;
  let totalPages = 1;
  let totalItems = 0;
  let itemsPerPage = 25;

  const loadData = async (page: number = 1): Promise<void> => {
    try {
      loading = true;
      error = null;
      const ccResult = await ProveedorService.obtenerCuentasCorrientes({
        page: 1,
        limit: 1000,
        search: proveedorId,
        field: 'Codigo',
        order: 'ASC'
      });
      const prov = ccResult.items.find((p: ProveedorCuentaCorriente) => p.Codigo === proveedorId);
      if (prov) {
        proveedorNombre = prov.Descripcion;
        saldoTotal = prov.Saldo ?? 0;
      }
      const compResult = await ProveedorService.obtenerComprobantesProveedor(
        proveedorId,
        page,
        itemsPerPage
      );
      comprobantes = compResult.items;
      currentPage = compResult.meta.currentPage;
      totalPages = compResult.meta.totalPages;
      totalItems = compResult.meta.totalItems;
    } catch (err: unknown) {
      console.error('Error cargando datos:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value);
  };

  const tipoLabel = (tipo: string): string => {
    const map: Record<string, string> = {
      COM: 'Compra',
      NC: 'Nota Crédito',
      ND: 'Nota Débito',
      REC: 'Recibo'
    };
    return map[tipo] ?? tipo;
  };

  onMount(() => {
    loadData(1);
  });
</script>

<svelte:head>
  <title>Cuenta corriente - {proveedorNombre || proveedorId}</title>
</svelte:head>

<div class="container mx-auto p-4">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
    <h1 class="text-2xl font-bold">Cuenta corriente - {proveedorNombre || proveedorId}</h1>
    <div class="flex gap-2">
      <Button
        variant="primary"
        on:click={async () => {
          try {
            await ProveedorService.generarPDFCuentaCorriente(proveedorId);
          } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Error al generar PDF');
          }
        }}
      >
        Generar PDF
      </Button>
      <Button variant="secondary" on:click={() => goto('/compras/cuentascorrientes')}>
        Volver al listado
      </Button>
    </div>
  </div>

  {#if loading}
    <p class="text-gray-500">Cargando...</p>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <p>{error}</p>
      <Button variant="secondary" class="mt-2" on:click={() => loadData(1)}>Reintentar</Button>
    </div>
  {:else}
    <div class="mb-4 rounded-lg border bg-white p-4 shadow-sm">
      <p class="text-sm text-gray-600">Proveedor: <span class="font-medium text-gray-900">{proveedorNombre || proveedorId}</span></p>
      <p class="text-sm text-gray-600">Saldo actual: <span class="font-medium text-gray-900">{formatCurrency(saldoTotal)}</span></p>
    </div>

    <div class="overflow-x-auto rounded-lg border bg-white shadow">
      <table class="min-w-full">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Fecha</th>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Detalle</th>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Tipo</th>
            <th class="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Débitos</th>
            <th class="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Créditos</th>
            <th class="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {#each comprobantes as comp}
            <tr class="border-b border-gray-100 hover:bg-gray-50">
              <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-700">{formatDate(comp.Fecha)}</td>
              <td class="px-4 py-2 text-sm text-gray-700">{comp.Detalle}</td>
              <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-600">{tipoLabel(comp.TipoComprobante)}</td>
              <td class="whitespace-nowrap px-4 py-2 text-right text-sm text-gray-700">{formatCurrency(comp.Debitos ?? 0)}</td>
              <td class="whitespace-nowrap px-4 py-2 text-right text-sm text-gray-700">{formatCurrency(comp.Creditos ?? 0)}</td>
              <td class="whitespace-nowrap px-4 py-2 text-right text-sm font-medium text-gray-900">{formatCurrency(comp.Saldo ?? 0)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if totalPages > 1}
      <div class="mt-4 flex justify-between items-center text-sm">
        <p class="text-gray-600">
          Mostrando {(currentPage - 1) * itemsPerPage + 1} a
          {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}
        </p>
        <div class="flex gap-2">
          <Button
            variant="secondary"
            disabled={currentPage <= 1}
            on:click={() => loadData(currentPage - 1)}
          >
            Anterior
          </Button>
          <span class="py-1">Página {currentPage} de {totalPages}</span>
          <Button
            variant="secondary"
            disabled={currentPage >= totalPages}
            on:click={() => loadData(currentPage + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    {/if}
  {/if}
</div>
