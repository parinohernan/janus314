<script lang="ts">
  import { onMount } from 'svelte';
  import { goto, beforeNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import { fade } from 'svelte/transition';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { auth } from '$lib/stores/authStore';
  import Button from '$lib/components/ui/Button.svelte';
  import { navigationState } from '$lib/stores/navigationState';

  const PAGE_PATH = '/caja';

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

  let cajaAbierta: CajaCabeza | null = null;
  let movimientos: Movimiento[] = [];
  let loading = true;
  let error: string | null = null;
  let vendedorId = '';
  let saldoInicial = 0;

  $: if (typeof $auth?.user?.usuario === 'string') {
    vendedorId = $auth.user.usuario;
  }

  async function cargarEstadoCaja() {
    if (!vendedorId) {
      error = 'No se encontró el usuario. Debe iniciar sesión.';
      loading = false;
      return;
    }
    try {
      error = null;
      const response = await fetchWithAuth(`/cajas/vendedor/${vendedorId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        cajaAbierta = data.data[0] as CajaCabeza;
        if (cajaAbierta) await cargarMovimientos(cajaAbierta.Codigo);
      } else {
        cajaAbierta = null;
      }
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : 'Error al cargar el estado de la caja';
    } finally {
      loading = false;
    }
  }

  async function cargarMovimientos(cajaCodigo: number) {
    try {
      const response = await fetchWithAuth(`/cajas/${cajaCodigo}/movimientos`);
      const data = await response.json();
      if (data.success) movimientos = data.data;
    } catch {
      error = 'Error al cargar los movimientos';
    }
  }

  async function abrirCaja(e: Event) {
    e.preventDefault();
    if (!vendedorId) return;
    try {
      loading = true;
      const response = await fetchWithAuth('/cajas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      } else {
        error = data.message || 'Error al abrir la caja';
      }
    } catch (err) {
      error = 'Error al abrir la caja';
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    let savedScroll: number | undefined;
    if (browser) {
      const savedState = navigationState.getState(PAGE_PATH);
      savedScroll = savedState?.scroll;
    }
    await cargarEstadoCaja();
    if (typeof savedScroll === 'number' && savedScroll > 0 && typeof window !== 'undefined') {
      requestAnimationFrame(() => window.scrollTo(0, savedScroll));
    }
  });

  beforeNavigate(({ from }) => {
    if (from?.url.pathname === PAGE_PATH && browser) {
      const currentState = navigationState.getState(PAGE_PATH) || {};
      navigationState.saveState(PAGE_PATH, {
        ...currentState,
        scroll: typeof window !== 'undefined' ? window.scrollY : 0
      });
    }
  });
</script>

<div>
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">Caja</h1>
    <Button variant="secondary" on:click={() => goto('/caja/cerradas')}>
      Ver listado de cajas
    </Button>
  </div>

  {#if loading}
    <div class="flex justify-center items-center h-32">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4" transition:fade>
      {error}
    </div>
  {:else}
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4">
        {cajaAbierta ? 'Caja abierta' : 'Caja cerrada'}
      </h2>

      {#if cajaAbierta}
        <div class="grid grid-cols-2 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
          <div>
            <div class="text-sm text-gray-600">Saldo inicial</div>
            <div class="text-xl font-bold text-blue-600">
              ${(parseFloat(cajaAbierta.SaldoInicial?.toString() || '0')).toFixed(2)}
            </div>
          </div>
          <div>
            <div class="text-sm text-gray-600">Saldo actual</div>
            <div class="text-xl font-bold text-blue-600">
              ${(parseFloat(cajaAbierta.SaldoTeorico?.toString() || '0')).toFixed(2)}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Button variant="success" on:click={() => goto('/caja/ingreso')}>
            + Ingreso
          </Button>
          <Button variant="danger" on:click={() => goto('/caja/egreso')}>
            − Egreso
          </Button>
          <Button variant="primary" on:click={() => goto('/caja/arqueo')}>
            Arqueo
          </Button>
          <Button variant="primary" class="!bg-purple-600 hover:!bg-purple-700" on:click={() => goto('/caja/cierre')}>
            Cierre
          </Button>
        </div>

        <h3 class="text-lg font-semibold text-gray-800 mb-3">Últimos movimientos</h3>
        {#if movimientos.length === 0}
          <p class="text-gray-500 py-4">No hay movimientos registrados</p>
        {:else}
          <div class="border rounded-lg overflow-hidden">
            {#each movimientos as movimiento}
              <div class="flex justify-between items-center px-4 py-3 border-b border-gray-100 last:border-0" transition:fade>
                <div>
                  <div class="font-medium text-gray-800">{movimiento.Concepto}</div>
                  <div class="text-sm text-gray-500">
                    {new Date(movimiento.FechaHora).toLocaleTimeString('es-AR')}
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-bold {movimiento.Tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}">
                    {movimiento.Tipo === 'ingreso' ? '+' : '−'}${(parseFloat(movimiento.Importe?.toString() || '0')).toFixed(2)}
                  </div>
                  <div class="text-sm text-gray-500">{movimiento.TipoPago?.Descripcion ?? '-'}</div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      {:else}
        <div class="bg-gray-50 p-6 rounded-lg">
          <h3 class="text-lg font-medium text-gray-800 mb-4">Abrir nueva caja</h3>
          <form on:submit={abrirCaja} class="space-y-4 max-w-sm">
            <div>
              <label for="saldoInicial" class="block text-sm font-medium text-gray-700 mb-1">Saldo inicial</label>
              <input
                id="saldoInicial"
                type="number"
                step="0.01"
                bind:value={saldoInicial}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Abriendo...' : 'Abrir caja'}
            </Button>
          </form>
        </div>
      {/if}
    </div>
  {/if}
</div>
