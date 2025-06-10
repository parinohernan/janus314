# Nuevo archivo
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { EmpresaService } from '$lib/services/EmpresaService';
  import FormasPago from '$lib/components/recibos/FormasPago.svelte';
  import '../../../bot/components/bot.css';
  import LogoJano from '../../../bot/components/LogoJano.svelte';

  // Estado del formulario
  let loading = false;
  let error: string | null = null;
  let success = false;

  // Estado de clientes
  let clientesOptions: any[] = [];
  let clientesLoading = false;
  let clienteSearch = '';
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let clienteSeleccionado: any = null;

  // Estado de documentos
  let documentosDeuda: any[] = [];
  let loadingDocumentos = false;
  let documentosSeleccionados: any[] = [];
  let importeTotalPagar = 0;
  let importesEditados: Record<string, number> = {};

  // Estado de formas de pago
  let formasPago: any[] = [];
  let importeTotalFormasPago = 0;
  let saldoPendiente = 0;

  // Código del vendedor
  let codigoVendedor: string = '';

  // Datos del recibo
  let recibo = {
    DocumentoTipo: 'RCF',
    DocumentoSucursal: '',
    DocumentoNumero: '',
    Fecha: new Date().toISOString().split('T')[0],
    ClienteId: '',
    Observaciones: ''
  };

  // Función para obtener la clave única de un documento
  function getDocumentoKey(doc: any) {
    return `${doc.DocumentoTipo}-${doc.DocumentoSucursal}-${doc.DocumentoNumero}`;
  }

  // Buscar clientes
  const buscarClientes = async (busqueda = '') => {
    if (timeoutId) clearTimeout(timeoutId);
    
    if (!busqueda || busqueda.length < 2) {
      clientesOptions = [];
      return;
    }
    
    clientesLoading = true;
    
    timeoutId = setTimeout(async () => {
      try {
        const response = await fetchWithAuth('/clientes', {
          params: {
            search: busqueda,
            limit: 10
          }
        });
        
        if (!response.ok) {
          throw new Error('Error al buscar clientes');
        }
        
        const data = await response.json();
        clientesOptions = data.items;
      } catch (error) {
        console.error('Error buscando clientes:', error);
        clientesOptions = [];
      } finally {
        clientesLoading = false;
      }
    }, 300);
  };

  // Seleccionar un cliente
  async function seleccionarCliente(cliente: any) {
    clienteSeleccionado = cliente;
    recibo.ClienteId = cliente.Id;
    clienteSearch = cliente.Descripcion;
    clientesOptions = [];
    
    if (cliente.Codigo) {
      await cargarDocumentosDeuda(cliente.Codigo);
    }
  }

  // Cargar documentos de deuda
  async function cargarDocumentosDeuda(codigoCliente: string) {
    if (!codigoCliente) return;
    
    loadingDocumentos = true;
    error = null;
    
    try {
      const response = await fetchWithAuth(`/recibos/docdeuda/${codigoCliente}`);
      
      if (!response.ok) {
        throw new Error(`Error al cargar documentos: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        documentosDeuda = data.data;
      } else {
        documentosDeuda = [];
        error = 'No se encontraron documentos';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error desconocido';
      documentosDeuda = [];
    } finally {
      loadingDocumentos = false;
    }
  }

  // Seleccionar documento
  function seleccionarDocumento(doc: any) {
    const key = getDocumentoKey(doc);
    const index = documentosSeleccionados.findIndex(d => getDocumentoKey(d) === key);
    
    if (index === -1) {
      documentosSeleccionados = [...documentosSeleccionados, doc];
      importesEditados[key] = doc.ImporteTotal - (doc.ImportePagado || 0);
    } else {
      documentosSeleccionados = documentosSeleccionados.filter((_, i) => i !== index);
      delete importesEditados[key];
    }
    
    calcularTotales();
  }

  // Calcular totales
  function calcularTotales() {
    importeTotalPagar = documentosSeleccionados.reduce((total, doc) => {
      const key = getDocumentoKey(doc);
      return total + (importesEditados[key] || 0);
    }, 0);
    
    saldoPendiente = importeTotalPagar - importeTotalFormasPago;
  }

  // Obtener próximo número
  async function obtenerProximoNumero() {
    try {
      const response = await fetchWithAuth(`/numeros-control/${recibo.DocumentoTipo}/${recibo.DocumentoSucursal}`);
      if (response.ok) {
        const data = await response.json();
        recibo.DocumentoNumero = data.data.proximoNumero;
      }
    } catch (error) {
      console.error('Error obteniendo próximo número:', error);
    }
  }

  // Grabar recibo
  async function grabarRecibo() {
    if (!clienteSeleccionado) {
      error = 'Debe seleccionar un cliente';
      return;
    }

    if (documentosSeleccionados.length === 0) {
      error = 'Debe seleccionar al menos un documento';
      return;
    }

    if (saldoPendiente > 0) {
      error = 'Debe cubrir el importe total';
      return;
    }

    if (!codigoVendedor) {
      error = 'No se encontró el código del vendedor';
      return;
    }

    loading = true;
    error = null;

    try {
      const reciboData = {
        ...recibo,
        DocumentoNumero: recibo.DocumentoNumero.toString().padStart(8, '0'),
        CodigoCliente: clienteSeleccionado.Codigo,
        VendedorCodigo: codigoVendedor,
        DocumentosDeuda: documentosSeleccionados.map(doc => ({
          DocumentoTipo: doc.DocumentoTipo,
          DocumentoSucursal: doc.DocumentoSucursal,
          DocumentoNumero: doc.DocumentoNumero.toString().padStart(8, '0'),
          Importe: importesEditados[getDocumentoKey(doc)]
        })),
        DocumentosCredito: [],
        FormasPago: formasPago.map(fp => ({
          Codigo: fp.codigo,
          Descripcion: fp.descripcion,
          Banco: fp.banco,
          Numero: fp.numero,
          Fecha: fp.fecha,
          Importe: fp.importe
        })),
        ImporteTotal: importeTotalPagar
      };

      const response = await fetchWithAuth('/recibos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reciboData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al grabar el recibo');
      }

      success = true;
      setTimeout(() => {
        goto('/ventas/bot/recibos');
      }, 2000);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al grabar el recibo';
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    try {
      // Obtener sucursal
      recibo.DocumentoSucursal = await EmpresaService.obtenerSucursal();
      
      // Obtener próximo número
      await obtenerProximoNumero();
      
      // Obtener código del vendedor del localStorage
      codigoVendedor = localStorage.getItem('botVendedorCodigo') || '';
      if (!codigoVendedor) {
        error = 'No se encontró el código del vendedor';
      }
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    }
  });
</script>

<div class="telegram-webapp">
  <!-- Header con título y botón volver -->
  <header class="header">
    <div class="header-content">
      <button class="btn-back" on:click={() => goto('/ventas/bot/recibos')} aria-label="Volver">
        <span class="back-icon">←</span>
      </button>
      <div class="title-container">
        <LogoJano size="small" animated={false} />
        <h2 class="page-subtitle">Nuevo Recibo</h2>
      </div>
    </div>
  </header>

  <div class="content">
    {#if error}
      <div class="error-message" transition:fade>
        {error}
      </div>
    {/if}

    <!-- Búsqueda de Cliente -->
    <div class="section">
      <label for="cliente-search">Cliente</label>
      <div class="search-container">
        <input
          id="cliente-search"
          type="text"
          bind:value={clienteSearch}
          on:input={() => buscarClientes(clienteSearch)}
          placeholder="Buscar cliente..."
          class="input-field"
        />
        {#if clientesLoading}
          <div class="loading-indicator"></div>
        {/if}
      </div>

      {#if clientesOptions.length > 0}
        <div class="search-results">
          {#each clientesOptions as cliente}
            <button
              class="cliente-option"
              on:click={() => seleccionarCliente(cliente)}
            >
              <div class="cliente-nombre">{cliente.Descripcion}</div>
              <div class="cliente-info">
                <span>Código: {cliente.Codigo}</span>
                {#if cliente.ImporteDeuda !== undefined}
                  <span>Deuda: ${cliente.ImporteDeuda.toFixed(2)}</span>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      {/if}

      {#if clienteSeleccionado}
        <div class="cliente-seleccionado">
          <div class="cliente-datos">
            <div class="cliente-nombre">{clienteSeleccionado.Descripcion}</div>
            <div class="cliente-info">
              <span>Código: {clienteSeleccionado.Codigo}</span>
              {#if clienteSeleccionado.ImporteDeuda !== undefined}
                <span>Deuda: ${clienteSeleccionado.ImporteDeuda.toFixed(2)}</span>
              {/if}
            </div>
          </div>
          <button 
            class="btn-cambiar"
            on:click={() => {
              clienteSeleccionado = null;
              clienteSearch = '';
              documentosDeuda = [];
              documentosSeleccionados = [];
              calcularTotales();
            }}
          >
            Cambiar
          </button>
        </div>
      {/if}
    </div>

    <!-- Documentos -->
    {#if loadingDocumentos}
      <div class="loading-container">
        <div class="loading-indicator"></div>
        <span>Cargando documentos...</span>
      </div>
    {:else if documentosDeuda.length > 0}
      <div class="section">
        <h3>Documentos a Pagar</h3>
        <div class="documentos-lista">
          {#each documentosDeuda as doc}
            {@const key = getDocumentoKey(doc)}
            {@const isSelected = documentosSeleccionados.some(d => getDocumentoKey(d) === key)}
            <button
              class="documento-item"
              class:selected={isSelected}
              on:click={() => seleccionarDocumento(doc)}
            >
              <div class="documento-info">
                <div class="documento-tipo">{doc.DocumentoTipo}-{doc.DocumentoSucursal}-{doc.DocumentoNumero}</div>
                <div class="documento-fecha">{new Date(doc.Fecha).toLocaleDateString()}</div>
              </div>
              <div class="documento-importes">
                <div class="importe-total">Total: ${doc.ImporteTotal.toFixed(2)}</div>
                <div class="importe-pendiente">Pendiente: ${(doc.ImporteTotal - (doc.ImportePagado || 0)).toFixed(2)}</div>
              </div>
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Formas de Pago -->
    {#if documentosSeleccionados.length > 0}
      <div class="section">
        <FormasPago
          bind:formasPago
          bind:importeTotalFormasPago
          bind:saldoPendiente
          on:change={({ detail }) => {
            formasPago = detail.formasPago;
            importeTotalFormasPago = detail.importeTotalFormasPago;
            saldoPendiente = detail.saldoPendiente;
          }}
        />
      </div>
    {/if}

    <!-- Resumen -->
    {#if documentosSeleccionados.length > 0}
      <div class="section resumen">
        <h3>Resumen</h3>
        <div class="resumen-item">
          <span>Total a Pagar:</span>
          <span class="importe">${importeTotalPagar.toFixed(2)}</span>
        </div>
        <div class="resumen-item">
          <span>Total Formas de Pago:</span>
          <span class="importe">${importeTotalFormasPago.toFixed(2)}</span>
        </div>
        <div class="resumen-item saldo">
          <span>Saldo Pendiente:</span>
          <span class="importe" class:negativo={saldoPendiente > 0}>${saldoPendiente.toFixed(2)}</span>
        </div>
      </div>

      <!-- Botón Grabar -->
      <button
        class="btn-grabar"
        disabled={loading || saldoPendiente > 0}
        on:click={grabarRecibo}
      >
        {loading ? 'Grabando...' : 'Grabar Recibo'}
      </button>
    {/if}

    <!-- Mensaje de éxito -->
    {#if success}
      <div class="success-message" transition:fade>
        <div class="success-icon">✓</div>
        <p>Recibo grabado correctamente</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .telegram-webapp {
    padding: 16px;
    max-width: 100%;
    min-height: 100vh;
    color: var(--tg-theme-text-color, #000);
    background: var(--tg-theme-bg-color, #fff);
  }

  .header {
    margin-bottom: 16px;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .btn-back {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--tg-theme-button-color, #2481cc);
    padding: 4px;
  }

  .title-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .page-subtitle {
    font-size: 1.5rem;
    margin: 0;
    color: var(--tg-theme-text-color, #000);
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .section {
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 12px;
    padding: 16px;
  }

  .section h3 {
    margin: 0 0 12px 0;
    font-size: 1.1rem;
    color: var(--tg-theme-text-color, #000);
  }

  .error-message {
    background-color: #fee2e2;
    padding: 12px;
    border-radius: 8px;
    color: #dc2626;
  }

  .search-container {
    position: relative;
  }

  .input-field {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--tg-theme-hint-color, #ddd);
    border-radius: 8px;
    font-size: 16px;
    background: var(--tg-theme-bg-color, #fff);
  }

  .loading-indicator {
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid var(--tg-theme-button-color, #2481cc);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .search-results {
    margin-top: 8px;
    background: var(--tg-theme-bg-color, #fff);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .cliente-option {
    width: 100%;
    padding: 12px;
    text-align: left;
    border: none;
    background: none;
    border-bottom: 1px solid var(--tg-theme-hint-color, #eee);
  }

  .cliente-option:last-child {
    border-bottom: none;
  }

  .cliente-seleccionado {
    margin-top: 12px;
    padding: 12px;
    background: var(--tg-theme-bg-color, #fff);
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .cliente-nombre {
    font-weight: 500;
    margin-bottom: 4px;
  }

  .cliente-info {
    font-size: 0.9rem;
    color: var(--tg-theme-hint-color, #666);
    display: flex;
    gap: 8px;
  }

  .btn-cambiar {
    padding: 6px 12px;
    border: none;
    background: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    border-radius: 6px;
    font-size: 0.9rem;
  }

  .documentos-lista {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .documento-item {
    width: 100%;
    padding: 12px;
    text-align: left;
    border: 1px solid var(--tg-theme-hint-color, #ddd);
    border-radius: 8px;
    background: var(--tg-theme-bg-color, #fff);
  }

  .documento-item.selected {
    border-color: var(--tg-theme-button-color, #2481cc);
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
  }

  .documento-info {
    margin-bottom: 8px;
  }

  .documento-tipo {
    font-weight: 500;
  }

  .documento-fecha {
    font-size: 0.9rem;
    color: var(--tg-theme-hint-color, #666);
  }

  .documento-importes {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
  }

  .resumen {
    background: var(--tg-theme-bg-color, #fff);
    border: 1px solid var(--tg-theme-hint-color, #ddd);
  }

  .resumen-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--tg-theme-hint-color, #eee);
  }

  .resumen-item:last-child {
    border-bottom: none;
  }

  .resumen-item.saldo {
    font-weight: 500;
  }

  .importe {
    color: var(--tg-theme-button-color, #2481cc);
  }

  .importe.negativo {
    color: #dc2626;
  }

  .btn-grabar {
    width: 100%;
    padding: 16px;
    background: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    margin-top: 16px;
  }

  .btn-grabar:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .success-message {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--tg-theme-bg-color, #fff);
    padding: 24px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }

  .success-icon {
    width: 48px;
    height: 48px;
    background: #22c55e;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    margin: 0 auto 16px;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 24px;
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 8px;
  }
</style> 