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
    PrecioVenta?: number;
    PrecioCosto?: number;
    Lista1?: number;
    Lista2?: number;
    Lista3?: number;
    Lista4?: number;
    Lista5?: number;
    Existencia?: number;
    PorcentajeIVA1?: number;
  }
  
  interface Cliente {
    Codigo: string;
    Descripcion: string;
  }
  
  interface ArticuloSeleccionado extends Articulo {
    cantidad: number;
  }
  
  // Estado del formulario con tipos definidos
  let cliente: string = 'CF'; // Consumidor Final como valor predeterminado
  let clienteSeleccionado: Cliente = { Codigo: 'CF', Descripcion: 'Consumidor Final' };
  let clientes: Cliente[] = [];
  let clientesFiltrados: Cliente[] = [];
  let mostrarModalClientes: boolean = false;
  let busquedaCliente: string = '';
  
  let articulos: Articulo[] = [];
  let productosFiltrados: Articulo[] = [];
  let busquedaProducto: string = '';
  
  let selectedArticulos: ArticuloSeleccionado[] = [];
  let isLoading: boolean = false;
  let error: string | null = null;
  let success: string | null = null;
  
  // Lista de precios seleccionada (por defecto Lista 1)
  let listaPrecios: string = '1';
  
  // Variables para el modal de cobro
  let mostrarModalCobro: boolean = false;
  let montoPagado: number = 0;
  let cambio: number = 0;
  
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
      const clientesResponse = await fetch('https://janus314-api.osvi.lat/api/clientes?page=1&limit=10&search=&field=Descripcion&order=ASC', {
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
        // Agregar consumidor final si no existe
        if (!clientes.find(c => c.Codigo === 'CF')) {
          clientes.unshift({ Codigo: 'CF', Descripcion: 'Consumidor Final' });
        }
      } catch (jsonError) {
        console.error('Respuesta no es JSON válido:', responseText.substring(0, 100));
        error = 'Error al parsear respuesta de la API';
      }
      
      isLoading = false;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      error = 'Error al cargar datos: ' + errorMessage;
      isLoading = false;
    }
  });
  
  // Función para filtrar clientes
  async function filtrarClientes(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const busqueda = input.value.toLowerCase();
    busquedaCliente = busqueda;
    
    if (busqueda.length < 2) {
      // Para búsquedas muy cortas, mostrar solo algunos clientes predeterminados
      clientesFiltrados = clientes.slice(0, 10);
      return;
    }
    
    isLoading = true;
    try {
      const response = await fetch(`https://janus314-api.osvi.lat/api/clientes?page=1&limit=10&search=${encodeURIComponent(busqueda)}&field=Descripcion&order=ASC`, {
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      clientesFiltrados = data.items || [];
      
      // Asegurar que Consumidor Final aparezca si no está en los resultados
      if (!clientesFiltrados.find(c => c.Codigo === 'CF')) {
        clientesFiltrados.unshift({ Codigo: 'CF', Descripcion: 'Consumidor Final' });
      }
    } catch (err) {
      error = 'Error al buscar clientes';
      console.error(err);
      // En caso de error, usar filtrado local como fallback
      clientesFiltrados = clientes.filter(c => 
        c.Codigo.toLowerCase().includes(busqueda) || 
        c.Descripcion.toLowerCase().includes(busqueda)
      );
    } finally {
      isLoading = false;
    }
  }
  
  // Función para seleccionar cliente
  function seleccionarCliente(c: Cliente): void {
    cliente = c.Codigo;
    clienteSeleccionado = c;
    mostrarModalClientes = false;
  }
  
  // Función para abrir modal de selección de cliente
  function abrirSelectorCliente(): void {
    clientesFiltrados = clientes.slice(0, 10); // Mostrar los primeros 10 por defecto
    mostrarModalClientes = true;
  }
  
  // Función para calcular precio según lista de precios
  function obtenerPrecioSegunLista(articulo: Articulo, listaId: string): number {
    // Obtener precio de costo con valor predeterminado 0
    const precioCosto = articulo.PrecioCosto || 0;
    
    // Valores predeterminados en caso de que las propiedades no existan
    const lista1 = articulo.Lista1 || 30;
    const lista2 = articulo.Lista2 || 40;
    const lista3 = articulo.Lista3 || 50;
    const lista4 = articulo.Lista4 || 60;
    const lista5 = articulo.Lista5 || 70;
    
    // Porcentaje de IVA (por defecto 21%)
    const porcentajeIva = articulo.PorcentajeIVA1 || 21;
    
    // Calcular precio según la lista seleccionada (sin IVA)
    let precioSinIva;
    switch(listaId) {
      case '1': precioSinIva = precioCosto * (1 + lista1/100); break;
      case '2': precioSinIva = precioCosto * (1 + lista2/100); break;
      case '3': precioSinIva = precioCosto * (1 + lista3/100); break;
      case '4': precioSinIva = precioCosto * (1 + lista4/100); break;
      case '5': precioSinIva = precioCosto * (1 + lista5/100); break;
      default: precioSinIva = precioCosto * (1 + lista1/100);
    }
    
    // Agregar IVA al precio
    return precioSinIva * (1 + porcentajeIva/100);
  }
  
  // Función para buscar productos
  async function buscarProductos(): Promise<void> {
    if (busquedaProducto.length < 3) {
      productosFiltrados = [];
      return;
    }
    
    isLoading = true;
    try {
      const response = await fetch(`https://janus314-api.osvi.lat/api/articulos?page=1&limit=10&search=${encodeURIComponent(busquedaProducto)}&field=Descripcion&order=ASC&activo=1`, {
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      
      // Procesar artículos para incluir precios calculados
      productosFiltrados = (data.items || []).map((item: Articulo) => {
        // Calcular PrecioVenta según la lista seleccionada
        const precioCalculado = obtenerPrecioSegunLista(item, listaPrecios);
        
        return {
          ...item,
          PrecioVenta: precioCalculado
        };
      });
    } catch (err) {
      error = 'Error al buscar productos';
      console.error(err);
    } finally {
      isLoading = false;
    }
  }
  
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
  
  // Aumentar cantidad de un artículo seleccionado
  function aumentarCantidad(codigo: string): void {
    const articulo = selectedArticulos.find(a => a.Codigo === codigo);
    if (articulo) {
      articulo.cantidad += 1;
      selectedArticulos = [...selectedArticulos]; // Actualizar para reactivity
    }
  }
  
  // Disminuir cantidad de un artículo seleccionado
  function disminuirCantidad(codigo: string): void {
    const articulo = selectedArticulos.find(a => a.Codigo === codigo);
    if (articulo && articulo.cantidad > 1) {
      articulo.cantidad -= 1;
      selectedArticulos = [...selectedArticulos]; // Actualizar para reactivity
    }
  }
  
  // Quitar artículo del pedido
  function quitarArticulo(codigo: string): void {
    selectedArticulos = selectedArticulos.filter(a => a.Codigo !== codigo);
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
    
    // Calcular importes para la factura (los precios ya incluyen IVA)
    const importeTotal = selectedArticulos.reduce((sum, a) => sum + ((a.PrecioVenta || 0) * a.cantidad), 0);
    
    // Inicializar el monto pagado con el total y mostrar el modal de cobro
    montoPagado = importeTotal;
    cambio = 0;
    mostrarModalCobro = true;
  }
  
  // Función para calcular el cambio automáticamente
  function calcularCambio(): void {
    const importeTotal = selectedArticulos.reduce((sum, a) => sum + ((a.PrecioVenta || 0) * a.cantidad), 0);
    cambio = Math.max(0, montoPagado - importeTotal);
  }
  
  // Función para procesar el cobro final y crear la factura
  async function procesarCobro(): Promise<void> {
    try {
      isLoading = true;
      error = null;
      
      // Calcular importes para la factura (los precios ya incluyen IVA)
      const importeTotal = selectedArticulos.reduce((sum, a) => sum + ((a.PrecioVenta || 0) * a.cantidad), 0);
      const importeBruto = importeTotal / 1.21; // Base imponible (precio sin IVA)
      const iva21 = importeTotal - importeBruto; // IVA = precio con IVA - precio sin IVA
      
      // Crear objeto de factura con todos los campos requeridos
      const factura: any = {
        DocumentoTipo: 'PRF', // Prefactura para telegram
        DocumentoSucursal: '0100', // Sucursal para telegram
        DocumentoNumero: '00000000', // El servidor asignará el número
        Fecha: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
        ClienteCodigo: cliente,
        // Usar el nombre que espera el controlador (cambiará a VendedorCodigo internamente)
        Vendedor: '1',
        // Usar el nombre que espera el controlador (cambiará a PagoTipo internamente)
        FormaPagoCodigo: 'CO',
        ImporteBruto: Number(importeBruto.toFixed(2)),
        PorcentajeBonificacion: 0,
        ImporteBonificado: 0,
        ImporteNeto: Number(importeBruto.toFixed(2)),
        ImporteAdicional: 0,
        ImporteIva1: Number(iva21.toFixed(2)),
        ImporteIva2: 0,
        BaseImponible1: Number(importeBruto.toFixed(2)),
        BaseImponible2: 0,
        ImporteTotal: Number(importeTotal.toFixed(2)),
        ImportePagado: Number(montoPagado.toFixed(2)),
        // Usar el nombre que espera el controlador (cambiará a ListaNumero internamente)
        ListaPrecio: parseInt(listaPrecios),
        Observacion: '',
        // No es necesario enviar estos campos, el controlador los establecerá
        // CodigoUsuario: 'admin', 
        // PorcentajeIva1: 21,
        // PorcentajeIva2: 10.5,
        CajaNumero: null,
        // Datos adicionales del cobro
        MontoPagado: Number(montoPagado.toFixed(2)),
        Cambio: Number(cambio.toFixed(2))
      };
      
      // Crear array de items para agregar a la factura
      const items = [];
      
      // Agregar cada artículo con su estructura completa
      for (const articulo of selectedArticulos) {
        // Obtener datos del artículo
        items.push({
          CodigoArticulo: articulo.Codigo,
          Descripcion: articulo.Descripcion || '',
          Cantidad: articulo.cantidad,
          PrecioUnitario: Number((articulo.PrecioVenta || 0).toFixed(2)),
          PrecioLista: Number((articulo.PrecioVenta || 0).toFixed(2)),
          PorcentajeBonificado: 0,
          ImporteBonificado: 0,
          PorcentajeIva: 21
        });
      }
      
      // Asignar los items a la factura
      factura.Items = items;
      
      console.log("Enviando factura:", JSON.stringify(factura));
      
      // Usar el nuevo endpoint específico para Telegram
      const response = await fetch('https://janus314-api.osvi.lat/api/telegram/facturas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(factura)
      });
      
      const responseText = await response.text();
      console.log("Respuesta del servidor:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Error en respuesta del servidor: ${responseText}`);
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al crear la factura');
      }
      
      success = 'Factura creada correctamente';
      mostrarModalCobro = false;
      
      // Limpiar datos para nueva venta
      cliente = 'CF';
      clienteSeleccionado = { Codigo: 'CF', Descripcion: 'Consumidor Final' };
      selectedArticulos = [];
      busquedaProducto = '';
      productosFiltrados = [];
      montoPagado = 0;
      cambio = 0;
      error = null;
      
      // Enviar datos a Telegram y cerrar WebApp si tg está disponible
      if (tg) {
        tg.sendData(JSON.stringify({
          tipo: factura.DocumentoTipo,
          sucursal: factura.DocumentoSucursal,
          numero: data.data?.DocumentoNumero || data.data?.numero || 'pendiente',
          cliente: cliente,
          total: factura.ImporteTotal,
          pagado: montoPagado,
          cambio: cambio
        }));
        
        // Cerrar la webapp después de un momento
        setTimeout(() => {
          if (tg) tg.close();
        }, 1000);
      }
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      error = errorMessage;
      console.error("Error completo:", err);
    } finally {
      isLoading = false;
    }
  }
  
  // Función para gestionar tecla Escape
  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      if (mostrarModalClientes) mostrarModalClientes = false;
      if (mostrarModalCobro) mostrarModalCobro = false;
    }
  }
</script>

<svelte:head>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<div class="telegram-webapp">
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
      <label for="cliente-display">Cliente</label>
      <div 
        id="cliente-display"
        class="cliente-seleccionado" 
        on:click={abrirSelectorCliente} 
        on:keydown={(e) => e.key === 'Enter' && abrirSelectorCliente()} 
        role="button" 
        tabindex="0"
        aria-haspopup="dialog"
      >
        <span class="cliente-label">{clienteSeleccionado.Descripcion}</span>
        <span class="cliente-editar">✏️</span>
      </div>
    </div>
    
    <!-- <div class="form-group">
      <label for="listaPrecio">Lista de Precios</label>
      <select 
        id="listaPrecio" 
        bind:value={listaPrecios}
        class="form-select"
        on:change={() => {
          // Si hay resultados de búsqueda, actualizar sus precios
          if (productosFiltrados.length > 0) {
            buscarProductos();
          }
        }}
      >
        <option value="1">Lista 1</option>
        <option value="2">Lista 2</option>
        <option value="3">Lista 3</option>
        <option value="4">Lista 4</option>
        <option value="5">Lista 5</option>
      </select>
    </div> -->
    
    <div class="form-group">
      <h3>Buscar Artículos</h3>
      <div class="busqueda-container">
        <input 
          type="text" 
          id="busqueda-producto"
          bind:value={busquedaProducto} 
          placeholder="Buscar por código o descripción..."
          on:input={() => {
            if (busquedaProducto.length >= 3) {
              const timeoutId = setTimeout(buscarProductos, 300);
              return () => clearTimeout(timeoutId);
            }
          }}
        />
        <button type="button" on:click={buscarProductos} class="btn-buscar">Buscar</button>
      </div>
      
      <div class="articulos-lista">
        {#if productosFiltrados.length === 0 && busquedaProducto.length >= 3}
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
    
    <div class="selected-articulos">
      <h3>Artículos seleccionados</h3>
      {#if selectedArticulos.length === 0}
        <p>No hay artículos seleccionados</p>
      {:else}
        {#each selectedArticulos as articulo}
          <div class="selected-articulo">
            <div class="articulo-info">
              <div class="articulo-nombre">{articulo.Descripcion}</div>
              <div class="articulo-codigo">{articulo.Codigo}</div>
            </div>
            <div class="articulo-actions">
              <div class="cantidad-control">
                <button 
                  type="button" 
                  class="btn-cantidad" 
                  on:click={() => disminuirCantidad(articulo.Codigo)}
                  disabled={articulo.cantidad <= 1}
                  aria-label="Disminuir cantidad"
                >-</button>
                <span class="cantidad">{articulo.cantidad}</span>
                <button 
                  type="button" 
                  class="btn-cantidad" 
                  on:click={() => aumentarCantidad(articulo.Codigo)}
                  aria-label="Aumentar cantidad"
                >+</button>
              </div>
              <div class="articulo-precio-container">
                <span class="articulo-precio-unitario">${articulo.PrecioVenta?.toFixed(2) || '0.00'}</span>
                <div class="articulo-total">
                  ${((articulo.PrecioVenta || 0) * articulo.cantidad).toFixed(2)}
                </div>
              </div>
              <button 
                type="button" 
                class="btn-remove"
                on:click={() => quitarArticulo(articulo.Codigo)}
                aria-label="Quitar artículo"
              >×</button>
            </div>
          </div>
        {/each}
        
        <div class="total">
          <strong>Total:</strong> ${selectedArticulos.reduce((sum, a) => sum + (a.cantidad * (a.PrecioVenta || 0)), 0).toFixed(2)} (IVA incluido)
        </div>
      {/if}
    </div>
    
    <div class="actions">
      <button type="submit" class="btn-primary" disabled={isLoading}>
        {isLoading ? 'Procesando...' : 'Cobrar'}
      </button>
    </div>
  </form>
</div>

<!-- Modal para selección de cliente -->
{#if mostrarModalClientes}
  <!-- Overlay principal sin eventos directos -->
  <div 
    class="modal-overlay" 
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
  >
    <!-- Contenedor del modal sin manejo de eventos -->
    <section
      class="modal-content" 
      role="document"
    >
      <div class="modal-header">
        <h3 id="modal-title">Seleccionar Cliente</h3>
        <button 
          class="modal-close" 
          on:click={() => mostrarModalClientes = false}
          aria-label="Cerrar"
        >×</button>
      </div>
      <input 
        type="text" 
        placeholder="Buscar cliente..." 
        on:input={filtrarClientes} 
        class="cliente-busqueda" 
        value={busquedaCliente}
      />
      <div class="clientes-lista">
        <button 
          class="cliente-item" 
          on:click={() => seleccionarCliente({Codigo: 'CF', Descripcion: 'Consumidor Final'})}
          type="button"
        >
          <strong>Consumidor Final</strong>
        </button>
        {#each clientesFiltrados as c}
          <button 
            class="cliente-item" 
            on:click={() => seleccionarCliente(c)}
            type="button"
          >
            <strong>{c.Codigo}</strong> - {c.Descripcion}
          </button>
        {/each}
      </div>
    </section>
    
    <!-- Botón para cerrar el modal al hacer clic fuera -->
    <button 
      class="modal-backdrop-btn" 
      on:click={() => mostrarModalClientes = false}
      aria-label="Cerrar modal"
    ></button>
  </div>
{/if}

<!-- Modal para cobro -->
{#if mostrarModalCobro}
  <div 
    class="modal-overlay" 
    role="dialog"
    aria-modal="true"
    aria-labelledby="cobro-modal-title"
    tabindex="-1"
  >
    <section class="modal-content cobro-modal">
      <div class="modal-header">
        <h3 id="cobro-modal-title">Confirmar Pago</h3>
        <button 
          class="modal-close" 
          on:click={() => mostrarModalCobro = false}
          aria-label="Cerrar"
        >×</button>
      </div>
      
      <div class="cobro-content">
        {#if isLoading}
          <div class="loading">Procesando pago...</div>
        {:else}
          <div class="cobro-item">
            <span class="cobro-label">Total:</span>
            <span class="cobro-value">${selectedArticulos.reduce((sum, a) => sum + ((a.PrecioVenta || 0) * a.cantidad), 0).toFixed(2)}</span>
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
                bind:value={montoPagado} 
                class="cobro-input"
                on:input={calcularCambio}
              />
            </div>
          </div>
          
          <div class="cobro-item cambio-item">
            <span class="cobro-label">Cambio:</span>
            <span class="cobro-value cambio-value">${cambio.toFixed(2)}</span>
          </div>
          
          <div class="cobro-actions">
            <button 
              type="button" 
              class="btn-secondary" 
              on:click={() => mostrarModalCobro = false}
            >
              Cancelar
            </button>
            <button 
              type="button" 
              class="btn-primary" 
              on:click={procesarCobro}
            >
              Terminar
            </button>
          </div>
        {/if}
      </div>
    </section>
    
    <!-- Solo si no está procesando, permitir cerrar al hacer clic fuera -->
    {#if !isLoading}
      <button 
        class="modal-backdrop-btn" 
        on:click={() => mostrarModalCobro = false}
        aria-label="Cerrar modal"
      ></button>
    {/if}
  </div>
{/if}

<style>
  .telegram-webapp {
    padding: 16px;
    max-width: 100%;
    color: var(--tg-theme-text-color, #000);
    background: var(--tg-theme-bg-color, #fff);
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
  }
  
  /* Estilos para cliente */
  .cliente-seleccionado {
    display: flex;
    padding: 10px;
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 6px;
    cursor: pointer;
    align-items: center;
    margin-bottom: 15px;
    justify-content: space-between;
  }
  
  .cliente-label {
    font-weight: bold;
  }
  
  .cliente-editar {
    color: var(--tg-theme-link-color, #2481cc);
  }
  
  /* Estilos para búsqueda de artículos */
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
  
  /* Estilos para lista de artículos de búsqueda */
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
  
  /* Estilos para artículos seleccionados */
  .selected-articulos {
    margin: 20px 0;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 10px;
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
  }
  
  .selected-articulos h3 {
    margin-top: 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #ddd;
  }
  
  .selected-articulo {
    padding: 12px 8px;
    border-bottom: 1px solid #ddd;
    background-color: var(--tg-theme-bg-color, #fff);
    border-radius: 6px;
    margin-bottom: 8px;
  }
  
  .selected-articulo .articulo-info {
    margin-bottom: 8px;
  }
  
  .selected-articulo .articulo-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .cantidad-control {
    display: flex;
    align-items: center;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .btn-cantidad {
    width: 28px;
    height: 28px;
    background: var(--tg-theme-bg-color, #fff);
    border: none;
    font-size: 16px;
    cursor: pointer;
  }
  
  .btn-cantidad:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .cantidad {
    padding: 0 10px;
    font-weight: bold;
  }
  
  .articulo-precio-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  
  .articulo-precio-unitario {
    font-size: 0.8em;
    color: #666;
  }
  
  .articulo-total {
    font-weight: bold;
    color: #2481cc;
  }
  
  .btn-remove {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: #ff4d4f;
    color: white;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
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
  
  .total {
    padding: 10px;
    text-align: right;
    font-size: 18px;
    border-top: 2px solid #ddd;
    margin-top: 10px;
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
  
  /* Estilos para modal de clientes */
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
  
  /* Estilos para el modal de cobro */
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
</style> 