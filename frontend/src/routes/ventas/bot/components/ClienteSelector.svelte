<script lang="ts">
  import type { Cliente } from './types';
  export let clientesFiltrados: Cliente[] = [];
  export let mostrarModalClientes: boolean;
  export let busquedaCliente: string;
  export let filtrarClientes: (e: Event) => void;
  export let seleccionarCliente: (c: Cliente) => void;
  export let cerrar: () => void;
</script>

{#if mostrarModalClientes}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
    <section class="modal-content" role="document">
      <div class="modal-header">
        <h3 id="modal-title">Seleccionar Cliente</h3>
        <button class="modal-close" on:click={cerrar} aria-label="Cerrar">×</button>
      </div>
      <input type="text" placeholder="Buscar cliente..." on:input={filtrarClientes} class="cliente-busqueda" value={busquedaCliente} />
      <div class="clientes-lista">
        <button class="cliente-item" on:click={() => seleccionarCliente({Codigo: 'CF', Descripcion: 'Consumidor Final'})} type="button">
          <strong>Consumidor Final</strong>
        </button>
        {#each clientesFiltrados as c}
          <button class="cliente-item" on:click={() => seleccionarCliente(c)} type="button">
            <strong>{c.Codigo}</strong> - {c.Descripcion}
          </button>
        {/each}
      </div>
    </section>
    <button class="modal-backdrop-btn" on:click={cerrar} aria-label="Cerrar modal"></button>
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
  
  .cliente-busqueda {
    padding: 12px;
    border: none;
    border-bottom: 1px solid #eee;
    width: 100%;
  }
  
  .clientes-lista {
    overflow-y: auto;
    max-height: 60vh;
  }
  
  .cliente-item {
    padding: 12px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    border-bottom: 1px solid #eee;
    font-size: 1em;
  }
  
  .cliente-item:hover {
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
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
</style> 