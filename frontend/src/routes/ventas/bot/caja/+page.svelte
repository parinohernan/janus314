<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import '../../../../app.css';
  import Breadcrumbs from '../components/Breadcrumbs/index.svelte';
  import LogoJano from '../components/LogoJano.svelte';

  interface CajaCabeza {
    Codigo: number;
    VendedorId: string;
    SaldoInicial: number;
    SaldoCierre: number | null;
    SaldoTeorico: number;
    Apertura: string;
    Cierre: string | null;
    Estado: 'abierta' | 'cerrada' | 'en_arqueo';
    Observaciones: string | null;
  }

  interface Movimiento {
    Codigo: number;
    CajaCabezaId: number;
    Tipo: 'ingreso' | 'egreso';
    Importe: number;
    Concepto: string;
    MetodoPago: string;
    FechaHora: string;
    TipoPago?: {
      Codigo: string;
      Descripcion: string;
    };
  }

  const breadcrumbs = [
    { label: 'Home', path: '/ventas/bot/home' },
    { label: 'Caja', path: '/ventas/bot/caja' }
  ];

  // Estados
  let cajaAbierta: CajaCabeza | null = null;
  let movimientos: Movimiento[] = [];
  let loading: boolean = true;
  let error: string | null = null;
  let vendedorId: string = '';
  let saldoInicial: number = 0;

  // Estado del modal
  let showModal = false;

  // Función para alternar el modal
  function toggleModal() {
    showModal = !showModal;
  }

  // Manejar eventos de teclado para el modal
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && showModal) {
      toggleModal();
    }
  }

  // Función para cargar el estado de la caja
  async function cargarEstadoCaja() {
    try {
      // Obtener el código del vendedor del localStorage
      vendedorId = localStorage.getItem('botVendedorCodigo') || '';
      if (!vendedorId) {
        error = "No se encontró el código del vendedor";
        return;
      }

      console.log('Intentando cargar estado de caja para vendedor:', vendedorId);
      const response = await fetchWithAuth(`/cajas/vendedor/${vendedorId}`);
      console.log('Respuesta del servidor:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Datos recibidos:', data);
      
      if (data.success && data.data.length > 0) {
        cajaAbierta = data.data[0] as CajaCabeza;
        if (cajaAbierta) {
          await cargarMovimientos(cajaAbierta.Codigo);
        }
      } else {
        console.log('No se encontraron cajas abiertas');
      }
      loading = false;
    } catch (err: unknown) {
      console.error('Error detallado:', err);
      error = `Error al cargar el estado de la caja: ${err instanceof Error ? err.message : 'Error desconocido'}`;
      loading = false;
    }
  }

  // Función para cargar movimientos
  async function cargarMovimientos(cajaCodigo: number) {
    try {
      const response = await fetchWithAuth(`/cajas/${cajaCodigo}/movimientos`);
      const data = await response.json();
      if (data.success) {
        movimientos = data.data;
      }
    } catch (err) {
      error = "Error al cargar los movimientos";
    }
  }

  // Función para abrir caja
  async function abrirCaja() {
    try {
      loading = true;
      const response = await fetchWithAuth('/cajas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendedorId,
          saldoInicial,
          descripcion: 'Apertura de caja'
        })
      });
      const data = await response.json();
      if (data.success) {
        cajaAbierta = data.data;
        error = null;
        await cargarEstadoCaja();
      }
    } catch (err) {
      error = "Error al abrir la caja";
    } finally {
      loading = false;
    }
  }

  // Función para registrar movimiento
  async function registrarMovimiento(tipo: 'ingreso' | 'egreso', importe: number, concepto: string) {
    if (!cajaAbierta) return;
    
    try {
      const response = await fetchWithAuth('/cajas/movimiento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cajaCabezaId: cajaAbierta.Codigo,
          tipo,
          importe: parseFloat(importe.toString()),
          concepto,
          metodoPago: 'EFE', // Efectivo por defecto
          usuarioId: vendedorId
        })
      });
      const data = await response.json();
      if (data.success) {
        await cargarEstadoCaja();
      }
    } catch (err) {
      error = "Error al registrar el movimiento";
    }
  }

  onMount(() => {
    cargarEstadoCaja();
  });
</script>

