<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { fade } from 'svelte/transition';
  import { Wallet, Plus, Minus, Calculator, ArrowLeft, Clock, DollarSign } from 'lucide-svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { smartNavigate } from '$lib/utils/navigation';
  import Icon from '$lib/components/ui/Icon.svelte';

  interface Movimiento {
    Codigo: number;
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

  interface CajaCabeza {
    Codigo: number;
    VendedorId: string;
    VendedorNombre?: string;
    SaldoInicial: number;
    SaldoTeorico: number;
    Apertura: string;
    Estado: string;
  }

  // Obtener ID de la caja desde la URL
  const cajaId = $derived($page.params.id);

  // Estados
  let caja = $state<CajaCabeza | null>(null);
  let movimientos = $state<Movimiento[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  async function cargarCaja() {
    try {
      loading = true;
      error = null;
      
      // Cargar datos de la caja y movimientos en paralelo
      const [cajaResponse, movimientosResponse] = await Promise.all([
        fetchWithAuth(`/cajas/${cajaId}`),
        fetchWithAuth(`/cajas/${cajaId}/movimientos`)
      ]);
      
      const cajaData = await cajaResponse.json();
      const movimientosData = await movimientosResponse.json();
      
      if (cajaData.success) {
        caja = cajaData.data;
      } else {
        error = cajaData.message || 'Error al cargar caja';
      }
      
      if (movimientosData.success) {
        movimientos = movimientosData.data || [];
      }
      
    } catch (err) {
      console.error('Error al cargar caja:', err);
      error = 'Error al cargar la caja';
    } finally {
      loading = false;
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

  function getTipoColor(tipo: string) {
    return tipo === 'ingreso' ? 'text-green-600' : 'text-red-600';
  }

  function getTipoBgColor(tipo: string) {
    return tipo === 'ingreso' ? 'bg-green-50' : 'bg-red-50';
  }

  onMount(() => {
    cargarCaja();
  });
</script>

<div class="space-y-6 pb-8" transition:fade={{ duration: 200 }}>
  <!-- Header -->
  <div class="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white shadow-lg">
    <button
      class="mb-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
      onclick={(e) => smartNavigate('/caja', e)}
    >
      <Icon icon={ArrowLeft} size={16} strokeWidth={2.5} />
      Volver
    </button>
    
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Icon icon={Wallet} size={32} strokeWidth={2.5} glass={true} />
        <div>
          <h1 class="text-3xl font-bold mb-1">Caja #{cajaId}</h1>
          {#if caja}
            <p class="text-emerald-100">{caja.VendedorNombre || `Vendedor ${caja.VendedorId}`}</p>
          {/if}
        </div>
      </div>

      {#if caja}
        <div class="text-right">
          <p class="text-emerald-100 text-sm mb-1">Saldo Teórico</p>
          <p class="text-3xl font-bold">{formatearMoneda(caja.SaldoTeorico)}</p>
        </div>
      {/if}
    </div>
  </div>

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
        onclick={cargarCaja}
      >
        Reintentar
      </button>
    </div>
  {:else if caja}
    <!-- Información de la caja -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center gap-3 mb-3">
          <Icon icon={DollarSign} size={24} strokeWidth={2.5} class="text-blue-600" />
          <h3 class="font-semibold text-gray-900">Saldo Inicial</h3>
        </div>
        <p class="text-2xl font-bold text-gray-900">{formatearMoneda(caja.SaldoInicial)}</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center gap-3 mb-3">
          <Icon icon={Wallet} size={24} strokeWidth={2.5} class="text-emerald-600" />
          <h3 class="font-semibold text-gray-900">Saldo Teórico</h3>
        </div>
        <p class="text-2xl font-bold text-emerald-600">{formatearMoneda(caja.SaldoTeorico)}</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center gap-3 mb-3">
          <Icon icon={Clock} size={24} strokeWidth={2.5} class="text-purple-600" />
          <h3 class="font-semibold text-gray-900">Apertura</h3>
        </div>
        <p class="text-sm text-gray-700">{formatearFecha(caja.Apertura)}</p>
      </div>
    </div>

    <!-- Acciones rápidas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <button
        class="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-6 hover:shadow-lg transition-all"
        onclick={(e) => smartNavigate(`/caja/${cajaId}/ingreso`, e)}
      >
        <Icon icon={Plus} size={32} strokeWidth={2.5} class="mx-auto mb-3" />
        <p class="font-semibold text-lg">Registrar Ingreso</p>
      </button>

      <button
        class="bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-xl p-6 hover:shadow-lg transition-all"
        onclick={(e) => smartNavigate(`/caja/${cajaId}/egreso`, e)}
      >
        <Icon icon={Minus} size={32} strokeWidth={2.5} class="mx-auto mb-3" />
        <p class="font-semibold text-lg">Registrar Egreso</p>
      </button>

      <button
        class="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-6 hover:shadow-lg transition-all"
        onclick={(e) => smartNavigate(`/caja/${cajaId}/arqueo`, e)}
      >
        <Icon icon={Calculator} size={32} strokeWidth={2.5} class="mx-auto mb-3" />
        <p class="font-semibold text-lg">Realizar Arqueo</p>
      </button>

      <button
        class="bg-gradient-to-br from-gray-500 to-slate-600 text-white rounded-xl p-6 hover:shadow-lg transition-all"
        onclick={(e) => smartNavigate(`/caja/${cajaId}/cierre`, e)}
      >
        <Icon icon={LockKeyhole} size={32} strokeWidth={2.5} class="mx-auto mb-3" />
        <p class="font-semibold text-lg">Cerrar Caja</p>
      </button>
    </div>

    <!-- Movimientos -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
        <h2 class="text-lg font-semibold text-gray-900">Movimientos</h2>
      </div>

      {#if movimientos.length === 0}
        <div class="p-12 text-center">
          <Icon icon={FileText} size={48} strokeWidth={1.5} class="mx-auto text-gray-400 mb-4" />
          <p class="text-gray-600">No hay movimientos registrados</p>
        </div>
      {:else}
        <div class="divide-y divide-gray-100">
          {#each movimientos as movimiento (movimiento.Codigo)}
            <div class="p-6 hover:bg-gray-50 transition-colors">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <div class="w-10 h-10 {getTipoBgColor(movimiento.Tipo)} rounded-lg flex items-center justify-center">
                      <Icon 
                        icon={movimiento.Tipo === 'ingreso' ? Plus : Minus} 
                        size={20} 
                        strokeWidth={2.5} 
                        class={getTipoColor(movimiento.Tipo)}
                      />
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">{movimiento.Concepto}</p>
                      <p class="text-sm text-gray-500">
                        {movimiento.TipoPago?.Descripcion || movimiento.MetodoPago}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 text-sm text-gray-500">
                    <Icon icon={Clock} size={14} strokeWidth={2} />
                    {formatearFecha(movimiento.FechaHora)}
                  </div>
                </div>
                
                <div class="text-right">
                  <p class="text-xl font-bold {getTipoColor(movimiento.Tipo)}">
                    {movimiento.Tipo === 'ingreso' ? '+' : '-'}{formatearMoneda(Math.abs(movimiento.Importe))}
                  </p>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
