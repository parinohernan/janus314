<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto as navigate } from '$app/navigation';
  import '../components/bot.css';
  import '../components/mobile-fix.css';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { auth } from '$lib/stores/authStore';
  import { get } from 'svelte/store';
  import ComprobanteDetalle from '../components/ComprobanteDetalle.svelte';


  interface Comprobante {
    Fecha: string;
    FechaFormateada?: string;
    DocumentoTipo: string;
    DocumentoSucursal: string;
    DocumentoNumero: string;
    ImporteTotal: number;
    ClienteCodigo: string;
    ClienteDescripcion: string;
    ClienteTelefono?: string;
    VendedorCodigo: string;
  }

  interface ComprobanteDetalle {
    Codigo: string;
    Descripcion: string;
    Cantidad: number;
    PrecioUnitario: number;
    ImporteTotal: number;
  }

  interface Vendedor {
    Codigo: string;
    Descripcion: string;
  }

  interface ApiFactura {
    DocumentoTipo: string;
    DocumentoSucursal: string;
    DocumentoNumero: string;
    Fecha: string;
    FechaFormateada?: string;
    ImporteTotal: number;
    ClienteCodigo: string;
    VendedorCodigo: string;
    Cliente?: {
      Descripcion: string;
      Telefono?: string;
    };
  }

  interface ApiFacturaDetalle {
    CodigoArticulo: string;
    Descripcion: string;
    Cantidad: number;
    PrecioUnitario: number;
  }

  interface ApiResponse {
    items: ApiFactura[];
    meta: {
      totalPages: number;
    };
  }

  interface ApiDetalleResponse {
    success: boolean;
    data: {
      encabezado: ApiFactura;
      items: ApiFacturaDetalle[];
    };
  }

  interface VendedorResponse {
    success: boolean;
    data: Vendedor[];
    message?: string;
  }

  let comprobantes: Comprobante[] = [];
  let comprobanteSeleccionado: Comprobante | null = null;
  let detallesComprobante: ComprobanteDetalle[] = [];
  let isLoading = false;
  let error: string | null = null;
  let currentPage = 1;
  let totalPages = 1;
  let mostrarDetalles = false;
  let vendedorFiltro: string = '';
  let vendedores: Vendedor[] = [];
  let vendedoresMap: Map<string, string> = new Map();
  
  // Variable para código del vendedor
  let codigoVendedor: string = '1'; // Valor por defecto por si fallan las demás opciones
  
  // Variables para el componente de detalle del comprobante
  let comprobanteFormateado: any = {
    tipo: '',
    sucursal: '',
    numero: '',
    fecha: '',
    clienteNombre: '',
    total: 0,
    vendedorNombre: '',
    items: []
  };
  
  // Función para guardar datos del vendedor en localStorage
  function guardarDatosVendedor(usuario: any) {
    if (usuario) {
      localStorage.setItem('botVendedorNombre', usuario.nombre || 'Vendedor');
      localStorage.setItem('botVendedorApellido', usuario.apellido || '');
      localStorage.setItem('botVendedorCodigo', usuario.usuario || '1');
      console.log("Datos de vendedor guardados en localStorage:", usuario.usuario);
    }
  }
  
  // Suscripción al store de autenticación
  let unsubscribe = auth.subscribe((state) => {
    console.log("Estado de autenticación:", state);
    if (state.user) {
      // Si el usuario está autenticado, usar su código de vendedor
      codigoVendedor = state.user.usuario || '1';
      guardarDatosVendedor(state.user);
      
      // Establecer el filtro de vendedor automáticamente al del usuario logueado
      if (vendedorFiltro === '') {
        vendedorFiltro = codigoVendedor;
      }
    } else {
      // Intentar recuperar datos del vendedor de localStorage si existen
      const codigoGuardado = localStorage.getItem('botVendedorCodigo');
      if (codigoGuardado) {
        codigoVendedor = codigoGuardado;
        // Establecer el filtro de vendedor automáticamente al del usuario
        if (vendedorFiltro === '') {
          vendedorFiltro = codigoGuardado;
        }
      }
    }
  });
  
  // Limpiar suscripción cuando el componente se destruye
  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  // Referencia al objeto de Telegram WebApp
  let tg: any = null;

  let mostrarModalWhatsApp = false;
  let numeroTelefono = '';
  let telefonoOriginal = '';
  let mostrarOpcionActualizar = false;
  let comprobanteParaCompartir: Comprobante | null = null;
  let detallesParaCompartir: ComprobanteDetalle[] = [];

  // Definir una interfaz para el evento personalizado
  interface ActualizarTelefonoEvent extends CustomEvent {
    detail: {
      clienteCodigo: string;
      nuevoTelefono: string;
    };
  }

  // Función para manejar eventos de actualización de teléfono
  const handleActualizarTelefono = ((event: Event) => {
    const customEvent = event as ActualizarTelefonoEvent;
    if (customEvent.detail && customEvent.detail.clienteCodigo && customEvent.detail.nuevoTelefono) {
      const { clienteCodigo, nuevoTelefono } = customEvent.detail;
      console.log(`Actualizando teléfono para cliente ${clienteCodigo}: ${nuevoTelefono}`);
      actualizarTelefonoCliente(clienteCodigo, nuevoTelefono);
    }
  }) as EventListener;

  onMount(async () => {
    // Inicializar el objeto de Telegram WebApp si estamos en Telegram
    if (typeof window !== 'undefined' && 'Telegram' in window) {
      const telegram = (window as any).Telegram;
      if (telegram && telegram.WebApp) {
        tg = telegram.WebApp;
        tg.expand();
      }
    }
    
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
        // Establecer filtro vendedor automaticamente si no hay uno seleccionado
        if (vendedorFiltro === '') {
          vendedorFiltro = codigoVendedor;
        }
      }
    } else if (authState.user) {
      // Guardar datos del usuario en localStorage si está autenticado
      guardarDatosVendedor(authState.user);
      // Establecer filtro vendedor automaticamente si no hay uno seleccionado
      if (vendedorFiltro === '') {
        vendedorFiltro = authState.user.usuario;
      }
    }
    
    await cargarVendedores();
    await cargarComprobantes();
    
    // Escuchar eventos personalizados para actualizar teléfono
    window.addEventListener('actualizarTelefono', handleActualizarTelefono);
  });

  onDestroy(() => {
    // Limpiar suscripción cuando el componente se destruye
    if (unsubscribe) {
      unsubscribe();
    }
    
    // Eliminar el event listener
    window.removeEventListener('actualizarTelefono', handleActualizarTelefono);
  });

  async function cargarVendedores() {
    try {
      const response = await fetchWithAuth('/vendedores', {
        params: {
          activo: true
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar vendedores');
      }

      const responseData = await response.json() as VendedorResponse;
      
      if (!responseData.success) {
        throw new Error(responseData.message || 'Error al cargar vendedores');
      }

      vendedores = responseData.data || [];
      // Crear un mapa para búsqueda rápida de nombres de vendedores
      vendedoresMap = new Map(vendedores.map(v => [v.Codigo, v.Descripcion]));
    } catch (err) {
      console.error('Error al cargar vendedores:', err);
      error = 'Error al cargar lista de vendedores';
    }
  }

  function obtenerNombreVendedor(codigo: string): string {
    return vendedoresMap.get(codigo) || codigo;
  }

  async function cargarComprobantes() {
    try {
      isLoading = true;
      error = null;
      
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: '10',
        tipo: 'PRF'
      };
      
      if (vendedorFiltro) {
        params.vendedor = vendedorFiltro;
      }

      const response = await fetchWithAuth('/facturas', { params });
      
      if (!response.ok) {
        throw new Error('Error al cargar los comprobantes');
      }

      const data = await response.json();
      
      comprobantes = data.items.map((item: ApiFactura) => ({
        ...item,
        ClienteDescripcion: item.Cliente?.Descripcion || 'Sin cliente'
      }));
      totalPages = data.meta.totalPages;
    } catch (err) {
      error = 'Error al cargar los comprobantes';
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  async function cargarDetalles(comprobante: Comprobante) {
    try {
      isLoading = true;
      error = null;
      comprobanteSeleccionado = comprobante;
      
      // Obtener detalles del comprobante - Corregir URL
      const response = await fetchWithAuth(`/facturas/${comprobante.DocumentoTipo}/${comprobante.DocumentoSucursal}/${comprobante.DocumentoNumero}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar los detalles del comprobante');
      }
      
      const data = await response.json() as ApiDetalleResponse;
      
      if (data && data.success && data.data) {
        const items = data.data.items;
        
        detallesComprobante = items.map(item => ({
          Codigo: item.CodigoArticulo,
          Descripcion: item.Descripcion,
          Cantidad: item.Cantidad,
          PrecioUnitario: item.PrecioUnitario,
          ImporteTotal: item.Cantidad * item.PrecioUnitario
        }));
        
        // Obtener teléfono del cliente
        const clienteTelefono = data.data.encabezado.Cliente?.Telefono || '';
        
        // Actualizar el comprobante seleccionado con los datos del cliente
        comprobanteSeleccionado = {
          ...comprobante,
          ClienteDescripcion: data.data.encabezado.Cliente?.Descripcion || 'Sin cliente',
          ClienteTelefono: clienteTelefono,
        };
        
        // Log para depurar - confirmar que se asignó correctamente
        console.log("Teléfono asignado:", comprobanteSeleccionado.ClienteTelefono);
        
        // Formatear datos para el componente ComprobanteDetalle
        comprobanteFormateado = {
          tipo: comprobanteSeleccionado.DocumentoTipo,
          sucursal: comprobanteSeleccionado.DocumentoSucursal,
          numero: comprobanteSeleccionado.DocumentoNumero,
          fecha: comprobanteSeleccionado.Fecha,
          clienteCodigo: comprobanteSeleccionado.ClienteCodigo,
          clienteNombre: comprobanteSeleccionado.ClienteDescripcion,
          clienteTelefono: comprobanteSeleccionado.ClienteTelefono,
          total: comprobanteSeleccionado.ImporteTotal,
          vendedorCodigo: comprobanteSeleccionado.VendedorCodigo,
          vendedorNombre: obtenerNombreVendedor(comprobanteSeleccionado.VendedorCodigo),
          items: detallesComprobante.map(item => ({
            codigo: item.Codigo,
            descripcion: item.Descripcion,
            cantidad: item.Cantidad,
            precioUnitario: item.PrecioUnitario,
            subtotal: item.ImporteTotal
          }))
        };
        
        mostrarDetalles = true;
      } else {
        throw new Error('Error en el formato de respuesta');
      }
    } catch (err) {
      error = 'Error al cargar los detalles';
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  function formatearImporte(importe: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(importe);
  }

  function cerrarDetalles() {
    mostrarDetalles = false;
    comprobanteSeleccionado = null;
    detallesComprobante = [];
  }

  async function cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= totalPages) {
      currentPage = pagina;
      await cargarComprobantes();
    }
  }

  async function filtrarPorVendedor() {
    currentPage = 1; // Resetear a la primera página
    await cargarComprobantes();
  }

  function prepararMensajeComprobante(comprobante: Comprobante, detalles: ComprobanteDetalle[]): string {
    const fecha = comprobante.Fecha;
    const numeroCompleto = `${comprobante.DocumentoTipo}-${comprobante.DocumentoSucursal}-${comprobante.DocumentoNumero}`;
    
    let mensaje = `*Detalle de su compra*\n`;
    mensaje += `ID: ${numeroCompleto}\n`;
    mensaje += `Fecha: ${fecha}\n`;
    mensaje += `Cliente: ${comprobante.ClienteDescripcion}\n`;
    mensaje += `Vendedor: ${obtenerNombreVendedor(comprobante.VendedorCodigo)}\n\n`;
    mensaje += `Teléfono: ${comprobante.ClienteTelefono}\n\n`;
    mensaje += `*Productos:*\n`;
    detalles.forEach(item => {
      mensaje += `• ${item.Descripcion}\n`;
      mensaje += `  ${item.Cantidad} x ${formatearImporte(item.PrecioUnitario)} = ${formatearImporte(item.ImporteTotal)}\n`;
    });
    
    mensaje += `\n*Total: ${formatearImporte(comprobante.ImporteTotal)}*\n\n`;
    mensaje += `Muchas gracias por su compra.`;
    
    return mensaje;
  }

  // Actualizar el teléfono del cliente en la base de datos
  async function actualizarTelefonoCliente(codigo: string, nuevoTelefono: string) {
    try {
      isLoading = true;
      error = null;
      
      console.log(`Intentando actualizar teléfono para cliente ${codigo} con valor: ${nuevoTelefono}`);
      
      // Primero obtenemos los datos actuales del cliente para asegurarnos de tener toda la info
      const getResponse = await fetchWithAuth(`/clientes/${codigo}`);
      
      if (!getResponse.ok) {
        console.error(`Error al obtener datos del cliente: ${getResponse.status} - ${getResponse.statusText}`);
        throw new Error('Error al obtener datos del cliente');
      }
      
      const clienteActual = await getResponse.json();
      console.log("Datos actuales del cliente:", clienteActual);
      
      // Usar directamente PUT en lugar de PATCH (PATCH no está permitido por CORS)
      console.log("Intentando actualizar con PUT...");
      const putResponse = await fetchWithAuth(`/clientes/${codigo}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...clienteActual,
          Telefono: nuevoTelefono
        }),
      });
      
      if (!putResponse.ok) {
        console.error(`PUT falló con status ${putResponse.status} - ${putResponse.statusText}`);
        const errorText = await putResponse.text();
        console.error("Detalles del error:", errorText);
        throw new Error('Error al actualizar el teléfono del cliente');
      }
      
      console.log("Actualización exitosa con PUT");
      
      // Mostrar mensaje de éxito temporal
      const mensajeAnterior = error;
      error = 'Teléfono actualizado correctamente';
      setTimeout(() => {
        error = mensajeAnterior;
      }, 2000);
      
      return true;
    } catch (err) {
      console.error('Error al actualizar el teléfono:', err);
      error = 'Error al actualizar el teléfono del cliente. Intente nuevamente más tarde.';
      return false;
    } finally {
      isLoading = false;
    }
  }

  function abrirModalWhatsApp(comprobante: Comprobante | null, detalles: ComprobanteDetalle[]) {
    if (!comprobante) return;
    comprobanteParaCompartir = comprobante;
    detallesParaCompartir = detalles;
    
    // Log para depurar - verificar teléfono al abrir modal
    console.log("Teléfono del cliente al abrir modal:", comprobante.ClienteTelefono);
    
    // Precargar el teléfono del cliente si existe
    if (comprobante.ClienteTelefono) {
      // Limpiar el teléfono de espacios, guiones y paréntesis
      numeroTelefono = comprobante.ClienteTelefono.replace(/[\s\-()]/g, '');
      // Si empieza con 0, quitarlo
      if (numeroTelefono.startsWith('0')) {
        numeroTelefono = numeroTelefono.substring(1);
      }
      // Si empieza con 15, quitarlo y asegurarse de que tenga el formato correcto
      // if (numeroTelefono.includes('15')) {
      //   numeroTelefono = numeroTelefono.replace('15', '');
      // }
      console.log("Teléfono procesado:", numeroTelefono);
    } else {
      numeroTelefono = '';
      console.log("No se encontró teléfono para el cliente");
    }
    
    // Guardar el teléfono original para detectar cambios
    telefonoOriginal = numeroTelefono;
    mostrarOpcionActualizar = false;
    mostrarModalWhatsApp = true;
  }

  // Detectar cambios en el número de teléfono
  function verificarCambioTelefono() {
    if (telefonoOriginal && numeroTelefono && telefonoOriginal !== numeroTelefono) {
      mostrarOpcionActualizar = true;
    } else {
      mostrarOpcionActualizar = false;
    }
  }

  function compartirPorWhatsApp() {
    if (!comprobanteParaCompartir || !numeroTelefono) return;
    
    // Limpiar el número de teléfono (quitar espacios y guiones)
    const numeroLimpio = numeroTelefono.replace(/[\s-]/g, '');
    
    // Validar que sea un número válido
    if (!/^\d{10,}$/.test(numeroLimpio)) {
      error = 'Por favor ingrese un número válido (mínimo 10 dígitos)';
      return;
    }

    const mensaje = prepararMensajeComprobante(comprobanteParaCompartir, detallesParaCompartir);
    // Agregar el prefijo del país (54 para Argentina) si no lo tiene
    const numeroCompleto = numeroLimpio.startsWith('54') ? numeroLimpio : `54${numeroLimpio}`;
    const url = `https://wa.me/${numeroCompleto}?text=${encodeURIComponent(mensaje)}`;
    
    mostrarModalWhatsApp = false;
    window.location.href = url;
  }

  function compartirPorEmail(comprobante: Comprobante | null, detalles: ComprobanteDetalle[]) {
    if (!comprobante) return;
    const mensaje = prepararMensajeComprobante(comprobante, detalles);
    const asunto = `Detalle de compra ${comprobante.DocumentoTipo}-${comprobante.DocumentoSucursal}-${comprobante.DocumentoNumero}`;
    const url = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
    window.location.href = url;
  }

  // Función para compartir comprobante mediante Telegram
  function compartirComprobante() {
    if (comprobanteSeleccionado && tg) {
      const mensaje = prepararMensajeComprobante(comprobanteSeleccionado, detallesComprobante);
      
      tg.sendData(JSON.stringify({
        action: 'share',
        data: mensaje
      }));
      
      comprobanteParaCompartir = null;
      detallesParaCompartir = [];
    }
  }
