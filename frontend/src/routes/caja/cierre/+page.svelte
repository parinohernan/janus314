<script lang="ts">
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/authStore';
  import Button from '$lib/components/ui/Button.svelte';

  let loading = false;
  let error: string | null = null;
  let vendedorId = '';
  let cajaAbierta: { Codigo: number; SaldoInicial?: number } | null = null;
  let resumenCaja: { totalIngresos?: number; totalEgresos?: number; saldoTeorico?: number } | null = null;
  let efectivoFinal = 0;
  let observaciones = '';

  $: if (typeof $auth?.user?.usuario === 'string') {
    vendedorId = $auth.user.usuario;
  }

  async function cargarEstadoCaja() {
    if (!vendedorId) {
      error = 'No se encontró el usuario. Debe iniciar sesión.';
      setTimeout(() => goto('/caja'), 2000);
      return;
    }
    try {
      const response = await fetchWithAuth(`/cajas/vendedor/${vendedorId}`);
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        const caja = data.data[0];
        cajaAbierta = caja;
        await cargarResumenCaja(caja.Codigo);
      } else {
        error = 'No hay una caja abierta';
        setTimeout(() => goto('/caja'), 2000);
      }
    } catch (err) {
      error = 'Error al cargar el estado de la caja';
    }
  }

  async function cargarResumenCaja(cajaCodigo: number) {
    try {
      const response = await fetchWithAuth(`/cajas/${cajaCodigo}/resumen`);
      const data = await response.json();
      if (data.success) {
        resumenCaja = data.data;
        efectivoFinal = parseFloat(String(resumenCaja?.saldoTeorico ?? 0));
      }
    } catch (err) {
      error = 'Error al cargar el resumen de caja';
    }
  }

  async function cerrarCaja(e: Event) {
    e.preventDefault();
    if (!vendedorId || !cajaAbierta) {
      error = 'No se puede cerrar la caja';
      return;
    }
    loading = true;
    try {
      const response = await fetchWithAuth(`/cajas/${cajaAbierta.Codigo}/cierre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          efectivoFinal,
          observaciones,
          usuarioId: vendedorId
        })
      });
      const data = await response.json();
      if (data.success) {
        goto('/caja');
      } else {
        error = data.message || 'Error al cerrar la caja';
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
    <h1 class="text-2xl font-bold text-gray-800">Cierre de caja</h1>
    <Button variant="secondary" on:click={() => goto('/caja')}>Volver a Caja</Button>
  </div>

  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4" transition:fade>
      {error}
    </div>
  {/if}

  {#if cajaAbierta && resumenCaja}
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="space-y-4 mb-6">
        <div class="p-4 rounded-lg bg-blue-50">
          <div class="text-sm text-gray-600">Saldo inicial</div>
          <div class="text-xl font-bold text-blue-600">
            ${parseFloat(String(cajaAbierta.SaldoInicial ?? 0)).toFixed(2)}
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="p-4 rounded-lg bg-green-50">
            <div class="text-sm text-gray-600">Total ingresos</div>
            <div class="text-xl font-bold text-green-600">
              ${parseFloat(String(resumenCaja.totalIngresos ?? 0)).toFixed(2)}
            </div>
          </div>
          <div class="p-4 rounded-lg bg-red-50">
            <div class="text-sm text-gray-600">Total egresos</div>
            <div class="text-xl font-bold text-red-600">
              ${parseFloat(String(resumenCaja.totalEgresos ?? 0)).toFixed(2)}
            </div>
          </div>
        </div>
        <div class="p-4 rounded-lg bg-purple-50">
          <div class="text-sm text-gray-600">Saldo final teórico</div>
          <div class="text-2xl font-bold text-purple-600">
            ${parseFloat(String(resumenCaja.saldoTeorico ?? 0)).toFixed(2)}
          </div>
        </div>
      </div>

      <form on:submit={cerrarCaja} class="space-y-4 max-w-md">
        <div>
          <label for="efectivoFinal" class="block text-sm font-medium text-gray-700 mb-1">Efectivo final</label>
          <input
            id="efectivoFinal"
            type="number"
            step="0.01"
            bind:value={efectivoFinal}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>
        <div>
          <label for="observaciones" class="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
          <textarea
            id="observaciones"
            bind:value={observaciones}
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Observaciones sobre el cierre"
          ></textarea>
        </div>
        <Button type="submit" variant="primary" disabled={loading} class="!bg-purple-600 hover:!bg-purple-700">
          {loading ? 'Cerrando...' : 'Cerrar caja'}
        </Button>
      </form>
    </div>
  {/if}
</div>
