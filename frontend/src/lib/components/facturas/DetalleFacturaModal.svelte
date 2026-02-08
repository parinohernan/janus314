<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { formatCurrency } from '$lib/utils/formatters';
  
  export let show = false;
  export let factura: any = null;
  export let items: any[] = [];
  export let loading = false;
  
  const dispatch = createEventDispatcher();
  
  function close() {
    show = false;
    dispatch('close');
  }
  
  function seleccionar() {
    dispatch('seleccionar', factura);
    close();
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" on:click={close}>
    <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white" on:click|stopPropagation>
      <!-- Header -->
      <div class="flex justify-between items-center mb-4 pb-3 border-b">
        <h3 class="text-lg font-semibold text-gray-900">
          Detalle de Factura {factura?.tipo}-{factura?.sucursal}-{factura?.numero}
        </h3>
        <button
          on:click={close}
          class="text-gray-400 hover:text-gray-600"
          aria-label="Cerrar"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {#if loading}
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      {:else if factura}
        <!-- Información de la factura -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p class="text-sm text-gray-600">Cliente:</p>
            <p class="font-medium">{factura.cliente}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Fecha:</p>
            <p class="font-medium">{new Date(factura.fecha).toLocaleDateString('es-AR')}</p>
          </div>
        </div>
        
        <!-- Items -->
        <div class="mb-4">
          <h4 class="font-semibold mb-2">Items:</h4>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cant.</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each items as item}
                  <tr>
                    <td class="px-4 py-2 text-sm">{item.CodigoArticulo || item.codigoArticulo}</td>
                    <td class="px-4 py-2 text-sm">{item.Descripcion || item.descripcion}</td>
                    <td class="px-4 py-2 text-sm text-right">{item.Cantidad || item.cantidad}</td>
                    <td class="px-4 py-2 text-sm text-right">{formatCurrency(item.PrecioUnitario || item.precioUnitario)}</td>
                    <td class="px-4 py-2 text-sm text-right">{formatCurrency((item.Cantidad || item.cantidad) * (item.PrecioUnitario || item.precioUnitario))}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Totales -->
        <div class="border-t pt-4">
          <div class="flex justify-end">
            <div class="w-64">
              <div class="flex justify-between mb-2">
                <span class="text-gray-600">Total:</span>
                <span class="font-bold text-lg">{formatCurrency(factura.total)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Botones -->
        <div class="flex justify-end gap-2 mt-6">
          <button
            on:click={close}
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cerrar
          </button>
          <button
            on:click={seleccionar}
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Usar esta factura
          </button>
        </div>
      {:else}
        <p class="text-center text-gray-500 py-8">No hay información de factura</p>
      {/if}
    </div>
  </div>
{/if}
