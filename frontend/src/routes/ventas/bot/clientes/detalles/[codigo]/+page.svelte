<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import '../../../../../../app.css';
  import Breadcrumbs from '../../../components/Breadcrumbs/index.svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  
  // Exportar las propiedades del componente
  export let data: { cliente: any };

  // Datos del cliente
  let cliente = data.cliente || {};
  let loading = false;
  let error = '';
  let saldoActual = data.cliente.ImporteDeuda || 0;
  let ultimasFacturas : any = [];

  // Cargar información adicional
  async function cargarInformacionAdicional() {
    try {
      loading = true;
      error = '';
      
      // // Cargar saldo actual
      // const responseSaldo = await fetchWithAuth(`/clientes/${cliente.Codigo}/saldo`);
      // if (responseSaldo.ok) {
      //   const saldoData = await responseSaldo.json();
      //   saldoActual = saldoData.importeDeuda || 0;
      // }
      // const responseSaldo = data.cliente.ImporteDeuda;
      // Cargar últimas facturas
      const responseFacturas = await fetchWithAuth(`/clientes/${cliente.Codigo}/comprobantes`, {
        params: {
          limit: 5,
          page: 1
        }
      });
      if (responseFacturas.ok) {
        const facturasData = await responseFacturas.json();
        ultimasFacturas = facturasData.items || [];
      }
      
    } catch (err) {
      console.error('Error al cargar información adicional:', err);
      error = 'Error al cargar información adicional. Algunos datos podrían no estar disponibles.';
    } finally {
      loading = false;
    }
  }

  // Volver al listado de clientes
  function volverListado() {
    goto('/ventas/bot/clientes');
  }

  // Ir a edición del cliente
  function editarCliente() {
    goto(`/ventas/bot/clientes/editar/${cliente.Codigo}`);
  }

  // Cargar datos adicionales al montar el componente
  onMount(() => {
    cargarInformacionAdicional();
  });

  // Formatear número como moneda
  function formatearMonto(valor: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(valor);
  }

  // Formatear fecha
  function formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-AR');
  }
</script>

