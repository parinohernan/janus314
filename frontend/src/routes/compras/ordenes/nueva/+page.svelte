<script lang="ts">
  import { onMount } from 'svelte';
  import { goto, beforeNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import Button from '$lib/components/ui/Button.svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { confirm } from '$lib/utils/toast';
  import { navigationState } from '$lib/stores/navigationState';

  const STORAGE_KEY_ORDEN_INFORME = 'janus314_orden_desde_informe';
  const ORDEN_NUEVA_PATH = '/compras/ordenes/nueva';

  interface ItemOrden {
    CodigoArticulo: string;
    Descripcion: string;
    Cantidad: number;
    PrecioCostoUnitario: number;
  }

  const hoy = new Date().toISOString().slice(0, 10);

  let loading = false;
  let error: string | null = null;
  let guardadoExitoso = false;

  let proveedoresOptions: { Codigo: string; Descripcion: string }[] = [];
  let proveedoresLoading = false;
  let proveedoresBusqueda = '';
  let mostrarSelectorProveedores = false;
  let timeoutProveedores: ReturnType<typeof setTimeout> | null = null;

  let articuloBusqueda = '';
  let articuloOptions: { Codigo: string; Descripcion: string; PrecioCosto?: number }[] = [];
  let articuloLoading = false;
  let articuloSeleccionado: { Codigo: string; Descripcion: string; PrecioCosto?: number } | null = null;
  let cantidadArticulo = 1;
  let timeoutArticulo: ReturnType<typeof setTimeout> | null = null;

  let formasPago: { value: string; label: string }[] = [];

  let orden = {
    Fecha: hoy,
    FechaDeEntrega: '' as string,
    ProveedorCodigo: '',
    ProveedorDescripcion: '',
    TipoPago: '',
    Observacion: '',
    RemitoNro: ''
  };

  let items: ItemOrden[] = [];

  const buscarProveedores = async (busqueda = '') => {
    if (timeoutProveedores) clearTimeout(timeoutProveedores);
    if (!busqueda || busqueda.length < 2) {
      proveedoresOptions = [];
      return;
    }
    proveedoresLoading = true;
    timeoutProveedores = setTimeout(async () => {
      try {
        const res = await fetchWithAuth('/proveedores', { params: { search: busqueda, limit: 15 } });
        if (!res.ok) return;
        const data = await res.json();
        proveedoresOptions = data.items || [];
      } catch (_) {
        proveedoresOptions = [];
      } finally {
        proveedoresLoading = false;
      }
    }, 300);
  };

  const seleccionarProveedor = (p: { Codigo: string; Descripcion: string }) => {
    orden.ProveedorCodigo = p.Codigo;
    orden.ProveedorDescripcion = p.Descripcion;
    proveedoresBusqueda = `${p.Codigo} - ${p.Descripcion}`;
    mostrarSelectorProveedores = false;
    proveedoresOptions = [];
  };

  const buscarArticulos = async (busqueda = '') => {
    if (timeoutArticulo) clearTimeout(timeoutArticulo);
    if (!busqueda || busqueda.length < 2) {
      articuloOptions = [];
      return;
    }
    articuloLoading = true;
    timeoutArticulo = setTimeout(async () => {
      try {
        const params: Record<string, string | number> = { search: busqueda.trim(), limit: 15 };
        if (orden.ProveedorCodigo) params.proveedor = orden.ProveedorCodigo;
        const res = await fetchWithAuth('/articulos', { params });
        if (!res.ok) return;
        const data = await res.json();
        articuloOptions = (data.items || []).map((a: { Codigo: string; Descripcion: string; PrecioCosto?: number }) => ({
          Codigo: a.Codigo,
          Descripcion: a.Descripcion,
          PrecioCosto: a.PrecioCosto
        }));
      } catch (_) {
        articuloOptions = [];
      } finally {
        articuloLoading = false;
      }
    }, 300);
  };

  const seleccionarArticulo = (art: { Codigo: string; Descripcion: string; PrecioCosto?: number }) => {
    articuloSeleccionado = art;
    articuloBusqueda = `${art.Codigo} - ${art.Descripcion}`;
    articuloOptions = [];
  };

  const agregarArticulo = () => {
    if (!articuloSeleccionado) return;
    if (!articuloSeleccionado.Codigo || cantidadArticulo <= 0) {
      error = 'Seleccione un artículo y una cantidad mayor a 0';
      return;
    }
    items = [
      ...items,
      {
        CodigoArticulo: articuloSeleccionado.Codigo,
        Descripcion: articuloSeleccionado.Descripcion,
        Cantidad: cantidadArticulo,
        PrecioCostoUnitario: Number(articuloSeleccionado.PrecioCosto) || 0
      }
    ];
    articuloSeleccionado = null;
    articuloBusqueda = '';
    cantidadArticulo = 1;
    error = null;
  };

  const quitarFila = (index: number) => {
    items = items.filter((_, i) => i !== index);
  };

  const cancelar = async () => {
    const ok = await confirm('¿Cancelar? Se perderán los datos ingresados.');
    if (ok) {
      if (browser) navigationState.clearState(ORDEN_NUEVA_PATH);
      goto('/compras/ordenes');
    }
  };

  // Guardar estado al salir (persistencia como en informes/proveedores)
  beforeNavigate(({ from }) => {
    if (from?.url.pathname === ORDEN_NUEVA_PATH && browser) {
      const currentState = navigationState.getState(ORDEN_NUEVA_PATH) || {};
      navigationState.saveState(ORDEN_NUEVA_PATH, {
        ...currentState,
        scroll: window.scrollY,
        filters: {
          orden: { ...orden },
          items: [...items],
          proveedoresBusqueda
        }
      });
    }
  });

  const guardar = async () => {
    if (!orden.ProveedorCodigo) {
      error = 'Debe seleccionar un proveedor';
      return;
    }
    if (!orden.Fecha) {
      error = 'La fecha es obligatoria';
      return;
    }
    const itemsValidos = items.filter(
      (it) => it.CodigoArticulo?.trim() && (Number(it.Cantidad) || 0) > 0
    );
    if (itemsValidos.length === 0) {
      error = 'Debe incluir al menos un ítem con artículo y cantidad mayor a cero';
      return;
    }

    loading = true;
    error = null;
    guardadoExitoso = false;
    try {
      const body = {
        Fecha: orden.Fecha,
        FechaDeEntrega: orden.FechaDeEntrega || undefined,
        ProveedorCodigo: orden.ProveedorCodigo,
        TipoPago: orden.TipoPago || undefined,
        Observacion: orden.Observacion || undefined,
        RemitoNro: orden.RemitoNro || undefined,
        Items: itemsValidos.map((it) => ({
          CodigoArticulo: it.CodigoArticulo.trim(),
          Cantidad: Number(it.Cantidad) || 0,
          PrecioCostoUnitario: Number(it.PrecioCostoUnitario) || 0
        }))
      };
      const res = await fetchWithAuth('/ordenes-compra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Error al crear orden');
      guardadoExitoso = true;
      if (browser) navigationState.clearState(ORDEN_NUEVA_PATH);
      const d = data.data || {};
      const num = String(d.DocumentoNumero ?? '').padStart(8, '0');
      setTimeout(
        () =>
          goto(
            `/compras/ordenes/${d.DocumentoTipo || 'OC'}/${d.DocumentoSucursal || '01'}/${num}`
          ),
        800
      );
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };

  onMount(() => {
    fetchWithAuth('/tipos-pago')
      .then((r) => r.json())
      .then((result) => {
        formasPago = (result.items || []).map((item: { Codigo: string; Descripcion: string }) => ({
          value: item.Codigo,
          label: item.Descripcion
        }));
      })
      .catch(() => {});

    if (browser && $page.url.searchParams.get('from') === 'informe') {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY_ORDEN_INFORME);
        if (stored) {
          const payload = JSON.parse(stored);
          orden.ProveedorCodigo = payload.proveedorCodigo || '';
          orden.ProveedorDescripcion = payload.proveedorDescripcion || '';
          proveedoresBusqueda = orden.ProveedorDescripcion ? `${orden.ProveedorCodigo} - ${orden.ProveedorDescripcion}` : '';
          if (payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
            items = payload.items.map((it: { CodigoArticulo: string; Descripcion: string; Cantidad: number; PrecioCostoUnitario?: number }) => ({
              CodigoArticulo: it.CodigoArticulo || '',
              Descripcion: it.Descripcion || '',
              Cantidad: Number(it.Cantidad) || 0,
              PrecioCostoUnitario: Number(it.PrecioCostoUnitario) || 0
            }));
          }
          sessionStorage.removeItem(STORAGE_KEY_ORDEN_INFORME);
        }
      } catch (_) {}
    } else if (browser) {
      // Restaurar estado persistido (misma técnica que informes/proveedores)
      const savedState = navigationState.getState(ORDEN_NUEVA_PATH);
      const filters = savedState?.filters as { orden?: typeof orden; items?: ItemOrden[]; proveedoresBusqueda?: string } | undefined;
      if (filters?.orden) {
        orden = { ...orden, ...filters.orden };
      }
      if (filters?.items && Array.isArray(filters.items) && filters.items.length > 0) {
        items = filters.items.map((it) => ({
          CodigoArticulo: it.CodigoArticulo || '',
          Descripcion: it.Descripcion || '',
          Cantidad: Number(it.Cantidad) || 0,
          PrecioCostoUnitario: Number(it.PrecioCostoUnitario) || 0
        }));
      }
      if (filters?.proveedoresBusqueda) {
        proveedoresBusqueda = filters.proveedoresBusqueda;
      }
      if (savedState?.scroll && typeof window !== 'undefined') {
        requestAnimationFrame(() => window.scrollTo(0, savedState.scroll));
      }
    }
  });
