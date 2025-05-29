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

  // Valores del arqueo
  let efectivoContado: number = 0;
  let observaciones: string = '';

  // Datos calculados
  let saldoTeorico: number = 0;
  let diferencia: number = 0;

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
        saldoTeorico = parseFloat(cajaAbierta.SaldoTeorico?.toString() || '0');
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

  // Calcular diferencia cuando cambie el efectivo contado
  $: {
    diferencia = efectivoContado - saldoTeorico;
  }

  async function registrarArqueo() {
    if (!vendedorId || !cajaAbierta) {
      error = "No se puede realizar el arqueo";
      return;
    }

    loading = true;
    try {
      const response = await fetchWithAuth('/cajas/arqueo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cajaCabezaId: cajaAbierta.Codigo,
          efectivoContado,
          diferencia,
          observaciones,
          usuarioId: vendedorId
        })
      });

      const data = await response.json();
      if (data.success) {
        goto('/ventas/bot/caja');
      } else {
        error = data.message || "Error al registrar el arqueo";
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
        <h2 class="page-subtitle">Arqueo de Caja</h2>
      </div>
    </div>
  </header>

  <div class="p-4">
    {#if error}
      <div class="error-message p-4 mb-4" transition:fade>
        {error}
      </div>
    {/if}

    {#if cajaAbierta}
      <!-- Información de Saldo Teórico -->
      <div class="saldo-info p-4 rounded-lg bg-blue-50 mb-6">
        <div class="text-sm text-gray-600">Saldo Teórico</div>
        <div class="text-2xl font-bold text-blue-600">
          ${saldoTeorico.toFixed(2)}
        </div>
      </div>

      <form on:submit|preventDefault={registrarArqueo} class="space-y-4">
        <div class="form-group">
          <label for="efectivoContado" class="block text-sm font-medium text-gray-700 mb-1">
            Efectivo Contado
          </label>
          <input
            id="efectivoContado"
            type="number"
            step="0.01"
            bind:value={efectivoContado}
            class="w-full p-3 border rounded-lg"
            placeholder="0.00"
          />
        </div>

        <!-- Mostrar diferencia -->
        <div class="diferencia-info p-4 rounded-lg mb-4" 
          class:bg-red-50={diferencia < 0}
          class:bg-green-50={diferencia > 0}
          class:bg-gray-50={diferencia === 0}>
          <div class="text-sm text-gray-600">Diferencia</div>
          <div class="text-xl font-bold"
            class:text-red-600={diferencia < 0}
            class:text-green-600={diferencia > 0}
            class:text-gray-600={diferencia === 0}>
            ${diferencia.toFixed(2)}
          </div>
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
            placeholder="Ingrese observaciones sobre el arqueo"
          ></textarea>
        </div>

        <button
          type="submit"
          class="w-full p-4 bg-blue-500 text-white font-medium rounded-lg"
          disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Arqueo'}
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