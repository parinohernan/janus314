<script lang="ts">
  import type { Articulo } from './types';
  import { fetchProductos } from './utils';
  import { onDestroy } from 'svelte';

  export let agregarArticulo: (a: Articulo) => void;
  export let handleArticuloKeyDown: (e: KeyboardEvent, a: Articulo) => void;
  export let listaPrecios: string = '1';

  let productosFiltrados: Articulo[] = [];
  let busquedaProducto: string = '';
  let isLoading = false;
  let error: string | null = null;
  let timeoutId: number | null = null;

  // Escaneo
  let tabActiva: 'buscar' | 'escanear' = 'buscar';

  // Variables para el modal de asociación
  let mostrarAsociarModal = false;
  let codigoEscaneado = '';
  let busquedaAsociar = '';
  let articulosAsociar: Articulo[] = [];
  let articuloSeleccionado: Articulo | null = null;
  let mostrarConfirmacionReemplazo = false;
  let timeoutIdAsociar: number | null = null;

  // Códigos de barras simulados para pruebas
  const codigosSimulados = [
    '7501234567890',
    '7509876543210',
    '7501112223334',
    '7504445556667',
    '7507778889990',
    '7501237894560',
    '7504561237890',
    '7507894561230',
    '7503216549870',
    '7506549873210'
  ];

  let codigoActual = 0;

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

  function simularEscaner(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const codigo = codigosSimulados[codigoActual];
    codigoActual = (codigoActual + 1) % codigosSimulados.length;
    busquedaProducto = codigo;
    buscarProductosPorCodigo(codigo);
  }

  async function buscarProductosPorCodigo(codigo: string) {
    isLoading = true;
    try {
      const resultados = await fetchProductos(codigo, listaPrecios);
      if (resultados.length > 0) {
        // Si encontramos el producto, lo agregamos directamente
        agregarArticulo(resultados[0]);
        // Limpiamos la búsqueda
        busquedaProducto = '';
        productosFiltrados = [];
      } else {
        // Si no encontramos el producto, abrimos el modal de asociación
        codigoEscaneado = codigo;
        mostrarAsociarModal = true;
        // Buscamos todos los productos para asociar
        articulosAsociar = await fetchProductos('', listaPrecios);
      }
      error = null;
    } catch (err) {
      error = 'Error al buscar productos';
      productosFiltrados = [];
    } finally {
      isLoading = false;
    }
  }

  async function asociarCodigoAArticulo(articulo: Articulo) {
    if (articulo.CodigoBarras) {
      articuloSeleccionado = articulo;
      mostrarConfirmacionReemplazo = true;
    } else {
      await confirmarAsociacion(articulo);
    }
  }

  async function confirmarAsociacion(articulo: Articulo) {
    try {
      // Aquí deberías hacer la llamada a tu API para asociar el código
      const response = await fetch('https://janus314-api.osvi.lat/api/articulos/asociar-codigo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigoArticulo: articulo.Codigo,
          codigoBarras: codigoEscaneado
        })
      });

      if (!response.ok) throw new Error('Error al asociar código');

      // Actualizar el artículo localmente
      articulo.CodigoBarras = codigoEscaneado;
      mostrarAsociarModal = false;
      mostrarConfirmacionReemplazo = false;
      articuloSeleccionado = null;
      busquedaProducto = '';
      productosFiltrados = [];
    } catch (error) {
      alert('Error al asociar el código de barras');
    }
  }

  function cancelarAsociacion() {
    mostrarAsociarModal = false;
    mostrarConfirmacionReemplazo = false;
    articuloSeleccionado = null;
    busquedaProducto = '';
    productosFiltrados = [];
  }

  function handleArticuloAsociarKeyDown(e: KeyboardEvent, articulo: Articulo) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      asociarCodigoAArticulo(articulo);
    }
  }

  function handleBusquedaAsociarChange(event: Event) {
    busquedaAsociar = (event.target as HTMLInputElement).value;
    if (timeoutIdAsociar) clearTimeout(timeoutIdAsociar);
    if (busquedaAsociar.length >= 3) {
      timeoutIdAsociar = setTimeout(async () => {
        try {
          articulosAsociar = await fetchProductos(busquedaAsociar, listaPrecios);
        } catch (err) {
          console.error('Error al buscar productos:', err);
        }
      }, 300);
    } else if (busquedaAsociar.length === 0) {
      // Si el campo está vacío, mostrar todos los productos
      fetchProductos('', listaPrecios).then(resultados => {
        articulosAsociar = resultados;
      }).catch(err => {
        console.error('Error al cargar productos:', err);
      });
    }
  }

  // Manejar cambio de pestaña
  function cambiarTab(event: MouseEvent, nuevaTab: 'buscar' | 'escanear') {
    event.preventDefault();
    event.stopPropagation();
    tabActiva = nuevaTab;
  }
</script>

