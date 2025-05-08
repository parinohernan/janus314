<script lang="ts">
  export let mostrarModalCobro: boolean;
  export let isLoading: boolean;
  export let selectedArticulos: any[] = [];
  export let montoPagado: number;
  export let cambio: number;
  export let setMontoPagado: (v: number) => void;
  export let calcularCambio: () => void;
  export let cancelar: () => void;
  export let terminar: () => void;

  function cantidadTotal(articulo: { cantidadEntera?: number; cantidadDecimal?: number }) {
    return (articulo.cantidadEntera || 0) + (articulo.cantidadDecimal || 0) / 1000;
  }
</script>

{#if mostrarModalCobro}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="cobro-modal-title" tabindex="-1">
    <section class="modal-content cobro-modal">
      <div class="modal-header">
        <h3 id="cobro-modal-title">Confirmar Pago</h3>
        <button class="modal-close" on:click={cancelar} aria-label="Cerrar">×</button>
      </div>
      <div class="cobro-content">
        {#if isLoading}
          <div class="loading">Procesando pago...</div>
        {:else}
          <div class="cobro-item">
            <span class="cobro-label">Total:</span>
            <span class="cobro-value">${Math.round(selectedArticulos.reduce((sum, a) => sum + ((a.PrecioVenta || 0) * cantidadTotal(a)), 0))}</span>
          </div>
          <div class="cobro-item">
            <label class="cobro-label" for="monto-pagado">Pagado:</label>
            <div class="cobro-input-container">
              <span class="input-currency">$</span>
              <input 
                id="monto-pagado" 
                type="number" 
                step="0.01" 
                min="0"
                value={Math.round(montoPagado).toString()}
                class="cobro-input"
                on:input={(e) => { setMontoPagado(Number((e.target as HTMLInputElement).value)); calcularCambio(); }}
                on:focus={(e) => { (e.target as HTMLInputElement).select(); }}
              />
            </div>
          </div>
          <div class="cobro-item cambio-item">
            <span class="cobro-label">Cambio:</span>
            <span class="cobro-value cambio-value">{Math.round(cambio)}</span>
          </div>
          <div class="cobro-actions">
            <button type="button" class="btn-secondary" on:click={cancelar}>Cancelar</button>
            <button type="button" class="btn-primary" on:click={terminar}>Terminar</button>
          </div>
        {/if}
      </div>
    </section>
    {#if !isLoading}
      <button class="modal-backdrop-btn" on:click={cancelar} aria-label="Cerrar modal"></button>
    {/if}
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .modal-content {
    background: var(--tg-theme-bg-color, #fff);
    width: 90%;
    max-width: 400px;
    border-radius: 8px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 102;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #eee;
  }
  
  .modal-header h3 {
    margin: 0;
  }
  
  .modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
  }
  
  .cobro-modal {
    max-width: 350px;
  }
  
  .cobro-content {
    padding: 20px;
  }
  
  .cobro-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
  }
  
  .cobro-label {
    font-weight: bold;
    font-size: 16px;
  }
  
  .cobro-value {
    font-size: 18px;
    font-weight: bold;
  }
  
  .cambio-item {
    margin-top: 20px;
    background-color: #f5f5f5;
    padding: 10px;
    border-radius: 4px;
    border-bottom: none;
  }
  
  .cambio-value {
    color: #2ecc71;
  }
  
  .cobro-input-container {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .input-currency {
    position: absolute;
    left: 10px;
    font-weight: bold;
  }
  
  .cobro-input {
    width: 120px;
    padding: 8px 8px 8px 25px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    text-align: right;
  }
  
  .cobro-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 25px;
  }
  
  .btn-secondary {
    padding: 10px 15px;
    border: 1px solid #ddd;
    background-color: #f5f5f5;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .btn-primary {
    padding: 10px 15px;
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .modal-backdrop-btn {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    z-index: 101;
    cursor: default;
  }
  
  .loading {
    text-align: center;
    padding: 20px;
  }
</style> 