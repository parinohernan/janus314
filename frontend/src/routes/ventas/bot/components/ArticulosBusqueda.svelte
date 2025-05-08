<script lang="ts">
  import type { Articulo } from './types';
  import { fetchProductos } from './utils';

  export let agregarArticulo: (a: Articulo) => void;
  export let handleArticuloKeyDown: (e: KeyboardEvent, a: Articulo) => void;
  export let listaPrecios: string = '1';

  let productosFiltrados: Articulo[] = [];
  let busquedaProducto: string = '';
  let isLoading = false;
  let error: string | null = null;
  let timeoutId: number | null = null;

  async function buscarProductos() {
    if (busquedaProducto.length < 3) {
      productosFiltrados = [];
      return;
    }
    isLoading = true;
    try {
      productosFiltrados = await fetchProductos(busquedaProducto, listaPrecios);
      error = null;
    } catch (err) {
      error = 'Error al buscar productos';
      productosFiltrados = [];
    } finally {
      isLoading = false;
    }
  }

  function handleBusquedaProductoChange(event: Event) {
    busquedaProducto = (event.target as HTMLInputElement).value;
    if (timeoutId) clearTimeout(timeoutId);
    if (busquedaProducto.length >= 3) {
      timeoutId = setTimeout(() => {
        buscarProductos();
      }, 300);
    } else {
      productosFiltrados = [];
    }
  }
</script>

<div class="form-group">
  <h3>Buscar Artículos</h3>
  <div class="busqueda-container">
    <input 
      type="text" 
      id="busqueda-producto"
      value={busquedaProducto}
      placeholder="Buscar por código o descripción..."
      on:input={handleBusquedaProductoChange}
    />
    <button type="button" on:click={buscarProductos} class="btn-buscar">Buscar</button>
  </div>
  <div class="articulos-lista">
    {#if isLoading}
      <div class="loading">Buscando...</div>
    {:else if error}
      <div class="no-resultados">{error}</div>
    {:else if productosFiltrados.length === 0 && busquedaProducto.length >= 3}
      <div class="no-resultados">No se encontraron productos con "{busquedaProducto}"</div>
    {:else if productosFiltrados.length > 0}
      {#each productosFiltrados as articulo}
        <div 
          class="articulo-item" 
          on:click={() => agregarArticulo(articulo)}
          on:keydown={(e) => handleArticuloKeyDown(e, articulo)}
          role="button"
          tabindex="0"
        >
          <div class="articulo-info">
            <div class="articulo-codigo">{articulo.Codigo}</div>
            <div class="articulo-nombre">{articulo.Descripcion}</div>
          </div>
          <div class="articulo-actions">
            <div class="articulo-precio">${articulo.PrecioVenta?.toFixed(2) || '0.00'} (IVA incl.)</div>
            <button class="btn-add" type="button">
              <span aria-hidden="true">+</span>
              <span class="sr-only">Agregar artículo</span>
            </button>
          </div>
        </div>
      {/each}
    {:else}
      <div class="instrucciones">Escriba al menos 3 caracteres para buscar</div>
    {/if}
  </div>
</div>

<style>
  .busqueda-container {
    display: flex;
    margin-bottom: 10px;
  }
  
  .busqueda-container input {
    flex-grow: 1;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px 0 0 4px;
  }
  
  .btn-buscar {
    background: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    border: none;
    padding: 0 15px;
    border-radius: 0 4px 4px 0;
    cursor: pointer;
  }
  
  .articulos-lista {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #eee;
    border-radius: 4px;
    margin-bottom: 20px;
  }
  
  .articulo-item {
    padding: 10px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .articulo-info {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }
  
  .articulo-codigo {
    font-size: 0.8em;
    color: #666;
  }
  
  .articulo-nombre {
    font-weight: bold;
  }
  
  .articulo-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .articulo-precio {
    font-weight: bold;
    color: #2481cc;
  }
  
  .btn-add {
    background: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    border: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  
  .articulo-item:hover {
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
  }
  
  .no-resultados, .instrucciones {
    padding: 15px;
    text-align: center;
    color: #666;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style> 