<div class="telegram-webapp">
  <!-- Header con título y botón volver -->
  <header class="header">
    <div class="header-content">
      <button class="btn-back" on:click={() => goto('/ventas/bot/home')} aria-label="Volver">
        <span class="back-icon">←</span>
      </button>
      <div class="title-container">
        <LogoJano size="small" animated={false} />
        <h2 class="page-subtitle">
          Caja
          <button 
            class="btn-help" 
            on:click={toggleModal}
            aria-label="Ayuda">
            <span class="help-icon">?</span>
          </button>
        </h2>
      </div>
    </div>
  </header>

  <!-- Modal de Ayuda -->
  {#if showModal}
    <!-- Contenedor del modal -->
    <div 
      class="modal-overlay" 
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
      tabindex="-1"
      on:keydown={handleKeydown}
      transition:fade>
      
      <!-- Botón invisible para cerrar con click fuera -->
      <button
        class="modal-backdrop"
        on:click={toggleModal}
        aria-label="Cerrar modal haciendo clic fuera">
        <span class="sr-only">Cerrar modal</span>
      </button>

      <!-- Contenido del modal -->
      <div 
        class="modal-content" 
        role="document">
        <button 
          class="modal-close" 
          on:click={toggleModal}
          aria-label="Cerrar modal">
          ×
        </button>
        
        <h3 class="modal-title" id="modal-title">Guía de Uso del Módulo de Caja</h3>
        
        <div class="modal-section">
          <h4>¿Cómo usar el módulo de caja?</h4>
          <ol class="instruction-list">
            <li><strong>Apertura de Caja:</strong> Al inicio del día, abra la caja ingresando el saldo inicial.</li>
            <li><strong>Registro de Movimientos:</strong>
              <ul>
                <li>Use "Ingreso" para registrar entradas de dinero</li>
                <li>Use "Egreso" para registrar salidas de dinero</li>
              </ul>
            </li>
            <li><strong>Arqueo de Caja:</strong> Realice arqueos periódicos para verificar que el dinero físico coincida con el saldo del sistema.</li>
            <li><strong>Cierre de Caja:</strong> Al finalizar el día, realice el cierre registrando el saldo final.</li>
          </ol>
        </div>

        <div class="modal-section">
          <h4>Ventajas para su Negocio</h4>
          <ul class="benefits-list">
            <li><span class="benefit-icon">📊</span> <strong>Control Financiero:</strong> Seguimiento preciso de todos los movimientos de dinero.</li>
            <li><span class="benefit-icon">🔍</span> <strong>Transparencia:</strong> Detecte y prevenga descuadres o pérdidas.</li>
            <li><span class="benefit-icon">📱</span> <strong>Accesibilidad:</strong> Gestione su caja desde cualquier dispositivo.</li>
            <li><span class="benefit-icon">📈</span> <strong>Reportes:</strong> Obtenga información detallada para toma de decisiones.</li>
            <li><span class="benefit-icon">⚡</span> <strong>Eficiencia:</strong> Agilice sus operaciones diarias de caja.</li>
            <li><span class="benefit-icon">🔒</span> <strong>Seguridad:</strong> Mantenga un registro seguro de todas las operaciones.</li>
          </ul>
        </div>

        <div class="modal-section">
          <h4>Recomendaciones</h4>
          <ul class="tips-list">
            <li>Realice arqueos frecuentes para mantener el control.</li>
            <li>Registre los movimientos en el momento que ocurren.</li>
            <li>Anote observaciones relevantes en cada operación.</li>
            <li>Verifique el saldo antes del cierre diario.</li>
          </ul>
        </div>
      </div>
    </div>
  {/if}

  <div class="p-4">
    {#if loading}
      <div class="flex justify-center items-center h-32">
        <div class="loading-spinner"></div>
      </div>
    {:else if error}
      <div class="error-message p-4 mb-4" transition:fade>
        {error}
      </div>
    {:else}
      <!-- Estado de Caja -->
      <div class="caja-estado mb-6" class:caja-abierta={cajaAbierta} class:caja-cerrada={!cajaAbierta}>
        <h2 class="text-xl font-bold mb-2">
          {cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}
        </h2>
        
        {#if cajaAbierta}
          <div class="saldo-info p-4 rounded-lg bg-blue-50 mb-4">
            <div class="text-sm text-gray-600">Saldo Actual</div>
            <div class="text-2xl font-bold text-blue-600">
              ${(parseFloat(cajaAbierta.SaldoTeorico?.toString() || '0')).toFixed(2)}
            </div>
          </div>

          <!-- Acciones Rápidas -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <button
              class="btn-ingreso p-4 rounded-lg bg-green-500 text-white font-medium"
              on:click={() => goto('/ventas/bot/caja/ingreso')}>
              + Ingreso
            </button>
            <button
              class="btn-egreso p-4 rounded-lg bg-red-500 text-white font-medium"
              on:click={() => goto('/ventas/bot/caja/egreso')}>
              - Egreso
            </button>
          </div>

          <!-- Acciones de Caja -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <button
              class="btn-arqueo p-4 rounded-lg bg-blue-500 text-white font-medium"
              on:click={() => goto('/ventas/bot/caja/arqueo')}>
              📊 Arqueo
            </button>
            <button
              class="btn-cierre p-4 rounded-lg bg-purple-500 text-white font-medium"
              on:click={() => goto('/ventas/bot/caja/cierre')}>
              🔒 Cierre
            </button>
          </div>

          <!-- Últimos Movimientos -->
          <div class="movimientos">
            <h3 class="text-lg font-semibold mb-3">Últimos Movimientos</h3>
            {#if movimientos.length === 0}
              <p class="text-gray-500 text-center py-4">No hay movimientos registrados</p>
            {:else}
              <div class="movimientos-lista">
                {#each movimientos as movimiento}
                  <div class="movimiento-item p-3 border-b" transition:fade>
                    <div class="flex justify-between items-center">
                      <div>
                        <div class="font-medium">{movimiento.Concepto}</div>
                        <div class="text-sm text-gray-500">
                          {new Date(movimiento.FechaHora).toLocaleTimeString()}
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="font-bold" class:text-green-600={movimiento.Tipo === 'ingreso'} class:text-red-600={movimiento.Tipo === 'egreso'}>
                          {movimiento.Tipo === 'ingreso' ? '+' : '-'}${(parseFloat(movimiento.Importe?.toString() || '0')).toFixed(2)}
                        </div>
                        <div class="text-sm text-gray-500">{movimiento.TipoPago?.Descripcion}</div>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {:else}
          <div class="space-y-4">
            <div class="p-4 rounded-lg bg-blue-50">
              <h3 class="text-lg font-medium text-gray-900 mb-2">Abrir Nueva Caja</h3>
              <form on:submit|preventDefault={abrirCaja} class="space-y-4">
                <div class="form-group">
                  <label for="saldoInicial" class="block text-sm font-medium text-gray-700 mb-1">
                    Saldo Inicial
                  </label>
                  <input
                    id="saldoInicial"
                    type="number"
                    step="0.01"
                    bind:value={saldoInicial}
                    class="w-full p-3 border rounded-lg"
                    placeholder="0.00"
                  />
                </div>
                <button
                  type="submit"
                  class="w-full p-4 bg-blue-500 text-white rounded-lg font-medium"
                  disabled={loading}>
                  {loading ? 'Abriendo...' : 'Abrir Caja'}
                </button>
              </form>
            </div>
          </div>
        {/if}
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
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .title-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-back {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--tg-theme-button-color, #2481cc);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
  }

  .page-subtitle {
    font-size: 1.5rem;
    margin: 0;
    color: var(--tg-theme-text-color, #000);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-message {
    background-color: #fee2e2;
    border: 1px solid #ef4444;
    color: #dc2626;
    border-radius: 0.5rem;
  }

  .btn-ingreso, .btn-egreso {
    transition: transform 0.2s;
  }

  .btn-ingreso:active, .btn-egreso:active {
    transform: scale(0.98);
  }

  .movimientos-lista {
    max-height: calc(100vh - 400px);
    overflow-y: auto;
  }

  .movimiento-item {
    transition: background-color 0.2s;
  }

  .movimiento-item:active {
    background-color: #f3f4f6;
  }

  .btn-help {
    background: none;
    border: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 8px;
    vertical-align: middle;
  }

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: none;
    border: none;
    width: 100%;
    height: 100%;
    cursor: default;
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
    border: 0;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 16px;
  }

  .modal-content {
    background-color: var(--tg-theme-bg-color, #fff);
    border-radius: 12px;
    padding: 24px;
    max-width: 90%;
    width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1001; /* Asegura que esté por encima del backdrop */
  }

  .modal-close {
    position: absolute;
    top: 12px;
    right: 12px;
    background: none;
    border: none;
    font-size: 24px;
    color: var(--tg-theme-hint-color, #999);
    cursor: pointer;
    padding: 4px;
    line-height: 1;
  }

  .modal-title {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 16px;
    color: var(--tg-theme-text-color, #000);
  }

  .modal-section {
    margin-bottom: 24px;
  }

  .modal-section h4 {
    font-size: 1.1rem;
    font-weight: bold;
    margin-bottom: 12px;
    color: var(--tg-theme-text-color, #000);
  }

  .instruction-list {
    list-style-type: decimal;
    padding-left: 20px;
  }

  .instruction-list li {
    margin-bottom: 8px;
  }

  .instruction-list ul {
    list-style-type: disc;
    padding-left: 20px;
    margin-top: 4px;
  }

  .benefits-list {
    list-style: none;
    padding: 0;
  }

  .benefits-list li {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
  }

  .benefit-icon {
    margin-right: 8px;
    font-size: 1.2rem;
  }

  .tips-list {
    list-style-type: disc;
    padding-left: 20px;
  }

  .tips-list li {
    margin-bottom: 8px;
    color: var(--tg-theme-hint-color, #666);
  }

  /* Estilos para dispositivos móviles */
  @media (max-width: 480px) {
    .modal-content {
      padding: 16px;
      width: 100%;
    }

    .modal-title {
      font-size: 1.3rem;
    }

    .modal-section h4 {
      font-size: 1rem;
    }
  }
</style> 