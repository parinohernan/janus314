<script lang="ts">
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { onMount } from 'svelte';
  import '../../../../../app.css';
  import LogoJano from '../../components/LogoJano.svelte';

  let loading: boolean = false;
  let error: string | null = null;
  let vendedorId: string = '';
  let cajaAbierta: any = null;
  let resumenCaja: any = null;

  // Valores del cierre
  let efectivoFinal: number = 0;
  let observaciones: string = '';

  // Cargar el estado de la caja al montar el componente
  async function cargarEstadoCaja() {
    try {
      // Obtener el código del vendedor del localStorage
      vendedorId = localStorage.getItem('botVendedorCodigo') || '';
      if (!vendedorId) {
        error = "No se encontró el código del vendedor";
        setTimeout(() => {
          goto('/ventas/bot/caja');
        }, 2000);
        return;
      }

      const response = await fetchWithAuth(`/cajas/vendedor/${vendedorId}`);
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        cajaAbierta = data.data[0];
        await cargarResumenCaja(cajaAbierta.Codigo);
      } else {
        error = "No hay una caja abierta";
        setTimeout(() => {
          goto('/ventas/bot/caja');
        }, 2000);
      }
    } catch (err) {
      error = "Error al cargar el estado de la caja";
      console.error("Error detallado:", err);
    }
  }

  // Cargar resumen de caja
  async function cargarResumenCaja(cajaCodigo: number) {
    try {
      const response = await fetchWithAuth(`/cajas/${cajaCodigo}/resumen`);
      const data = await response.json();
      if (data.success) {
        resumenCaja = data.data;
        efectivoFinal = parseFloat(resumenCaja.saldoTeorico?.toString() || '0');
      }
    } catch (err) {
      error = "Error al cargar el resumen de caja";
      console.error("Error detallado:", err);
    }
  }

  async function cerrarCaja() {
    if (!vendedorId || !cajaAbierta) {
      error = "No se puede cerrar la caja";
      return;
    }

    loading = true;
    try {
      const response = await fetchWithAuth(`/cajas/${cajaAbierta.Codigo}/cierre`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          efectivoFinal,
          observaciones,
          usuarioId: vendedorId
        })
      });

      const data = await response.json();
      if (data.success) {
        goto('/ventas/bot/caja');
      } else {
        error = data.message || "Error al cerrar la caja";
      }
    } catch (err) {
      error = "Error al conectar con el servidor";
      console.error("Error detallado:", err);
    } finally {
      loading = false;
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
      <button class="btn-back" on:click={() => goto('/ventas/bot/caja')} aria-label="Volver">
        <span class="back-icon">←</span>
      </button>
      <div class="title-container">
        <LogoJano size="small" animated={false} />
        <h2 class="page-subtitle">Cierre de Caja</h2>
      </div>
    </div>
  </header>

  <div class="p-4">
    {#if error}
      <div class="error-message p-4 mb-4" transition:fade>
        {error}
      </div>
    {/if}

    {#if cajaAbierta && resumenCaja}
      <!-- Resumen de Caja -->
      <div class="resumen-container space-y-4 mb-6">
        <div class="saldo-info p-4 rounded-lg bg-blue-50">
          <div class="text-sm text-gray-600">Saldo Inicial</div>
          <div class="text-xl font-bold text-blue-600">
            ${parseFloat(cajaAbierta.SaldoInicial?.toString() || '0').toFixed(2)}
          </div>
        </div>

        <div class="movimientos-info grid grid-cols-2 gap-4">
          <div class="p-4 rounded-lg bg-green-50">
            <div class="text-sm text-gray-600">Total Ingresos</div>
            <div class="text-xl font-bold text-green-600">
              ${parseFloat(resumenCaja.totalIngresos?.toString() || '0').toFixed(2)}
            </div>
          </div>

          <div class="p-4 rounded-lg bg-red-50">
            <div class="text-sm text-gray-600">Total Egresos</div>
            <div class="text-xl font-bold text-red-600">
              ${parseFloat(resumenCaja.totalEgresos?.toString() || '0').toFixed(2)}
            </div>
          </div>
        </div>

        <div class="saldo-final p-4 rounded-lg bg-purple-50">
          <div class="text-sm text-gray-600">Saldo Final Teórico</div>
          <div class="text-2xl font-bold text-purple-600">
            ${parseFloat(resumenCaja.saldoTeorico?.toString() || '0').toFixed(2)}
          </div>
        </div>
      </div>

      <form on:submit|preventDefault={cerrarCaja} class="space-y-4">
        <div class="form-group">
          <label for="efectivoFinal" class="block text-sm font-medium text-gray-700 mb-1">
            Efectivo Final
          </label>
          <input
            id="efectivoFinal"
            type="number"
            step="0.01"
            bind:value={efectivoFinal}
            class="w-full p-3 border rounded-lg"
            placeholder="0.00"
          />
        </div>

        <div class="form-group">
          <label for="observaciones" class="block text-sm font-medium text-gray-700 mb-1">
            Observaciones
          </label>
          <textarea
            id="observaciones"
            bind:value={observaciones}
            class="w-full p-3 border rounded-lg"
            rows="3"
            placeholder="Ingrese observaciones sobre el cierre"
          ></textarea>
        </div>

        <button
          type="submit"
          class="w-full p-4 bg-purple-500 text-white font-medium rounded-lg"
          disabled={loading}>
          {loading ? 'Cerrando...' : 'Cerrar Caja'}
        </button>
      </form>
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

  .error-message {
    background-color: #fee2e2;
    border: 1px solid #ef4444;
    color: #dc2626;
    border-radius: 0.5rem;
  }

  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  input, textarea {
    font-size: 16px; /* Evita zoom en iOS */
  }
</style> 