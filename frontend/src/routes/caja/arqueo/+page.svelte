<script lang="ts">
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/authStore';
  import Button from '$lib/components/ui/Button.svelte';

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

  let loading = false;
  let error: string | null = null;
  let success: string | null = null;
  let vendedorId = '';
  let cajaAbierta: { Codigo: number } | null = null;
  let resumenArqueo: ResumenArqueo | null = null;
  let observaciones = '';
  let totalDeclarado = 0;
  let actualizandoDiferencia = false;

  $: if (typeof $auth?.user?.usuario === 'string') {
    vendedorId = $auth.user.usuario;
  }

  async function cargarDatos() {
    if (!vendedorId) {
      error = 'No se encontró el usuario. Debe iniciar sesión.';
      setTimeout(() => goto('/caja'), 2000);
      return;
    }
    try {
      const response = await fetchWithAuth(`/cajas/vendedor/${vendedorId}`);
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        cajaAbierta = data.data[0];
        await cargarResumenArqueo();
      } else {
        error = 'No hay una caja abierta';
        setTimeout(() => goto('/caja'), 2000);
      }
    } catch (err) {
      error = 'Error al cargar el estado de la caja';
    }
  }

  async function cargarResumenArqueo() {
    if (!cajaAbierta) return;
    try {
      const response = await fetchWithAuth(`/cajas/${cajaAbierta.Codigo}/arqueo/resumen`);
      const data = await response.json();
      if (data.success) {
        data.data.formasPago = data.data.formasPago.map((fp: FormaPagoArqueo) => ({
          ...fp,
          totalDeclarado: fp.totalSistema,
          diferencia: 0
        }));
        resumenArqueo = data.data;
        if (resumenArqueo) totalDeclarado = resumenArqueo.totalSistema;
      }
    } catch (err) {
      error = 'Error al cargar el resumen del arqueo';
    }
  }

  function actualizarDiferencia(formaPago: FormaPagoArqueo) {
    if (actualizandoDiferencia) return;
    actualizandoDiferencia = true;
    try {
      formaPago.totalDeclarado = parseFloat(String(formaPago.totalDeclarado ?? 0));
      formaPago.diferencia = formaPago.totalDeclarado - formaPago.totalSistema;
      if (resumenArqueo) {
        totalDeclarado = resumenArqueo.formasPago.reduce(
          (sum, fp) => sum + parseFloat(String(fp.totalDeclarado ?? 0)),
          0
        );
      }
    } finally {
      actualizandoDiferencia = false;
    }
  }

  async function registrarArqueo() {
    if (!vendedorId || !cajaAbierta || !resumenArqueo) {
      error = 'No se puede realizar el arqueo';
      return;
    }
    loading = true;
    try {
      const response = await fetchWithAuth(`/cajas/arqueo/${cajaAbierta.Codigo}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formasPago: resumenArqueo.formasPago.map((fp) => ({
            ...fp,
            totalDeclarado: parseFloat(String(fp.totalDeclarado ?? 0)),
            diferencia: parseFloat(String(fp.diferencia ?? 0))
          })),
          totalDeclarado,
          diferencia: totalDeclarado - resumenArqueo.totalSistema,
          observaciones,
          usuarioId: vendedorId
        })
      });
      const data = await response.json();
      if (data.success) {
        success = 'Arqueo registrado correctamente';
        setTimeout(() => {
          success = null;
          cargarDatos();
        }, 2000);
      } else {
        error = data.message || 'Error al registrar el arqueo';
      }
    } catch (err) {
      error = 'Error al conectar con el servidor';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    cargarDatos();
  });
</script>

<div>
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">Arqueo de caja</h1>
    <Button variant="secondary" on:click={() => goto('/caja')}>Volver a Caja</Button>
  </div>

  {#if loading && !resumenArqueo}
    <div class="flex justify-center items-center h-32">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4" transition:fade>
      {error}
    </div>
  {:else if success}
    <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4" transition:fade>
      {success}
    </div>
  {:else if resumenArqueo}
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg mb-6">
        <div>
          <div class="text-sm text-gray-600">Saldo inicial</div>
          <div class="text-xl font-bold text-blue-600">${resumenArqueo.saldoInicial.toFixed(2)}</div>
        </div>
        <div>
          <div class="text-sm text-gray-600">Saldo teórico</div>
          <div class="text-xl font-bold text-blue-600">${resumenArqueo.saldoTeorico.toFixed(2)}</div>
        </div>
      </div>

      <h3 class="text-lg font-semibold text-gray-800 mb-4">Formas de pago</h3>
      <div class="space-y-4">
        {#each resumenArqueo.formasPago as formaPago}
          <div class="bg-gray-50 p-4 rounded-lg border border-gray-100" transition:fade>
            <div class="mb-2 font-medium text-gray-800">{formaPago.descripcion}</div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <div class="text-sm text-gray-600">Sistema</div>
                <div class="font-bold">${formaPago.totalSistema.toFixed(2)}</div>
              </div>
              <div>
                <div class="text-sm text-gray-600">Declarado</div>
                <input
                  type="number"
                  step="0.01"
                  bind:value={formaPago.totalDeclarado}
                  on:input={() => actualizarDiferencia(formaPago)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <div class="text-sm text-gray-600">Diferencia</div>
                <div class="font-bold {formaPago.diferencia < 0 ? 'text-red-600' : 'text-green-600'}">
                  ${formaPago.diferencia.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <div class="bg-gray-100 p-4 rounded-lg mt-6">
        <div class="grid grid-cols-3 gap-4">
          <div>
            <div class="text-sm text-gray-600">Total sistema</div>
            <div class="text-xl font-bold">${resumenArqueo.totalSistema.toFixed(2)}</div>
          </div>
          <div>
            <div class="text-sm text-gray-600">Total declarado</div>
            <div class="text-xl font-bold">${totalDeclarado.toFixed(2)}</div>
          </div>
          <div>
            <div class="text-sm text-gray-600">Diferencia total</div>
            <div class="text-xl font-bold {totalDeclarado - resumenArqueo.totalSistema < 0 ? 'text-red-600' : 'text-green-600'}">
              ${(totalDeclarado - resumenArqueo.totalSistema).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <label for="observaciones" class="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
        <textarea
          id="observaciones"
          bind:value={observaciones}
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Observaciones sobre el arqueo..."
        ></textarea>
      </div>

      <div class="mt-6">
        <Button variant="primary" on:click={registrarArqueo} disabled={loading} fullWidth>
          {loading ? 'Registrando...' : 'Registrar arqueo'}
        </Button>
      </div>
    </div>
  {/if}
</div>
