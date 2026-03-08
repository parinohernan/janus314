<script lang="ts">
  import { onMount } from 'svelte';
  import { beforeNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import { PUBLIC_API_URL } from '$env/static/public';
  import Button from '$lib/components/ui/Button.svelte';
  import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { InformeCacheService, idbCacheAdapter } from '$lib/cache';
  import { navigationState } from '$lib/stores/navigationState';
  import { exportarCambiosPreciosPorcentaje } from '$lib/utils/exportarCambiosPrecios';

  const PAGE_PATH = '/productos/precios/actualizacion';
  const informeCache = new InformeCacheService(idbCacheAdapter);

  // Guardar filtros, scroll y artículos al salir
  beforeNavigate(({ from }) => {
    if (from?.url.pathname === PAGE_PATH && browser) {
      const currentState = navigationState.getState(PAGE_PATH) || {};
      navigationState.saveState(PAGE_PATH, {
        ...currentState,
        scroll: window.scrollY,
        filters: {
          proveedores: proveedoresSeleccionados.join(','),
          rubros: rubrosSeleccionados.join(','),
          porcentajeIncremento
        }
      });
      // Persistir artículos en IndexedDB (más escalable que localStorage)
      if (articulos.length > 0) {
        const params = {
          proveedores: proveedoresSeleccionados.join(','),
          rubros: rubrosSeleccionados.join(',')
        };
        informeCache.set('actualizacion-precios', params, {
          articulos,
          seleccionarTodos
        }).catch((err) => console.warn('Cache IndexedDB:', err));
      }
    }
  });

  // Interfaces
  interface Proveedor {
    Codigo: string;
    Descripcion: string;
  }

  interface Rubro {
    Codigo: string;
    Descripcion: string;
  }

  interface Articulo {
    Codigo: string;
    Descripcion: string;
    PrecioCosto: number;
    RubroCodigo: string;
    ProveedorCodigo: string;
    seleccionado?: boolean;
    Rubro?: {
      Descripcion: string;
    };
    Proveedor?: {
      Descripcion: string;
    };
  }

  // Estado
  let proveedores: Proveedor[] = [];
  let rubros: Rubro[] = [];
  let articulos: Articulo[] = [];
  let proveedoresSeleccionados: string[] = [];
  let rubrosSeleccionados: string[] = [];
  let porcentajeIncremento: number = 0;
  let loading = false;
  let error: string | null = null;
  let success: string | null = null;
  let seleccionarTodos = false;

  // Contador de artículos seleccionados
  $: articulosSeleccionados = articulos.filter(a => a.seleccionado).length;

  // Cargar datos iniciales y restaurar estado persistido
  onMount(async () => {
    try {
      loading = true;
      const [proveedoresRes, rubrosRes] = await Promise.all([
        fetchWithAuth(`${PUBLIC_API_URL}/proveedores?limit=500`),
        fetchWithAuth(`${PUBLIC_API_URL}/rubros?limit=500`)
      ]);

      if (!proveedoresRes.ok || !rubrosRes.ok) {
        throw new Error('Error al cargar datos iniciales');
      }

      const proveedoresData = await proveedoresRes.json();
      const rubrosData = await rubrosRes.json();

      proveedores = proveedoresData.items;
      rubros = rubrosData.items;

      // Restaurar filtros y scroll desde navigationState (localStorage)
      if (browser) {
        const savedState = navigationState.getState(PAGE_PATH);
        const filters = savedState?.filters as { proveedores?: string; rubros?: string; porcentajeIncremento?: number } | undefined;
        if (filters?.proveedores) proveedoresSeleccionados = filters.proveedores.split(',').filter(Boolean);
        if (filters?.rubros) rubrosSeleccionados = filters.rubros.split(',').filter(Boolean);
        if (filters?.porcentajeIncremento != null) porcentajeIncremento = filters.porcentajeIncremento;

        // Restaurar artículos desde IndexedDB si hay filtros guardados
        if ((proveedoresSeleccionados.length > 0 || rubrosSeleccionados.length > 0)) {
          const params = {
            proveedores: proveedoresSeleccionados.join(','),
            rubros: rubrosSeleccionados.join(',')
          };
          const cached = await informeCache.get<{ articulos: Articulo[]; seleccionarTodos: boolean }>('actualizacion-precios', params);
          if (cached?.data) {
            articulos = cached.data.articulos ?? [];
            seleccionarTodos = cached.data.seleccionarTodos ?? false;
          }
        }

        // Restaurar scroll
        if (typeof savedState?.scroll === 'number') {
          requestAnimationFrame(() => {
            window.scrollTo(0, savedState!.scroll);
          });
        }
      }
    } catch (err) {
      console.error('Error:', err);
      error = 'Error al cargar los datos iniciales';
    } finally {
      loading = false;
    }
  });

  // Buscar artículos afectados
  async function buscarArticulos() {
    if (proveedoresSeleccionados.length === 0 && rubrosSeleccionados.length === 0) {
      error = 'Debe seleccionar al menos un proveedor o rubro';
      return;
    }

    try {
      loading = true;
      error = null;
      success = null;

      // Construir parámetros de búsqueda
      const params = new URLSearchParams();
      if (proveedoresSeleccionados.length > 0) {
        params.append('proveedores', proveedoresSeleccionados.join(','));
      }
      if (rubrosSeleccionados.length > 0) {
        params.append('rubros', rubrosSeleccionados.join(','));
      }

      const response = await fetchWithAuth(`${PUBLIC_API_URL}/articulos?${params}&limit=1000`);
      if (!response.ok) throw new Error('Error al buscar artículos');

      const data = await response.json();
      articulos = data.items.map((a: Articulo) => ({ ...a, seleccionado: true }));
      seleccionarTodos = true;
    } catch (err) {
      console.error('Error:', err);
      error = 'Error al buscar artículos';
    } finally {
      loading = false;
    }
  }

  // Toggle seleccionar todos
  function toggleSeleccionarTodos() {
    // seleccionarTodos ya cambió por bind:checked, solo actualizar los artículos
    articulos = articulos.map(a => ({ ...a, seleccionado: seleccionarTodos }));
  }

  // Actualizar precios
  async function actualizarPrecios() {
    const articulosSeleccionados = articulos.filter(a => a.seleccionado);
    
    if (!porcentajeIncremento || articulosSeleccionados.length === 0) {
      error = 'Debe especificar un porcentaje y tener artículos seleccionados';
      return;
    }

    try {
      loading = true;
      error = null;

      const response = await fetchWithAuth(`${PUBLIC_API_URL}/articulos/actualizar-precios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articulos: articulosSeleccionados.map(a => a.Codigo),
          porcentaje: porcentajeIncremento
        })
      });

      if (!response.ok) throw new Error('Error al actualizar precios');

      success = `Precios actualizados correctamente para ${articulosSeleccionados.length} artículo(s)`;
      exportarCambiosPreciosPorcentaje(articulosSeleccionados, porcentajeIncremento);
      articulos = [];
      seleccionarTodos = false;
      porcentajeIncremento = 0;
      const params = {
        proveedores: proveedoresSeleccionados.join(','),
        rubros: rubrosSeleccionados.join(',')
      };
      informeCache.set('actualizacion-precios', params, { articulos: [], seleccionarTodos: false }).catch(() => {});
    } catch (err) {
      console.error('Error:', err);
      error = 'Error al actualizar los precios';
    } finally {
      loading = false;
    }
  }

  function salir() {
    window.history.back();
  }
</script>

<svelte:head>
  <title>Actualización de Precios</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="bg-white rounded-lg shadow-md p-6">
    <h1 class="text-2xl font-bold mb-6">Actualización de Precios</h1>

    <!-- Formulario de filtros -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div>
        <label id="proveedores-label" for="proveedores-select" class="block text-sm font-medium text-gray-700 mb-2">
          Proveedores
        </label>
        <div 
          id="proveedores-select"
          role="group"
          aria-labelledby="proveedores-label"
        >
          <MultiSelect
            items={proveedores}
            bind:selectedValues={proveedoresSeleccionados}
            labelField="Descripcion"
            valueField="Codigo"
            placeholder="Seleccione proveedores..."
          />
        </div>
      </div>

      <div>
        <label id="rubros-label" for="rubros-select" class="block text-sm font-medium text-gray-700 mb-2">
          Rubros
        </label>
        <div 
          id="rubros-select"
          role="group"
          aria-labelledby="rubros-label"
        >
          <MultiSelect
            items={rubros}
            bind:selectedValues={rubrosSeleccionados}
            labelField="Descripcion"
            valueField="Codigo"
            placeholder="Seleccione rubros..."
          />
        </div>
      </div>

      <div>
        <label for="porcentaje-input" class="block text-sm font-medium text-gray-700 mb-2">
          Porcentaje de Incremento
        </label>
        <input
          id="porcentaje-input"
          type="number"
          bind:value={porcentajeIncremento}
          on:input={() => {
            // Forzar actualización de la lista cuando cambia el porcentaje
            articulos = articulos;
          }}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ingrese porcentaje..."
          step="0.01"
        />
      </div>
    </div>

    <!-- Botones de acción -->
    <div class="flex gap-4 mb-6">
      <Button on:click={buscarArticulos} disabled={loading}>
        {loading ? 'Buscando...' : 'Buscar'}
      </Button>
      <Button 
        variant="success" 
        on:click={actualizarPrecios} 
        disabled={loading || articulosSeleccionados === 0}
      >
        {loading ? 'Actualizando...' : `Actualizar Precios (${articulosSeleccionados})`}
      </Button>
      <Button variant="secondary" on:click={salir}>
        Salir
      </Button>
    </div>

    <!-- Mensajes de error/éxito -->
    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    {/if}

    {#if success}
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        {success}
      </div>
    {/if}

    <!-- Tabla de artículos -->
    {#if articulos.length > 0}
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={seleccionarTodos}
              on:change={toggleSeleccionarTodos}
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span class="text-sm font-medium text-gray-700">Seleccionar todos</span>
          </label>
          <span class="text-sm text-gray-600">
            {articulosSeleccionados} de {articulos.length} artículo(s) seleccionado(s)
          </span>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  bind:checked={seleccionarTodos}
                  on:change={toggleSeleccionarTodos}
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rubro
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proveedor
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio Actual
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nuevo Precio
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each articulos as articulo, index (articulo.Codigo)}
              <tr class="{articulo.seleccionado ? 'hover:bg-gray-50' : 'opacity-30 bg-gray-50'}">
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    bind:checked={articulo.seleccionado}
                    on:change={() => {
                      // Forzar actualización del array para que Svelte detecte el cambio
                      articulos = articulos;
                      // Actualizar seleccionarTodos basado en el estado actual
                      seleccionarTodos = articulos.every(a => a.seleccionado);
                    }}
                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm {articulo.seleccionado ? 'text-gray-900' : 'text-gray-400'}">
                  {articulo.Codigo}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm {articulo.seleccionado ? 'text-gray-900' : 'text-gray-400'}">
                  {articulo.Descripcion}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm {articulo.seleccionado ? 'text-gray-500' : 'text-gray-400'}">
                  {articulo.Rubro?.Descripcion || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm {articulo.seleccionado ? 'text-gray-500' : 'text-gray-400'}">
                  {articulo.Proveedor?.Descripcion || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm {articulo.seleccionado ? 'text-gray-900' : 'text-gray-400'}">
                  ${articulo.PrecioCosto.toFixed(2)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium {articulo.seleccionado ? 'text-gray-900' : 'text-gray-400'}">
                  ${(articulo.PrecioCosto * (1 + porcentajeIncremento/100)).toFixed(2)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div> 