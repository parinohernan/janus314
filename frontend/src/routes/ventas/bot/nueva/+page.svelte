<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto as navigate } from '$app/navigation';
  import ClienteSelector from '../components/ClienteSelector.svelte';
  import ArticulosBusqueda from '../components/ArticulosBusqueda.svelte';
  import ArticulosSeleccionados from '../components/ArticulosSeleccionados.svelte';
  import CobroModal from '../components/CobroModal.svelte';
  import { obtenerPrecioSegunLista, fetchProductos } from '../components/utils';
  import type { Articulo, Cliente, ArticuloSeleccionado } from '../components/types';
  import '../components/bot.css';
  
  let articulosBusquedaComponent: ArticulosBusqueda;
  
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
  let tg: any = null;
  
  let debounceTimeout: number | null = null;
  
  onMount(async () => {
    try {
      // Inicializar el objeto de Telegram WebApp
      if (typeof window !== 'undefined' && 'Telegram' in window) {
        // Usar casting para solucionar el problema de tipos
        const telegram = (window as any).Telegram;
        if (telegram && telegram.WebApp) {
          tg = telegram.WebApp;
          
          // Configurar la WebApp
          tg.expand();
          tg.enableClosingConfirmation();
        }
      }
      
      isLoading = true;
      
      // Cargar lista de clientes
      const clientesResponse = await fetch('https://janus314-api.osvi.lat/api/clientes?page=1&limit=10&search=&field=Descripcion&order=ASC&Activo=1', {
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
      const response = await fetch(`https://janus314-api.osvi.lat/api/clientes?page=1&limit=10&search=${encodeURIComponent(busqueda)}&field=Descripcion&order=ASC&Activo=1`, {
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
  
  // Función para buscar productos
  async function buscarProductos(): Promise<void> {
    console.log('buscarProductos llamada con:', busquedaProducto);
    if (busquedaProducto.length < 3) {
      productosFiltrados = [];
      return;
    }
    isLoading = true;
    try {
      productosFiltrados = await fetchProductos(busquedaProducto, listaPrecios);
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
      found.cantidadEntera += 1;
      selectedArticulos = [...selectedArticulos];
    } else {
      selectedArticulos = [...selectedArticulos, {
        ...articulo,
        cantidadEntera: 1,
        cantidadDecimal: 0
      }];
    }
  }
  
  // Aumentar cantidad entera de un artículo seleccionado
  function aumentarCantidad(codigo: string): void {
    const articulo = selectedArticulos.find(a => a.Codigo === codigo);
    if (articulo) {
      articulo.cantidadEntera += 1;
      selectedArticulos = [...selectedArticulos];
    }
  }
  
  // Disminuir cantidad entera de un artículo seleccionado
  function disminuirCantidad(codigo: string): void {
    const articulo = selectedArticulos.find(a => a.Codigo === codigo);
    if (articulo && articulo.cantidadEntera > 0) {
      articulo.cantidadEntera -= 1;
      selectedArticulos = [...selectedArticulos];
    }
  }
  
  // Cambiar cantidad decimal de un artículo seleccionado
  function cambiarCantidadDecimal(codigo: string, valor: number): void {
    const articulo = selectedArticulos.find(a => a.Codigo === codigo);
    if (articulo) {
      articulo.cantidadDecimal = valor;
      selectedArticulos = [...selectedArticulos];
    }
  }
  
  // Quitar artículo del pedido
  function quitarArticulo(codigo: string): void {
    selectedArticulos = selectedArticulos.filter(a => a.Codigo !== codigo);
  }
  
  // Calcular la cantidad total (entera + decimal/1000)
  function cantidadTotal(articulo: ArticuloSeleccionado): number {
    return (articulo.cantidadEntera || 0) + (articulo.cantidadDecimal || 0) / 1000;
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
    const importeTotal = selectedArticulos.reduce((sum, a) => sum + ((a.PrecioVenta || 0) * cantidadTotal(a)), 0);
    
    // Inicializar el monto pagado con el total y mostrar el modal de cobro
    montoPagado = importeTotal;
    cambio = 0;
    
    // Limpiar la búsqueda antes de mostrar el modal de cobro
    if (articulosBusquedaComponent) {
      articulosBusquedaComponent.limpiarBusqueda();
    }
    
    mostrarModalCobro = true;
  }
  
  // Función para calcular el cambio automáticamente
  function calcularCambio(): void {
    const importeTotal = selectedArticulos.reduce((sum, a) => sum + ((a.PrecioVenta || 0) * cantidadTotal(a)), 0);
    cambio = Math.max(0, montoPagado - importeTotal);
  }
  
  // Función para procesar el cobro final y crear la factura
  async function procesarCobro(): Promise<void> {
    try {
      isLoading = true;
      error = null;
      
      // Calcular importes para la factura (los precios ya incluyen IVA)
      const importeTotal = selectedArticulos.reduce((sum, a) => sum + ((a.PrecioVenta || 0) * cantidadTotal(a)), 0);
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
          Cantidad: cantidadTotal(articulo),
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

  function handleBusquedaProductoChange() {
    console.log('handleBusquedaProductoChange llamada con:', busquedaProducto);
    if (debounceTimeout) clearTimeout(debounceTimeout);
    if (busquedaProducto.length >= 3) {
      debounceTimeout = setTimeout(() => {
        buscarProductos();
      }, 300);
    } else {
      productosFiltrados = [];
    }
  }

  // Función para abrir modal de cobro
  function abrirModalCobro() {
    mostrarModalCobro = true;
    if (articulosBusquedaComponent) {
      articulosBusquedaComponent.limpiarBusqueda();
    }
  }

  onDestroy(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
  });
</script>

<svelte:head>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<div class="telegram-webapp">
  <button class="btn-volver" on:click={() => navigate('/ventas/bot/home')}>← Volver</button>

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
    <ArticulosBusqueda
      bind:this={articulosBusquedaComponent}
      agregarArticulo={agregarArticulo}
      handleArticuloKeyDown={handleArticuloKeyDown}
      listaPrecios={listaPrecios}
    />
    
    <ArticulosSeleccionados
      {selectedArticulos}
      {aumentarCantidad}
      {disminuirCantidad}
      {quitarArticulo}
      cambiarCantidadDecimal={cambiarCantidadDecimal}
    />
    
    <div class="actions">
      <button type="submit" class="btn-primary" disabled={isLoading}>
        {isLoading ? 'Procesando...' : 'Cobrar'}
      </button>
    </div>
  </form>
  <ClienteSelector
    {clientesFiltrados}
    {mostrarModalClientes} 
    {busquedaCliente}
    {filtrarClientes}
    {seleccionarCliente}
    cerrar={() => mostrarModalClientes = false}
  />
  <CobroModal
    {mostrarModalCobro}
    {isLoading}
    {selectedArticulos}
    {montoPagado}
    {cambio}
    setMontoPagado={v => montoPagado = v}
    {calcularCambio}
    cancelar={() => mostrarModalCobro = false}
    terminar={procesarCobro}
  />
</div>

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

  .btn-volver {
    background: none;
    border: none;
    color: var(--tg-theme-link-color, #2481cc);
    padding: 8px 0;
    cursor: pointer;
    font-size: 1em;
    margin-bottom: 16px;
  }
</style> 