</script>

<svelte:head>
  <title>Nueva orden de compra</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <h1 class="text-2xl font-semibold text-gray-900">Nueva orden de compra</h1>
    <div class="flex gap-2">
      <Button variant="secondary" on:click={cancelar}>Cancelar</Button>
      <Button variant="primary" on:click={guardar} disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar orden'}
      </Button>
    </div>
  </div>

  {#if error}
    <div class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
      {error}
    </div>
  {/if}

  {#if guardadoExitoso}
    <div class="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
      Orden creada. Redirigiendo al detalle...
    </div>
  {/if}

  <!-- Cabecera -->
  <div class="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <h2 class="mb-4 text-lg font-semibold text-gray-900">Datos de la orden</h2>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
      <div class="relative lg:col-span-4">
        <label for="proveedor" class="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
        <input
          type="text"
          id="proveedor"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          placeholder="Buscar proveedor..."
          bind:value={proveedoresBusqueda}
          on:input={() => {
            buscarProveedores(proveedoresBusqueda);
            mostrarSelectorProveedores = proveedoresBusqueda.length >= 2;
          }}
          on:focus={() => {
            if (proveedoresBusqueda.length >= 2) mostrarSelectorProveedores = true;
          }}
          on:blur={() => setTimeout(() => (mostrarSelectorProveedores = false), 200)}
          autocomplete="off"
        />
        {#if proveedoresLoading}
          <div class="absolute right-3 top-9">
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
          </div>
        {/if}
        {#if mostrarSelectorProveedores && proveedoresOptions.length > 0}
          <div
            class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white py-1 shadow-lg"
          >
            {#each proveedoresOptions as p}
              <button
                type="button"
                class="w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-gray-100"
                on:click={() => seleccionarProveedor(p)}
                on:mousedown|preventDefault
              >
                {p.Codigo} - {p.Descripcion}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="lg:col-span-2">
        <label for="fecha" class="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
        <input
          id="fecha"
          type="date"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          bind:value={orden.Fecha}
        />
      </div>
      <div class="lg:col-span-2">
        <label for="fechaEntrega" class="block text-sm font-medium text-gray-700 mb-1">Fecha de entrega</label>
        <input
          id="fechaEntrega"
          type="date"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          bind:value={orden.FechaDeEntrega}
        />
      </div>
      <div class="lg:col-span-2">
        <label for="tipoPago" class="block text-sm font-medium text-gray-700 mb-1">Forma de pago</label>
        <select
          id="tipoPago"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          bind:value={orden.TipoPago}
        >
          <option value="">Seleccionar</option>
          {#each formasPago as fp}
            <option value={fp.value}>{fp.label}</option>
          {/each}
        </select>
      </div>
      <div class="lg:col-span-12">
        <label for="observacion" class="block text-sm font-medium text-gray-700 mb-1">Observación</label>
        <input
          id="observacion"
          type="text"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          placeholder="Opcional"
          bind:value={orden.Observacion}
        />
      </div>
    </div>
  </div>

  <!-- Items -->
  <div class="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <h2 class="mb-4 text-lg font-semibold text-gray-900">Ítems</h2>

    <!-- Agregar artículo (estilo notascredito) -->
    <div class="mb-6 rounded-lg bg-gray-50 p-4">
      <h3 class="mb-3 text-sm font-semibold text-gray-700">Agregar artículo</h3>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div class="relative md:col-span-2">
          <label for="articulo" class="mb-1 block text-sm font-medium text-gray-700">Artículo</label>
          <input
            id="articulo"
            type="text"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            placeholder="Buscar artículo por código o descripción..."
            bind:value={articuloBusqueda}
            on:input={() => buscarArticulos(articuloBusqueda)}
          />
          {#if articuloLoading}
            <div class="absolute right-3 top-9">
              <div class="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
            </div>
          {/if}
          {#if articuloOptions.length > 0}
            <div
              class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white py-1 shadow-lg"
            >
              {#each articuloOptions as art}
                <button
                  type="button"
                  class="w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-gray-100"
                  on:click={() => seleccionarArticulo(art)}
                  on:mousedown|preventDefault
                >
                  {art.Codigo} - {art.Descripcion}
                </button>
              {/each}
            </div>
          {/if}
        </div>
        <div>
          <label for="cantidad" class="mb-1 block text-sm font-medium text-gray-700">Cantidad</label>
          <input
            id="cantidad"
            type="number"
            min="1"
            step="0.01"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            bind:value={cantidadArticulo}
          />
        </div>
        <div class="flex items-end">
          <Button
            variant="primary"
            on:click={agregarArticulo}
            disabled={!articuloSeleccionado}
            class="w-full"
          >
            + Agregar
          </Button>
        </div>
      </div>
      {#if articuloSeleccionado}
        <div class="mt-3 rounded border border-blue-200 bg-blue-50 p-3">
          <p class="text-sm text-gray-700">
            <span class="font-semibold">Artículo seleccionado:</span>
            {articuloSeleccionado.Codigo} - {articuloSeleccionado.Descripcion}
          </p>
        </div>
      {/if}
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Artículo</th>
            <th class="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Cantidad</th>
            <th class="px-4 py-2 w-12"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          {#each items as item, i}
            <tr>
              <td class="px-4 py-2 text-sm text-gray-900">
                {item.CodigoArticulo} - {item.Descripcion}
              </td>
              <td class="px-4 py-2 text-right text-sm text-gray-900">{item.Cantidad}</td>
              <td class="px-4 py-2">
                <button
                  type="button"
                  class="text-red-600 hover:text-red-800"
                  on:click={() => quitarFila(i)}
                >
                  Quitar
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#if items.length === 0}
      <p class="mt-4 text-center text-sm text-gray-500">No hay ítems. Busque y agregue artículos arriba.</p>
    {/if}
  </div>
</div>
