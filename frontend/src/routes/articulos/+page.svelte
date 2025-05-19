<!-- Importar los servicios -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { ArticuloService } from '$lib/services/ArticuloService';
  import type { Articulo } from '../ventas/bot/components/types';
  import { RubroService, type Rubro } from '$lib/services/RubroService';
  import { ProveedorService, type Proveedor } from '$lib/services/ProveedorService';

  // Estado
  let articulos: Articulo[] = [];
  let rubros: Rubro[] = [];
  let proveedores: Proveedor[] = [];
  let loading = true;
  let error: string | null = null;

  // Parámetros de paginación y filtros
  let currentPage = 1;
  let itemsPerPage = 10;
  let searchTerm = '';
  let sortField = 'Descripcion';
  let sortOrder: 'ASC' | 'DESC' = 'ASC';
  let showActive = true;

  // Cargar datos iniciales
  onMount(async () => {
    try {
      await Promise.all([
        loadArticulos(),
        loadRubros(),
        loadProveedores()
      ]);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al cargar los datos';
    } finally {
      loading = false;
    }
  });

  // Función para cargar artículos
  async function loadArticulos() {
    try {
      const response = await ArticuloService.listarArticulos({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        field: sortField,
        order: sortOrder,
        activo: showActive
      });
      
      articulos = response.items;
    } catch (err) {
      console.error('Error cargando artículos:', err);
      throw new Error('Error al cargar los artículos');
    }
  }

  // Función para cargar rubros
  async function loadRubros() {
    try {
      rubros = await RubroService.obtenerRubros();
    } catch (err) {
      console.error('Error cargando rubros:', err);
      throw new Error('Error al cargar los rubros');
    }
  }

  // Función para cargar proveedores
  async function loadProveedores() {
    try {
      proveedores = await ProveedorService.obtenerProveedores();
    } catch (err) {
      console.error('Error cargando proveedores:', err);
      throw new Error('Error al cargar los proveedores');
    }
  }

  // Función para manejar cambios en la paginación
  async function handlePageChange(newPage: number) {
    currentPage = newPage;
    await loadArticulos();
  }

  // Función para manejar cambios en la búsqueda
  async function handleSearch() {
    currentPage = 1; // Resetear a la primera página
    await loadArticulos();
  }

  // Función para manejar cambios en el ordenamiento
  async function handleSort(field: string) {
    if (field === sortField) {
      sortOrder = sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      sortField = field;
      sortOrder = 'ASC';
    }
    await loadArticulos();
  }
</script>

<!-- Template -->
<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-8">Artículos</h1>

  {#if loading}
    <div class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong class="font-bold">Error!</strong>
      <span class="block sm:inline">{error}</span>
    </div>
  {:else}
    <!-- Controles de búsqueda y filtros -->
    <div class="mb-6 flex flex-wrap gap-4">
      <input
        type="text"
        bind:value={searchTerm}
        on:input={handleSearch}
        placeholder="Buscar artículos..."
        class="px-4 py-2 border rounded-lg"
      />
      
      <select
        bind:value={itemsPerPage}
        on:change={loadArticulos}
        class="px-4 py-2 border rounded-lg"
      >
        <option value={10}>10 por página</option>
        <option value={25}>25 por página</option>
        <option value={50}>50 por página</option>
      </select>

      <label class="flex items-center">
        <input
          type="checkbox"
          bind:checked={showActive}
          on:change={loadArticulos}
          class="mr-2"
        />
        Mostrar solo activos
      </label>
    </div>

    <!-- Tabla de artículos -->
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white">
        <thead>
          <tr>
            <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm leading-4 font-medium text-gray-500 uppercase tracking-wider">
              <button on:click={() => handleSort('Codigo')} class="hover:text-gray-700">
                Código {sortField === 'Codigo' ? (sortOrder === 'ASC' ? '↑' : '↓') : ''}
              </button>
            </th>
            <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm leading-4 font-medium text-gray-500 uppercase tracking-wider">
              <button on:click={() => handleSort('Descripcion')} class="hover:text-gray-700">
                Descripción {sortField === 'Descripcion' ? (sortOrder === 'ASC' ? '↑' : '↓') : ''}
              </button>
            </th>
            <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm leading-4 font-medium text-gray-500 uppercase tracking-wider">
              Rubro
            </th>
            <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm leading-4 font-medium text-gray-500 uppercase tracking-wider">
              Proveedor
            </th>
            <th class="px-6 py-3 border-b-2 border-gray-300 text-left text-sm leading-4 font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {#each articulos as articulo (articulo.Codigo)}
            <tr>
              <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                {articulo.Codigo}
              </td>
              <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                {articulo.Descripcion}
              </td>
              <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                {rubros.find(r => r.Codigo === articulo.RubroCodigo)?.Descripcion || '-'}
              </td>
              <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                {proveedores.find(p => p.Codigo === articulo.ProveedorCodigo)?.Descripcion || '-'}
              </td>
              <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                <button
                  class="text-blue-600 hover:text-blue-800"
                  on:click={() => {/* Implementar edición */}}
                >
                  Editar
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    <div class="mt-6 flex justify-center">
      <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
        <button
          class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
          disabled={currentPage === 1}
          on:click={() => handlePageChange(currentPage - 1)}
        >
          Anterior
        </button>
        <button
          class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
          on:click={() => handlePageChange(currentPage + 1)}
        >
          Siguiente
        </button>
      </nav>
    </div>
  {/if}
</div> 