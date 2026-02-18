<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { fade } from 'svelte/transition';
  import { Calculator, ArrowLeft, DollarSign, AlertCircle } from 'lucide-svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { smartNavigate } from '$lib/utils/navigation';
  import Icon from '$lib/components/ui/Icon.svelte';

  interface FormaPagoArqueo {
    formaPago: string;
    descripcion: string;
    totalSistema: number;
    totalDeclarado: number;
    diferencia: number;
  }

  interface ResumenArqueo {
    cajaId: number;
    saldoInicial: number;
    saldoTeorico: number;
    formasPago: FormaPagoArqueo[];
    totalSistema: number;
  }

  const cajaId = $derived($page.params.id);

  let loading = $state(true);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);
  let resumenArqueo = $state<ResumenArqueo | null>(null);
  let observaciones = $state('');
  let totalDeclarado = $state(0);

  async function cargarResumenArqueo() {
    try {
      loading = true;
      error = null;
      
      const response = await fetchWithAuth(`/cajas/${cajaId}/arqueo/resumen`);
      const data = await response.json();
      
      if (data.success) {
        // Inicializar los valores declarados con los valores del sistema
        data.data.formasPago = data.data.formasPago.map((fp: FormaPagoArqueo) => ({
          ...fp,
          totalDeclarado: fp.totalSistema,
          diferencia: 0
        }));
        resumenArqueo = data.data;
        calcularTotalDeclarado();
      } else {
        error = data.message || 'Error al cargar resumen de arqueo';
      }
    } catch (err) {
      console.error('Error al cargar resumen de arqueo:', err);
      error = 'Error al cargar el resumen de arqueo';
    } finally {
      loading = false;
    }
  }

  function calcularTotalDeclarado() {
    if (!resumenArqueo) return;
    totalDeclarado = resumenArqueo.formasPago.reduce((sum, fp) => sum + fp.totalDeclarado, 0);
  }

  function actualizarDiferencia(index: number) {
    if (!resumenArqueo) return;
    const fp = resumenArqueo.formasPago[index];
    fp.diferencia = fp.totalDeclarado - fp.totalSistema;
    calcularTotalDeclarado();
  }

  async function realizarArqueo() {
    if (!resumenArqueo) return;

    loading = true;
    error = null;
    success = null;

    try {
      const response = await fetchWithAuth(`/cajas/arqueo/${cajaId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formasPago: resumenArqueo.formasPago,
          observaciones,
          totalDeclarado
        })
      });

      const data = await response.json();
      
      if (data.success) {
        success = "Arqueo realizado correctamente";
        setTimeout(() => {
          smartNavigate(`/caja/${cajaId}`, new MouseEvent('click'));
        }, 1500);
      } else {
        error = data.message || "Error al realizar el arqueo";
      }
    } catch (err) {
      console.error('Error al realizar arqueo:', err);
      error = "Error al conectar con el servidor";
    } finally {
      loading = false;
    }
  }

  function formatearMoneda(valor: number) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(valor);
  }

  function getDiferenciaClass(diferencia: number) {
    if (diferencia === 0) return 'text-gray-600';
    return diferencia > 0 ? 'text-green-600' : 'text-red-600';
  }

  function handleCancel(e: MouseEvent) {
    smartNavigate(`/caja/${cajaId}`, e);
  }

  const totalDiferencia = $derived(
    resumenArqueo ? totalDeclarado - resumenArqueo.totalSistema : 0
  );

  onMount(() => {
    cargarResumenArqueo();
  });
</script>

<div class="space-y-6 pb-8" transition:fade={{ duration: 200 }}>
  <!-- Header -->
  <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
    <button
      class="mb-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
      onclick={handleCancel}
    >
      <Icon icon={ArrowLeft} size={16} strokeWidth={2.5} />
      Volver
    </button>
    
    <div class="flex items-center gap-3">
      <Icon icon={Calculator} size={32} strokeWidth={2.5} glass={true} />
      <div>
        <h1 class="text-3xl font-bold mb-1">Arqueo de Caja</h1>
        <p class="text-blue-100">Caja #{cajaId}</p>
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

  {#if loading}
    <div class="flex justify-center items-center py-20">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  {:else if resumenArqueo}
    <!-- Resumen -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p class="text-sm text-gray-600 mb-2">Saldo Inicial</p>
        <p class="text-2xl font-bold text-gray-900">{formatearMoneda(resumenArqueo.saldoInicial)}</p>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p class="text-sm text-gray-600 mb-2">Total Sistema</p>
        <p class="text-2xl font-bold text-blue-600">{formatearMoneda(resumenArqueo.totalSistema)}</p>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p class="text-sm text-gray-600 mb-2">Total Declarado</p>
        <p class="text-2xl font-bold {getDiferenciaClass(totalDiferencia)}">
          {formatearMoneda(totalDeclarado)}
        </p>
        {#if totalDiferencia !== 0}
          <p class="text-sm mt-1 {getDiferenciaClass(totalDiferencia)}">
            Dif: {formatearMoneda(totalDiferencia)}
          </p>
        {/if}
      </div>
    </div>

    <!-- Formas de pago -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 class="text-lg font-semibold text-gray-900">Arqueo por Forma de Pago</h2>
      </div>

      <div class="p-6 space-y-4">
        {#each resumenArqueo.formasPago as formaPago, index}
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-gray-900">{formaPago.descripcion}</h3>
              <span class="text-sm text-gray-600">Sistema: {formatearMoneda(formaPago.totalSistema)}</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Total Declarado
                </label>
                <input
                  type="number"
                  step="0.01"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  bind:value={formaPago.totalDeclarado}
                  oninput={() => actualizarDiferencia(index)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <p class="block text-sm font-medium text-gray-700 mb-2">Diferencia</p>
                <div class="px-4 py-2 bg-gray-50 rounded-lg">
                  <p class="text-lg font-semibold {getDiferenciaClass(formaPago.diferencia)}">
                    {formatearMoneda(formaPago.diferencia)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Observaciones -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Observaciones
      </label>
      <textarea
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        bind:value={observaciones}
        rows="4"
        placeholder="Agregue observaciones sobre el arqueo..."
      ></textarea>
    </div>

    <!-- Alerta si hay diferencias -->
    {#if totalDiferencia !== 0}
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <Icon icon={AlertCircle} size={20} strokeWidth={2.5} class="text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p class="font-semibold text-yellow-800">Hay diferencias detectadas</p>
          <p class="text-sm text-yellow-700 mt-1">
            Revise los importes declarados. Diferencia total: {formatearMoneda(totalDiferencia)}
          </p>
        </div>
      </div>
    {/if}

    <!-- Botones de acción -->
    <div class="flex gap-3">
      <button
        type="button"
        class="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        onclick={handleCancel}
        disabled={loading}
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        onclick={realizarArqueo}
        disabled={loading}
      >
        {loading ? 'Realizando Arqueo...' : 'Realizar Arqueo'}
      </button>
    </div>
  {/if}
</div>
