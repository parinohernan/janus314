<script lang="ts">
  import { onMount } from 'svelte';
  import '../components/bot.css';

  interface Comprobante {
    Fecha: string;
    DocumentoTipo: string;
    DocumentoSucursal: string;
    DocumentoNumero: string;
    ImporteTotal: number;
    ClienteCodigo: string;
    ClienteDescripcion: string;
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
    ImporteTotal: number;
    ClienteCodigo: string;
    VendedorCodigo: string;
    Cliente?: {
      Descripcion: string;
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

  // Telegram WebApp
  let tg: any = null;

  let mostrarModalWhatsApp = false;
  let numeroTelefono = '';
  let comprobanteParaCompartir: Comprobante | null = null;
  let detallesParaCompartir: ComprobanteDetalle[] = [];

  onMount(async () => {
    if (typeof window !== 'undefined' && 'Telegram' in window) {
      const telegram = (window as any).Telegram;
      if (telegram && telegram.WebApp) {
        tg = telegram.WebApp;
        tg.expand();
      }
    }
    await cargarVendedores();
    await cargarComprobantes();
  });

  async function cargarVendedores() {
    try {
      const response = await fetch('https://janus314-api.osvi.lat/api/vendedores?activo=true', {
        credentials: 'include',
        mode: 'cors'
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
      let url = `https://janus314-api.osvi.lat/api/facturas?page=${currentPage}&limit=10&tipo=PRF`;
      
      if (vendedorFiltro) {
        url += `&vendedor=${encodeURIComponent(vendedorFiltro)}`;
      }

      const response = await fetch(url, {
        credentials: 'include',
        mode: 'cors'
      });
      
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
      const response = await fetch(
        `https://janus314-api.osvi.lat/api/facturas/${comprobante.DocumentoTipo}/${comprobante.DocumentoSucursal}/${comprobante.DocumentoNumero}`,
        {
          credentials: 'include',
          mode: 'cors'
        }
      );

      if (!response.ok) {
        throw new Error('Error al cargar los detalles');
      }

      const data = await response.json() as ApiDetalleResponse;
      if (data.success && data.data) {
        detallesComprobante = data.data.items.map((item: ApiFacturaDetalle) => ({
          Codigo: item.CodigoArticulo,
          Descripcion: item.Descripcion,
          Cantidad: item.Cantidad,
          PrecioUnitario: item.PrecioUnitario,
          ImporteTotal: item.Cantidad * item.PrecioUnitario
        }));
        comprobanteSeleccionado = {
          ...comprobante,
          ClienteDescripcion: data.data.encabezado.Cliente?.Descripcion || 'Sin cliente'
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

  function formatearFecha(fecha: string): string {
    const f = new Date(fecha);
    return f.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
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
    const fecha = formatearFecha(comprobante.Fecha);
    const numeroCompleto = `${comprobante.DocumentoTipo}-${comprobante.DocumentoSucursal}-${comprobante.DocumentoNumero}`;
    
    let mensaje = `*Detalle de su compra*\n`;
    mensaje += `ID: ${numeroCompleto}\n`;
    mensaje += `Fecha: ${fecha}\n`;
    mensaje += `Cliente: ${comprobante.ClienteDescripcion}\n`;
    mensaje += `Vendedor: ${obtenerNombreVendedor(comprobante.VendedorCodigo)}\n\n`;
    
    mensaje += `*Productos:*\n`;
    detalles.forEach(item => {
      mensaje += `• ${item.Descripcion}\n`;
      mensaje += `  ${item.Cantidad} x ${formatearImporte(item.PrecioUnitario)} = ${formatearImporte(item.ImporteTotal)}\n`;
    });
    
    mensaje += `\n*Total: ${formatearImporte(comprobante.ImporteTotal)}*\n\n`;
    mensaje += `Muchas gracias por su compra.`;
    
    return mensaje;
  }

  function abrirModalWhatsApp(comprobante: Comprobante | null, detalles: ComprobanteDetalle[]) {
    if (!comprobante) return;
    comprobanteParaCompartir = comprobante;
    detallesParaCompartir = detalles;
    numeroTelefono = '';
    mostrarModalWhatsApp = true;
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
</script>

<svelte:head>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</svelte:head>

<div class="telegram-webapp">
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
              {formatearFecha(comprobante.Fecha)}
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
    <div class="detalles-comprobante">
      <button class="btn-volver" on:click={cerrarDetalles}>← Volver</button>
      
      {#if comprobanteSeleccionado}
        <div class="detalles-header">
          <h2>{comprobanteSeleccionado.DocumentoTipo}-{comprobanteSeleccionado.DocumentoSucursal}-{comprobanteSeleccionado.DocumentoNumero}</h2>
          <div class="detalles-fecha">{formatearFecha(comprobanteSeleccionado.Fecha)}</div>
          <div class="detalles-cliente">{comprobanteSeleccionado.ClienteDescripcion}</div>
        </div>

        <div class="detalles-items">
          {#each detallesComprobante as item}
            <div class="detalle-item">
              <div class="item-descripcion">{item.Descripcion}</div>
              <div class="item-cantidad">{item.Cantidad}</div>
              <div class="item-precio">{formatearImporte(item.PrecioUnitario)}</div>
              <div class="item-total">{formatearImporte(item.ImporteTotal)}</div>
            </div>
          {/each}
        </div>

        <div class="detalles-total">
          <span>Total:</span>
          <span>{formatearImporte(comprobanteSeleccionado.ImporteTotal)}</span>
        </div>

        <div class="acciones-comprobante">
          <button 
            class="btn-compartir whatsapp"
            on:click={() => abrirModalWhatsApp(comprobanteSeleccionado, detallesComprobante)}
          >
            Compartir por WhatsApp
          </button>
          <button 
            class="btn-compartir email"
            on:click={() => compartirPorEmail(comprobanteSeleccionado, detallesComprobante)}
          >
            Compartir por Email
          </button>
        </div>
      {/if}
    </div>
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
          />
          <small class="ayuda-texto">Ingrese el número sin 0 ni 15. Ej: 3492123456</small>
        </div>
        <div class="modal-actions">
          <button class="btn-cancelar" on:click={() => mostrarModalWhatsApp = false}>
            Cancelar
          </button>
          <button class="btn-compartir whatsapp" on:click={compartirPorWhatsApp}>
            Enviar
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

  .detalles-comprobante {
    padding: 16px 0;
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

  .detalles-header {
    margin-bottom: 20px;
  }

  .detalles-header h2 {
    margin: 0;
    font-size: 1.2em;
  }

  .detalles-fecha {
    color: var(--tg-theme-hint-color, #999);
    font-size: 0.9em;
    margin: 4px 0;
  }

  .detalles-cliente {
    font-weight: bold;
  }

  .detalles-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .detalle-item {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid var(--tg-theme-hint-color, #eee);
  }

  .item-descripcion {
    font-size: 0.9em;
  }

  .item-cantidad {
    text-align: right;
    font-size: 0.9em;
  }

  .item-precio {
    text-align: right;
    font-size: 0.9em;
    color: var(--tg-theme-hint-color, #999);
  }

  .item-total {
    text-align: right;
    font-size: 0.9em;
    font-weight: bold;
  }

  .detalles-total {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 2px solid var(--tg-theme-hint-color, #eee);
    font-weight: bold;
    font-size: 1.1em;
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

  .acciones-comprobante {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--tg-theme-hint-color, #eee);
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

  .btn-compartir.email {
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
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
</style> 