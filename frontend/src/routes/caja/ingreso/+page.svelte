<script lang="ts">
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/authStore';
  import Button from '$lib/components/ui/Button.svelte';

  let importe = 0;
  let concepto = '';
  let loading = false;
  let error: string | null = null;
  let vendedorId = '';
  let cajaAbierta: { Codigo: number } | null = null;

  $: if (typeof $auth?.user?.usuario === 'string') {
    vendedorId = $auth.user.usuario;
  }

  async function cargarEstadoCaja() {
    if (!vendedorId) {
      error = 'No se encontró el usuario. Debe iniciar sesión.';
      return;
    }
    try {
      const response = await fetchWithAuth(`/cajas/vendedor/${vendedorId}`);
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        cajaAbierta = data.data[0];
      } else {
        error = 'No hay una caja abierta';
        setTimeout(() => goto('/caja'), 2000);
      }
    } catch (err) {
      error = 'Error al cargar el estado de la caja';
    }
  }

  async function registrarIngreso(e: Event) {
    e.preventDefault();
    if (!vendedorId || !cajaAbierta || !importe || !concepto) {
      error = 'Complete todos los campos';
      return;
    }
    loading = true;
    error = null;
    try {
      const response = await fetchWithAuth('/cajas/movimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        goto('/caja');
      } else {
        error = data.message || 'Error al registrar el ingreso';
      }
    } catch (err) {
      error = 'Error al conectar con el servidor';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    cargarEstadoCaja();
  });
</script>

<div>
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">Nuevo ingreso</h1>
    <Button variant="secondary" on:click={() => goto('/caja')}>Volver a Caja</Button>
  </div>

  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4" transition:fade>
      {error}
    </div>
  {/if}

  {#if cajaAbierta}
    <div class="bg-white rounded-lg shadow-sm p-6 max-w-md">
      <form on:submit={registrarIngreso} class="space-y-4">
        <div>
          <label for="importe" class="block text-sm font-medium text-gray-700 mb-1">Importe</label>
          <input
            id="importe"
            type="number"
            step="0.01"
            bind:value={importe}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>
        <div>
          <label for="concepto" class="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
          <input
            id="concepto"
            type="text"
            bind:value={concepto}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingrese el concepto"
          />
        </div>
        <Button type="submit" variant="success" disabled={loading} fullWidth>
          {loading ? 'Registrando...' : 'Registrar ingreso'}
        </Button>
      </form>
    </div>
  {/if}
</div>
