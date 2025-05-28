<script lang="ts">
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import '../../../../../app.css';

  let importe: number = 0;
  let concepto: string = '';
  let loading: boolean = false;
  let error: string | null = null;
  let vendedorId: string = '001'; // TODO: Obtener del contexto

  async function registrarIngreso() {
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
          tipo: 'ingreso',
          importe,
          concepto,
          metodoPago: 'EFE',
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
    } finally {
      loading = false;
    }
  }
</script>

<div class="telegram-webapp p-4">
  <div class="mb-4 flex items-center">
    <button
      class="text-blue-500"
      on:click={() => goto('/ventas/bot/caja')}>
      ← Volver
    </button>
    <h2 class="text-xl font-bold ml-4">Nuevo Ingreso</h2>
  </div>

  {#if error}
    <div class="error-message p-4 mb-4" transition:fade>
      {error}
    </div>
  {/if}

  <form on:submit|preventDefault={registrarIngreso} class="space-y-4">
    <div class="form-group">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Importe
      </label>
      <input
        type="number"
        step="0.01"
        bind:value={importe}
        class="w-full p-3 border rounded-lg"
        placeholder="0.00"
      />
    </div>

    <div class="form-group">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Concepto
      </label>
      <input
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
</div>

<style>
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