</script>

<!-- Comentado para desvincular el bot de Telegram -->
<svelte:head>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</svelte:head>

<div class="telegram-webapp">
  <button class="btn-volver" on:click={() => navigate('/ventas/bot/home')}>← Volver</button>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  {#if !mostrarDetalles}
    <div class="filtros">
      <select
        bind:value={vendedorFiltro}
        class="select-vendedor"
        on:change={filtrarPorVendedor}
      >
        <option value="">Todos los vendedores</option>
        {#each vendedores as vendedor}
          <option value={vendedor.Codigo}>{vendedor.Descripcion}</option>
        {/each}
      </select>
    </div>

    {#if isLoading}
      <div class="loading">Cargando...</div>
    {/if}

    <div class="comprobantes-lista">
      {#each comprobantes as comprobante}
        <div
          class="comprobante-card"
          on:click={() => cargarDetalles(comprobante)}
          on:keydown={(e) => e.key === 'Enter' && cargarDetalles(comprobante)}
          role="button"
          tabindex="0"
        >
          <div class="comprobante-header">
            <div class="comprobante-fecha">
              {comprobante.Fecha}
              <!-- {formatearFecha(comprobante.FechaFormateada || comprobante.Fecha, comprobante)} -->
            </div>
            <div class="comprobante-vendedor">
              {obtenerNombreVendedor(comprobante.VendedorCodigo)}
            </div>
          </div>
          <div class="comprobante-cliente">
            {comprobante.ClienteDescripcion}
          </div>
          <div class="comprobante-numero">
            {comprobante.DocumentoTipo}-{comprobante.DocumentoSucursal}-{comprobante.DocumentoNumero}
          </div>
          <div class="comprobante-importe">
            {formatearImporte(comprobante.ImporteTotal)}
          </div>
        </div>
      {/each}
    </div>

    <div class="paginacion">
      <button
        class="btn-pagina"
        disabled={currentPage === 1}
        on:click={() => cambiarPagina(currentPage - 1)}
      >
        ←
      </button>
      <span class="pagina-actual">{currentPage} de {totalPages}</span>
      <button
        class="btn-pagina"
        disabled={currentPage === totalPages}
        on:click={() => cambiarPagina(currentPage + 1)}
      >
        →
      </button>
    </div>
  {:else}
    <ComprobanteDetalle
      comprobante={comprobanteFormateado}
      mostrar={mostrarDetalles}
      onClose={cerrarDetalles}
    />
  {/if}

  {#if mostrarModalWhatsApp}
    <div class="modal-overlay">
      <div class="modal-content">
        <h3>Enviar por WhatsApp</h3>
        <div class="form-group">
          <label for="telefono">Número de teléfono:</label>
          <input
            type="tel"
            id="telefono"
            bind:value={numeroTelefono}
            placeholder="Ej: 3492123456"
            class="input-telefono"
            on:input={verificarCambioTelefono}
          />
          <small class="ayuda-texto">Ingrese el número sin 0 ni 15. Ej: 3492123456</small>
          
          {#if mostrarOpcionActualizar && comprobanteParaCompartir}
            <div class="actualizar-telefono">
              <label class="checkbox-container">
                <input type="checkbox" id="actualizarTelefono" />
                <span class="checkbox-label">Actualizar teléfono del cliente</span>
              </label>
              <small class="ayuda-texto">Se guardará el nuevo número en la ficha del cliente</small>
            </div>
          {/if}
        </div>
        <div class="modal-actions">
          <button class="btn-cancelar" on:click={() => mostrarModalWhatsApp = false}>
            Cancelar
          </button>
          {#if mostrarOpcionActualizar && comprobanteParaCompartir}
            <button 
              class="btn-actualizar" 
              on:click={() => {
                const checkboxActualizar = document.getElementById('actualizarTelefono') as HTMLInputElement;
                if (checkboxActualizar && checkboxActualizar.checked && comprobanteParaCompartir) {
                  const telefonoLimpio = numeroTelefono.replace(/[\s\-()]/g, '');
                  actualizarTelefonoCliente(comprobanteParaCompartir.ClienteCodigo, telefonoLimpio);
                }
              }}
            >
              Actualizar Teléfono
            </button>
          {/if}
          <button 
            class="btn-compartir whatsapp" 
            on:click={compartirPorWhatsApp}
          >
            Enviar WhatsApp
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .telegram-webapp {
    padding: 16px;
    max-width: 100%;
    color: var(--tg-theme-text-color, #000);
    background: var(--tg-theme-bg-color, #fff);
  }

  .comprobantes-lista {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .comprobante-card {
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .comprobante-card:hover {
    transform: translateY(-2px);
  }

  .comprobante-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .comprobante-fecha {
    font-size: 0.9em;
    color: var(--tg-theme-hint-color, #999);
  }

  .comprobante-vendedor {
    font-size: 0.9em;
    color: var(--tg-theme-hint-color, #999);
  }

  .comprobante-cliente {
    font-weight: bold;
    margin: 4px 0;
  }

  .comprobante-numero {
    font-size: 0.9em;
    color: var(--tg-theme-hint-color, #999);
  }

  .comprobante-importe {
    font-weight: bold;
    color: var(--tg-theme-button-color, #2481cc);
    text-align: right;
    margin-top: 4px;
  }

  .paginacion {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin-top: 20px;
  }

  .btn-pagina {
    background: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
  }

  .btn-pagina:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .pagina-actual {
    font-size: 0.9em;
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

  .error {
    color: #d32f2f;
    padding: 8px;
    margin-bottom: 16px;
    background-color: #ffebee;
    border-radius: 4px;
  }

  .loading {
    text-align: center;
    padding: 20px;
  }

  .filtros {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .select-vendedor {
    flex: 1;
    padding: 8px;
    border: 1px solid var(--tg-theme-hint-color, #ccc);
    border-radius: 4px;
    font-size: 1em;
    background-color: var(--tg-theme-bg-color, #fff);
    color: var(--tg-theme-text-color, #000);
  }

  .select-vendedor option {
    background-color: var(--tg-theme-bg-color, #fff);
    color: var(--tg-theme-text-color, #000);
  }

  .btn-compartir {
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-size: 1em;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .btn-compartir.whatsapp {
    background-color: #25D366;
    color: white;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background-color: var(--tg-theme-bg-color, #fff);
    padding: 20px;
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
  }

  .modal-content h3 {
    margin: 0 0 16px 0;
    color: var(--tg-theme-text-color, #000);
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    color: var(--tg-theme-text-color, #000);
  }

  .input-telefono {
    width: 100%;
    padding: 8px;
    border: 1px solid var(--tg-theme-hint-color, #ccc);
    border-radius: 4px;
    font-size: 1em;
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    color: var(--tg-theme-text-color, #000);
  }

  .ayuda-texto {
    display: block;
    font-size: 0.8em;
    color: var(--tg-theme-hint-color, #999);
    margin-top: 4px;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 20px;
  }

  .btn-cancelar {
    padding: 8px 16px;
    border: 1px solid var(--tg-theme-hint-color, #ccc);
    background: none;
    border-radius: 4px;
    color: var(--tg-theme-text-color, #000);
    cursor: pointer;
  }

  .actualizar-telefono {
    margin-top: 12px;
    padding: 8px;
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 4px;
  }
  
  .checkbox-container {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  
  .checkbox-label {
    font-size: 0.9em;
    color: var(--tg-theme-text-color, #000);
  }

  .btn-actualizar {
    padding: 8px 16px;
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
</style> 