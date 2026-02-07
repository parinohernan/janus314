<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  
  // Props
  export let show = false;
  export let factura: {
    DocumentoTipo: string;
    DocumentoSucursal: string;
    DocumentoNumero: string;
  };
  
  // Event dispatcher para comunicarse con el componente padre
  const dispatch = createEventDispatcher();
  
  // Determinar si es una nota de crédito
  $: esNotaCredito = factura?.DocumentoTipo?.startsWith('NC');
  
  // Función para cerrar el modal
  function close() {
    show = false;
    dispatch('close');
  }
  
  // Función para imprimir
  function imprimir() {
    dispatch('imprimir');
  }
  
  // Función para cancelar
  function cancelar() {
    dispatch('cancelar');
  }
</script>

{#if show}
  <div 
    class="modal-backdrop" 
    on:click|self={close}
    on:keydown={(e) => e.key === 'Escape' && close()}
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
        <h3 id="modal-title">{esNotaCredito ? 'Nota de crédito' : 'Factura'} creada exitosamente</h3>
        <button 
          class="close-button" 
          on:click={close}
          aria-label="Cerrar"
          type="button"
        >×</button>
      </div>
      
      <div class="modal-body">
        <div class="success-state">
          <div class="success-icon" aria-hidden="true">✅</div>
          <h4>¡{esNotaCredito ? 'Nota de crédito' : 'Factura'} guardada correctamente!</h4>
          
          <div class="factura-info">
            <div class="info-row">
              <span class="label">Tipo:</span>
              <span class="value">{factura.DocumentoTipo}</span>
            </div>
            <div class="info-row">
              <span class="label">Sucursal:</span>
              <span class="value">{factura.DocumentoSucursal}</span>
            </div>
            <div class="info-row">
              <span class="label">Número:</span>
              <span class="value">{factura.DocumentoNumero}</span>
            </div>
          </div>
          
          <p class="question">¿Desea imprimir {esNotaCredito ? 'la nota de crédito' : 'la factura'} ahora?</p>
          
          <div class="actions">
            <Button variant="primary" on:click={imprimir}>Sí, imprimir</Button>
            <Button variant="secondary" on:click={cancelar}>No, cancelar</Button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .success-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px 0;
  }
  
  .success-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  .factura-info {
    width: 100%;
    margin: 20px 0;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 16px;
    background-color: #f8fafc;
  }
  
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .info-row:last-child {
    border-bottom: none;
  }
  
  .label {
    font-weight: 600;
    color: #4a5568;
  }
  
  .question {
    font-size: 1.1rem;
    font-weight: 500;
    margin: 20px 0;
    color: #2d3748;
  }
  
  .actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 20px;
  }
</style> 