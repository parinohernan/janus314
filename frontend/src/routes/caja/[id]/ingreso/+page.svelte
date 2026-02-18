<script lang="ts">
  import { page } from '$app/stores';
  import { fade } from 'svelte/transition';
  import { Plus, ArrowLeft, DollarSign } from 'lucide-svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { smartNavigate } from '$lib/utils/navigation';
  import Icon from '$lib/components/ui/Icon.svelte';

  const cajaId = $derived($page.params.id);

  let loading = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);
  
  let formData = $state({
    importe: 0,
    concepto: '',
    metodoPago: 'CO'
  });

  const metodosPago = [
    { value: 'CO', label: 'Efectivo' },
    { value: 'TC', label: 'Tarjeta de Crédito' },
    { value: 'TD', label: 'Tarjeta de Débito' },
    { value: 'TR', label: 'Transferencia' },
    { value: 'CH', label: 'Cheque' }
  ];

  async function registrarIngreso() {
    if (!formData.importe || !formData.concepto) {
      error = "Por favor complete todos los campos";
      return;
    }

    if (formData.importe <= 0) {
      error = "El importe debe ser mayor a cero";
      return;
    }

    loading = true;
    error = null;
    success = null;

    try {
      const response = await fetchWithAuth('/cajas/movimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cajaCabezaId: parseInt(cajaId),
          tipo: 'ingreso',
          importe: formData.importe,
          concepto: formData.concepto,
          metodoPago: formData.metodoPago
        })
      });

      const data = await response.json();
      
      if (data.success) {
        success = "Ingreso registrado correctamente";
        setTimeout(() => {
          smartNavigate(`/caja/${cajaId}`, new MouseEvent('click'));
        }, 1500);
      } else {
        error = data.message || "Error al registrar el ingreso";
      }
    } catch (err) {
      console.error('Error al registrar ingreso:', err);
      error = "Error al conectar con el servidor";
    } finally {
      loading = false;
    }
  }

  function handleCancel(e: MouseEvent) {
    smartNavigate(`/caja/${cajaId}`, e);
  }
</script>

<div class="space-y-6 pb-8 max-w-2xl mx-auto" transition:fade={{ duration: 200 }}>
  <!-- Header -->
  <div class="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
    <button
      class="mb-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
      onclick={handleCancel}
    >
      <Icon icon={ArrowLeft} size={16} strokeWidth={2.5} />
      Volver
    </button>
    
    <div class="flex items-center gap-3">
      <Icon icon={Plus} size={32} strokeWidth={2.5} glass={true} />
      <div>
        <h1 class="text-3xl font-bold mb-1">Registrar Ingreso</h1>
        <p class="text-green-100">Caja #{cajaId}</p>
      </div>
    </div>
  </div>

  <!-- Mensajes -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800" transition:fade>
      <p class="font-semibold">Error</p>
      <p class="text-sm">{error}</p>
    </div>
  {/if}

  {#if success}
    <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800" transition:fade>
      <p class="font-semibold">¡Éxito!</p>
      <p class="text-sm">{success}</p>
    </div>
  {/if}

  <!-- Formulario -->
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <form onsubmit={(e) => { e.preventDefault(); registrarIngreso(); }} class="space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <div class="flex items-center gap-2">
            <Icon icon={DollarSign} size={16} strokeWidth={2.5} />
            Importe
          </div>
        </label>
        <input
          type="number"
          step="0.01"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
          bind:value={formData.importe}
          required
          placeholder="0.00"
          autofocus
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Concepto
        </label>
        <input
          type="text"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          bind:value={formData.concepto}
          required
          placeholder="Descripción del ingreso"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Método de Pago
        </label>
        <select
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          bind:value={formData.metodoPago}
        >
          {#each metodosPago as metodo}
            <option value={metodo.value}>{metodo.label}</option>
          {/each}
        </select>
      </div>

      <div class="flex gap-3 pt-4">
        <button
          type="button"
          class="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          onclick={handleCancel}
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Registrando...' : 'Registrar Ingreso'}
        </button>
      </div>
    </form>
  </div>
</div>
