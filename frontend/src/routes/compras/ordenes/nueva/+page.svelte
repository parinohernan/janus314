<script lang="ts">
  import { onMount } from 'svelte';
  import { goto, beforeNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import Button from '$lib/components/ui/Button.svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { confirm } from '$lib/utils/toast';
  import { navigationState } from '$lib/stores/navigationState';
  import { Check, CheckCircle2, Pencil, X } from 'lucide-svelte';

  const STORAGE_KEY_ORDEN_INFORME = 'janus314_orden_desde_informe';
  const ORDEN_NUEVA_PATH = '/compras/ordenes/nueva';

  interface RelacionApi {
    ProveedorCodigo: string;
    CodigoArticuloProveedor: string;
    CodigoArticuloEmpresa: string;
    Relacion: number;
    DescripcionProveedor: string | null;
    ArticuloEmpresa: { Codigo: string; Descripcion: string } | null;
  }

  interface ItemOrden {
    CodigoArticulo: string;
    Descripcion: string;
    CantidadComprar: number;
    PrecioCostoUnitario: number;
    Existencia: number | null;
    CantidadVendidaPeriodo: number | null;
    CodigoArticuloProveedor: string;
    DescripcionProveedor: string;
    Relacion: number;
    CantidadBultos: number;
    RelacionGuardada: boolean;
  }

  const hoy = new Date().toISOString().slice(0, 10);

  let loading = false;
  let error: string | null = null;
  let guardadoExitoso = false;
  let relacionesCargando = false;
  let savingRelacionRow: number | null = null;
  let proveedorCodigoAnterior = '';

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

  function normalizeItemFromPayload(it: Record<string, unknown>): ItemOrden {
    const cant = Number(it.CantidadComprar ?? it.Cantidad) || 0;
    const rel = Number(it.Relacion) > 0 ? Number(it.Relacion) : 1;
    let bultos: number;
    if (it.CantidadBultos != null && it.CantidadBultos !== '') {
      bultos = Number(it.CantidadBultos) || 0;
    } else {
      bultos = rel > 0 ? cant / rel : cant;
    }
    const ex = it.Existencia;
    const vend = it.CantidadVendidaPeriodo;
    return {
      CodigoArticulo: String(it.CodigoArticulo ?? ''),
      Descripcion: String(it.Descripcion ?? ''),
      CantidadComprar: cant,
      PrecioCostoUnitario: Number(it.PrecioCostoUnitario) || 0,
      Existencia: ex != null && ex !== '' ? Number(ex) : null,
      CantidadVendidaPeriodo: vend != null && vend !== '' ? Number(vend) : null,
      CodigoArticuloProveedor: String(it.CodigoArticuloProveedor ?? ''),
      DescripcionProveedor: String(it.DescripcionProveedor ?? ''),
      Relacion: rel,
      CantidadBultos: Number.isFinite(bultos) ? bultos : cant,
      RelacionGuardada: !!it.RelacionGuardada
    };
  }

  function nuevaFilaVacia(
    codigo: string,
    descripcion: string,
    cantidadComprar: number,
    precio: number,
    existencia: number | null,
    vendidos: number | null
  ): ItemOrden {
    const rel = 1;
    return {
      CodigoArticulo: codigo,
      Descripcion: descripcion,
      CantidadComprar: cantidadComprar,
      PrecioCostoUnitario: precio,
      Existencia: existencia,
      CantidadVendidaPeriodo: vendidos,
      CodigoArticuloProveedor: '',
      DescripcionProveedor: '',
      Relacion: rel,
      CantidadBultos: cantidadComprar / rel,
      RelacionGuardada: false
    };
  }

  async function cargarRelacionesProveedor(): Promise<Map<string, RelacionApi>> {
    const cod = orden.ProveedorCodigo?.trim();
    if (!cod) return new Map();
    try {
      const res = await fetchWithAuth('/relaciones-articulo-proveedor', {
        params: { proveedorCodigo: cod }
      });
      if (!res.ok) return new Map();
      const data = await res.json();
      const list: RelacionApi[] = data.items || [];
      const map = new Map<string, RelacionApi>();
      for (const r of list) {
        const emp = String(r.CodigoArticuloEmpresa ?? '').trim();
        if (emp) map.set(emp, r);
      }
      return map;
    } catch {
      return new Map();
    }
  }

  function aplicarMapaRelaciones(map: Map<string, RelacionApi>, limpiarSiSinRelacion: boolean) {
    items = items.map((item) => {
      const key = item.CodigoArticulo.trim();
      const rel = map.get(key);
      if (rel) {
        const r = rel.Relacion > 0 ? rel.Relacion : 1;
        return {
          ...item,
          CodigoArticuloProveedor: rel.CodigoArticuloProveedor || '',
          DescripcionProveedor: rel.DescripcionProveedor || '',
          Relacion: r,
          CantidadBultos: item.CantidadComprar / r,
          RelacionGuardada: true
        };
      }
      if (limpiarSiSinRelacion) {
        return {
          ...item,
          CodigoArticuloProveedor: '',
          DescripcionProveedor: '',
          Relacion: 1,
          CantidadBultos: item.CantidadComprar,
          RelacionGuardada: false
        };
      }
      return { ...item };
    });
  }

  async function enriquecerItemsConRelaciones(limpiarSinRelacion = false) {
    if (!orden.ProveedorCodigo?.trim() || items.length === 0) return;
    relacionesCargando = true;
    try {
      const map = await cargarRelacionesProveedor();
      aplicarMapaRelaciones(map, limpiarSinRelacion);
    } finally {
      relacionesCargando = false;
    }
  }

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

  const seleccionarProveedor = async (p: { Codigo: string; Descripcion: string }) => {
    const prev = proveedorCodigoAnterior;
    const esCambioProveedor = prev !== '' && p.Codigo !== prev;
    orden.ProveedorCodigo = p.Codigo;
    orden.ProveedorDescripcion = p.Descripcion;
    proveedorCodigoAnterior = p.Codigo;
    proveedoresBusqueda = `${p.Codigo} - ${p.Descripcion}`;
    mostrarSelectorProveedores = false;
    proveedoresOptions = [];
    if (items.length > 0) {
      await enriquecerItemsConRelaciones(esCambioProveedor);
    }
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

  const agregarArticulo = async () => {
    if (!articuloSeleccionado) return;
    if (!articuloSeleccionado.Codigo || cantidadArticulo <= 0) {
      error = 'Seleccione un artículo y una cantidad mayor a 0';
      return;
    }
    items = [
      ...items,
      nuevaFilaVacia(
        articuloSeleccionado.Codigo,
        articuloSeleccionado.Descripcion,
        cantidadArticulo,
        Number(articuloSeleccionado.PrecioCosto) || 0,
        null,
        null
      )
    ];
    articuloSeleccionado = null;
    articuloBusqueda = '';
    cantidadArticulo = 1;
    error = null;
    await enriquecerItemsConRelaciones();
  };

  function actualizarRelacion(index: number, value: number) {
    if (value <= 0) return;
    const row = items[index];
    row.Relacion = value;
    row.CantidadComprar = row.CantidadBultos * value;
    row.RelacionGuardada = false;
    items = [...items];
  }

  function actualizarCantidadBultos(index: number, value: number) {
    const v = value < 0 ? 0 : value;
    const row = items[index];
    row.CantidadBultos = v;
    row.CantidadComprar = v * row.Relacion;
    row.RelacionGuardada = false;
    items = [...items];
  }

  function actualizarCantidadComprar(index: number, value: number) {
    const v = value < 0 ? 0 : value;
    const row = items[index];
    row.CantidadComprar = v;
    const r = row.Relacion > 0 ? row.Relacion : 1;
    row.CantidadBultos = r > 0 ? v / r : v;
    row.RelacionGuardada = false;
    items = [...items];
  }

  function onCodigoProveedorInput(index: number) {
    items[index].RelacionGuardada = false;
    items = [...items];
  }

  function onDescripcionProveedorInput(index: number) {
    items[index].RelacionGuardada = false;
    items = [...items];
  }

  const quitarFila = (index: number) => {
    items = items.filter((_, i) => i !== index);
  };

  function focusEditarFila(index: number) {
    if (browser) setTimeout(() => document.getElementById(`oc-cod-prov-${index}`)?.focus(), 0);
  }

  async function guardarRelacion(index: number) {
    const f = items[index];
    if (!orden.ProveedorCodigo?.trim()) {
      error = 'Seleccione un proveedor en la cabecera antes de guardar la relación.';
      return;
    }
    if (!f.CodigoArticuloProveedor?.trim() || !f.CodigoArticulo?.trim()) {
      error = 'Complete código artículo proveedor y artículo de la empresa en la fila.';
      return;
    }
    savingRelacionRow = index;
    error = null;
    try {
      const res = await fetchWithAuth('/relaciones-articulo-proveedor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ProveedorCodigo: orden.ProveedorCodigo.trim(),
          CodigoArticuloProveedor: f.CodigoArticuloProveedor.trim(),
          CodigoArticuloEmpresa: f.CodigoArticulo.trim(),
          Relacion: f.Relacion,
          DescripcionProveedor: f.DescripcionProveedor?.trim() || null
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { message?: string }).message || 'Error al guardar la relación');
      }
      items[index].RelacionGuardada = true;
      items = [...items];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al guardar relación';
    } finally {
      savingRelacionRow = null;
    }
  }

  const cancelar = async () => {
    const ok = await confirm('¿Cancelar? Se perderán los datos ingresados.');
    if (ok) {
      if (browser) navigationState.clearState(ORDEN_NUEVA_PATH);
      goto('/compras/ordenes');
    }
  };

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
      (it) => it.CodigoArticulo?.trim() && (Number(it.CantidadComprar) || 0) > 0
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
        Items: itemsValidos.map((it) => {
          const bultos = Number(it.CantidadBultos);
          return {
            CodigoArticulo: it.CodigoArticulo.trim(),
            Cantidad: Number(it.CantidadComprar) || 0,
            CantidadProveedor:
              Number.isFinite(bultos) && bultos > 0 ? bultos : null,
            PrecioCostoUnitario: Number(it.PrecioCostoUnitario) || 0
          };
        })
      };
      const res = await fetchWithAuth('/ordenes-compra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Error al crear orden');
      if (browser && data.advertenciaMigracionBd) {
        alert(
          'Importante: su sistema no actualizó la base de datos. Pídale a soporte técnico que ejecute la migración de prv_orden_compra_items (columna CantidadProveedor). La orden se guardó correctamente, pero no se pudo registrar la cantidad del proveedor por ítem en la base.'
        );
      }
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

    const boot = async () => {
      if (browser && $page.url.searchParams.get('from') === 'informe') {
        try {
          const stored = sessionStorage.getItem(STORAGE_KEY_ORDEN_INFORME);
          if (stored) {
            const payload = JSON.parse(stored);
            orden.ProveedorCodigo = payload.proveedorCodigo || '';
            orden.ProveedorDescripcion = payload.proveedorDescripcion || '';
            proveedorCodigoAnterior = orden.ProveedorCodigo;
            proveedoresBusqueda = orden.ProveedorDescripcion
              ? `${orden.ProveedorCodigo} - ${orden.ProveedorDescripcion}`
              : '';
            if (payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
              items = payload.items.map((it: Record<string, unknown>) => normalizeItemFromPayload(it));
            }
            sessionStorage.removeItem(STORAGE_KEY_ORDEN_INFORME);
          }
        } catch (_) {}
        await enriquecerItemsConRelaciones(false);
      } else if (browser) {
        const savedState = navigationState.getState(ORDEN_NUEVA_PATH);
        const filters = savedState?.filters as
          | { orden?: typeof orden; items?: Record<string, unknown>[]; proveedoresBusqueda?: string }
          | undefined;
        if (filters?.orden) {
          orden = { ...orden, ...filters.orden };
          proveedorCodigoAnterior = orden.ProveedorCodigo;
        }
        if (filters?.items && Array.isArray(filters.items) && filters.items.length > 0) {
          items = filters.items.map((it) => normalizeItemFromPayload(it));
        }
        if (filters?.proveedoresBusqueda) {
          proveedoresBusqueda = filters.proveedoresBusqueda;
        }
        if (savedState?.scroll && typeof window !== 'undefined') {
          requestAnimationFrame(() => window.scrollTo(0, savedState.scroll));
        }
        if (orden.ProveedorCodigo && items.length > 0) {
          await enriquecerItemsConRelaciones(false);
        }
      }
    };
    void boot();
  });

  function fmtNum(n: number | null): string {
    if (n === null || Number.isNaN(n)) return '—';
    return String(n);
  }
