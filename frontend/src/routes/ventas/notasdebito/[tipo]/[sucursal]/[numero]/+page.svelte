<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { formatDate } from '$lib/utils/dateUtils';
  import { toast, confirm } from '$lib/utils/toast';

  // Parámetros de la URL
  $: tipo = $page.params.tipo;
  $: sucursal = $page.params.sucursal;
  $: numero = $page.params.numero;

  // Estado
  let loading = true;
  let error: string | null = null;
  let notaDebito: any = null;

  // Función para cargar la nota de débito
  async function cargarNotaDebito() {
    try {
      loading = true;
      error = null;

      const response = await fetchWithAuth(`/notasdebito/${tipo}/${sucursal}/${numero}`);

      if (!response.ok) {
        throw new Error('Error al cargar la nota de débito');
      }

      notaDebito = await response.json();
      console.log('Nota de débito cargada:', notaDebito);
    } catch (err) {
      console.error('Error cargando nota de débito:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  }

  // Función para anular la nota de débito
  async function anularNotaDebito() {
    const ok = await confirm('¿Está seguro que desea anular esta nota de débito?');
    if (!ok) return;

    try {
      const response = await fetchWithAuth(`/notasdebito/${tipo}/${sucursal}/${numero}/anular`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al anular la nota de débito');
      }

      toast.success('Nota de débito anulada correctamente');
      await cargarNotaDebito();
    } catch (err) {
      console.error('Error anulando nota de débito:', err);
      toast.error(err instanceof Error ? err.message : 'Error al anular la nota de débito');
    }
  }

  // Función para volver al listado
  function volverAlListado() {
    goto('/ventas/notasdebito');
  }

  // Cargar datos al montar
  onMount(() => {
    cargarNotaDebito();
  });

  // Función para obtener el nombre del tipo de documento
  function getTipoDocumentoLabel(tipo: string): string {
    switch (tipo) {
      case 'NDA':
        return 'Nota de Débito A';
      case 'NDB':
        return 'Nota de Débito B';
      case 'NDF':
        return 'Nota de Débito F';
      default:
        return tipo;
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-6xl mx-auto">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Detalle de Nota de Débito</h1>
      <Button variant="secondary" on:click={volverAlListado}>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Volver al Listado
      </Button>
    </div>

    {#if loading}
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    {:else if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>{error}</p>
      </div>
    {:else if notaDebito}
      <div class="bg-white rounded-lg shadow-sm p-6">
        <!-- Encabezado -->
        <div class="border-b pb-4 mb-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 class="text-lg font-semibold mb-2">Información del Documento</h2>
              <div class="space-y-2">
                <div class="flex">
                  <span class="font-medium text-gray-600 w-32">Tipo:</span>
                  <span class="text-gray-900">{getTipoDocumentoLabel(notaDebito.DocumentoTipo)}</span>
                </div>
                <div class="flex">
                  <span class="font-medium text-gray-600 w-32">Número:</span>
                  <span class="text-gray-900">{notaDebito.DocumentoSucursal}-{notaDebito.DocumentoNumero}</span>
                </div>
                <div class="flex">
                  <span class="font-medium text-gray-600 w-32">Fecha:</span>
                  <span class="text-gray-900">{formatDate(notaDebito.Fecha)}</span>
                </div>
                <div class="flex">
                  <span class="font-medium text-gray-600 w-32">Estado:</span>
                  {#if notaDebito.FechaAnulacion}
                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      Anulada - {formatDate(notaDebito.FechaAnulacion)}
                    </span>
                  {:else}
                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Activa
                    </span>
                  {/if}
                </div>
              </div>
            </div>

            <div>
              <h2 class="text-lg font-semibold mb-2">Información del Cliente</h2>
              <div class="space-y-2">
                <div class="flex">
                  <span class="font-medium text-gray-600 w-32">Cliente:</span>
                  <span class="text-gray-900">
                    {notaDebito.ClienteRelacion ? notaDebito.ClienteRelacion.Descripcion : 'N/A'}
                  </span>
                </div>
                <div class="flex">
                  <span class="font-medium text-gray-600 w-32">Código:</span>
                  <span class="text-gray-900">{notaDebito.ClienteCodigo}</span>
                </div>
                {#if notaDebito.VendedorRelacion}
                  <div class="flex">
                    <span class="font-medium text-gray-600 w-32">Vendedor:</span>
                    <span class="text-gray-900">{notaDebito.VendedorRelacion.Descripcion}</span>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="mb-6">
          <h2 class="text-lg font-semibold mb-4">Items</h2>
          {#if notaDebito.Items && notaDebito.Items.length > 0}
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Importe
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each notaDebito.Items as item}
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-900">
                        {item.Descripcion}
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-900 text-right">
                        ${item.Importe ? item.Importe.toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <div class="text-center py-8 bg-gray-50 rounded-md">
              <p class="text-gray-500">No hay items en esta nota de débito</p>
            </div>
          {/if}
        </div>

        <!-- Totales -->
        <div class="border-t pt-4">
          <div class="flex justify-end">
            <div class="w-full md:w-1/2 lg:w-1/3">
              <div class="bg-gray-50 p-4 rounded-md space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Subtotal:</span>
                  <span class="font-medium">
                    ${notaDebito.ImporteNeto ? notaDebito.ImporteNeto.toFixed(2) : '0.00'}
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">IVA (21%):</span>
                  <span class="font-medium">
                    ${notaDebito.ImporteIva1 ? notaDebito.ImporteIva1.toFixed(2) : '0.00'}
                  </span>
                </div>
                <div class="flex justify-between text-base font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>
                    ${notaDebito.ImporteTotal ? notaDebito.ImporteTotal.toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div class="mt-6 flex justify-end gap-3">
          {#if !notaDebito.FechaAnulacion}
            <Button variant="danger" on:click={anularNotaDebito}>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Anular Nota de Débito
            </Button>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