<div class="detalle-cliente-container">
  <!-- Breadcrumbs -->
  <Breadcrumbs />
  
  <!-- Header con título y botones de acción -->
  <header class="header">
    <div class="header-title">
      <h1>Detalles del Cliente</h1>
      <div class="cliente-code">Código: {cliente.Codigo}</div>
    </div>
    <div class="header-actions">
      <button class="btn-back" on:click={volverListado} aria-label="Volver al listado">
        <span class="icon">←</span> <span class="label">Volver</span>
      </button>
      
      <button class="btn-edit" on:click={editarCliente} aria-label="Editar cliente">
        <span class="icon">✏️</span> <span class="label">Editar</span>
      </button>
    </div>
  </header>
  
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <span>Cargando información adicional...</span>
    </div>
  {:else if error}
    <div class="error-message">
      <p>{error}</p>
      <button on:click={() => error = ''}>Cerrar</button>
    </div>
  {/if}
  
  <!-- Contenido principal -->
  <div class="cliente-details">
    <!-- Sección de información básica -->
    <section class="detail-section">
      <h2>Información General</h2>
      
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">Nombre/Razón Social</div>
          <div class="detail-value">{cliente.Descripcion || 'No disponible'}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">CUIT/DNI</div>
          <div class="detail-value">{cliente.Cuit || 'No especificado'}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">Teléfono</div>
          <div class="detail-value">{cliente.Telefono || 'No especificado'}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">Email</div>
          <div class="detail-value">{cliente.Email || 'No especificado'}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">Estado</div>
          <div class="detail-value">
            <span class="status-indicator {cliente.Activo ? 'active' : 'inactive'}">
              {cliente.Activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Sección de cuenta corriente -->
    <section class="detail-section">
      <h2>Cuenta Corriente</h2>
      
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">Saldo Actual</div>
          <div class="detail-value saldo-level {saldoActual > 0 ? 'positivo' : 'negativo'}">
            {formatearMonto(saldoActual)}
          </div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">Límite de Crédito</div>
          <div class="detail-value">{formatearMonto(cliente.LimiteCredito || 0)}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">Condición IVA</div>
          <div class="detail-value">{cliente.CondicionIva || 'No especificada'}</div>
        </div>
      </div>
    </section>
    
    <!-- Sección de últimas facturas -->
    <section class="detail-section">
      <h2>Últimos Comprobantes</h2>
      
      {#if ultimasFacturas.length > 0}
        <div class="facturas-list">
          {#each ultimasFacturas as comprobante}
            <div class="factura-item">
              <div class="factura-info">
                <div class="factura-numero">{comprobante.Detalle}</div>
                <div class="factura-fecha">{formatearFecha(comprobante.Fecha)}</div>
              </div>
              <div class="factura-montos">
                <div class="monto-debito">{formatearMonto(comprobante.Debitos)}</div>
                <div class="monto-credito" class:negativo={comprobante.Creditos < 0}>{formatearMonto(comprobante.Creditos)}</div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="no-data">No hay comprobantes recientes</p>
      {/if}
    </section>
  </div>
</div>

<style>
  .detalle-cliente-container {
    padding: 16px;
    max-width: 100%;
    color: var(--tg-theme-text-color, #000);
    background: var(--tg-theme-bg-color, #fff);
    min-height: 100vh;
  }
  
  .header {
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .header-title {
    display: flex;
    flex-direction: column;
  }
  
  .header-title h1 {
    font-size: 1.8rem;
    margin: 0 0 4px 0;
    color: var(--tg-theme-text-color, #000);
  }
  
  .cliente-code {
    font-size: 1rem;
    color: var(--tg-theme-hint-color, #777);
  }
  
  .header-actions {
    display: flex;
    gap: 10px;
  }
  
  .btn-back, .btn-edit {
    padding: 8px 16px;
    border-radius: 8px;
    border: none;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.9rem;
    cursor: pointer;
  }
  
  .btn-back {
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    color: var(--tg-theme-text-color, #000);
  }
  
  .btn-edit {
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
  }
  
  .icon {
    font-size: 1.1rem;
  }
  
  .loading-state, .error-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 8px;
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
  }
  
  .spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--tg-theme-hint-color, #ccc);
    border-top-color: var(--tg-theme-button-color, #2481cc);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 12px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .error-message {
    color: #f44336;
  }
  
  .error-message button {
    margin-top: 10px;
    padding: 6px 12px;
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .cliente-details {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .detail-section {
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 8px;
    padding: 20px;
  }
  
  .detail-section h2 {
    font-size: 1.4rem;
    margin: 0 0 16px 0;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--tg-theme-hint-color, #ccc);
    color: var(--tg-theme-text-color, #000);
  }
  
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  
  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .detail-label {
    font-size: 0.9rem;
    color: var(--tg-theme-hint-color, #777);
  }
  
  .detail-value {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--tg-theme-text-color, #000);
  }
  
  .status-indicator {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  .status-indicator.active {
    background-color: rgba(76, 175, 80, 0.2);
    color: #388e3c;
  }
  
  .status-indicator.inactive {
    background-color: rgba(244, 67, 54, 0.2);
    color: #d32f2f;
  }
  
  .saldo-level.positivo {
    color: #388e3c;
  }
  
  .saldo-level.negativo {
    color: #f44336;
  }
  
  .facturas-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .factura-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background-color: var(--tg-theme-bg-color, #fff);
    border-radius: 6px;
    border: 1px solid var(--tg-theme-hint-color, #eee);
  }
  
  .factura-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .factura-numero {
    font-weight: 500;
    color: var(--tg-theme-text-color, #000);
  }
  
  .factura-fecha {
    font-size: 0.9rem;
    color: var(--tg-theme-hint-color, #777);
  }
  
  .factura-montos {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }
  
  .monto-debito {
    font-weight: 500;
    color: var(--tg-theme-text-color, #000);
  }

  .monto-credito {
    font-weight: 500;
    color:  #3b6fce;
  }
  
  /* .monto-saldo {
    font-size: 0.9rem;
    color: #388e3c;
  }
   */
  /* .monto-saldo.negativo {
    color: #f44336;
  } */
  
  .no-data {
    text-align: center;
    color: var(--tg-theme-hint-color, #777);
    font-style: italic;
  }
  
  @media (max-width: 600px) {
    .detail-grid {
      grid-template-columns: 1fr;
    }
    
    .header {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .header-actions {
      width: 100%;
      justify-content: space-between;
    }
  }
</style> 