<script lang="ts">
    import { onMount } from 'svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import { goto } from '$app/navigation';
    import { getTodayISOArgentina } from '$lib/utils/dateUtils';
    import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  
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
      Observacion: ''
    };
    let loading = false;
    let error: string | null = null;
    let successMessage: string | null = null;
    let articulosCache: Map<string, { Codigo: string; Descripcion: string }> = new Map();
  
    onMount(async () => {
      try {
        const res = await fetchWithAuth('/datos-empresa');
        if (!res.ok) throw new Error('Error al cargar datos de la empresa');
        const { data } = await res.json();
        if (data?.Sucursal) documento.DocumentoSucursal = data.Sucursal;
      } catch (err) {
        error = err instanceof Error ? err.message : 'Error desconocido';
      }
    });
  
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
        error = 'El texto no es un JSON válido. Formato esperado: [{"codigoProveedor":"...","descripcionProveedor":"...","cantidad":1}]';
        return [];
      }
    }
  
    async function cargarRelaciones() {
      if (!proveedorCodigo.trim()) {
        error = 'Ingrese el código de proveedor';
        return;
      }
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
        console.error(err);
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
      if (items.length === 0) return;
      await cargarRelaciones();

      const mapRelacion = new Map<string, RelacionApi>();
      relacionesGuardadas.forEach((r) => mapRelacion.set(r.CodigoArticuloProveedor, r));

      filas = [];
      for (const item of items) {
        const rel = mapRelacion.get(item.codigoProveedor);
        let codigoEmpresa = rel?.CodigoArticuloEmpresa ?? '';
        let descEmpresa = rel?.ArticuloEmpresa?.Descripcion ?? '';
        let relacion = rel ? rel.Relacion : 1;

        // Si no hay relación guardada, buscar artículo por ProveedorCodigo + ProveedorArticuloCodigo
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
        error = 'Complete código proveedor, código artículo proveedor y código artículo empresa antes de guardar';
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
      const validas = filas.filter(
        (f) => f.codigoArticuloEmpresa && f.cantidadEmpresa > 0
      );
      if (validas.length === 0) {
        error = 'Complete al menos una fila con artículo de la empresa y cantidad válida';
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
  
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Ingreso de stock por remito</h1>
      <Button variant="secondary" on:click={() => goto('/productos/stock')}>
        Volver
      </Button>
    </div>
  
    {#if error}
      <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
    {/if}
    {#if successMessage}
      <div class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{successMessage}</div>
    {/if}
  
    <div class="bg-white p-6 rounded-lg shadow-md space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="proveedor" class="block text-sm font-medium text-gray-700 mb-1">Código de proveedor *</label>
          <input
            id="proveedor"
            type="text"
            bind:value={proveedorCodigo}
            placeholder="Ej: 0001"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="fecha" class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <input
            id="fecha"
            type="date"
            bind:value={documento.Fecha}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
  
      <div>
        <label for="texto" class="block text-sm font-medium text-gray-700 mb-1">Pegar datos del remito (JSON) *</label>
        <textarea
        id="texto"
        bind:value={textoPegado}
        rows="6"
        placeholder="Pegar aquí el JSON del remito (ej: codigoProveedor, descripcionProveedor, cantidad)"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
      ></textarea>
        <p class="text-xs text-gray-500 mt-1">Formato: array de objetos con codigoProveedor, descripcionProveedor, cantidad</p>
      </div>
  
      <div>
        <Button variant="primary" on:click={armarTabla} disabled={loading}>
          Cargar tabla
        </Button>
      </div>
  
      {#if filas.length > 0}
        <div class="border-t pt-6">
            <label for="observacion" class="block text-sm font-medium text-gray-700 mb-2">Observación (opcional)</label>
          <!-- <input
            type="text"
            bind:value={documento.Observacion}
            placeholder="Ej: Remito 123"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          /> -->
          <input
          id="observacion"
          type="text"
          bind:value={documento.Observacion}
          placeholder="Ej: Remito 123"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />
          <div class="overflow-x-auto">
            <table class="min-w-full border border-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cód. proveedor</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Desc. proveedor</th>
                  <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cant. proveedor</th>
                  <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Relación</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cód. artículo (empresa)</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Desc. artículo (empresa)</th>
                  <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cant. empresa</th>
                  <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody>
                {#each filas as fila, i}
                  <tr class="border-b border-gray-200 hover:bg-gray-50">
                    <td class="px-3 py-2 text-sm">{fila.codigoProveedor}</td>
                    <td class="px-3 py-2 text-sm">{fila.descripcionProveedor}</td>
                    <td class="px-3 py-2 text-sm text-right">{fila.cantidadProveedor}</td>
                    <td class="px-3 py-2">
                      <input
                        type="number"
                        min="0.0001"
                        step="any"
                        value={fila.relacion}
                        on:change={(e) => actualizarRelacion(i, parseFloat(e.currentTarget.value) || 1)}
                        class="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td class="px-3 py-2">
                      <input
                        type="text"
                        bind:value={fila.codigoArticuloEmpresa}
                        on:blur={() => elegirArticulo(i, fila.codigoArticuloEmpresa)}
                        placeholder="Código"
                        class="w-28 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td class="px-3 py-2 text-sm">{fila.descripcionArticuloEmpresa || '-'}</td>
                    <td class="px-3 py-2 text-sm text-right">{fila.cantidadEmpresa.toFixed(2)}</td>
                    <td class="px-3 py-2 text-center">
                      <button
                        type="button"
                        class="text-blue-600 hover:underline text-sm"
                        on:click={() => guardarRelacion(i)}
                        disabled={loading}
                      >
                        {fila.relacionGuardada ? '✓ Guardada' : 'Guardar relación'}
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
  
          <div class="mt-4 flex justify-end">
            <Button variant="primary" on:click={crearMovimiento} disabled={loading}>
              {#if loading}
                Creando...
              {:else}
                Crear movimiento de ingreso
              {/if}
            </Button>
          </div>
        </div>
      {/if}
    </div>
  </div>