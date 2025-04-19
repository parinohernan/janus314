<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { FORMAS_PAGO, BANCOS } from '$lib/constants/formasPago';
  import type { FormaPago } from '$lib/constants/formasPago';

  // Props
  export let formasPago: FormaPago[] = [];
  export let importeTotalFormasPago = 0;
  export let saldoPendiente = 0;

  // Estado local
  let nuevaFormaPago: FormaPago = {
    codigo: '',
    descripcion: '',
    banco: '',
    numero: '',
    fecha: '',
    importe: 0
  };
  let mostrarFormularioPago = false;
  let error: string | null = null;

  // Event dispatcher
  const dispatch = createEventDispatcher();

  // Obtener descripción de forma de pago
  function getDescripcionFormaPago(codigo: string): string {
    const formaPago = FORMAS_PAGO.find(fp => fp.codigo === codigo);
    return formaPago ? formaPago.descripcion : '';
  }

  // Obtener descripción de banco
  function getDescripcionBanco(codigo: string): string {
    const banco = BANCOS.find(b => b.codigo === codigo);
    return banco ? banco.descripcion : '';
  }

  // Agregar forma de pago
  function agregarFormaPago() {
    if (!nuevaFormaPago.codigo || !nuevaFormaPago.descripcion || nuevaFormaPago.importe <= 0) {
      error = 'Todos los campos son requeridos y el importe debe ser mayor a 0';
      return;
    }

    // Verificar si el importe excede el saldo pendiente
    if (nuevaFormaPago.importe > saldoPendiente) {
      error = `El importe no puede exceder el saldo pendiente (${saldoPendiente.toFixed(2)})`;
      return;
    }

    // Verificar campos adicionales según el tipo de pago
    if (nuevaFormaPago.codigo === 'CH' && (!nuevaFormaPago.banco || !nuevaFormaPago.numero || !nuevaFormaPago.fecha)) {
      error = 'Para cheques se requiere banco, número y fecha';
      return;
    }

    if (nuevaFormaPago.codigo === 'TRF' && (!nuevaFormaPago.banco || !nuevaFormaPago.fecha)) {
      error = 'Para transferencias se requiere banco y fecha';
      return;
    }

    // Agregar la nueva forma de pago
    const nuevaFP = { ...nuevaFormaPago };
    formasPago = [...formasPago, nuevaFP];
    
    // Calcular nuevo total
    importeTotalFormasPago = formasPago.reduce((total, fp) => total + (fp.importe || 0), 0);
    
    // Calcular nuevo saldo pendiente
    saldoPendiente = saldoPendiente - nuevaFP.importe;
    
    // Limpiar formulario
    nuevaFormaPago = {
      codigo: '',
      descripcion: '',
      banco: '',
      numero: '',
      fecha: '',
      importe: 0
    };
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
    importeTotalFormasPago = formasPago.reduce((total, fp) => total + (fp.importe || 0), 0);
    saldoPendiente = saldoPendiente + formaPagoEliminada.importe;
    
    // Disparar evento de cambio
    dispatch('change', { formasPago, importeTotalFormasPago, saldoPendiente });
  }

  // Cerrar formulario
  function cerrarFormulario() {
    mostrarFormularioPago = false;
    nuevaFormaPago = {
      codigo: '',
      descripcion: '',
      banco: '',
      numero: '',
      fecha: '',
      importe: 0
    };
    error = null;
  }

  // Manejar cambio de tipo de forma de pago
  function handleTipoPagoChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const codigo = select.value;
    const formaPago = FORMAS_PAGO.find(fp => fp.codigo === codigo);
    
    if (formaPago) {
      nuevaFormaPago = {
        ...formaPago,
        importe: saldoPendiente
      };
    }
  }
</script>

<div class="mt-6 border-t pt-6">
  <div class="flex justify-between items-center mb-2">
    <h3 class="text-lg font-medium text-gray-900">Formas de Pago</h3>
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
          <label for="tipo-pago" class="block text-sm font-medium text-gray-700 mb-1">Tipo de Pago</label>
          <select
            id="tipo-pago"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            bind:value={nuevaFormaPago.codigo}
            on:change={handleTipoPagoChange}
          >
            <option value="">Seleccione un tipo</option>
            {#each FORMAS_PAGO as fp}
              <option value={fp.codigo}>{fp.descripcion}</option>
            {/each}
          </select>
        </div>

        {#if nuevaFormaPago.codigo === 'CH' || nuevaFormaPago.codigo === 'TRF'}
          <div>
            <label for="banco-pago" class="block text-sm font-medium text-gray-700 mb-1">Banco</label>
            <select
              id="banco-pago"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              bind:value={nuevaFormaPago.banco}
            >
              <option value="">Seleccione un banco</option>
              {#each BANCOS as banco}
                <option value={banco.codigo}>{banco.descripcion}</option>
              {/each}
            </select>
          </div>
        {/if}

        {#if nuevaFormaPago.codigo === 'CH'}
          <div>
            <label for="numero-pago" class="block text-sm font-medium text-gray-700 mb-1">Número de Cheque</label>
            <input
              id="numero-pago"
              type="text"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              placeholder="Ingrese el número de cheque"
              bind:value={nuevaFormaPago.numero}
            />
          </div>
        {/if}

        {#if nuevaFormaPago.codigo === 'TRF'}
          <div>
            <label for="numero-pago" class="block text-sm font-medium text-gray-700 mb-1">Número de Referencia</label>
            <input
              id="numero-pago"
              type="text"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              placeholder="Ingrese el número de referencia (opcional)"
              bind:value={nuevaFormaPago.numero}
            />
          </div>
        {/if}

        {#if nuevaFormaPago.codigo === 'CH' || nuevaFormaPago.codigo === 'TRF'}
          <div>
            <label for="fecha-pago" class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              id="fecha-pago"
              type="date"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              bind:value={nuevaFormaPago.fecha}
            />
          </div>
        {/if}

        <div>
          <label for="importe-pago" class="block text-sm font-medium text-gray-700 mb-1">Importe</label>
          <input
            id="importe-pago"
            type="number"
            step="0.01"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            placeholder="0.00"
            bind:value={nuevaFormaPago.importe}
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
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importe</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each formasPago as formaPago, index}
          <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {formaPago.descripcion}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {#if formaPago.codigo === 'CH'}
                Banco: {getDescripcionBanco(formaPago.banco ?? '')}<br>
                Número: {formaPago.numero}<br>
                Fecha: {formaPago.fecha}
              {:else if formaPago.codigo === 'TRF'}
                Banco: {getDescripcionBanco(formaPago.banco ?? '')}<br>
                {#if formaPago.numero}
                  Referencia: {formaPago.numero}<br>
                {/if}
                Fecha: {formaPago.fecha}
              {/if}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              ${formaPago.importe.toFixed(2)}
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