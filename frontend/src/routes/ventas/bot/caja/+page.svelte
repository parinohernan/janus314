<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import '../../../../app.css';

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

  // Estados
  let cajaAbierta: CajaCabeza | null = null;
  let movimientos: Movimiento[] = [];
  let loading: boolean = true;
  let error: string | null = null;
  let vendedorId: string = '001'; // TODO: Obtener del contexto de la aplicación

  // Función para cargar el estado de la caja
  async function cargarEstadoCaja() {
    try {
      console.log('Intentando cargar estado de caja para vendedor:', vendedorId);
      const response = await fetchWithAuth(`/cajas/vendedor/${vendedorId}`);
      console.log('Respuesta del servidor:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Datos recibidos:', data);
      
      if (data.success && data.data.length > 0) {
        cajaAbierta = data.data[0] as CajaCabeza;
        if (cajaAbierta) {
          await cargarMovimientos(cajaAbierta.Codigo);
        }
      } else {
        console.log('No se encontraron cajas abiertas');
      }
      loading = false;
    } catch (err: unknown) {
      console.error('Error detallado:', err);
      error = `Error al cargar el estado de la caja: ${err instanceof Error ? err.message : 'Error desconocido'}`;
      loading = false;
    }
  }

  // Función para cargar movimientos
  async function cargarMovimientos(cajaCodigo: number) {
    try {
      const response = await fetchWithAuth(`/cajas/${cajaCodigo}/movimientos`);
      const data = await response.json();
      if (data.success) {
        movimientos = data.data;
      }
    } catch (err) {
      error = "Error al cargar los movimientos";
    }
  }

  // Función para abrir caja
  async function abrirCaja() {
    try {
      const response = await fetchWithAuth('/cajas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendedorId,
          saldoInicial: 0,
          descripcion: 'Apertura de caja'
        })
      });
      const data = await response.json();
      if (data.success) {
        cajaAbierta = data.data;
        error = null;
      }
    } catch (err) {
      error = "Error al abrir la caja";
    }
  }

  // Función para registrar movimiento
  async function registrarMovimiento(tipo: 'ingreso' | 'egreso', importe: number, concepto: string) {
    if (!cajaAbierta) return;
    
    try {
      const response = await fetchWithAuth('/cajas/movimiento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cajaCabezaId: cajaAbierta.Codigo,
          tipo,
          importe: parseFloat(importe.toString()),
          concepto,
          metodoPago: 'EFE', // Efectivo por defecto
          usuarioId: vendedorId
        })
      });
      const data = await response.json();
      if (data.success) {
        await cargarEstadoCaja();
      }
    } catch (err) {
      error = "Error al registrar el movimiento";
    }
  }

  onMount(() => {
    cargarEstadoCaja();
  });
</script>

<div class="telegram-webapp p-4">
  {#if loading}
    <div class="flex justify-center items-center h-32">
      <div class="loading-spinner"></div>
    </div>
  {:else if error}
    <div class="error-message p-4 mb-4" transition:fade>
      {error}
    </div>
  {:else}
    <!-- Estado de Caja -->
    <div class="caja-estado mb-6" class:caja-abierta={cajaAbierta} class:caja-cerrada={!cajaAbierta}>
      <h2 class="text-xl font-bold mb-2">
        {cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}
      </h2>
      
      {#if cajaAbierta}
        <div class="saldo-info p-4 rounded-lg bg-blue-50 mb-4">
          <div class="text-sm text-gray-600">Saldo Actual</div>
          <div class="text-2xl font-bold text-blue-600">
            ${cajaAbierta.SaldoTeorico?.toFixed(2) || '0.00'}
          </div>
        </div>

        <!-- Acciones Rápidas -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <button
            class="btn-ingreso p-4 rounded-lg bg-green-500 text-white font-medium"
            on:click={() => goto('/ventas/bot/caja/ingreso')}>
            + Ingreso
          </button>
          <button
            class="btn-egreso p-4 rounded-lg bg-red-500 text-white font-medium"
            on:click={() => goto('/ventas/bot/caja/egreso')}>
            - Egreso
          </button>
        </div>

        <!-- Últimos Movimientos -->
        <div class="movimientos">
          <h3 class="text-lg font-semibold mb-3">Últimos Movimientos</h3>
          {#if movimientos.length === 0}
            <p class="text-gray-500 text-center py-4">No hay movimientos registrados</p>
          {:else}
            <div class="movimientos-lista">
              {#each movimientos as movimiento}
                <div class="movimiento-item p-3 border-b" transition:fade>
                  <div class="flex justify-between items-center">
                    <div>
                      <div class="font-medium">{movimiento.Concepto}</div>
                      <div class="text-sm text-gray-500">
                        {new Date(movimiento.FechaHora).toLocaleTimeString()}
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-bold" class:text-green-600={movimiento.Tipo === 'ingreso'} class:text-red-600={movimiento.Tipo === 'egreso'}>
                        {movimiento.Tipo === 'ingreso' ? '+' : '-'}${movimiento.Importe.toFixed(2)}
                      </div>
                      <div class="text-sm text-gray-500">{movimiento.TipoPago?.Descripcion}</div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {:else}
        <div class="flex justify-center">
          <button
            class="btn-abrir-caja p-4 rounded-lg bg-blue-500 text-white font-medium"
            on:click={abrirCaja}>
            Abrir Caja
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
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

  .btn-ingreso, .btn-egreso, .btn-abrir-caja {
    transition: transform 0.2s;
  }

  .btn-ingreso:active, .btn-egreso:active, .btn-abrir-caja:active {
    transform: scale(0.98);
  }

  .movimientos-lista {
    max-height: calc(100vh - 400px);
    overflow-y: auto;
  }

  .movimiento-item {
    transition: background-color 0.2s;
  }

  .movimiento-item:active {
    background-color: #f3f4f6;
  }
</style> 