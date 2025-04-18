<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  // Props
  export let formasPago: any[] = [];
  export let importeTotalFormasPago = 0;
  export let saldoPendiente = 0;

  // Estado local
  let nuevaFormaPago = {
    codigo: '',
    descripcion: '',
    total: 0
  };
  let mostrarFormularioPago = false;
  let error: string | null = null;

  // Event dispatcher
  const dispatch = createEventDispatcher();

  // Agregar forma de pago
  function agregarFormaPago() {
    if (!nuevaFormaPago.codigo || !nuevaFormaPago.descripcion || nuevaFormaPago.total <= 0) {
      error = 'Todos los campos son requeridos y el total debe ser mayor a 0';
      return;
    }

    // Verificar si el total excede el saldo pendiente
    if (nuevaFormaPago.total > saldoPendiente) {
      error = `El total no puede exceder el saldo pendiente (${saldoPendiente.toFixed(2)})`;
      return;
    }

    // Verificar si ya existe una forma de pago con el mismo código
    if (formasPago.some(fp => fp.codigo === nuevaFormaPago.codigo)) {
      error = 'Ya existe una forma de pago con este código';
      return;
    }

    // Agregar la nueva forma de pago
    const nuevaFP = { ...nuevaFormaPago };
    formasPago = [...formasPago, nuevaFP];
    
    // Calcular nuevo total
    importeTotalFormasPago = formasPago.reduce((total, fp) => total + (fp.total || 0), 0);
    
    // Calcular nuevo saldo pendiente
    saldoPendiente = saldoPendiente - nuevaFP.total;
    
    // Limpiar formulario
    nuevaFormaPago = { codigo: '', descripcion: '', total: 0 };
    mostrarFormularioPago = false;
    error = null;
    
    // Disparar evento de cambio
    dispatch('change', { formasPago, importeTotalFormasPago, saldoPendiente });
  }

  // Eliminar forma de pago
  function eliminarFormaPago(index: number) {
    const formaPagoEliminada = formasPago[index];
    formasPago = formasPago.filter((_, i) => i !== index);
    
    // Recalcular totales
    importeTotalFormasPago = formasPago.reduce((total, fp) => total + (fp.total || 0), 0);
    saldoPendiente = saldoPendiente + formaPagoEliminada.total;
    
    // Disparar evento de cambio
    dispatch('change', { formasPago, importeTotalFormasPago, saldoPendiente });
  }

  // Cerrar formulario
  function cerrarFormulario() {
    mostrarFormularioPago = false;
    nuevaFormaPago = { codigo: '', descripcion: '', total: 0 };
    error = null;
  }
</script>

<div class="mt-6 border-t pt-6">
  <div class="flex justify-between items-center mb-2">
    <h3 class="text-lg font-medium text-gray-900">2. Formas de Pago</h3>
    <button 
      type="button" 
      class="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
      on:click={() => mostrarFormularioPago = !mostrarFormularioPago}
    >
      {mostrarFormularioPago ? 'Cancelar' : 'Agregar Forma de Pago'}
    </button>
  </div>

  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p>{error}</p>
    </div>
  {/if}

  {#if mostrarFormularioPago}
    <div class="bg-gray-50 p-4 rounded-md mb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label for="codigo-pago" class="block text-sm font-medium text-gray-700 mb-1">Código</label>
          <input
            id="codigo-pago"
            type="text"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            placeholder="Ej: EF, TC, TD"
            bind:value={nuevaFormaPago.codigo}
          />
        </div>
        <div>
          <label for="descripcion-pago" class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <input
            id="descripcion-pago"
            type="text"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            placeholder="Ej: EFECTIVO, TARJETA DE CRÉDITO"
            bind:value={nuevaFormaPago.descripcion}
          />
        </div>
        <div>
          <label for="total-pago" class="block text-sm font-medium text-gray-700 mb-1">Total</label>
          <input
            id="total-pago"
            type="number"
            step="0.01"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            placeholder="0.00"
            bind:value={nuevaFormaPago.total}
          />
        </div>
      </div>
      <div class="mt-4 flex justify-end">
        <button 
          type="button" 
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          on:click={agregarFormaPago}
        >
          Agregar
        </button>
      </div>
    </div>
  {/if}

  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each formasPago as formaPago, index}
          <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {formaPago.codigo}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {formaPago.descripcion}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              ${formaPago.total.toFixed(2)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <button 
                type="button" 
                class="text-red-600 hover:text-red-800"
                on:click={() => eliminarFormaPago(index)}
              >
                Eliminar
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
      <tfoot class="bg-gray-50">
        <tr>
          <td colspan="2" class="px-6 py-4 text-right text-sm font-medium text-gray-900">Total Formas de Pago:</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">${importeTotalFormasPago.toFixed(2)}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </div>
</div> 