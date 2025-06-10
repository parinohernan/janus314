<script lang="ts">
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { onMount } from 'svelte';
  import '../../../../../app.css';
  import LogoJano from '../../components/LogoJano.svelte';

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

  let loading: boolean = false;
  let error: string | null = null;
  let success: string | null = null;
  let vendedorId: string = '';
  let cajaAbierta: any = null;
  let resumenArqueo: ResumenArqueo | null = null;

  // Valores del arqueo
  let observaciones: string = '';
  let totalDeclarado: number = 0;
  let actualizandoDiferencia = false;

  // Cargar el estado de la caja y el resumen del arqueo
  async function cargarDatos() {
    try {
      // Obtener el código del vendedor del localStorage
      vendedorId = localStorage.getItem('botVendedorCodigo') || '';
      if (!vendedorId) {
        error = "No se encontró el código del vendedor";
        setTimeout(() => {
          goto('/ventas/bot/caja');
        }, 2000);
        return;
      }

      const response = await fetchWithAuth(`/cajas/vendedor/${vendedorId}`);
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        cajaAbierta = data.data[0];
        await cargarResumenArqueo();
      } else {
        error = "No hay una caja abierta";
        setTimeout(() => {
          goto('/ventas/bot/caja');
        }, 2000);
      }
    } catch (err) {
      error = "Error al cargar el estado de la caja";
      console.error("Error detallado:", err);
    }
  }

  // Cargar resumen del arqueo
  async function cargarResumenArqueo() {
    try {
      const response = await fetchWithAuth(`/cajas/${cajaAbierta.Codigo}/arqueo/resumen`);
      const data = await response.json();
      if (data.success) {
        // Inicializar los valores declarados con los valores del sistema
        data.data.formasPago = data.data.formasPago.map((fp: FormaPagoArqueo) => ({
          ...fp,
          totalDeclarado: fp.totalSistema,
          diferencia: 0
        }));
        resumenArqueo = data.data;
        // Calcular el total declarado inicial
        if (resumenArqueo) {
          totalDeclarado = resumenArqueo.totalSistema;
        }
      }
    } catch (err) {
      error = "Error al cargar el resumen del arqueo";
      console.error("Error detallado:", err);
    }
  }

  // Actualizar diferencia cuando cambie el monto declarado
  function actualizarDiferencia(formaPago: FormaPagoArqueo) {
    if (actualizandoDiferencia) return;
    actualizandoDiferencia = true;
    
    try {
      // Asegurarse de que totalDeclarado sea un número
      formaPago.totalDeclarado = parseFloat(formaPago.totalDeclarado?.toString() || '0');
      // Calcular la diferencia
      formaPago.diferencia = formaPago.totalDeclarado - formaPago.totalSistema;
      // Recalcular el total declarado
      if (resumenArqueo) {
        totalDeclarado = resumenArqueo.formasPago.reduce(
          (sum, fp: FormaPagoArqueo) => sum + (parseFloat(fp.totalDeclarado?.toString() || '0')), 
          0
        );
      }
    } finally {
      actualizandoDiferencia = false;
    }
  }

  async function registrarArqueo() {
    if (!vendedorId || !cajaAbierta || !resumenArqueo) {
      error = "No se puede realizar el arqueo";
      return;
    }

    loading = true;
    try {
      const response = await fetchWithAuth(`/cajas/arqueo/${cajaAbierta.Codigo}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formasPago: resumenArqueo.formasPago.map(fp => ({
            ...fp,
            totalDeclarado: parseFloat(fp.totalDeclarado?.toString() || '0'),
            diferencia: parseFloat(fp.diferencia?.toString() || '0')
          })),
          totalDeclarado,
          diferencia: totalDeclarado - resumenArqueo.totalSistema,
          observaciones,
          usuarioId: vendedorId
        })
      });

      const data = await response.json();
      if (data.success) {
        success = "Arqueo registrado exitosamente";
        // Recargar los datos después de 2 segundos
        setTimeout(() => {
          success = null;
          cargarDatos();
        }, 2000);
      } else {
        error = data.message || "Error al registrar el arqueo";
      }
    } catch (err) {
      error = "Error al conectar con el servidor";
      console.error("Error detallado:", err);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    cargarDatos();
  });
</script>

<div class="telegram-webapp">
  <header class="header">
    <div class="header-content">
      <button class="btn-back" on:click={() => goto('/ventas/bot/caja')} aria-label="Volver">
        <span class="back-icon">←</span>
      </button>
      <div class="title-container">
        <LogoJano size="small" animated={false} />
        <h2 class="page-subtitle">Arqueo de Caja</h2>
      </div>
    </div>
  </header>

  {#if loading}
    <div class="flex justify-center items-center h-32">
      <div class="loading-spinner"></div>
    </div>
  {:else if error}
    <div class="error-message p-4 mb-4" transition:fade>
      {error}
    </div>
  {:else if success}
    <div class="success-message p-4 mb-4" transition:fade>
      {success}
    </div>
  {:else if resumenArqueo}
    <div class="arqueo-container p-4">
      <!-- Información General -->
      <div class="info-general bg-blue-50 p-4 rounded-lg mb-6">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-sm text-gray-600">Saldo Inicial</div>
            <div class="text-xl font-bold text-blue-600">
              ${resumenArqueo.saldoInicial.toFixed(2)}
            </div>
          </div>
          <div>
            <div class="text-sm text-gray-600">Saldo Teórico</div>
            <div class="text-xl font-bold text-blue-600">
              ${resumenArqueo.saldoTeorico.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <!-- Formas de Pago -->
      <div class="formas-pago space-y-4">
        <h3 class="text-lg font-semibold mb-3">Formas de Pago</h3>
        
        {#each resumenArqueo.formasPago as formaPago}
          <div class="forma-pago bg-white p-4 rounded-lg shadow" transition:fade>
            <div class="mb-2 font-medium">{formaPago.descripcion}</div>
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
                  class="w-full p-2 border rounded"
                />
              </div>
              <div>
                <div class="text-sm text-gray-600">Diferencia</div>
                <div class="font-bold" class:text-red-600={formaPago.diferencia < 0} class:text-green-600={formaPago.diferencia > 0}>
                  ${formaPago.diferencia.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        {/each}

        <!-- Totales -->
        <div class="totales bg-gray-50 p-4 rounded-lg mt-6">
          <div class="grid grid-cols-3 gap-4">
            <div>
              <div class="text-sm text-gray-600">Total Sistema</div>
              <div class="text-xl font-bold">${resumenArqueo.totalSistema.toFixed(2)}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600">Total Declarado</div>
              <div class="text-xl font-bold">${totalDeclarado.toFixed(2)}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600">Diferencia Total</div>
              <div class="text-xl font-bold" class:text-red-600={totalDeclarado - resumenArqueo.totalSistema < 0} class:text-green-600={totalDeclarado - resumenArqueo.totalSistema > 0}>
                ${(totalDeclarado - resumenArqueo.totalSistema).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <!-- Observaciones -->
        <div class="mt-6">
          <label for="observaciones" class="block text-sm font-medium text-gray-700 mb-2">
            Observaciones
          </label>
          <textarea
            id="observaciones"
            bind:value={observaciones}
            rows="3"
            class="w-full p-3 border rounded-lg"
            placeholder="Ingrese observaciones sobre el arqueo..."
          ></textarea>
        </div>

        <!-- Botón de Registro -->
        <div class="mt-6">
          <button
            class="w-full p-4 bg-blue-500 text-white rounded-lg font-medium"
            on:click={registrarArqueo}
            disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar Arqueo'}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .telegram-webapp {
    padding: 16px;
    max-width: 100%;
    min-height: 100vh;
    color: var(--tg-theme-text-color, #000);
    background: var(--tg-theme-bg-color, #fff);
  }

  .header {
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .title-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-back {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--tg-theme-button-color, #2481cc);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
  }

  .page-subtitle {
    font-size: 1.5rem;
    margin: 0;
    color: var(--tg-theme-text-color, #000);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-message {
    background-color: #fee2e2;
    border: 1px solid #ef4444;
    color: #dc2626;
    border-radius: 0.5rem;
  }

  .success-message {
    background-color: #dcfce7;
    border: 1px solid #22c55e;
    color: #16a34a;
    border-radius: 0.5rem;
  }

  input[type="number"] {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    appearance: none;
    margin: 0;
  }
</style> 