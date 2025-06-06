<script lang="ts">
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { onMount } from 'svelte';
  import '../../../../../app.css';
  import Breadcrumbs from '../../components/Breadcrumbs/index.svelte';
  import LogoJano from '../../components/LogoJano.svelte';

  let importe: number = 0;
  let concepto: string = '';
  let loading: boolean = false;
  let error: string | null = null;
  let vendedorId: string = '';
  let cajaAbierta: any = null;

  const breadcrumbs = [
    { label: 'Home', path: '/ventas/bot/home' },
    { label: 'Caja', path: '/ventas/bot/caja' },
    { label: 'Nuevo Ingreso', path: '/ventas/bot/caja/ingreso' }
  ];

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

  async function registrarIngreso() {
    if (!vendedorId) {
      error = "No se encontró el código del vendedor";
      return;
    }

    if (!cajaAbierta) {
      error = "No hay una caja abierta";
      return;
    }

    if (!importe || !concepto) {
      error = "Por favor complete todos los campos";
      return;
    }

    loading = true;
    try {
      const response = await fetchWithAuth('/cajas/movimiento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cajaCabezaId: cajaAbierta.Codigo,
          tipo: 'ingreso',
          importe,
          concepto,
          metodoPago: 'CO',
          usuarioId: vendedorId
        })
      });

      const data = await response.json();
      if (data.success) {
        goto('/ventas/bot/caja');
      } else {
        error = data.message || "Error al registrar el ingreso";
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
        <h2 class="page-subtitle">Nuevo Ingreso</h2>
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
      <form on:submit|preventDefault={registrarIngreso} class="space-y-4">
        <div class="form-group">
          <label for="importe" class="block text-sm font-medium text-gray-700 mb-1">
            Importe
          </label>
          <input
            id="importe"
            type="number"
            step="0.01"
            bind:value={importe}
            class="w-full p-3 border rounded-lg"
            placeholder="0.00"
          />
        </div>

        <div class="form-group">
          <label for="concepto" class="block text-sm font-medium text-gray-700 mb-1">
            Concepto
          </label>
          <input
            id="concepto"
            type="text"
            bind:value={concepto}
            class="w-full p-3 border rounded-lg"
            placeholder="Ingrese el concepto"
          />
        </div>

        <button
          type="submit"
          class="w-full p-4 bg-green-500 text-white font-medium rounded-lg"
          disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Ingreso'}
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

  input {
    font-size: 16px; /* Evita zoom en iOS */
  }
</style> 