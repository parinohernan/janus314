<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { AfipService } from '$lib/services/AfipService';
  
  // Props
  export let show = false;
  export let factura: {
    DocumentoTipo: string;
    DocumentoSucursal: string;
    DocumentoNumero: string;
  };
  
  // Estados
  let loading = false;
  let error: string | null = null;
  let caeData: any = null;
  
  // Event dispatcher para comunicarse con el componente padre
  const dispatch = createEventDispatcher();
  
  // Función para cerrar el modal
  function close() {
    show = false;
    dispatch('close');
  }
  
  // Función para solicitar CAE
  async function solicitarCae() {
    if (!factura) return;
    
    loading = true;
    error = null;
    // factura.tipo = factura.DocumentoTipo;
    // factura.puntoVenta = factura.DocumentoSucursal;
    // factura.numero = factura.DocumentoNumero;
    console.log('Solndo CAE... t', factura);
    try {
      // Obtener CAE del servicio
      const result = await AfipService.obtenerCae(
        factura.DocumentoTipo,

        factura.DocumentoSucursal,
        factura.DocumentoNumero
      );
      
      console.log('Respuesta de obtención de CAE:', result);
      
      if (result.success) {
        caeData = result.data;
        dispatch('caeObtenido', caeData);
      } else {
        error = result.error || 'Error al obtener CAE';
      }
    } catch (err) {
      console.error('Error solicitando CAE:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  }
  
  // Solicitar CAE automáticamente cuando se muestra el modal
  $: if (show) {
    solicitarCae();
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
        <h3 id="modal-title">Proceso de autorización AFIP</h3>
        <button 
          class="close-button" 
          on:click={close}
          aria-label="Cerrar"
          type="button"
        >×</button>
      </div>
      
      <div class="modal-body">
        {#if loading}
          <div class="loading-state">
            <div class="spinner" aria-hidden="true"></div>
            <p>Solicitando CAE a AFIP...</p>
          </div>
        {:else if error}
          <div class="error-state">
            <div class="error-icon" aria-hidden="true">❌</div>
            <h4>Error en la autorización</h4>
            <p>{error}</p>
            <Button variant="secondary" on:click={solicitarCae}>Reintentar</Button>
          </div>
        {:else if caeData}
          <div class="success-state">
            <div class="success-icon" aria-hidden="true">✅</div>
            <h4>Factura autorizada correctamente</h4>
            
            <div class="cae-info">
              <div class="info-row">
                <span class="label">CAE:</span>
                <span class="value">{caeData.cae}</span>
              </div>
              <div class="info-row">
                <span class="label">Vencimiento:</span>
                <span class="value">{caeData.fechaVencimiento}</span>
              </div>
              {#if caeData.observaciones}
                <div class="info-row">
                  <span class="label">Observaciones:</span>
                  <span class="value">{caeData.observaciones}</span>
                </div>
              {/if}
            </div>
            
            <div class="actions">
              <Button variant="primary" on:click={close}>Aceptar</Button>
              <Button variant="secondary" on:click={() => dispatch('imprimir')}>Imprimir</Button>
            </div>
          </div>
        {/if}
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
  
  .loading-state, .error-state, .success-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px 0;
  }
  
  .spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 2s linear infinite;
    margin-bottom: 16px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .error-icon, .success-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  .cae-info {
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
  
  .actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 20px;
  }
</style> 