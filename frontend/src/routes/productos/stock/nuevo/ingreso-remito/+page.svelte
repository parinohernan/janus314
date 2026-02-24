<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import Button from '$lib/components/ui/Button.svelte';
  import { goto } from '$app/navigation';
  import { getTodayISOArgentina } from '$lib/utils/dateUtils';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { Check, Pencil, X } from 'lucide-svelte';

  const STORAGE_KEY_PROVIDER_IA = 'janus314_ingreso_remito_provider_ia';

  interface ItemRemito {
    codigoProveedor: string;
    descripcionProveedor: string;
    cantidad: number;
  }

  interface FilaTabla {
    codigoProveedor: string;
    descripcionProveedor: string;
    cantidadProveedor: number;
    relacion: number;
    codigoArticuloEmpresa: string;
    descripcionArticuloEmpresa: string;
    cantidadEmpresa: number;
    relacionGuardada: boolean;
  }

  interface RelacionApi {
    ProveedorCodigo: string;
    CodigoArticuloProveedor: string;
    CodigoArticuloEmpresa: string;
    Relacion: number;
    DescripcionProveedor: string | null;
    ArticuloEmpresa: { Codigo: string; Descripcion: string } | null;
  }

  let proveedorCodigo = '';
  let textoPegado = '';
  let filas: FilaTabla[] = [];
  let relacionesGuardadas: RelacionApi[] = [];
  let documento = {
    DocumentoTipo: 'STK',
    DocumentoSucursal: '',
    Fecha: getTodayISOArgentina(),
    MovimientoTipo: 'ING' as const,
    Observacion: 'ING - automatico'
  };
  let loading = false;
  let error: string | null = null;
  let successMessage: string | null = null;
  let articulosCache: Map<string, { Codigo: string; Descripcion: string }> = new Map();

  let imagenArchivo: File | null = null;
  let imagenPreviewUrl: string | null = null;
  let loadingIA = false;
  let providerIA: 'groq' | 'gemini' = 'groq';
  let pasoActual: 1 | 2 | 3 = 1;
  let mostrarJsonParaEditar = false;
  let extraccionLista = false;
  let entradaDesdeJson = false;
  let tablaCargando = false;
  let skeletonFilasCount = 0;

  interface ProveedorOption {
    Codigo: string;
    Descripcion: string;
  }
  let proveedores: ProveedorOption[] = [];

  onMount(async () => {
    if (browser) {
      const saved = localStorage.getItem(STORAGE_KEY_PROVIDER_IA);
      if (saved === 'groq' || saved === 'gemini') providerIA = saved;
    }
    try {
      const res = await fetchWithAuth('/datos-empresa');
      if (!res.ok) throw new Error('Error al cargar datos de la empresa');
      const { data } = await res.json();
      if (data?.Sucursal) documento.DocumentoSucursal = data.Sucursal;

      const resProv = await fetchWithAuth('/proveedores', {
        params: { limit: 500, page: 1 }
      });
      if (resProv.ok) {
        const dataProv = await resProv.json();
        proveedores = dataProv.items || [];
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error desconocido';
    }
  });

  function guardarProviderIA() {
    if (browser) localStorage.setItem(STORAGE_KEY_PROVIDER_IA, providerIA);
  }

  function irADesdeJson() {
    entradaDesdeJson = true;
    textoPegado = '';
    pasoActual = 2;
    mostrarJsonParaEditar = true;
  }

  function volverAPaso1() {
    entradaDesdeJson = false;
    pasoActual = 1;
  }

  function parsearTexto(): ItemRemito[] {
    const t = textoPegado.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      return arr.map((x: any) => ({
        codigoProveedor: String(x.codigoProveedor ?? x.codigo ?? '').trim(),
        descripcionProveedor: String(x.descripcionProveedor ?? x.descripcion ?? '').trim(),
        cantidad: parseFloat(x.cantidad) || 0
      })).filter((x: ItemRemito) => x.codigoProveedor || x.descripcionProveedor);
    } catch {
      error = 'El texto no es un JSON válido.';
      return [];
    }
  }

  function onImagenSeleccionada(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (imagenPreviewUrl) URL.revokeObjectURL(imagenPreviewUrl);
    imagenPreviewUrl = null;
    imagenArchivo = null;
    if (file && file.type.startsWith('image/')) {
      imagenArchivo = file;
      imagenPreviewUrl = URL.createObjectURL(file);
    }
    input.value = '';
  }

  function quitarImagen() {
    if (imagenPreviewUrl) URL.revokeObjectURL(imagenPreviewUrl);
    imagenPreviewUrl = null;
    imagenArchivo = null;
  }

  async function procesarImagenConIA() {
    if (!imagenArchivo || !proveedorCodigo.trim()) {
      error = imagenArchivo ? 'Ingrese el código de proveedor' : 'Seleccione una imagen del remito';
      return;
    }
    error = null;
    loadingIA = true;
    try {
      const formData = new FormData();
      formData.append('imagen', imagenArchivo);
      formData.append('provider', providerIA);
      const res = await fetchWithAuth('/remito/analizar-imagen', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al analizar la imagen');
      }
      const data = await res.json();
      const items = data.items ?? data;
      textoPegado = JSON.stringify(Array.isArray(items) ? items : [items], null, 2);
      extraccionLista = true;
      pasoActual = 2;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al procesar con IA';
    } finally {
      loadingIA = false;
    }
  }

  async function cargarRelaciones() {
    if (!proveedorCodigo.trim()) return;
    error = null;
    try {
      const res = await fetchWithAuth('/relaciones-articulo-proveedor', {
        params: { proveedorCodigo: proveedorCodigo.trim() }
      });
      if (!res.ok) throw new Error('Error al cargar relaciones');
      const data = await res.json();
      relacionesGuardadas = data.items || [];
    } catch (err) {
      relacionesGuardadas = [];
    }
  }

  async function buscarArticuloPorProveedorYCodigo(provCodigo: string, codigoProv: string): Promise<{ Codigo: string; Descripcion: string } | null> {
    if (!provCodigo.trim() || !codigoProv.trim()) return null;
    try {
      const res = await fetchWithAuth('/articulos/by-proveedor-articulo', {
        params: { proveedorCodigo: provCodigo.trim(), codigoProveedor: codigoProv.trim() }
      });
      if (!res.ok) return null;
      const art = await res.json();
      return { Codigo: art.Codigo, Descripcion: art.Descripcion };
    } catch {
      return null;
    }
  }

  async function armarTabla() {
    error = null;
    const items = parsearTexto();
    if (items.length === 0) {
      error = 'No hay ítems válidos. Verifique el JSON.';
      return;
    }
    tablaCargando = true;
    skeletonFilasCount = items.length;
    pasoActual = 3;
    try {
      await cargarRelaciones();
      const mapRelacion = new Map<string, RelacionApi>();
      relacionesGuardadas.forEach((r) => mapRelacion.set(r.CodigoArticuloProveedor, r));
      filas = [];
      for (const item of items) {
        const rel = mapRelacion.get(item.codigoProveedor);
        let codigoEmpresa = rel?.CodigoArticuloEmpresa ?? '';
        let descEmpresa = rel?.ArticuloEmpresa?.Descripcion ?? '';
        let relacion = rel ? rel.Relacion : 1;
        if (!codigoEmpresa && proveedorCodigo.trim() && item.codigoProveedor) {
          const art = await buscarArticuloPorProveedorYCodigo(proveedorCodigo, item.codigoProveedor);
          if (art) {
            codigoEmpresa = art.Codigo;
            descEmpresa = art.Descripcion;
          }
        }
        const cantidadEmpresa = (item.cantidad || 0) * relacion;
        filas.push({
          codigoProveedor: item.codigoProveedor,
          descripcionProveedor: item.descripcionProveedor,
          cantidadProveedor: item.cantidad,
          relacion,
          codigoArticuloEmpresa: codigoEmpresa,
          descripcionArticuloEmpresa: descEmpresa,
          cantidadEmpresa,
          relacionGuardada: !!rel
        });
      }
      filas = [...filas];
    } finally {
      tablaCargando = false;
    }
  }

  async function buscarArticulo(codigo: string): Promise<{ Codigo: string; Descripcion: string } | null> {
    if (!codigo.trim()) return null;
    const cached = articulosCache.get(codigo.trim());
    if (cached) return cached;
    try {
      const res = await fetchWithAuth(`/articulos/${encodeURIComponent(codigo.trim())}`);
      if (!res.ok) return null;
      const art = await res.json();
      const obj = { Codigo: art.Codigo, Descripcion: art.Descripcion };
      articulosCache.set(codigo.trim(), obj);
      return obj;
    } catch {
      return null;
    }
  }

  function actualizarRelacion(index: number, value: number) {
    if (value <= 0) return;
    filas[index].relacion = value;
    filas[index].cantidadEmpresa = filas[index].cantidadProveedor * value;
    filas = [...filas];
  }

  function actualizarCantidadProveedor(index: number, value: number) {
    const v = value < 0 ? 0 : value;
    filas[index].cantidadProveedor = v;
    filas[index].cantidadEmpresa = v * filas[index].relacion;
    filas = [...filas];
  }

  function eliminarFila(index: number) {
    filas = filas.filter((_, j) => j !== index);
  }

  function focusEditarFila(index: number) {
    if (browser) setTimeout(() => document.getElementById(`codigo-prov-${index}`)?.focus(), 0);
  }

  async function elegirArticulo(index: number, codigo: string) {
    const art = await buscarArticulo(codigo);
    if (!art) {
      error = `No se encontró artículo con código "${codigo}"`;
      return;
    }
    filas[index].codigoArticuloEmpresa = art.Codigo;
    filas[index].descripcionArticuloEmpresa = art.Descripcion;
    filas[index].cantidadEmpresa = filas[index].cantidadProveedor * filas[index].relacion;
    filas = [...filas];
    error = null;
  }

  async function guardarRelacion(index: number) {
    const f = filas[index];
    if (!proveedorCodigo.trim() || !f.codigoProveedor || !f.codigoArticuloEmpresa) {
      error = 'Complete código proveedor, código artículo proveedor y código artículo empresa.';
      return;
    }
    loading = true;
    error = null;
    try {
      const res = await fetchWithAuth('/relaciones-articulo-proveedor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ProveedorCodigo: proveedorCodigo.trim(),
          CodigoArticuloProveedor: f.codigoProveedor,
          CodigoArticuloEmpresa: f.codigoArticuloEmpresa,
          Relacion: f.relacion,
          DescripcionProveedor: f.descripcionProveedor || null
        })
      });
      if (!res.ok) throw new Error('Error al guardar la relación');
      filas[index].relacionGuardada = true;
      filas = [...filas];
      await cargarRelaciones();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al guardar relación';
    } finally {
      loading = false;
    }
  }

  async function crearMovimiento() {
    const validas = filas.filter((f) => f.codigoArticuloEmpresa && f.cantidadEmpresa > 0);
    if (validas.length === 0) {
      error = 'Complete al menos una fila con artículo y cantidad válida.';
      return;
    }
    loading = true;
    error = null;
    try {
      const res = await fetchWithAuth('/movimientos-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encabezado: documento,
          items: validas.map((f) => ({
            CodigoArticulo: f.codigoArticuloEmpresa,
            Cantidad: f.cantidadEmpresa
          }))
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al crear el movimiento');
      }
      successMessage = 'Movimiento de ingreso creado correctamente';
      setTimeout(() => goto('/productos/stock'), 2000);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al crear movimiento';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Ingreso por remito</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
  <div class="max-w-6xl mx-auto px-4 py-8">
    <header class="flex justify-between items-center mb-8">
      <h1 class="text-xl font-semibold text-slate-800">Ingreso por remito</h1>
      <Button variant="secondary" on:click={() => goto('/productos/stock')}>Volver</Button>
    </header>

    {#if error}
      <div class="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">
        {error}
      </div>
    {/if}
    {#if successMessage}
      <div class="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
        {successMessage}
      </div>
    {/if}

    <!-- Stepper -->
    <nav class="flex items-center gap-2 mb-8" aria-label="Pasos">
      <div class="flex items-center gap-2">
        <span class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium {pasoActual >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}">1</span>
        <span class="text-sm font-medium text-slate-600">Imagen</span>
      </div>
      <div class="h-px w-8 bg-slate-200" aria-hidden="true"></div>
      <div class="flex items-center gap-2">
        <span class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium {pasoActual >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}">2</span>
        <span class="text-sm font-medium text-slate-600">Revisar</span>
      </div>
      <div class="h-px w-8 bg-slate-200" aria-hidden="true"></div>
      <div class="flex items-center gap-2">
        <span class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium {pasoActual >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}">3</span>
        <span class="text-sm font-medium text-slate-600">Tabla</span>
      </div>
    </nav>

    <main class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <!-- Paso 1: Proveedor, fecha, IA, imagen -->
      {#if pasoActual === 1}
        <div class="p-6 space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="proveedor" class="block text-sm font-medium text-slate-700 mb-1.5">Proveedor *</label>
              <select
                id="proveedor"
                bind:value={proveedorCodigo}
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Seleccione un proveedor</option>
                {#each proveedores as p}
                  <option value={p.Codigo}>{p.Codigo} – {p.Descripcion}</option>
                {/each}
              </select>
            </div>
            <div>
              <label for="fecha" class="block text-sm font-medium text-slate-700 mb-1.5">Fecha</label>
              <input
                id="fecha"
                type="date"
                bind:value={documento.Fecha}
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label for="providerIA" class="block text-sm font-medium text-slate-700 mb-1.5">Proveedor de IA</label>
            <select
              bind:value={providerIA}
              on:change={guardarProviderIA}
              id="providerIA"
              class="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="groq">Groq (Llama)</option>
              <option value="gemini">Gemini</option>
            </select>
          </div>

          <div>
            <label for="imagen-remito" class="block text-sm font-medium text-slate-700 mb-1.5">Imagen del remito</label>
            <input
              id="imagen-remito"
              type="file"
              accept="image/*"
              on:change={onImagenSeleccionada}
              class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {#if imagenPreviewUrl}
              <div class="mt-4 flex flex-wrap items-start gap-4">
                <div class="relative">
                  <img
                    src={imagenPreviewUrl}
                    alt="Vista previa del remito"
                    class="max-h-52 rounded-lg border border-slate-200 object-contain bg-slate-50"
                  />
                  <button
                    type="button"
                    class="absolute top-2 right-2 h-7 w-7 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-slate-800 text-sm"
                    on:click={quitarImagen}
                    title="Quitar imagen"
                  >×</button>
                </div>
                <div class="flex flex-col justify-center gap-2">
                  <Button variant="primary" on:click={procesarImagenConIA} disabled={loadingIA}>
                    {loadingIA ? 'Analizando…' : 'Procesar con IA'}
                  </Button>
                </div>
              </div>
            {/if}
            <p class="mt-2 text-xs text-slate-500">Suba una foto o escaneo del remito para extraer los ítems.</p>
            <p class="mt-3 text-sm text-slate-600">O bien:</p>
            <Button variant="secondary" on:click={irADesdeJson} class="mt-1">
              agregar texto manualmente
            </Button>
          </div>
        </div>
      {/if}

      <!-- Paso 2: Extracción ok + opción ver/editar JSON -->
      {#if pasoActual === 2}
        <div class="p-6 space-y-6">
          {#if entradaDesdeJson}
            <div class="flex flex-wrap items-center gap-3">
              <span class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium">
                Agregue el JSON del remito a continuación
              </span>
            </div>
          {:else}
            <div class="flex flex-wrap items-center gap-3">
              <span class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-800 text-sm font-medium">
                <span aria-hidden="true">✓</span> Extracción desde la imagen ok
              </span>
              <button
                type="button"
                class="text-sm text-blue-600 hover:underline font-medium"
                on:click={() => (mostrarJsonParaEditar = !mostrarJsonParaEditar)}
              >
                {mostrarJsonParaEditar ? 'Ocultar JSON' : 'Ver/editar JSON'}
              </button>
            </div>
          {/if}
          {#if mostrarJsonParaEditar}
            <div>
              <label for="texto" class="block text-sm font-medium text-slate-700 mb-1.5">JSON {entradaDesdeJson ? 'del remito' : '(solo para edición ocasional)'}</label>
              <textarea
                id="texto"
                bind:value={textoPegado}
                rows="10"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              ></textarea>
            </div>
          {/if}
          <div class="flex flex-wrap gap-3">
            {#if entradaDesdeJson}
              <Button variant="secondary" on:click={volverAPaso1}>Volver al paso 1</Button>
            {:else}
              <Button variant="secondary" on:click={() => (pasoActual = 1)}>Cambiar imagen</Button>
            {/if}
            <Button variant="primary" on:click={armarTabla} disabled={loading}>
              Cargar tabla
            </Button>
          </div>
        </div>
      {/if}

      <!-- Paso 3: Tabla y crear movimiento (o skeleton mientras carga) -->
      {#if pasoActual === 3 && (tablaCargando || filas.length > 0)}
        <div class="p-6 space-y-6">
          {#if tablaCargando}
            <!-- Skeleton del paso 3 -->
            <div>
              <div class="h-4 w-24 bg-slate-200 rounded animate-pulse mb-1.5"></div>
              <div class="h-10 w-full bg-slate-200 rounded-lg animate-pulse"></div>
            </div>
            <div class="overflow-x-auto -mx-6 px-6">
              <table class="min-w-full border border-slate-200 text-sm">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-3 py-2.5 text-left font-medium text-slate-600">Cód. prov.</th>
                    <th class="px-3 py-2.5 text-left font-medium text-slate-600">Desc. prov.</th>
                    <th class="px-3 py-2.5 text-right font-medium text-slate-600">Cant.</th>
                    <th class="px-3 py-2.5 text-right font-medium text-slate-600">Rel.</th>
                    <th class="px-3 py-2.5 text-left font-medium text-slate-600">Cód. artículo</th>
                    <th class="px-3 py-2.5 text-left font-medium text-slate-600">Desc. artículo</th>
                    <th class="px-3 py-2.5 text-right font-medium text-slate-600">Cant. empresa</th>
                    <th class="px-3 py-2.5 text-center font-medium text-slate-600">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {#each Array.from({ length: skeletonFilasCount }) as _, i}
                    <tr class="border-b border-slate-100">
                      <td class="px-3 py-2"><div class="h-8 w-16 bg-slate-200 rounded animate-pulse"></div></td>
                      <td class="px-3 py-2"><div class="h-8 w-24 bg-slate-200 rounded animate-pulse"></div></td>
                      <td class="px-3 py-2"><div class="h-8 w-12 bg-slate-200 rounded animate-pulse ml-auto"></div></td>
                      <td class="px-3 py-2"><div class="h-8 w-14 bg-slate-200 rounded animate-pulse ml-auto"></div></td>
                      <td class="px-3 py-2"><div class="h-8 w-20 bg-slate-200 rounded animate-pulse"></div></td>
                      <td class="px-3 py-2"><div class="h-8 w-32 bg-slate-200 rounded animate-pulse"></div></td>
                      <td class="px-3 py-2"><div class="h-8 w-12 bg-slate-200 rounded animate-pulse ml-auto"></div></td>
                      <td class="px-3 py-2"><div class="flex justify-center gap-1"><div class="h-7 w-7 bg-slate-200 rounded animate-pulse"></div><div class="h-7 w-7 bg-slate-200 rounded animate-pulse"></div><div class="h-7 w-7 bg-slate-200 rounded animate-pulse"></div></div></td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
            <div class="flex justify-end pt-2">
              <div class="h-10 w-48 bg-slate-200 rounded animate-pulse"></div>
            </div>
          {:else}
          <div>
            <label for="observacion" class="block text-sm font-medium text-slate-700 mb-1.5">Observación (opcional)</label>
            <input
              id="observacion"
              type="text"
              bind:value={documento.Observacion}
              placeholder="Ej: Remito 123"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div class="overflow-x-auto -mx-6 px-6">
            <table class="min-w-full border border-slate-200 text-sm">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-3 py-2.5 text-left font-medium text-slate-600">Cód. prov.</th>
                  <th class="px-3 py-2.5 text-left font-medium text-slate-600">Desc. prov.</th>
                  <th class="px-3 py-2.5 text-right font-medium text-slate-600">Cant.</th>
                  <th class="px-3 py-2.5 text-right font-medium text-slate-600">Rel.</th>
                  <th class="px-3 py-2.5 text-left font-medium text-slate-600">Cód. artículo</th>
                  <th class="px-3 py-2.5 text-left font-medium text-slate-600">Desc. artículo</th>
                  <th class="px-3 py-2.5 text-right font-medium text-slate-600">Cant. empresa</th>
                  <th class="px-3 py-2.5 text-center font-medium text-slate-600">Acción</th>
                </tr>
              </thead>
              <tbody>
                {#each filas as fila, i}
                  <tr class="border-b border-slate-100 hover:bg-slate-50/50">
                    <td class="px-3 py-2">
                      <input
                        id="codigo-prov-{i}"
                        type="text"
                        bind:value={fila.codigoProveedor}
                        class="w-full min-w-[5rem] px-2 py-1.5 border border-slate-300 rounded text-slate-800"
                      />
                    </td>
                    <td class="px-3 py-2 text-slate-800">{fila.descripcionProveedor || '—'}</td>
                    <td class="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={fila.cantidadProveedor}
                        on:input={(e) => actualizarCantidadProveedor(i, parseFloat(e.currentTarget.value) || 0)}
                        class="w-20 px-2 py-1.5 border border-slate-300 rounded text-right"
                      />
                    </td>
                    <td class="px-3 py-2">
                      <input
                        type="number"
                        min="0.0001"
                        step="any"
                        value={fila.relacion}
                        on:change={(e) => actualizarRelacion(i, parseFloat(e.currentTarget.value) || 1)}
                        class="w-20 px-2 py-1.5 border border-slate-300 rounded text-right"
                      />
                    </td>
                    <td class="px-3 py-2">
                      <input
                        type="text"
                        bind:value={fila.codigoArticuloEmpresa}
                        on:blur={() => elegirArticulo(i, fila.codigoArticuloEmpresa)}
                        placeholder="Código"
                        class="w-28 px-2 py-1.5 border border-slate-300 rounded"
                      />
                    </td>
                    <td class="px-3 py-2 text-slate-700">{fila.descripcionArticuloEmpresa || '—'}</td>
                    <td class="px-3 py-2 text-right">{fila.cantidadEmpresa.toFixed(2)}</td>
                    <td class="px-3 py-2">
                      <div class="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          class="p-1.5 rounded {fila.relacionGuardada ? 'text-green-600 bg-green-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}"
                          on:click={() => guardarRelacion(i)}
                          disabled={loading}
                          title={fila.relacionGuardada ? 'Relación guardada' : 'Guardar relación'}
                        >
                          <Check size={18} class={fila.relacionGuardada ? 'text-green-600 stroke-[3]' : 'text-slate-400'} />
                        </button>
                        <button
                          type="button"
                          class="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          on:click={() => focusEditarFila(i)}
                          title="Editar línea"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          class="p-1.5 rounded text-slate-500 hover:text-red-600 hover:bg-red-50"
                          on:click={() => eliminarFila(i)}
                          title="Eliminar línea"
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
          <div class="flex justify-end pt-2">
            <Button variant="primary" on:click={crearMovimiento} disabled={loading}>
              {loading ? 'Creando…' : 'Crear movimiento de ingreso'}
            </Button>
          </div>
          {/if}
        </div>
      {/if}
    </main>
  </div>
</div>