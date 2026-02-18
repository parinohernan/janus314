<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { LockKeyhole, Calendar, User, DollarSign, FileText } from 'lucide-svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { smartNavigate } from '$lib/utils/navigation';
  import Icon from '$lib/components/ui/Icon.svelte';

  interface CajaCerrada {
    Codigo: number;
    VendedorId: string;
    VendedorNombre?: string;
    SaldoInicial: number;
    SaldoCierre: number;
    SaldoTeorico: number;
    Apertura: string;
    Cierre: string;
    Observaciones: string | null;
  }

  // Estados
  let cajas = $state<CajaCerrada[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  
  // Paginación
  let currentPage = $state(1);
  let totalPages = $state(1);
  let totalItems = $state(0);
  const itemsPerPage = 20;

  async function cargarCajasCerradas() {
    try {
      loading = true;
      error = null;
      
      const response = await fetchWithAuth(`/cajas/cerradas?page=${currentPage}&limit=${itemsPerPage}`);
      const data = await response.json();
      
      if (data.success) {
        cajas = data.data || [];
        totalPages = data.meta?.totalPages || 1;
        totalItems = data.meta?.totalItems || 0;
      } else {
        error = data.message || 'Error al cargar cajas cerradas';
      }
    } catch (err) {
      console.error('Error al cargar cajas cerradas:', err);
      error = 'Error al cargar las cajas cerradas';
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

  function calcularDiferencia(saldoCierre: number, saldoTeorico: number) {
    return saldoCierre - saldoTeorico;
  }

  function getDiferenciaClass(diferencia: number) {
    if (diferencia === 0) return 'text-gray-600';
    return diferencia > 0 ? 'text-green-600' : 'text-red-600';
  }

  function handleCajaClick(caja: CajaCerrada, event: MouseEvent) {
    smartNavigate(`/caja/${caja.Codigo}/detalle`, event);
  }

  function cambiarPagina(newPage: number) {
    if (newPage < 1 || newPage > totalPages) return;
    currentPage = newPage;
    cargarCajasCerradas();
  }

  onMount(() => {
    cargarCajasCerradas();
  });
</script>

<div class="space-y-6 pb-8" transition:fade={{ duration: 200 }}>
  <!-- Header -->
  <div class="bg-gradient-to-r from-gray-600 to-slate-600 rounded-xl p-6 text-white shadow-lg">
    <div class="flex items-center gap-3">
      <Icon icon={LockKeyhole} size={32} strokeWidth={2.5} glass={true} />
      <div>
        <h1 class="text-3xl font-bold mb-1">Cajas Cerradas</h1>
        <p class="text-gray-100">Historial de cajas finalizadas y arqueos realizados</p>
      </div>
    </div>
  </div>

  <!-- Estadísticas rápidas -->
  {#if !loading && cajas.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon icon={FileText} size={20} strokeWidth={2.5} class="text-blue-600" />
          </div>
          <div>
            <p class="text-sm text-gray-600">Total de cajas</p>
            <p class="text-2xl font-bold text-gray-900">{totalItems}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Icon icon={DollarSign} size={20} strokeWidth={2.5} class="text-emerald-600" />
          </div>
          <div>
            <p class="text-sm text-gray-600">Esta página</p>
            <p class="text-2xl font-bold text-gray-900">{cajas.length}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Icon icon={Calendar} size={20} strokeWidth={2.5} class="text-purple-600" />
          </div>
          <div>
            <p class="text-sm text-gray-600">Página</p>
            <p class="text-2xl font-bold text-gray-900">{currentPage} de {totalPages}</p>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Lista de cajas cerradas -->
  {#if loading}
    <div class="flex justify-center items-center py-20">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
      <p class="font-semibold mb-2">Error</p>
      <p>{error}</p>
      <button
        class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        onclick={cargarCajasCerradas}
      >
        Reintentar
      </button>
    </div>
  {:else if cajas.length === 0}
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <Icon icon={LockKeyhole} size={64} strokeWidth={1.5} class="mx-auto text-gray-400 mb-4" />
      <p class="text-gray-600 text-lg mb-2">No hay cajas cerradas</p>
      <p class="text-gray-500 text-sm">Las cajas cerradas aparecerán aquí</p>
    </div>
  {:else}
    <div class="space-y-4">
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
                <div class="w-12 h-12 bg-gradient-to-br from-gray-500 to-slate-500 rounded-lg flex items-center justify-center">
                  <Icon icon={LockKeyhole} size={24} strokeWidth={2.5} class="text-white" />
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
              <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                <div>
                  <p class="text-xs text-gray-500 mb-1">Apertura</p>
                  <p class="text-sm text-gray-700">{formatearFecha(caja.Apertura)}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 mb-1">Cierre</p>
                  <p class="text-sm text-gray-700">{formatearFecha(caja.Cierre)}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 mb-1">Saldo Inicial</p>
                  <p class="font-semibold text-gray-900">{formatearMoneda(caja.SaldoInicial)}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 mb-1">Saldo Teórico</p>
                  <p class="font-semibold text-blue-600">{formatearMoneda(caja.SaldoTeorico)}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 mb-1">Saldo Cierre</p>
                  <p class="font-semibold text-gray-900">{formatearMoneda(caja.SaldoCierre)}</p>
                </div>
              </div>

              {#if caja.Observaciones}
                <div class="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p class="text-xs text-gray-500 mb-1">Observaciones</p>
                  <p class="text-sm text-gray-700">{caja.Observaciones}</p>
                </div>
              {/if}
            </div>

            <!-- Diferencia -->
            <div class="flex flex-col items-end">
              {#if calcularDiferencia(caja.SaldoCierre, caja.SaldoTeorico) !== 0}
                <p class="text-xs text-gray-500 mb-1">Diferencia</p>
                <p class="text-xl font-bold {getDiferenciaClass(calcularDiferencia(caja.SaldoCierre, caja.SaldoTeorico))}">
                  {formatearMoneda(calcularDiferencia(caja.SaldoCierre, caja.SaldoTeorico))}
                </p>
              {:else}
                <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                  Sin diferencias
                </span>
              {/if}
            </div>
          </div>
        </button>
      {/each}
    </div>

    <!-- Paginación -->
    {#if totalPages > 1}
      <div class="flex justify-center items-center gap-4 mt-6">
        <button
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={currentPage === 1}
          onclick={() => cambiarPagina(currentPage - 1)}
        >
          Anterior
        </button>
        
        <span class="text-sm text-gray-600">
          Página {currentPage} de {totalPages}
        </span>
        
        <button
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={currentPage === totalPages}
          onclick={() => cambiarPagina(currentPage + 1)}
        >
          Siguiente
        </button>
      </div>
    {/if}
  {/if}
</div>
