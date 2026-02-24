<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { debounce } from 'lodash-es';
  import Button from '$lib/components/ui/Button.svelte';
  import {
    ProveedorService,
    type ProveedorCuentaCorriente,
  } from '$lib/services/ProveedorService';

  interface Pagination {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  }

  interface Filters {
    search: string;
    field: string;
    order: 'ASC' | 'DESC';
  }

  let filters: Filters = {
    search: '',
    field: 'Descripcion',
    order: 'ASC'
  };

  let pagination: Pagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  };

  let proveedores: ProveedorCuentaCorriente[] = [];
  let loading = true;
  let error: string | null = null;

  const loadProveedores = async (): Promise<void> => {
    try {
      loading = true;
      error = null;
      const result = await ProveedorService.obtenerCuentasCorrientes({
        page: pagination.currentPage,
        limit: pagination.limit,
        search: filters.search,
        field: filters.field,
        order: filters.order
      });
      proveedores = result.items;
      pagination = {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalItems,
        limit: result.limit
      };
    } catch (err: unknown) {
      console.error('Error cargando cuentas corrientes:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };

  const debouncedSearch = debounce(() => {
    pagination.currentPage = 1;
    loadProveedores();
  }, 300);

  const handleSearchChange = (e: Event): void => {
    filters.search = (e.target as HTMLInputElement).value;
    debouncedSearch();
  };

  const toggleOrderBy = (field: string): void => {
    if (filters.field === field) {
      filters.order = filters.order === 'ASC' ? 'DESC' : 'ASC';
    } else {
      filters.field = field;
      filters.order = 'ASC';
    }
    loadProveedores();
  };

  const goToPage = (p: number): void => {
    if (p < 1 || p > pagination.totalPages) return;
    pagination.currentPage = p;
    loadProveedores();
  };

  onMount(() => {
    loadProveedores();
  });
</script>

<svelte:head>
  <title>Cuentas Corrientes - Proveedores</title>
</svelte:head>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-4">
    <h1 class="text-2xl font-bold">Cuentas Corrientes - Proveedores</h1>
  </div>

  <div class="mb-6 bg-white p-4 rounded-lg shadow-sm">
    <div class="flex flex-col md:flex-row gap-4">
      <div class="flex-grow">
        <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
        <input
          type="text"
          id="search"
          placeholder="Buscar por código o descripción..."
          value={filters.search}
          on:input={handleSearchChange}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div class="md:w-48">
        <label for="limit" class="block text-sm font-medium text-gray-700 mb-1">Mostrar</label>
        <select
          id="limit"
          bind:value={pagination.limit}
          on:change={() => { pagination.currentPage = 1; loadProveedores(); }}
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={5}>5 por página</option>
          <option value={10}>10 por página</option>
          <option value={25}>25 por página</option>
          <option value={50}>50 por página</option>
        </select>
      </div>
    </div>
  </div>

  {#if loading}
    <div class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      <p class="mt-2 text-gray-600">Cargando...</p>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p class="font-bold">Error al cargar los datos</p>
      <p>{error}</p>
      <button
        class="mt-2 bg-red-200 hover:bg-red-300 text-red-800 px-3 py-1 rounded"
        on:click={loadProveedores}
      >
        Reintentar
      </button>
    </div>
  {:else if proveedores.length === 0}
    <div class="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-8 rounded mb-4 text-center">
      <p>No se encontraron cuentas corrientes de proveedores.</p>
    </div>
  {:else}
    <div class="overflow-x-auto bg-white rounded-lg shadow">
      <table class="min-w-full">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button class="flex items-center" on:click={() => toggleOrderBy('Codigo')}>
                Código
                {#if filters.field === 'Codigo'}
                  <span class="ml-1">{filters.order === 'ASC' ? '↑' : '↓'}</span>
                {/if}
              </button>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button class="flex items-center" on:click={() => toggleOrderBy('Descripcion')}>
                Descripción
                {#if filters.field === 'Descripcion'}
                  <span class="ml-1">{filters.order === 'ASC' ? '↑' : '↓'}</span>
                {/if}
              </button>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button class="flex items-center" on:click={() => toggleOrderBy('Saldo')}>
                Saldo
                {#if filters.field === 'Saldo'}
                  <span class="ml-1">{filters.order === 'ASC' ? '↑' : '↓'}</span>
                {/if}
              </button>
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {#each proveedores as prov (prov.Codigo)}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">{prov.Codigo}</td>
              <td class="px-6 py-4 border-b border-gray-200">{prov.Descripcion}</td>
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                {(prov.Saldo ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right border-b border-gray-200">
                <Button
                  variant="secondary"
                  size="sm"
                  on:click={() => goto(`/compras/cuentascorrientes/${prov.Codigo}`)}
                >
                  Ver detalle
                </Button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if pagination.totalPages > 1}
      <div class="mt-4 flex justify-between items-center text-sm">
        <div class="text-gray-600">
          Mostrando {(pagination.currentPage - 1) * pagination.limit + 1} a
          {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} de
          {pagination.totalItems} proveedores
        </div>
        <div class="flex space-x-1">
          <button
            class="px-3 py-1 rounded border {pagination.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}"
            on:click={() => goToPage(1)}
            disabled={pagination.currentPage === 1}
          >
            &laquo;
          </button>
          <button
            class="px-3 py-1 rounded border {pagination.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}"
            on:click={() => goToPage(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
          >
            Anterior
          </button>
          <span class="px-3 py-1">
            Página {pagination.currentPage} de {pagination.totalPages}
          </span>
          <button
            class="px-3 py-1 rounded border {pagination.currentPage >= pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}"
            on:click={() => goToPage(pagination.currentPage + 1)}
            disabled={pagination.currentPage >= pagination.totalPages}
          >
            Siguiente
          </button>
          <button
            class="px-3 py-1 rounded border {pagination.currentPage >= pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}"
            on:click={() => goToPage(pagination.totalPages)}
            disabled={pagination.currentPage >= pagination.totalPages}
          >
            &raquo;
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>
