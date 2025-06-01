<script lang="ts">
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { onMount, onDestroy } from 'svelte';
  import '../../../../../app.css';
  import LogoJano from '../../components/LogoJano.svelte';
  import { get } from 'svelte/store';
  import { auth } from '$lib/stores/authStore';
  import type { Usuario } from '$lib/types/usuario.types';

  interface AuthState {
    user: Usuario | null;
    isAuthenticated: boolean;
    token: string | null;
    empresa?: {
      id: string;
      nombre: string;
      baseDatos: string;
    } | null;
  }

  interface CajaArqueo {
    MetodoPago: string;
    MontoContado: number;
    MontoSistema: number;
    Diferencia: number;
    FechaHora: string;
  }

  interface Caja {
    Codigo: string;
    Estado: string;
    Apertura: string;
    Cierre: string;
    SaldoInicial: string;
    SaldoTeorico: string;
    SaldoCierre: string;
    Observaciones: string;
    Vendedor: {
      Codigo: string;
      Descripcion: string;
    };
    Arqueos: CajaArqueo[];
  }

  interface Vendedor {
    Codigo: string;
    Descripcion: string;
  }

  let loading: boolean = false;
  let error: string | null = null;
  let cajas: Caja[] = [];
  let totalPages: number = 0;
  let currentPage: number = 1;
  let vendedorFiltro: string = '';
  let vendedores: Vendedor[] = [];
  let vendedoresMap: Map<string, string> = new Map();
  let codigoVendedor: string = '1'; // Valor por defecto
  let fechaDesde: string = new Date().toISOString().split('T')[0];
  let fechaHasta: string = new Date().toISOString().split('T')[0];
  let estado: string = '';

  // Función para guardar datos del vendedor en localStorage
  function guardarDatosVendedor(usuario: any) {
    if (usuario) {
      localStorage.setItem('botVendedorNombre', usuario.nombre || 'Vendedor');
      localStorage.setItem('botVendedorApellido', usuario.apellido || '');
      localStorage.setItem('botVendedorCodigo', usuario.usuario || '1');
      console.log("Datos de vendedor guardados en localStorage:", usuario.usuario);
    }
  }

  // Suscripción al store de autenticación
  let unsubscribe = auth.subscribe((state: AuthState) => {
    console.log("Estado de autenticación:", state);
    if (state.user) {
      // Si el usuario está autenticado, usar su código de vendedor
      codigoVendedor = state.user.usuario || '1';
      guardarDatosVendedor(state.user);
      
      // Establecer el filtro de vendedor automáticamente al del usuario logueado
      if (vendedorFiltro === '') {
        vendedorFiltro = codigoVendedor;
      }
    } else {
      // Intentar recuperar datos del vendedor de localStorage si existen
      const codigoGuardado = localStorage.getItem('botVendedorCodigo');
      if (codigoGuardado) {
        codigoVendedor = codigoGuardado;
        // Establecer el filtro de vendedor automáticamente al del usuario
        if (vendedorFiltro === '') {
          vendedorFiltro = codigoGuardado;
        }
      }
    }
  });

  // Limpiar suscripción cuando el componente se destruye
  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  async function cargarVendedores() {
    try {
      const response = await fetchWithAuth('/vendedores', {
        params: {
          activo: true
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar vendedores');
      }

      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.message || 'Error al cargar vendedores');
      }

      vendedores = responseData.data || [];
      // Crear un mapa para búsqueda rápida de nombres de vendedores
      vendedoresMap = new Map(vendedores.map(v => [v.Codigo, v.Descripcion]));
    } catch (err) {
      console.error('Error al cargar vendedores:', err);
      error = 'Error al cargar lista de vendedores';
    }
  }

  function obtenerNombreVendedor(codigo: string): string {
    return vendedoresMap.get(codigo) || codigo;
  }

  // Cargar cajas
  async function cargarCajas(page: number = 1) {
    loading = true;
    try {
      let url = `/cajas?page=${page}`;
      if (vendedorFiltro) url += `&vendedor=${vendedorFiltro}`;
      if (fechaDesde) url += `&fechaDesde=${fechaDesde}`;
      if (fechaHasta) url += `&fechaHasta=${fechaHasta}`;
      if (estado) url += `&estado=${estado}`;

      const response = await fetchWithAuth(url);
      const data = await response.json();
      
      if (data.success) {
        cajas = data.items;
        totalPages = data.meta.totalPages;
        currentPage = page;
      }
    } catch (err) {
      error = "Error al cargar las cajas";
      console.error("Error detallado:", err);
    } finally {
      loading = false;
    }
  }

  // Formatear fecha
  function formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Formatear monto
  function formatearMonto(monto: string | number): string {
    return parseFloat(monto?.toString() || '0').toFixed(2);
  }

  // Cambiar página
  function cambiarPagina(page: number) {
    if (page > 0 && page <= totalPages) {
      cargarCajas(page);
    }
  }

  // Aplicar filtros
  function aplicarFiltros() {
    cargarCajas(1);
  }

  // Obtener clase de estado
  function getEstadoClass(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'abierta':
        return 'bg-green-100 text-green-800';
      case 'cerrada':
        return 'bg-red-100 text-red-800';
      case 'en_arqueo':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function filtrarPorVendedor(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target) {
      vendedorFiltro = target.value;
      cargarCajas(1);
    }
  }

  onMount(async () => {
    // Verificar estado actual de autenticación
    const authState = get(auth) as AuthState;
    console.log("Estado inicial de autenticación:", authState);
    
    // Si no hay usuario autenticado, verificar la sesión
    if (!authState.isAuthenticated) {
      await auth.verifySession();
      
      // Verificar de nuevo después de verificar la sesión
      const nuevoAuthState = get(auth) as AuthState;
      if (nuevoAuthState.user) {
        codigoVendedor = nuevoAuthState.user.usuario || '1';
        guardarDatosVendedor(nuevoAuthState.user);
        // Establecer filtro vendedor automaticamente si no hay uno seleccionado
        if (vendedorFiltro === '') {
          vendedorFiltro = codigoVendedor;
        }
      }
    } else if (authState.user) {
      // Guardar datos del usuario en localStorage si está autenticado
      guardarDatosVendedor(authState.user);
      // Establecer filtro vendedor automaticamente si no hay uno seleccionado
      if (vendedorFiltro === '') {
        vendedorFiltro = authState.user.usuario;
      }
    }
    
    await cargarVendedores();
    await cargarCajas();
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
        <h2 class="page-subtitle">Listado de Cajas</h2>
      </div>
    </div>
  </header>

  <!-- Filtros -->
  <div class="filtros bg-white p-4 rounded-lg shadow mb-4">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label 
          for="vendedor-input" 
          class="block text-sm font-medium text-gray-700 mb-1">
          Vendedor
        </label>
        <select
          id="vendedor-input"
          bind:value={vendedorFiltro}
          class="w-full p-2 border rounded"
          on:change={filtrarPorVendedor}
        >
          <option value="">Todos los vendedores</option>
          {#each vendedores as vendedor}
            <option value={vendedor.Codigo}>{vendedor.Descripcion}</option>
          {/each}
        </select>
      </div>
      <div>
        <label 
          for="estado-select" 
          class="block text-sm font-medium text-gray-700 mb-1">
          Estado
        </label>
        <select
          id="estado-select"
          bind:value={estado}
          class="w-full p-2 border rounded"
        >
          <option value="">Todos</option>
          <option value="abierta">Abierta</option>
          <option value="cerrada">Cerrada</option>
          <option value="en_arqueo">En Arqueo</option>
        </select>
      </div>
      <div>
        <label 
          for="fecha-desde" 
          class="block text-sm font-medium text-gray-700 mb-1">
          Desde
        </label>
        <input
          id="fecha-desde"
          type="date"
          bind:value={fechaDesde}
          class="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label 
          for="fecha-hasta" 
          class="block text-sm font-medium text-gray-700 mb-1">
          Hasta
        </label>
        <input
          id="fecha-hasta"
          type="date"
          bind:value={fechaHasta}
          class="w-full p-2 border rounded"
        />
      </div>
    </div>
    <button
      class="mt-4 w-full bg-blue-500 text-white p-2 rounded"
      on:click={aplicarFiltros}
    >
      Aplicar Filtros
    </button>
  </div>

  {#if loading}
    <div class="flex justify-center items-center h-32">
      <div class="loading-spinner"></div>
    </div>
  {:else if error}
    <div class="error-message p-4 mb-4" transition:fade>
      {error}
    </div>
  {:else if cajas.length === 0}
    <div class="text-center p-4">
      No se encontraron cajas
    </div>
  {:else}
    <div class="cajas-list space-y-4">
      {#each cajas as caja}
        <div class="caja bg-white p-4 rounded-lg shadow" transition:fade>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div class="text-sm text-gray-600">Vendedor</div>
              <div class="font-medium">{obtenerNombreVendedor(caja.Vendedor.Codigo)}</div>
            </div>
            <div class="text-right">
              <div class="text-sm text-gray-600">Estado</div>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getEstadoClass(caja.Estado)}">
                {caja.Estado}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div class="text-sm text-gray-600">Apertura</div>
              <div class="font-medium">{formatearFecha(caja.Apertura)}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600">Cierre</div>
              <div class="font-medium">{caja.Cierre ? formatearFecha(caja.Cierre) : '-'}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600">Saldo Inicial</div>
              <div class="font-medium">${formatearMonto(caja.SaldoInicial)}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600">Saldo {caja.Estado === 'cerrada' ? 'Final' : 'Actual'}</div>
              <div class="font-medium">${formatearMonto(caja.Estado === 'cerrada' ? caja.SaldoCierre : caja.SaldoTeorico)}</div>
            </div>
          </div>

          {#if caja.Arqueos && caja.Arqueos.length > 0}
            <div class="mt-4">
              <h4 class="font-medium mb-2">Arqueos</h4>
              <div class="overflow-x-auto">
                <table class="min-w-full">
                  <thead>
                    <tr class="bg-gray-50">
                      <th class="px-4 py-2 text-left">Método</th>
                      <th class="px-4 py-2 text-right">Sistema</th>
                      <th class="px-4 py-2 text-right">Contado</th>
                      <th class="px-4 py-2 text-right">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each caja.Arqueos as arqueo}
                      <tr class="border-t">
                        <td class="px-4 py-2">{arqueo.MetodoPago}</td>
                        <td class="px-4 py-2 text-right">${formatearMonto(arqueo.MontoSistema)}</td>
                        <td class="px-4 py-2 text-right">${formatearMonto(arqueo.MontoContado)}</td>
                        <td class="px-4 py-2 text-right" class:text-red-600={arqueo.Diferencia < 0} class:text-green-600={arqueo.Diferencia > 0}>
                          ${formatearMonto(arqueo.Diferencia)}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          {/if}

          {#if caja.Observaciones}
            <div class="mt-4">
              <div class="text-sm text-gray-600">Observaciones</div>
              <div class="mt-1 text-gray-700">{caja.Observaciones}</div>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Paginación -->
    {#if totalPages > 1}
      <div class="pagination flex justify-center items-center space-x-2 mt-6">
        <button
          class="px-4 py-2 rounded bg-gray-100"
          disabled={currentPage === 1}
          on:click={() => cambiarPagina(currentPage - 1)}
        >
          Anterior
        </button>
        <span class="px-4 py-2">
          Página {currentPage} de {totalPages}
        </span>
        <button
          class="px-4 py-2 rounded bg-gray-100"
          disabled={currentPage === totalPages}
          on:click={() => cambiarPagina(currentPage + 1)}
        >
          Siguiente
        </button>
      </div>
    {/if}
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
</style> 