<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto as navigate } from '$app/navigation';
  import ClienteSelector from '../components/ClienteSelector.svelte';
  import ArticulosBusqueda from '../components/ArticulosBusqueda.svelte';
  import ArticulosSeleccionados from '../components/ArticulosSeleccionados.svelte';
  import CobroModal from '../components/CobroModal.svelte';
  import ComprobanteDetalle from '../components/ComprobanteDetalle.svelte';
  import FormasPago from '$lib/components/recibos/FormasPago.svelte';
  import { obtenerPrecioSegunLista, fetchProductos } from '../components/utils';
  import type { Articulo, Cliente, ArticuloSeleccionado } from '../components/types';
  import type { FormaPago } from '$lib/constants/formasPago';
  import '../components/bot.css';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { auth } from '$lib/stores/authStore';
  import { get } from 'svelte/store';
  import ClienteNuevoModal from '../components/ClienteNuevoModal.svelte';
  
  // Asegurar que haya un token para el bot de Telegram
  if (typeof localStorage !== 'undefined' && !localStorage.getItem('authToken')) {
    // Si no hay token, establece uno temporal para el bot
    localStorage.setItem('authToken', 'bot-telegram-token-temporal');
  }
  
  let articulosBusquedaComponent: ArticulosBusqueda;
  
  // Variable para código del vendedor
  let codigoVendedor: string = '1'; // Valor por defecto por si fallan las demás opciones
  
  // Función para guardar datos del vendedor en localStorage
  function guardarDatosVendedor(usuario: any) {
    if (usuario) {
      localStorage.setItem('botVendedorNombre', usuario.nombre || 'Vendedor');
      localStorage.setItem('botVendedorApellido', usuario.apellido || '');
      localStorage.setItem('botVendedorCodigo', usuario.usuario || '1');
      console.log("Datos de vendedor guardados en localStorage:", usuario.usuario);
    }
  }
  
  
  codigoVendedor = localStorage.getItem('botVendedorCodigo') || '1';
  
  console.log("codigoVendedor:", codigoVendedor);
  
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
  
  // Variables para el modal de comprobante
  let mostrarComprobanteDetalle: boolean = false;
  let comprobanteActual: any = {
    tipo: '',
    sucursal: '',
    numero: '',
    clienteNombre: '',
    total: 0,
    items: []
  };
  
  // Referencia al objeto de Telegram WebApp
  let tg: any = null;
  
  let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  
  let mostrarModalNuevoCliente = false;
  
  let formaPago: string = 'CO'; // Valor por defecto para forma de pago
  
  // Estado para la caja
  let cajaAbierta: any = null;
  let formasPago: FormaPago[] = [];
  let importeTotalFormasPago = 0;
  let saldoPendiente = 0;
  
  onMount(async () => {
    // Verificar estado actual de autenticación
    const authState = get(auth);
    console.log("Estado inicial de autenticación:", authState);
    
    // Si no hay usuario autenticado, verificar la sesión
    if (!authState.isAuthenticated) {
      await auth.verifySession();
      
      // Verificar de nuevo después de verificar la sesión
      const nuevoAuthState = get(auth);
      if (nuevoAuthState.user) {
        codigoVendedor = nuevoAuthState.user.usuario || '1';
        guardarDatosVendedor(nuevoAuthState.user);
      }
    } else if (authState.user) {
      // Guardar datos del usuario en localStorage si está autenticado
      guardarDatosVendedor(authState.user);
    }

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
      const clientesResponse = await fetchWithAuth('/clientes', {
        params: {
          page: 1,
          limit: 10,
          search: '',
          field: 'Descripcion',
          order: 'ASC',
          Activo: 1
        },
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

      // Verificar caja abierta después de obtener el código del vendedor
      await verificarCajaAbierta();
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
      const response = await fetchWithAuth('/clientes', {
        params: {
          page: 1,
          limit: 10,
          search: busqueda,
          field: 'Descripcion',
          order: 'ASC',
          Activo: 1
        },
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
  
  // Función para verificar caja abierta
  async function verificarCajaAbierta() {
    try {
      const response = await fetchWithAuth(`/cajas/vendedor/${codigoVendedor}`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        cajaAbierta = data.data[0];
        return true;
      } else {
        error = "No hay una caja abierta para este vendedor";
        return false;
      }
    } catch (err) {
      error = "Error al verificar el estado de la caja";
      console.error(err);
      return false;
    }
  }
  
  // Función para registrar movimientos en caja y actualizar saldo del cliente
  async function registrarMovimientosCaja(formasPago: FormaPago[], importeTotal: number) {
    try {
      console.log('Registrando movimientos en caja:', { cajaAbierta, formasPago });
      
      let totalAplicaSaldo = 0;
      
      for (const formaPago of formasPago) {
        // Si la forma de pago aplica saldo, sumamos al total pero no generamos movimiento
        if (formaPago.aplicaSaldo) {
          console.log(`Forma de pago ${formaPago.codigo} aplica saldo: $${formaPago.importe}`);
          totalAplicaSaldo += parseFloat(formaPago.importe.toString());
          continue;
        }

        // Si no aplica saldo, generamos el movimiento en caja
        const movimiento = {
          cajaCabezaId: cajaAbierta.Codigo,
          tipo: 'ingreso',
          importe: parseFloat(formaPago.importe.toString()),
          concepto: `Venta de contado - ${formaPago.descripcion}`,
          metodoPago: formaPago.codigo,
          referencia: formaPago.numero || null,
          banco: formaPago.banco || null,
          valorFecha: formaPago.fecha || new Date().toISOString().split('T')[0],
          documentoAsociado: comprobanteActual?.numero || '',
          tipoDocumento: 'PRF',
          usuarioId: codigoVendedor.replace(/^0+/, '')
        };

        console.log('Enviando movimiento:', movimiento);

        const response = await fetchWithAuth('/cajas/movimiento', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(movimiento)
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error del servidor:', errorData);
          throw new Error(errorData.message || 'Error al registrar movimiento en caja');
        }

        const responseData = await response.json();
        console.log('Movimiento registrado:', responseData);
      }

      return totalAplicaSaldo;
    } catch (err) {
      console.error('Error al registrar movimientos:', err);
      throw err;
    }
  }
  
  // Función para enviar venta
  async function enviarVenta() {
    if (!cliente) {
      error = 'Debe seleccionar un cliente';
      return;
    }
    
    if (selectedArticulos.length === 0) {
      error = 'Debe agregar al menos un artículo';
      return;
    }

    // Verificar caja abierta
    if (!cajaAbierta) {
      const tieneCaja = await verificarCajaAbierta();
      if (!tieneCaja) {
        error = 'No hay una caja abierta. Debe abrir la caja antes de realizar ventas.';
        return;
      }
    }
    
    // Calcular importes para la factura
    const importeTotal = selectedArticulos.reduce((sum, a) => sum + ((a.PrecioVenta || 0) * cantidadTotal(a)), 0);
    
    // Inicializar formas de pago
    formasPago = [];
    importeTotalFormasPago = 0;
    saldoPendiente = importeTotal;
    
    // Mostrar el modal de cobro
    mostrarModalCobro = true;
  }

  // Función para calcular el cambio automáticamente
  function calcularCambio(): void {
    const importeTotal = selectedArticulos.reduce((sum, a) => sum + ((a.PrecioVenta || 0) * cantidadTotal(a)), 0);
    cambio = Math.max(0, montoPagado - importeTotal);
  }
  
  // Modificar la función procesarCobro para manejar mejor los errores
  async function procesarCobro() {
    try {
      isLoading = true;
      error = null;

      if (importeTotalFormasPago !== selectedArticulos.reduce((sum, a) => sum + ((a.PrecioVenta || 0) * cantidadTotal(a)), 0)) {
        error = 'El total de las formas de pago debe ser igual al importe de la venta';
        return;
      }

      // Verificar que la caja siga abierta antes de procesar
      const cajaResponse = await fetchWithAuth(`/cajas/vendedor/${codigoVendedor}`);
      const cajaData = await cajaResponse.json();
      
      if (!cajaData.success || !cajaData.data.length) {
        error = 'La caja ya no está abierta. Por favor, verifique el estado de la caja.';
        return;
      }
      
      cajaAbierta = cajaData.data[0];

      // Calcular importes para la factura
      const importeTotal = selectedArticulos.reduce((sum, a) => sum + ((a.PrecioVenta || 0) * cantidadTotal(a)), 0);
      const importeBruto = importeTotal / 1.21;
      const iva21 = importeTotal - importeBruto;

      // Registrar movimientos en caja y obtener el total que aplica saldo
      const totalAplicaSaldo = await registrarMovimientosCaja(formasPago, importeTotal);
      console.log('Total que aplica saldo:', totalAplicaSaldo);

      // Si hay formas de pago que aplican saldo, actualizar el saldo del cliente
      if (totalAplicaSaldo > 0) {
        try {
          const clienteResponse = await fetchWithAuth(`/clientes/${cliente}`);
          if (!clienteResponse.ok) {
            throw new Error('Error al obtener datos del cliente');
          }
          
          const clienteData = await clienteResponse.json();
          console.log('Datos del cliente:', clienteData);
          
          // Actualizar el saldo del cliente usando el nuevo endpoint
          const updateResponse = await fetchWithAuth(`/clientes/${cliente}/actualizarSaldo`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ImporteDeuda: (parseFloat(clienteData.ImporteDeuda || 0) + totalAplicaSaldo).toFixed(2)
            })
          });

          if (!updateResponse.ok) {
            throw new Error('Error al actualizar el saldo del cliente');
          }

          console.log('Saldo del cliente actualizado');
        } catch (error: unknown) {
          console.error('Error al actualizar saldo del cliente:', error);
          throw new Error(error instanceof Error ? error.message : 'Error desconocido al actualizar el saldo del cliente');
        }
      }

      // Crear objeto de factura
      const factura = {
        DocumentoTipo: 'PRF',
        DocumentoSucursal: '0100',
        DocumentoNumero: '00000000',
        Fecha: new Date().toISOString().split('T')[0],
        ClienteCodigo: cliente,
        Vendedor: codigoVendedor.replace(/^0+/, ''),
        FormaPagoCodigo: formasPago[0].codigo,
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
        ImportePagado: Number((importeTotal - totalAplicaSaldo).toFixed(2)),
        ListaPrecio: parseInt(listaPrecios),
        Observacion: formasPago.length > 1 ? 
          `Pago mixto: ${formasPago.map(fp => `${fp.descripcion}: $${fp.importe}`).join(', ')}` : '',
        CajaNumero: cajaAbierta.Codigo,
        aplicaSaldo: totalAplicaSaldo > 0
      };

      console.log('Enviando factura:', factura);

      // Crear la factura
      const facturaResponse = await fetchWithAuth('/telegram/facturas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...factura,
          Items: selectedArticulos.map(articulo => ({
            CodigoArticulo: articulo.Codigo,
            Descripcion: articulo.Descripcion || '',
            Cantidad: cantidadTotal(articulo),
            PrecioUnitario: Number((articulo.PrecioVenta || 0).toFixed(2)),
            PrecioLista: Number((articulo.PrecioVenta || 0).toFixed(2)),
            PorcentajeBonificado: 0,
            ImporteBonificado: 0,
            PorcentajeIva: 21
          }))
        })
      });

      if (!facturaResponse.ok) {
        const errorData = await facturaResponse.json();
        throw new Error(errorData.message || 'Error al crear la factura');
      }

      const facturaData = await facturaResponse.json();
      console.log('Factura creada:', facturaData);

      success = 'Factura creada correctamente';
      mostrarModalCobro = false;

      // Preparar datos para el comprobante
      comprobanteActual = {
        tipo: factura.DocumentoTipo,
        sucursal: factura.DocumentoSucursal,
        numero: facturaData.data?.DocumentoNumero || facturaData.data?.numero || '00000000',
        fecha: factura.Fecha,
        clienteCodigo: cliente,
        clienteNombre: clienteSeleccionado.Descripcion,
        total: factura.ImporteTotal,
        vendedorCodigo: codigoVendedor,
        vendedorNombre: localStorage.getItem('botVendedorNombre') || 'Vendedor',
        items: selectedArticulos.map(articulo => ({
          codigo: articulo.Codigo,
          descripcion: articulo.Descripcion || '',
          cantidad: cantidadTotal(articulo),
          precioUnitario: Number((articulo.PrecioVenta || 0).toFixed(2)),
          subtotal: Number(((articulo.PrecioVenta || 0) * cantidadTotal(articulo)).toFixed(2))
        }))
      };

      // Mostrar el detalle del comprobante
      mostrarComprobanteDetalle = true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      error = errorMessage;
      console.error("Error completo:", err);
    } finally {
      isLoading = false;
    }
  }
  
  // Función para cerrar el detalle del comprobante y preparar nueva venta
  function cerrarComprobanteDetalle() {
    mostrarComprobanteDetalle = false;
    
    // Limpiar datos para nueva venta
    cliente = 'CF';
    clienteSeleccionado = { Codigo: 'CF', Descripcion: 'Consumidor Final' };
    selectedArticulos = [];
    busquedaProducto = '';
    productosFiltrados = [];
    montoPagado = 0;
    cambio = 0;
    error = null;
    
    // Cerrar la webapp de Telegram después de un momento si está disponible
    if (tg) {
      setTimeout(() => {
        if (tg) tg.close();
      }, 1000);
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

  function handleClienteCreado(event: CustomEvent) {
    const nuevoCliente = event.detail.cliente;
    clientes = [nuevoCliente, ...clientes];
    cliente = nuevoCliente.Codigo;
    clienteSeleccionado = nuevoCliente;
    mostrarModalNuevoCliente = false;
  }

  // Función para manejar cambios en formas de pago
  function handleFormasPagoChange(event: CustomEvent) {
    const { formasPago: nuevasFormasPago, importeTotalFormasPago: nuevoTotal, saldoPendiente: nuevoSaldo } = event.detail;
    formasPago = nuevasFormasPago;
    importeTotalFormasPago = nuevoTotal;
    saldoPendiente = nuevoSaldo;
  }

  onDestroy(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
  });
</script>

<!-- <svelte:head>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</svelte:head> -->

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
      <div class="cliente-selector-row">
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
          <!-- <span class="cliente-editar">✏️</span> -->
          <button type="button" class="btn-nuevo-cliente" aria-label="Agregar nuevo cliente" on:click={() => mostrarModalNuevoCliente = true}>+</button>
        </div>
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
        {isLoading ? 'Procesando...' : (selectedArticulos.length > 0 ? 'Cobrar' : 'Agregar artículos')}
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
    {clienteSeleccionado}
    bind:formasPago
    bind:importeTotalFormasPago
    bind:saldoPendiente
    on:cancelar={() => mostrarModalCobro = false}
    on:terminar={procesarCobro}
    on:formasPagoChange={handleFormasPagoChange}
  />
  
  <ComprobanteDetalle
    comprobante={comprobanteActual}
    mostrar={mostrarComprobanteDetalle}
    onClose={cerrarComprobanteDetalle}
  />
  <ClienteNuevoModal
    mostrar={mostrarModalNuevoCliente}
    on:clienteCreado={handleClienteCreado}
    onClose={() => mostrarModalNuevoCliente = false}
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
  .cliente-selector-row {
    display: flex;
    gap: 8px;
    align-items: center;
    width: 100%;
  }
  .cliente-seleccionado {
    flex: 1;
    display: flex;
    padding: 10px;
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 6px;
    cursor: pointer;
    align-items: center;
    margin-bottom: 15px;
    justify-content: space-between;
    min-width: 0;
  }
  .cliente-label {
    font-weight: bold;
  }
  
  /* .cliente-editar {
    color: var(--tg-theme-link-color, #2481cc);
  } */
  
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

  .btn-nuevo-cliente {
    margin-left: 8px;
    flex-shrink: 0;
    background: #e8f5e9;
    color: #2481cc;
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    font-size: 1.4em;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  .btn-nuevo-cliente:hover {
    background: #b2ebf2;
    transform: scale(1.05);
    box-shadow: 0 3px 6px rgba(0,0,0,0.15);
  }
  .btn-nuevo-cliente:active {
    transform: scale(0.95);
  }
  .btn-nuevo-cliente:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(36,129,204,0.3);
  }
</style> 