<div class="form-group">
  <div class="tabs">
    <button 
      class="tab-btn {tabActiva === 'buscar' ? 'activa' : ''}" 
      on:click={(e) => cambiarTab(e, 'buscar')}
      type="button"
      on:keydown|stopPropagation
    >
      Buscar
    </button>
    <button 
      class="tab-btn {tabActiva === 'escanear' ? 'activa' : ''}" 
      on:click={(e) => cambiarTab(e, 'escanear')}
      type="button"
      on:keydown|stopPropagation
    >
      Escanear
    </button>
  </div>

  {#if tabActiva === 'buscar'}
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
  {:else}
    <div class="escaner-container">
      <div class="simulador-escaner">
        <p>Simulador de escáner</p>
        <p class="codigo-actual">Código actual: {codigosSimulados[codigoActual]}</p>
        <button 
          class="btn-primary" 
          on:click={simularEscaner}
          type="button"
          on:keydown|stopPropagation
        >
          Simular escaneo
        </button>
      </div>
    </div>
  {/if}

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

  {#if mostrarAsociarModal}
    <div class="modal modal-asociar">
      <div class="modal-content modal-asociar-content">
        <button class="modal-close" on:click={cancelarAsociacion}>×</button>
        <h4>No se encontró ningún artículo con el código "{codigoEscaneado}"</h4>
        <p>¿Deseas asociarlo a un artículo existente?</p>
        <input 
          type="text" 
          placeholder="Buscar artículo por nombre o código..." 
          value={busquedaAsociar}
          on:input={handleBusquedaAsociarChange}
          class="input-busqueda"
        />
        <div class="lista-articulos">
          {#each articulosAsociar as articulo}
            <div 
              class="articulo-item" 
              on:click={() => asociarCodigoAArticulo(articulo)}
              on:keydown={(e) => handleArticuloAsociarKeyDown(e, articulo)}
              role="button"
              tabindex="0"
            >
              <div class="articulo-info">
                <strong>{articulo.Codigo}</strong> - {articulo.Descripcion}
                {#if articulo.CodigoBarras}
                  <div class="codigo-barras-existente">
                    Código actual: {articulo.CodigoBarras}
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" on:click={cancelarAsociacion}>Cancelar</button>
        </div>
      </div>
    </div>
  {/if}

  {#if mostrarConfirmacionReemplazo && articuloSeleccionado}
    <div class="modal modal-confirmacion">
      <div class="modal-content modal-confirmacion-content">
        <button class="modal-close" on:click={cancelarAsociacion}>×</button>
        <h4>Confirmar reemplazo de código de barras</h4>
        <p>El artículo "{articuloSeleccionado.Descripcion}" ya tiene un código de barras asociado:</p>
        <p class="codigo-actual">Código actual: {articuloSeleccionado.CodigoBarras}</p>
        <p>¿Deseas reemplazarlo por el nuevo código "{codigoEscaneado}"?</p>
        <div class="modal-actions">
          <button class="btn-secondary" on:click={cancelarAsociacion}>Cancelar</button>
          <button class="btn-primary" on:click={() => confirmarAsociacion(articuloSeleccionado!)}>
            Confirmar reemplazo
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .tabs {
    display: flex;
    gap: 1px;
    background: #ddd;
    padding: 1px;
    border-radius: 4px 4px 0 0;
    margin-bottom: 0;
  }

  .tab-btn {
    flex: 1;
    padding: 12px;
    border: none;
    background: #f5f5f5;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.2s;
  }

  .tab-btn:first-child {
    border-radius: 4px 0 0 0;
  }

  .tab-btn:last-child {
    border-radius: 0 4px 0 0;
  }

  .tab-btn.activa {
    background: #fff;
    font-weight: bold;
  }

  .busqueda-container {
    display: flex;
    margin-bottom: 10px;
    padding: 10px;
    background: #fff;
    border: 1px solid #ddd;
    border-top: none;
    border-radius: 0 0 4px 4px;
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

  .simulador-escaner {
    text-align: center;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    margin: 10px;
  }

  .codigo-actual {
    font-family: monospace;
    font-size: 1.2em;
    margin: 10px 0;
    padding: 10px;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .btn-primary {
    background: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }

  .btn-primary:hover {
    opacity: 0.9;
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

  .modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    max-width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
  }

  .modal-close {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    color: #666;
  }

  .modal-asociar-content {
    width: 500px;
  }

  .input-busqueda {
    width: 100%;
    padding: 8px;
    margin: 10px 0;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .lista-articulos {
    max-height: 300px;
    overflow-y: auto;
    margin: 10px 0;
  }

  .codigo-barras-existente {
    font-size: 0.8em;
    color: #666;
    margin-top: 4px;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }

  .btn-secondary {
    background: #f5f5f5;
    border: 1px solid #ddd;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }

  .btn-secondary:hover {
    background: #eee;
  }
</style> 