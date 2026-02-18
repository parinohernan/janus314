<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { Wallet, Plus, DollarSign, Clock, User, Calendar } from 'lucide-svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { smartNavigate } from '$lib/utils/navigation';
  import Icon from '$lib/components/ui/Icon.svelte';

  interface CajaCabeza {
    Codigo: number;
    VendedorId: string;
    VendedorNombre?: string;
    SaldoInicial: number;
    SaldoCierre: number | null;
    SaldoTeorico: number;
    Apertura: string;
    Cierre: string | null;
    Estado: 'abierta' | 'cerrada' | 'en_arqueo';
    Observaciones: string | null;
  }

  // Estados
  let cajas = $state<CajaCabeza[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let showModalApertura = $state(false);
  
  // Form para nueva caja
  let nuevaCaja = $state({
    vendedorId: '',
    saldoInicial: 0
  });

  async function cargarCajas() {
    try {
      loading = true;
      error = null;
      
      const response = await fetchWithAuth('/cajas');
      const data = await response.json();
      
      if (data.success) {
        cajas = data.data || [];
      } else {
        error = data.message || 'Error al cargar cajas';
      }
    } catch (err) {
      console.error('Error al cargar cajas:', err);
      error = 'Error al cargar las cajas';
    } finally {
      loading = false;
    }
  }

  async function abrirCaja() {
    try {
      const response = await fetchWithAuth('/cajas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaCaja)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showModalApertura = false;
        nuevaCaja = { vendedorId: '', saldoInicial: 0 };
        await cargarCajas();
      } else {
        error = data.message || 'Error al abrir caja';
      }
    } catch (err) {
      console.error('Error al abrir caja:', err);
      error = 'Error al abrir la caja';
    }
  }

  function formatearFecha(fecha: string) {
    const d = new Date(fecha);
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatearMoneda(valor: number) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(valor);
  }

  function getEstadoClass(estado: string) {
    switch (estado) {
      case 'abierta': return 'bg-green-100 text-green-700';
      case 'cerrada': return 'bg-gray-100 text-gray-700';
      case 'en_arqueo': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  function getEstadoLabel(estado: string) {
    switch (estado) {
      case 'abierta': return 'Abierta';
      case 'cerrada': return 'Cerrada';
      case 'en_arqueo': return 'En Arqueo';
      default: return estado;
    }
  }

  function handleCajaClick(caja: CajaCabeza, event: MouseEvent) {
    if (caja.Estado === 'abierta') {
      smartNavigate(`/caja/${caja.Codigo}`, event);
    } else {
      smartNavigate(`/caja/${caja.Codigo}/detalle`, event);
    }
  }

  function handleNuevaApertura(event: MouseEvent) {
    event.preventDefault();
    showModalApertura = true;
  }

  onMount(() => {
    cargarCajas();
  });
</script>

<div class="space-y-6 pb-8" transition:fade={{ duration: 200 }}>
  <!-- Header -->
  <div class="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white shadow-lg">
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <Icon icon={Wallet} size={32} strokeWidth={2.5} glass={true} />
          <h1 class="text-3xl font-bold">Administración de Cajas</h1>
        </div>
        <p class="text-emerald-100">Gestión de cajas diarias, apertura, cierre y arqueos</p>
      </div>
      <button
        class="px-6 py-3 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-colors shadow-lg flex items-center gap-2"
        onclick={handleNuevaApertura}
      >
        <Icon icon={Plus} size={20} strokeWidth={2.5} />
        Nueva Apertura
      </button>
    </div>
  </div>

  <!-- Filtros rápidos -->
  <div class="flex gap-4">
    <button class="px-4 py-2 bg-white border-2 border-emerald-600 text-emerald-600 rounded-lg font-medium hover:bg-emerald-50 transition-colors">
      Todas
    </button>
    <button class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
      Abiertas
    </button>
    <button class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
      Cerradas
    </button>
  </div>

  <!-- Lista de cajas -->
  {#if loading}
    <div class="flex justify-center items-center py-20">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
      <p class="font-semibold mb-2">Error</p>
      <p>{error}</p>
      <button
        class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        onclick={cargarCajas}
      >
        Reintentar
      </button>
    </div>
  {:else if cajas.length === 0}
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <Icon icon={Wallet} size={64} strokeWidth={1.5} class="mx-auto text-gray-400 mb-4" />
      <p class="text-gray-600 text-lg mb-2">No hay cajas registradas</p>
      <p class="text-gray-500 text-sm">Comienza abriendo una nueva caja</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-4">
      {#each cajas as caja (caja.Codigo)}
        <button
          class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left w-full"
          onclick={(e) => handleCajaClick(caja, e)}
          transition:fade={{ duration: 150 }}
        >
          <div class="flex items-start justify-between gap-4">
            <!-- Info principal -->
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Icon icon={Wallet} size={24} strokeWidth={2.5} class="text-white" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">Caja #{caja.Codigo}</h3>
                  <div class="flex items-center gap-2">
                    <Icon icon={User} size={14} strokeWidth={2} class="text-gray-500" />
                    <p class="text-sm text-gray-600">{caja.VendedorNombre || `Vendedor ${caja.VendedorId}`}</p>
                  </div>
                </div>
              </div>

              <!-- Detalles -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p class="text-xs text-gray-500 mb-1">Saldo Inicial</p>
                  <p class="font-semibold text-gray-900">{formatearMoneda(caja.SaldoInicial)}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 mb-1">Saldo Teórico</p>
                  <p class="font-semibold text-emerald-600">{formatearMoneda(caja.SaldoTeorico)}</p>
                </div>
                {#if caja.SaldoCierre !== null}
                  <div>
                    <p class="text-xs text-gray-500 mb-1">Saldo Cierre</p>
                    <p class="font-semibold text-gray-900">{formatearMoneda(caja.SaldoCierre)}</p>
                  </div>
                {/if}
                <div>
                  <p class="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Icon icon={Calendar} size={12} strokeWidth={2} />
                    Apertura
                  </p>
                  <p class="text-sm text-gray-700">{formatearFecha(caja.Apertura)}</p>
                </div>
                {#if caja.Cierre}
                  <div>
                    <p class="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Icon icon={Calendar} size={12} strokeWidth={2} />
                      Cierre
                    </p>
                    <p class="text-sm text-gray-700">{formatearFecha(caja.Cierre)}</p>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Estado y acciones -->
            <div class="flex flex-col items-end gap-3">
              <span class="px-3 py-1 rounded-full text-xs font-semibold {getEstadoClass(caja.Estado)}">
                {getEstadoLabel(caja.Estado)}
              </span>
              
              {#if caja.Estado === 'abierta'}
                <div class="flex flex-col gap-2">
                  <button
                    class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors"
                    onclick={(e) => {
                      e.stopPropagation();
                      smartNavigate(`/caja/${caja.Codigo}/ingreso`, e);
                    }}
                  >
                    Ingreso
                  </button>
                  <button
                    class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                    onclick={(e) => {
                      e.stopPropagation();
                      smartNavigate(`/caja/${caja.Codigo}/egreso`, e);
                    }}
                  >
                    Egreso
                  </button>
                  <button
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    onclick={(e) => {
                      e.stopPropagation();
                      smartNavigate(`/caja/${caja.Codigo}/arqueo`, e);
                    }}
                  >
                    Arqueo
                  </button>
                </div>
              {/if}
            </div>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<!-- Modal de apertura de caja -->
{#if showModalApertura}
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onclick={() => showModalApertura = false}
    transition:fade={{ duration: 200 }}
  >
    <div 
      class="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex items-center gap-3 mb-6">
        <Icon icon={Wallet} size={28} strokeWidth={2.5} class="text-emerald-600" />
        <h2 class="text-2xl font-bold text-gray-900">Nueva Apertura de Caja</h2>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); abrirCaja(); }}>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Código de Vendedor
            </label>
            <input
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              bind:value={nuevaCaja.vendedorId}
              required
              placeholder="Ej: 1, 2, 3..."
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Saldo Inicial
            </label>
            <input
              type="number"
              step="0.01"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              bind:value={nuevaCaja.saldoInicial}
              required
              placeholder="0.00"
            />
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            type="button"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            onclick={() => showModalApertura = false}
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
          >
            Abrir Caja
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<svelte:window onkeydown={(e) => {
  if (e.key === 'Escape' && showModalApertura) {
    showModalApertura = false;
  }
}} />

<style>
  :global(body) {
    overflow-y: auto;
  }
</style>
