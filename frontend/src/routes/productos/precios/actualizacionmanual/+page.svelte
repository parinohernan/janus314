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
  import { exportarCambiosPreciosManual } from '$lib/utils/exportarCambiosPrecios';

  const PAGE_PATH = '/productos/precios/actualizacionmanual';
  const informeCache = new InformeCacheService(idbCacheAdapter);

  type ModoEdicion = 'precioCosto' | 'precioCostoMasImp' | 'lista1' | 'lista2' | 'lista3' | 'lista4' | 'lista5';
  const MODOS: { value: ModoEdicion; label: string }[] = [
    { value: 'precioCosto', label: 'Precio costo' },
    { value: 'precioCostoMasImp', label: 'Costo + IVA' },
    { value: 'lista1', label: 'Lista 1' },
    { value: 'lista2', label: 'Lista 2' },
    { value: 'lista3', label: 'Lista 3' },
    { value: 'lista4', label: 'Lista 4' },
    { value: 'lista5', label: 'Lista 5' }
  ];

  beforeNavigate(({ from }) => {
    if (from?.url.pathname === PAGE_PATH && browser) {
      const currentState = navigationState.getState(PAGE_PATH) || {};
      navigationState.saveState(PAGE_PATH, {
        ...currentState,
        scroll: window.scrollY,
        filters: {
          proveedores: proveedoresSeleccionados.join(','),
          rubros: rubrosSeleccionados.join(','),
          modoEdicion
        }
      });
      if (articulos.length > 0) {
        const params = {
          proveedores: proveedoresSeleccionados.join(','),
          rubros: rubrosSeleccionados.join(',')
        };
        informeCache.set('actualizacion-manual-precios', params, {
          articulos,
          seleccionarTodos
        }).catch((err) => console.warn('Cache IndexedDB:', err));
      }
    }
  });

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
    PrecioCostoMasImp?: number;
    Lista1?: number;
    Lista2?: number;
    Lista3?: number;
    Lista4?: number;
    Lista5?: number;
    PorcentajeIVA1?: number;
    RubroCodigo: string;
    ProveedorCodigo: string;
    seleccionado?: boolean;
    Rubro?: { Descripcion: string };
    Proveedor?: { Descripcion: string };
  }

  let proveedores: Proveedor[] = [];
  let rubros: Rubro[] = [];
  let articulos: Articulo[] = [];
  let proveedoresSeleccionados: string[] = [];
  let rubrosSeleccionados: string[] = [];
  let modoEdicion: ModoEdicion = 'precioCosto';
  let loading = false;
  let error: string | null = null;
  let success: string | null = null;
  let seleccionarTodos = false;

  // Map<Codigo, { PrecioCosto?, Lista1?, ... }> - solo campos modificados
  let articulosModificados: Map<string, Partial<Articulo>> = new Map();

  $: articulosSeleccionados = articulos.filter(a => a.seleccionado).length;
  $: hayCambios = articulosModificados.size > 0;

  function getValorActual(articulo: Articulo): number {
    switch (modoEdicion) {
      case 'precioCosto': return articulo.PrecioCosto ?? 0;
      case 'precioCostoMasImp': return articulo.PrecioCostoMasImp ?? (articulo.PrecioCosto ?? 0) * (1 + (articulo.PorcentajeIVA1 ?? 21) / 100);
      case 'lista1': return articulo.Lista1 ?? 0;
      case 'lista2': return articulo.Lista2 ?? 0;
      case 'lista3': return articulo.Lista3 ?? 0;
      case 'lista4': return articulo.Lista4 ?? 0;
      case 'lista5': return articulo.Lista5 ?? 0;
      default: return 0;
    }
  }

  function getKeyModo(): keyof Articulo {
    if (modoEdicion === 'precioCosto') return 'PrecioCosto';
    if (modoEdicion === 'precioCostoMasImp') return 'PrecioCostoMasImp';
    return ('Lista' + modoEdicion.slice(-1)) as keyof Articulo;
  }

  function getValorParaMostrar(articulo: Articulo): number {
    const mod = articulosModificados.get(articulo.Codigo);
    if (mod) {
      const key = getKeyModo();
      const v = mod[key];
      if (v !== undefined && v !== null) return Number(v);
    }
    return getValorActual(articulo);
  }

  function setValorModificado(codigo: string, valor: number) {
    const articulo = articulos.find(a => a.Codigo === codigo);
    if (!articulo) return;
    const valorOriginal = getValorActual(articulo);
    articulosModificados = new Map(articulosModificados);
    const mod = { ...articulosModificados.get(codigo) };
    const key = getKeyModo();
    (mod as Record<string, number>)[key] = valor;
    if (valor === valorOriginal) {
      delete (mod as Record<string, unknown>)[key];
    }
    if (Object.keys(mod).length === 0) {
      articulosModificados.delete(codigo);
    } else {
      articulosModificados.set(codigo, mod);
    }
    articulosModificados = new Map(articulosModificados);
  }

  function calcularPrecioConIva(articulo: Articulo): number {
    const iva = articulo.PorcentajeIVA1 ?? 21;
    if (modoEdicion === 'precioCosto') {
      const costo = getValorParaMostrar(articulo);
      return costo * (1 + iva / 100);
    }
    if (modoEdicion === 'precioCostoMasImp') {
      return getValorParaMostrar(articulo);
    }
    const mod = articulosModificados.get(articulo.Codigo);
    const precioCosto = (mod?.PrecioCosto ?? articulo.PrecioCosto) ?? 0;
    const pctLista = getValorParaMostrar(articulo);
    const precioSinIva = precioCosto * (1 + pctLista / 100);
    return precioSinIva * (1 + iva / 100);
  }

  function tieneCambio(codigo: string): boolean {
    return articulosModificados.has(codigo);
  }

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

      proveedores = (await proveedoresRes.json()).items;
      rubros = (await rubrosRes.json()).items;

      if (browser) {
        const savedState = navigationState.getState(PAGE_PATH);
        const filters = savedState?.filters as { proveedores?: string; rubros?: string; modoEdicion?: ModoEdicion } | undefined;
        if (filters?.proveedores) proveedoresSeleccionados = filters.proveedores.split(',').filter(Boolean);
        if (filters?.rubros) rubrosSeleccionados = filters.rubros.split(',').filter(Boolean);
        if (filters?.modoEdicion && MODOS.some(m => m.value === filters.modoEdicion)) modoEdicion = filters.modoEdicion;

        if (proveedoresSeleccionados.length > 0 || rubrosSeleccionados.length > 0) {
          const params = {
            proveedores: proveedoresSeleccionados.join(','),
            rubros: rubrosSeleccionados.join(',')
          };
          const cached = await informeCache.get<{ articulos: Articulo[]; seleccionarTodos: boolean }>('actualizacion-manual-precios', params);
          if (cached?.data) {
            articulos = cached.data.articulos ?? [];
            seleccionarTodos = cached.data.seleccionarTodos ?? false;
          }
        }

        if (typeof savedState?.scroll === 'number') {
          requestAnimationFrame(() => window.scrollTo(0, savedState!.scroll));
        }
      }
    } catch (err) {
      console.error('Error:', err);
      error = 'Error al cargar los datos iniciales';
    } finally {
      loading = false;
    }
  });

  async function buscarArticulos() {
    if (proveedoresSeleccionados.length === 0 && rubrosSeleccionados.length === 0) {
      error = 'Debe seleccionar al menos un proveedor o rubro';
      return;
    }

    try {
      loading = true;
      error = null;
      success = null;
      articulosModificados = new Map();

      const params = new URLSearchParams();
      if (proveedoresSeleccionados.length > 0) params.append('proveedores', proveedoresSeleccionados.join(','));
      if (rubrosSeleccionados.length > 0) params.append('rubros', rubrosSeleccionados.join(','));

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

  function toggleSeleccionarTodos() {
    articulos = articulos.map(a => ({ ...a, seleccionado: seleccionarTodos }));
  }

  async function actualizarPrecios() {
    const seleccionados = articulos.filter(a => a.seleccionado);
    const conCambios = seleccionados.filter(a => articulosModificados.has(a.Codigo));

    if (conCambios.length === 0) {
      error = 'Debe modificar al menos un artículo seleccionado';
      return;
    }

    try {
      loading = true;
      error = null;

      const payload = conCambios.map(a => {
        const mod = articulosModificados.get(a.Codigo)!;
        return {
          Codigo: a.Codigo,
          ...(mod.PrecioCosto !== undefined && { PrecioCosto: mod.PrecioCosto }),
          ...(mod.PrecioCostoMasImp !== undefined && { PrecioCostoMasImp: mod.PrecioCostoMasImp }),
          ...(mod.Lista1 !== undefined && { Lista1: mod.Lista1 }),
          ...(mod.Lista2 !== undefined && { Lista2: mod.Lista2 }),
          ...(mod.Lista3 !== undefined && { Lista3: mod.Lista3 }),
          ...(mod.Lista4 !== undefined && { Lista4: mod.Lista4 }),
          ...(mod.Lista5 !== undefined && { Lista5: mod.Lista5 })
        };
      });

      const response = await fetchWithAuth(`${PUBLIC_API_URL}/articulos/actualizar-precios-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articulos: payload })
      });

      if (!response.ok) throw new Error('Error al actualizar precios');

      success = `Precios actualizados correctamente para ${conCambios.length} artículo(s)`;
      exportarCambiosPreciosManual(articulos, articulosModificados);

      // Actualizar estado local con los nuevos valores
      for (const a of articulos) {
        const mod = articulosModificados.get(a.Codigo);
        if (mod) {
          const iva = a.PorcentajeIVA1 ?? 21;
          if (mod.PrecioCosto !== undefined) a.PrecioCosto = mod.PrecioCosto;
          if (mod.PrecioCostoMasImp !== undefined) {
            a.PrecioCostoMasImp = mod.PrecioCostoMasImp;
            a.PrecioCosto = mod.PrecioCostoMasImp / (1 + iva / 100);
          }
          if (mod.Lista1 !== undefined) a.Lista1 = mod.Lista1;
          if (mod.Lista2 !== undefined) a.Lista2 = mod.Lista2;
          if (mod.Lista3 !== undefined) a.Lista3 = mod.Lista3;
          if (mod.Lista4 !== undefined) a.Lista4 = mod.Lista4;
          if (mod.Lista5 !== undefined) a.Lista5 = mod.Lista5;
        }
      }
      articulosModificados = new Map();
      articulos = articulos;
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
  <title>Actualización Manual de Precios</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="bg-white rounded-lg shadow-md p-6">
    <h1 class="text-2xl font-bold mb-6">Actualización Manual de Precios</h1>

    <!-- Filtros -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div role="group" aria-labelledby="proveedores-label">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label id="proveedores-label" class="block text-sm font-medium text-gray-700 mb-2">Proveedores</label>
        <MultiSelect
          items={proveedores}
          bind:selectedValues={proveedoresSeleccionados}
          labelField="Descripcion"
          valueField="Codigo"
          placeholder="Seleccione proveedores..."
        />
      </div>
      <div role="group" aria-labelledby="rubros-label">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label id="rubros-label" class="block text-sm font-medium text-gray-700 mb-2">Rubros</label>
        <MultiSelect
          items={rubros}
          bind:selectedValues={rubrosSeleccionados}
          labelField="Descripcion"
          valueField="Codigo"
          placeholder="Seleccione rubros..."
        />
      </div>
    </div>

    <!-- Botones -->
    <div class="flex gap-4 mb-6">
      <Button on:click={buscarArticulos} disabled={loading}>
        {loading ? 'Buscando...' : 'Buscar'}
      </Button>
      <Button
        variant="success"
        on:click={actualizarPrecios}
        disabled={loading || !hayCambios}
      >
        {loading ? 'Actualizando...' : `Actualizar (${articulosModificados.size} cambios)`}
      </Button>
      <Button variant="secondary" on:click={salir}>Salir</Button>
    </div>

    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
    {/if}
    {#if success}
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>
    {/if}

    {#if articulos.length > 0}
      <!-- Selector de modo -->
      <div class="mb-4">
        <span class="text-sm font-medium text-gray-700 mr-2">Editar:</span>
        <div class="inline-flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg">
          {#each MODOS as m}
            <button
              type="button"
              class="px-3 py-1.5 text-sm rounded {modoEdicion === m.value ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}"
              on:click={() => modoEdicion = m.value}
            >
              {m.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" bind:checked={seleccionarTodos} on:change={toggleSeleccionarTodos}
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <span class="text-sm font-medium text-gray-700">Seleccionar todos</span>
          </label>
          <span class="text-sm text-gray-600">{articulosSeleccionados} de {articulos.length} artículo(s)</span>
          {#if hayCambios}
            <span class="text-sm text-amber-600 font-medium">{articulosModificados.size} con cambios</span>
          {/if}
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10">
                <input type="checkbox" bind:checked={seleccionarTodos} on:change={toggleSeleccionarTodos}
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rubro</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio costo</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {modoEdicion === 'precioCosto' ? 'Nuevo costo' : modoEdicion === 'precioCostoMasImp' ? 'Costo + IVA' : `% ${MODOS.find(m => m.value === modoEdicion)?.label}`}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio con IVA</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each articulos as articulo (articulo.Codigo)}
              {@const modificado = tieneCambio(articulo.Codigo)}
              <tr class="{articulo.seleccionado ? 'hover:bg-gray-50' : 'opacity-30 bg-gray-50'} {modificado ? 'ring-1 ring-amber-400' : ''}">
                <td class="px-4 py-3 whitespace-nowrap">
                  <input
                    type="checkbox"
                    bind:checked={articulo.seleccionado}
                    on:change={() => {
                      articulos = articulos;
                      seleccionarTodos = articulos.every(a => a.seleccionado);
                    }}
                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{articulo.Codigo}</td>
                <td class="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{articulo.Descripcion}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{articulo.Rubro?.Descripcion || '-'}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{articulo.Proveedor?.Descripcion || '-'}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  ${(articulo.PrecioCosto ?? 0).toFixed(2)}
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <input
                    type="number"
                    value={getValorParaMostrar(articulo)}
                    on:input={(e) => {
                      const v = parseFloat((e.target as HTMLInputElement).value);
                      setValorModificado(articulo.Codigo, isNaN(v) ? 0 : v);
                    }}
                    step={modoEdicion === 'precioCosto' ? '0.01' : '0.1'}
                    class="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${calcularPrecioConIva(articulo).toFixed(2)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
