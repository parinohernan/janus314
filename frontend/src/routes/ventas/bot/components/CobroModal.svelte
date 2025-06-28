<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ArticuloSeleccionado } from './types';
  import type { Cliente } from './types';
  import FormasPago from '$lib/components/recibos/FormasPago.svelte';
  import type { FormaPago } from '$lib/constants/formasPago';
  
  export let mostrarModalCobro: boolean = false;
  export let isLoading: boolean = false;
  export let selectedArticulos: ArticuloSeleccionado[] = [];
  export let clienteSeleccionado: Cliente;
  
  // Props para formas de pago
  export let formasPago: FormaPago[] = [];
  export let importeTotalFormasPago = 0;
  export let saldoPendiente = 0;

  const dispatch = createEventDispatcher();

  // Calcular total de la venta
  $: importeTotal = selectedArticulos.reduce((sum, a) => sum + ((a.PrecioVenta || 0) * ((a.cantidadEntera || 0) + (a.cantidadDecimal || 0) / 1000)), 0);

  // Inicializar saldo pendiente cuando se abre el modal
  $: if (mostrarModalCobro) {
    saldoPendiente = importeTotal;
    }

  function handleFormasPagoChange(event: CustomEvent) {
    const { formasPago: nuevasFormasPago, importeTotalFormasPago: nuevoTotal, saldoPendiente: nuevoSaldo } = event.detail;
    formasPago = nuevasFormasPago;
    importeTotalFormasPago = nuevoTotal;
    saldoPendiente = nuevoSaldo;
    dispatch('formasPagoChange', event.detail);
  }

  function handleCancelar() {
    formasPago = [];
    importeTotalFormasPago = 0;
    saldoPendiente = importeTotal;
    dispatch('cancelar');
        }

  function handleTerminar() {
    if (saldoPendiente > 0) {
      alert('Debe cubrir el importe total de la venta');
      return;
      }
    if (formasPago.length === 0) {
      alert('Debe agregar al menos una forma de pago');
      return;
    }
    dispatch('terminar');
  }
</script>

{#if mostrarModalCobro}
  <div 
    class="modal-overlay" 
    role="presentation"
  >
    <div 
      class="modal-content" 
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabindex="-1"
    >
      <div class="modal-header">
        <h2 id="modal-title">Cobro de Venta</h2>
        <button 
          class="btn-close" 
          on:click={handleCancelar}
          on:keydown={(e) => e.key === 'Escape' && handleCancelar()}
          aria-label="Cerrar modal"
          type="button"
        >×</button>
      </div>

      <div class="modal-body">
        <div class="cliente-info">
          <strong>Cliente:</strong> {clienteSeleccionado.Descripcion}
        </div>

        <div class="total-info">
          <strong>Total a Cobrar:</strong> ${importeTotal.toFixed(2)}
        </div>

        <div 
          class="saldo-info" 
          class:pendiente={saldoPendiente > 0} 
          class:completo={saldoPendiente === 0}
          role="status"
          aria-live="polite"
        >
          <strong>Saldo Pendiente:</strong> ${saldoPendiente.toFixed(2)}
        </div>

        <FormasPago
          bind:formasPago
          bind:importeTotalFormasPago
          bind:saldoPendiente
          incluirFormasAplicaSaldo={true}
          on:change={handleFormasPagoChange}
        />
      </div>

      <div class="modal-footer">
        <button 
          class="btn-cancelar" 
          on:click={handleCancelar}
          on:keydown={(e) => e.key === 'Escape' && handleCancelar()}
          disabled={isLoading}
          type="button"
        >
          Cancelar
        </button>
        <button 
          class="btn-terminar" 
          on:click={handleTerminar}
          on:keydown={(e) => e.key === 'Enter' && handleTerminar()}
          disabled={isLoading || saldoPendiente > 0 || formasPago.length === 0}
          type="button"
        >
          {isLoading ? 'Procesando...' : 'Terminar Venta'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    outline: none; /* Para el foco del tabindex */
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
  }
  
  .btn-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    color: #666;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .btn-close:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  .btn-close:focus {
    outline: 2px solid #2481cc;
    outline-offset: 2px;
  }
  
  .modal-body {
    margin-bottom: 20px;
  }
  
  .cliente-info,
  .total-info,
  .saldo-info {
    margin-bottom: 15px;
    padding: 10px;
    background: #f5f5f5;
    border-radius: 4px;
  }
  
  .saldo-info.pendiente {
    background: #fff3e0;
    color: #e65100;
  }
  
  .saldo-info.completo {
    background: #e8f5e9;
    color: #2e7d32;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  
  .btn-cancelar,
  .btn-terminar {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    min-width: 100px;
  }

  .btn-cancelar {
    background: #f44336;
    color: white;
  }

  .btn-terminar {
    background: #4caf50;
    color: white;
  }

  .btn-cancelar:disabled,
  .btn-terminar:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .btn-cancelar:focus,
  .btn-terminar:focus {
    outline: 2px solid #2481cc;
    outline-offset: 2px;
  }
</style> 