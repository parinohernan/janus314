<script lang="ts">
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { auth } from '$lib/stores/authStore';
  import Button from '$lib/components/ui/Button.svelte';
  import type { Usuario } from '$lib/types/usuario.types';

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
    Vendedor: { Codigo: string; Descripcion: string };
    Arqueos: CajaArqueo[];
  }

  interface Vendedor {
    Codigo: string;
    Descripcion: string;
  }

  let loading = false;
  let error: string | null = null;
  let cajas: Caja[] = [];
  let totalPages = 0;
  let currentPage = 1;
  let vendedorFiltro = '';
  let vendedores: Vendedor[] = [];
  let vendedoresMap = new Map<string, string>();

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastWeekStr = lastWeek.toISOString().split('T')[0];
  let fechaDesde = lastWeekStr;
  let fechaHasta = today;
  let estado = '';

  function obtenerNombreVendedor(codigo: string): string {
    return vendedoresMap.get(codigo) || codigo;
  }

  async function cargarVendedores() {
    try {
      const response = await fetchWithAuth('/vendedores', { params: { activo: true } });
      if (!response.ok) throw new Error('Error al cargar vendedores');
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Error al cargar vendedores');
      vendedores = data.data || [];
      vendedoresMap = new Map(vendedores.map((v: Vendedor) => [v.Codigo, v.Descripcion]));
    } catch (err) {
      console.error(err);
      error = 'Error al cargar lista de vendedores';
    }
  }

  async function cargarCajas(page = 1) {
    loading = true;
    error = null;
    try {
      let url = `/cajas?page=${page}&limit=10`;
      if (vendedorFiltro) url += `&vendedor=${vendedorFiltro}`;
      if (fechaDesde) url += `&fechaDesde=${fechaDesde}`;
      if (fechaHasta) url += `&fechaHasta=${fechaHasta}`;
      if (estado) url += `&estado=${estado}`;
      const response = await fetchWithAuth(url);
      const data = await response.json();
      if (data.success) {
        cajas = data.items || [];
        totalPages = data.meta?.totalPages || 0;
        currentPage = page;
      } else {
        error = data.message || 'Error al cargar las cajas';
      }
    } catch (err) {
      error = 'Error al cargar las cajas';
    } finally {
      loading = false;
    }
  }

  function getPaginationArray(): (number | string)[] {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }
    for (const i of range) {
      if (l !== undefined) {
        if (i - l === 2) rangeWithDots.push(l + 1);
        else if (i - l !== 1) rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  }

  function formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatearMonto(monto: string | number): string {
    return parseFloat(String(monto ?? 0)).toFixed(2);
  }

  function getEstadoClass(est: string): string {
    switch (est.toLowerCase()) {
      case 'abierta': return 'bg-green-100 text-green-800';
      case 'cerrada': return 'bg-red-100 text-red-800';
      case 'en_arqueo': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  onMount(async () => {
    const authState = get(auth) as { user: Usuario | null };
    if (authState?.user && vendedorFiltro === '') {
      vendedorFiltro = authState.user.usuario || '';
    }
    await cargarVendedores();
    await cargarCajas(1);
  });
</script>

<div>
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">Listado de cajas</h1>
    <Button variant="secondary" on:click={() => goto('/caja')}>Volver a Caja</Button>
  </div>

  <div class="bg-white p-4 rounded-lg shadow-sm mb-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label for="vendedor-input" class="block text-sm font-medium text-gray-700 mb-1">Vendedor</label>
        <select
          id="vendedor-input"
          bind:value={vendedorFiltro}
          on:change={() => cargarCajas(1)}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los vendedores</option>
          {#each vendedores as vendedor}
            <option value={vendedor.Codigo}>{vendedor.Descripcion}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="estado-select" class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
        <select
          id="estado-select"
          bind:value={estado}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos</option>
          <option value="abierta">Abierta</option>
          <option value="cerrada">Cerrada</option>
          <option value="en_arqueo">En Arqueo</option>
        </select>
      </div>
      <div>
        <label for="fecha-desde" class="block text-sm font-medium text-gray-700 mb-1">Desde</label>
        <input
          id="fecha-desde"
          type="date"
          bind:value={fechaDesde}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label for="fecha-hasta" class="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
        <input
          id="fecha-hasta"
          type="date"
          bind:value={fechaHasta}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div class="md:col-span-4">
        <Button variant="primary" on:click={() => cargarCajas(1)}>Aplicar filtros</Button>
      </div>
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center items-center h-32">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4" transition:fade>
      {error}
    </div>
  {:else if cajas.length === 0}
    <div class="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
      No se encontraron cajas
    </div>
  {:else}
    <div class="space-y-4">
      {#each cajas as caja}
        <div class="bg-white p-6 rounded-lg shadow-sm" transition:fade>
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
              <div class="font-medium">{caja.Cierre ? formatearFecha(caja.Cierre) : '−'}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600">Saldo inicial</div>
              <div class="font-medium">${formatearMonto(caja.SaldoInicial)}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600">Saldo {caja.Estado === 'cerrada' ? 'final' : 'actual'}</div>
              <div class="font-medium">${formatearMonto(caja.Estado === 'cerrada' ? caja.SaldoCierre : caja.SaldoTeorico)}</div>
            </div>
          </div>
          {#if caja.Arqueos?.length > 0}
            <div class="mt-4">
              <h4 class="font-medium text-gray-800 mb-2">Arqueos</h4>
              <div class="overflow-x-auto border rounded-lg">
                <table class="min-w-full text-sm">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-2 text-left font-medium text-gray-700">Método</th>
                      <th class="px-4 py-2 text-right font-medium text-gray-700">Sistema</th>
                      <th class="px-4 py-2 text-right font-medium text-gray-700">Contado</th>
                      <th class="px-4 py-2 text-right font-medium text-gray-700">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each caja.Arqueos as arqueo}
                      <tr class="border-t border-gray-100">
                        <td class="px-4 py-2">{arqueo.MetodoPago}</td>
                        <td class="px-4 py-2 text-right">${formatearMonto(arqueo.MontoSistema)}</td>
                        <td class="px-4 py-2 text-right">${formatearMonto(arqueo.MontoContado)}</td>
                        <td class="px-4 py-2 text-right {arqueo.Diferencia < 0 ? 'text-red-600' : 'text-green-600'}">
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

    {#if totalPages > 1}
      <div class="flex justify-center items-center gap-2 mt-6">
        <Button variant="secondary" size="sm" disabled={currentPage === 1} on:click={() => cargarCajas(currentPage - 1)}>
          Anterior
        </Button>
        {#each getPaginationArray() as page}
          {#if page === '...'}
            <span class="px-3 py-2">…</span>
          {:else}
            <Button
              variant={currentPage === page ? 'primary' : 'secondary'}
              size="sm"
              on:click={() => typeof page === 'number' && cargarCajas(page)}
            >
              {page}
            </Button>
          {/if}
        {/each}
        <Button variant="secondary" size="sm" disabled={currentPage === totalPages} on:click={() => cargarCajas(currentPage + 1)}>
          Siguiente
        </Button>
      </div>
    {/if}
  {/if}
</div>
