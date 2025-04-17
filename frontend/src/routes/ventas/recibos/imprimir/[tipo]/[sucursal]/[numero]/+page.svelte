<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { PUBLIC_API_URL } from '$env/static/public';
  import Button from '$lib/components/ui/Button.svelte';
  import { formatDate } from '$lib/utils/dateUtils';

  // Obtener parámetros de la URL
  const tipo = $page.params.tipo;
  const sucursal = $page.params.sucursal;
  const numero = $page.params.numero;

  // Estado para los datos del recibo
  let recibo: any = null;
  let loading = true;
  let error: string | null = null;

  // Cargar datos del recibo
  const cargarRecibo = async () => {
    try {
      loading = true;
      error = null;
      
      const response = await fetch(`${PUBLIC_API_URL}/recibos/${tipo}/${sucursal}/${numero}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Recibo no encontrado');
        }
        throw new Error('Error al cargar el recibo');
      }
      
      recibo = await response.json();
    } catch (err) {
      console.error('Error cargando recibo:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };

  // Función para imprimir el recibo
  const imprimirRecibo = () => {
    window.print();
  };

  // Función para volver a la lista de recibos
  const volverALista = () => {
    goto('/ventas/recibos');
  };

  // Cargar datos al montar el componente
  onMount(() => {
    cargarRecibo();
  });
</script>

<div class="container mx-auto px-4 py-8">
  <!-- Botones de acción (no se imprimen) -->
  <div class="flex justify-between mb-6 print:hidden">
    <Button variant="secondary" on:click={volverALista}>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Volver
    </Button>
    <Button variant="primary" on:click={imprimirRecibo}>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Imprimir
    </Button>
  </div>

  <!-- Contenido del recibo -->
  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p>{error}</p>
    </div>
  {:else if recibo}
    <div class="bg-white rounded-lg shadow-sm p-8 max-w-4xl mx-auto">
      <!-- Encabezado del recibo -->
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold mb-2">RECIBO</h1>
        <p class="text-gray-600">Número: {recibo.DocumentoSucursal}-{recibo.DocumentoNumero}</p>
        <p class="text-gray-600">Fecha: {formatDate(recibo.Fecha)}</p>
        {#if recibo.FechaAnulacion}
          <div class="mt-2">
            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
              ANULADO
            </span>
            <p class="text-sm text-red-600 mt-1">Fecha de anulación: {formatDate(recibo.FechaAnulacion)}</p>
          </div>
        {/if}
      </div>

      <!-- Información del cliente -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold mb-2">Cliente</h2>
        <div class="border rounded p-4">
          <p class="font-medium">{recibo.ClienteRelacion?.Descripcion || 'Cliente no asignado'}</p>
          {#if recibo.ClienteRelacion?.NombreFantasia}
            <p class="text-gray-600">{recibo.ClienteRelacion.NombreFantasia}</p>
          {/if}
        </div>
      </div>

      <!-- Detalles del pago -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold mb-2">Detalles del Pago</h2>
        <div class="border rounded overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Importe</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#if recibo.Detalles && recibo.Detalles.length > 0}
                {#each recibo.Detalles as detalle}
                  <tr>
                    <td class="px-4 py-3 whitespace-nowrap">{detalle.Concepto}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-right">
                      {detalle.Importe.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                    </td>
                  </tr>
                {/each}
              {:else}
                <tr>
                  <td colspan="2" class="px-4 py-3 text-center text-gray-500">No hay detalles disponibles</td>
                </tr>
              {/if}
            </tbody>
            <tfoot class="bg-gray-50">
              <tr>
                <td class="px-4 py-3 text-right font-medium">Total:</td>
                <td class="px-4 py-3 text-right font-bold">
                  {recibo.ImporteTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Observaciones -->
      {#if recibo.Observaciones}
        <div class="mb-8">
          <h2 class="text-lg font-semibold mb-2">Observaciones</h2>
          <div class="border rounded p-4">
            <p class="whitespace-pre-line">{recibo.Observaciones}</p>
          </div>
        </div>
      {/if}

      <!-- Pie del recibo -->
      <div class="mt-12 pt-8 border-t">
        <div class="grid grid-cols-2 gap-8">
          <div>
            <p class="text-center font-medium">Firma del Cliente</p>
            <div class="border-t border-dashed mt-16"></div>
          </div>
          <div>
            <p class="text-center font-medium">Firma del Empleado</p>
            <div class="border-t border-dashed mt-16"></div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  @media print {
    body {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    
    .print\:hidden {
      display: none !important;
    }
    
    .container {
      padding: 0 !important;
    }
    
    .bg-white {
      box-shadow: none !important;
    }
  }
</style> 