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
      {/if}
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
</style> 