</script>

<svelte:head>
  <title>Nueva orden de compra</title>
</svelte:head>

<div class="mx-auto max-w-[100rem] px-4 py-6 sm:px-6 lg:px-8">
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
          <label for="cantidad" class="mb-1 block text-sm font-medium text-gray-700">Cantidad (empresa)</label>
          <input
            id="cantidad"
            type="number"
            min="0.01"
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

    <div class="overflow-x-auto -mx-2 px-2">
      {#if relacionesCargando}
        <div class="flex items-center gap-2 py-4 text-sm text-slate-600">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
          Cargando relaciones con el proveedor…
        </div>
      {/if}
      <table class="min-w-full border border-slate-200 text-sm">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-3 py-2.5 text-left font-medium text-slate-600">Código</th>
            <th class="px-3 py-2.5 text-left font-medium text-slate-600">Descripción</th>
            <th class="px-3 py-2.5 text-right font-medium text-slate-600">Existencia</th>
            <th class="px-3 py-2.5 text-right font-medium text-slate-600">Vendidos período</th>
            <th class="px-3 py-2.5 text-right font-medium text-slate-600">Cant. a comprar</th>
            <th class="px-3 py-2.5 text-left font-medium text-slate-600 bg-amber-50/90 border-l border-amber-200"
              >Cód. prov.</th
            >
            <th class="px-3 py-2.5 text-left font-medium text-slate-600 bg-amber-50/90">Desc. prov.</th>
            <th class="px-3 py-2.5 text-right font-medium text-slate-600 bg-amber-50/90">Relación</th>
            <th class="px-3 py-2.5 text-right font-medium text-slate-600 bg-amber-50/90">Cant. bultos</th>
            <th class="px-3 py-2.5 text-center font-medium text-slate-600">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each items as item, i (item.CodigoArticulo + '-' + i)}
            <tr class="border-b border-slate-100 hover:bg-slate-50/50">
              <td class="px-3 py-2 font-mono text-slate-800">{item.CodigoArticulo || '—'}</td>
              <td class="px-3 py-2 text-slate-800 max-w-[14rem]">{item.Descripcion || '—'}</td>
              <td class="px-3 py-2 text-right text-slate-700">{fmtNum(item.Existencia)}</td>
              <td class="px-3 py-2 text-right text-slate-700">{fmtNum(item.CantidadVendidaPeriodo)}</td>
              <td class="px-3 py-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={item.CantidadComprar}
                  on:input={(e) => actualizarCantidadComprar(i, parseFloat(e.currentTarget.value) || 0)}
                  class="w-24 px-2 py-1.5 border border-slate-300 rounded text-right"
                />
              </td>
              <td class="px-3 py-2 bg-amber-50/80 border-l border-amber-200">
                <input
                  id="oc-cod-prov-{i}"
                  type="text"
                  bind:value={item.CodigoArticuloProveedor}
                  on:input={() => onCodigoProveedorInput(i)}
                  class="w-full min-w-[5rem] px-2 py-1.5 border border-slate-300 rounded text-slate-800"
                />
              </td>
              <td class="px-3 py-2 bg-amber-50/80">
                <input
                  type="text"
                  bind:value={item.DescripcionProveedor}
                  on:input={() => onDescripcionProveedorInput(i)}
                  class="w-full min-w-[8rem] px-2 py-1.5 border border-slate-300 rounded text-slate-800"
                />
              </td>
              <td class="px-3 py-2 bg-amber-50/80">
                <input
                  type="number"
                  min="0.0001"
                  step="any"
                  value={item.Relacion}
                  on:change={(e) => actualizarRelacion(i, parseFloat(e.currentTarget.value) || 1)}
                  class="w-20 px-2 py-1.5 border border-slate-300 rounded text-right"
                />
              </td>
              <td class="px-3 py-2 bg-amber-50/80">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={item.CantidadBultos}
                  on:input={(e) => actualizarCantidadBultos(i, parseFloat(e.currentTarget.value) || 0)}
                  class="w-20 px-2 py-1.5 border border-slate-300 rounded text-right"
                />
              </td>
              <td class="px-3 py-2">
                <div class="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    class="p-1.5 rounded flex items-center gap-1 {item.RelacionGuardada
                      ? 'text-green-600 bg-green-100'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}"
                    on:click={() => guardarRelacion(i)}
                    disabled={savingRelacionRow !== null}
                    title={item.RelacionGuardada
                      ? 'Guardado. Clic para regrabar'
                      : 'Guardar relación artículo proveedor'}
                  >
                    {#if savingRelacionRow === i}
                      <span class="text-xs text-slate-500">…</span>
                    {:else if item.RelacionGuardada}
                      <CheckCircle2 size={18} class="text-green-600 shrink-0" />
                      <span class="text-xs font-medium text-green-700 hidden sm:inline">Guardado</span>
                    {:else}
                      <Check size={18} class="text-slate-400 shrink-0" />
                      <span class="text-xs hidden sm:inline">Guardar</span>
                    {/if}
                  </button>
                  <button
                    type="button"
                    class="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                    on:click={() => focusEditarFila(i)}
                    title="Editar código proveedor"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    class="p-1.5 rounded text-slate-500 hover:text-red-600 hover:bg-red-50"
                    on:click={() => quitarFila(i)}
                    title="Quitar fila"
                  >
                    <X size={18} />
                  </button>
                </div>
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
