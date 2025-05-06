<script lang="ts">
  import { onMount } from 'svelte';
  
  // Definición de tipos para Telegram WebApp
  interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
      user?: {
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
      };
    };
    expand: () => void;
    close: () => void;
    enableClosingConfirmation: () => void;
    sendData: (data: string) => void;
  }
  
  // Interfaces para tipos
  interface Articulo {
    Codigo: string;
    Descripcion: string;
    PrecioVenta: number;
    Existencia?: number;
  }
  
  interface Cliente {
    Codigo: string;
    Descripcion: string;
  }
  
  interface ArticuloSeleccionado extends Articulo {
    cantidad: number;
  }
  
  // Estado del formulario con tipos definidos
  let cliente: string = '';
  let clientes: Cliente[] = [];
  let articulos: Articulo[] = [];
  let selectedArticulos: ArticuloSeleccionado[] = [];
  let isLoading: boolean = false;
  let error: string | null = null;
  let success: string | null = null;
  
  // Referencia al objeto de Telegram WebApp
  let tg: TelegramWebApp | null = null;
  
  onMount(async () => {
    try {
      // Inicializar el objeto de Telegram WebApp
      if (typeof window !== 'undefined' && 'Telegram' in window) {
        // Usar casting para solucionar el problema de tipos
        const telegram = (window as any).Telegram;
        if (telegram && telegram.WebApp) {
          tg = telegram.WebApp as TelegramWebApp;
          
          // Configurar la WebApp
          tg.expand();
          tg.enableClosingConfirmation();
        }
      }
      
      isLoading = true;
      
      // Cargar lista de clientes
      const clientesResponse = await fetch('https://janus314-api.osvi.lat/api/clientes?limit=100', {
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      const responseText = await clientesResponse.text();
      
      try {
        const clientesData = JSON.parse(responseText);
        clientes = clientesData.items || [];
      } catch (jsonError) {
        console.error('Respuesta no es JSON válido:', responseText.substring(0, 100));
        error = 'Error al parsear respuesta de la API';
      }
      
      // Cargar lista de artículos
      const articulosResponse = await fetch('https://janus314-api.osvi.lat/api/articulos?limit=100');
      console.log(articulosResponse);
      const articulosData = await articulosResponse.json();
      articulos = articulosData.items || [];
      
      isLoading = false;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      error = 'Error al cargar datos: ' + errorMessage;
      isLoading = false;
    }
  });
  
  // Agregar artículo al pedido
  function agregarArticulo(articulo: Articulo): void {
    const found = selectedArticulos.find(a => a.Codigo === articulo.Codigo);
    
    if (found) {
      found.cantidad += 1;
      selectedArticulos = [...selectedArticulos];
    } else {
      selectedArticulos = [...selectedArticulos, {
        ...articulo,
        cantidad: 1
      }];
    }
  }
  
  function handleArticuloKeyDown(event: KeyboardEvent, articulo: Articulo): void {
    if (event.key === 'Enter' || event.key === ' ') {
      agregarArticulo(articulo);
    }
  }
  
  // Enviar venta
  async function enviarVenta(): Promise<void> {
    if (!cliente) {
      error = 'Debe seleccionar un cliente';
      return;
    }
    
    if (selectedArticulos.length === 0) {
      error = 'Debe agregar al menos un artículo';
      return;
    }
    
    try {
      isLoading = true;
      error = null;
      
      // Crear objeto de venta
      const venta = {
        ClienteCodigo: cliente,
        Items: selectedArticulos.map(a => ({
          CodigoArticulo: a.Codigo,
          Cantidad: a.cantidad,
          PrecioUnitario: a.PrecioVenta
        }))
      };
      
      // Enviar a la API
      const response = await fetch('/api/preventas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(venta)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al crear la venta');
      }
      
      success = 'Venta creada correctamente';
      
      // Enviar datos a Telegram y cerrar WebApp si tg está disponible
      if (tg) {
        tg.sendData(JSON.stringify({
          id: data.id,
          cliente: cliente,
          total: selectedArticulos.reduce((sum, a) => sum + (a.cantidad * a.PrecioVenta), 0)
        }));
        
        // Cerrar la webapp después de un momento
        setTimeout(() => {
          if (tg) tg.close();
        }, 1000);
      }
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      error = errorMessage;
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</svelte:head>

<div class="telegram-webapp">
  <header>
    <h1>Nueva Venta</h1>
  </header>
  
  {#if isLoading}
    <div class="loading">Cargando...</div>
  {/if}
  
  {#if error}
    <div class="error">{error}</div>
  {/if}
  
  {#if success}
    <div class="success">{success}</div>
  {/if}
  
  <form on:submit|preventDefault={enviarVenta}>
    <div class="form-group">
      <label for="cliente">Cliente</label>
      <select id="cliente" bind:value={cliente} required>
        <option value="">Seleccione un cliente</option>
        {#each clientes as c}
          <option value={c.Codigo}>{c.Descripcion}</option>
        {/each}
      </select>
    </div>
    
    <div class="form-group">
      <h3>Artículos</h3>
      <div class="articulos-lista">
        {#each articulos.slice(0, 20) as articulo}
          <div 
            class="articulo-item" 
            on:click={() => agregarArticulo(articulo)}
            on:keydown={(e) => handleArticuloKeyDown(e, articulo)}
            role="button"
            tabindex="0"
          >
            <div class="articulo-nombre">{articulo.Descripcion}</div>
            <div class="articulo-precio">${articulo.PrecioVenta}</div>
          </div>
        {/each}
      </div>
    </div>
    
    <div class="selected-articulos">
      <h3>Artículos seleccionados</h3>
      {#if selectedArticulos.length === 0}
        <p>No hay artículos seleccionados</p>
      {:else}
        {#each selectedArticulos as articulo}
          <div class="selected-articulo">
            <div class="articulo-info">
              <span class="articulo-nombre">{articulo.Descripcion}</span>
              <span class="articulo-precio">${articulo.PrecioVenta} x {articulo.cantidad}</span>
            </div>
            <div class="articulo-total">
              ${(articulo.PrecioVenta * articulo.cantidad).toFixed(2)}
            </div>
          </div>
        {/each}
        
        <div class="total">
          <strong>Total:</strong> ${selectedArticulos.reduce((sum, a) => sum + (a.cantidad * a.PrecioVenta), 0).toFixed(2)}
        </div>
      {/if}
    </div>
    
    <div class="actions">
      <button type="submit" class="btn-primary" disabled={isLoading}>
        {isLoading ? 'Enviando...' : 'Crear Venta'}
      </button>
    </div>
  </form>
</div>

<style>
  .telegram-webapp {
    padding: 16px;
    max-width: 100%;
    color: var(--tg-theme-text-color, #000);
    background: var(--tg-theme-bg-color, #fff);
  }
  
  header {
    margin-bottom: 20px;
    text-align: center;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
  }
  
  select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  .articulos-lista {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #eee;
    border-radius: 4px;
  }
  
  .articulo-item {
    padding: 8px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    cursor: pointer;
  }
  
  .articulo-item:hover {
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
  }
  
  .selected-articulos {
    margin: 20px 0;
  }
  
  .selected-articulo {
    padding: 8px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
  }
  
  .actions {
    margin-top: 20px;
  }
  
  .btn-primary {
    width: 100%;
    padding: 12px;
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
  }
  
  .error {
    color: #d32f2f;
    padding: 8px;
    margin-bottom: 16px;
    background-color: #ffebee;
    border-radius: 4px;
  }
  
  .success {
    color: #388e3c;
    padding: 8px;
    margin-bottom: 16px;
    background-color: #e8f5e9;
    border-radius: 4px;
  }
  
  .loading {
    text-align: center;
    padding: 20px;
  }
  
  .total {
    padding: 10px;
    text-align: right;
    font-size: 18px;
    border-top: 2px solid #eee;
  }
</style> 