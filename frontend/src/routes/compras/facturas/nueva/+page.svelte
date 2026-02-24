<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { EmpresaService } from '$lib/services/EmpresaService';

  const hoy = new Date().toISOString().slice(0, 10);

  let loading = false;
  let error: string | null = null;
  let guardadoExitoso = false;

  let proveedoresOptions: { Codigo: string; Descripcion: string }[] = [];
  let proveedoresLoading = false;
  let proveedoresBusqueda = '';
  let mostrarSelectorProveedores = false;
  let timeoutProveedores: ReturnType<typeof setTimeout> | null = null;

  let formasPago: { value: string; label: string }[] = [];
  let sucursalActual = '01';

  let compra = {
    DocumentoTipo: '',
    DocumentoSucursal: '01',
    DocumentoNumero: '',
    Fecha: hoy,
    FechaDePago: '' as string,
    ProveedorCodigo: '',
    ProveedorDescripcion: '',
    TipoPago: '',
    ImporteBruto: 0,
    ImporteBonificado: 0,
    ImporteNeto: 0,
    ImporteAdicional: 0,
    ImporteIva1: 0,
    ImporteIva2: 0,
    Percepcion: 0,
    IngresosBrutos: 0,
    OtrosImpuestos1: 0,
    OtrosImpuestos2: 0,
    OtrosImpuestos3: 0,
    ImporteTotal: 0,
    ImportePagado: 0,
    Observacion: '',
    ObservacionAnula: '',
    RemitoNro: '',
    OrdenCompraNro: ''
  };

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
    compra.ProveedorCodigo = p.Codigo;
    compra.ProveedorDescripcion = p.Descripcion;
    proveedoresBusqueda = `${p.Codigo} - ${p.Descripcion}`;
    mostrarSelectorProveedores = false;
    proveedoresOptions = [];
  };

  const cancelar = () => {
    if (confirm('¿Cancelar? Se perderán los datos ingresados.')) goto('/compras/facturas');
  };

  const guardar = async () => {
    if (!compra.ProveedorCodigo) {
      error = 'Debe seleccionar un proveedor';
      return;
    }
    if (!compra.Fecha) {
      error = 'La fecha es obligatoria';
      return;
    }
    if (!compra.DocumentoTipo?.trim()) {
      error = 'Indique el tipo de comprobante (ej. FCA, FCB, N/D)';
      return;
    }
    if (!compra.DocumentoNumero?.trim()) {
      error = 'Indique el número del comprobante del proveedor';
      return;
    }
    const total = Number(compra.ImporteTotal) || 0;
    if (total <= 0) {
      error = 'El importe total debe ser mayor a cero';
      return;
    }

    loading = true;
    error = null;
    guardadoExitoso = false;
    try {
      const body = {
        DocumentoTipo: compra.DocumentoTipo.trim(),
        DocumentoSucursal: compra.DocumentoSucursal?.trim() || '01',
        DocumentoNumero: String(compra.DocumentoNumero).trim(),
        Fecha: compra.Fecha,
        FechaDePago: compra.FechaDePago || undefined,
        ProveedorCodigo: compra.ProveedorCodigo,
        TipoPago: compra.TipoPago || undefined,
        ImporteBruto: compra.ImporteBruto,
        ImporteBonificado: compra.ImporteBonificado,
        ImporteNeto: compra.ImporteNeto,
        ImporteAdicional: compra.ImporteAdicional,
        ImporteIva1: compra.ImporteIva1,
        ImporteIva2: compra.ImporteIva2,
        Percepcion: compra.Percepcion,
        ImporteTotal: total,
        ImportePagado: compra.ImportePagado,
        IngresosBrutos: compra.IngresosBrutos,
        OtrosImpuestos1: compra.OtrosImpuestos1,
        OtrosImpuestos2: compra.OtrosImpuestos2,
        OtrosImpuestos3: compra.OtrosImpuestos3,
        Observacion: compra.Observacion || undefined,
        ObservacionAnula: compra.ObservacionAnula || undefined,
        RemitoNro: compra.RemitoNro || undefined,
        OrdenCompraNro: compra.OrdenCompraNro || undefined,
        Items: []
      };
      const res = await fetchWithAuth('/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Error al registrar');
      guardadoExitoso = true;
      const d = data.data || {};
      setTimeout(
        () =>
          goto(
            `/compras/facturas/${encodeURIComponent(d.DocumentoTipo || '')}/${encodeURIComponent(d.DocumentoSucursal || '01')}/${encodeURIComponent(d.DocumentoNumero || '')}`
          ),
        800
      );
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al guardar';
    } finally {
      loading = false;
    }
  };

  const fmt = (n: number) =>
    (n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  onMount(async () => {
    try {
      sucursalActual = (await EmpresaService.obtenerSucursal()) || '01';
      compra.DocumentoSucursal = sucursalActual;
      const resPago = await fetchWithAuth('/tipos-pago');
      if (resPago.ok) {
        const dataPago = await resPago.json();
        formasPago = (dataPago.items || []).map((item: { Codigo: string; Descripcion: string }) => ({
          value: item.Codigo,
          label: item.Descripcion
        }));
      }
    } catch (_) {}
  });
</script>

<svelte:head>
  <title>Nueva factura de compra</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">Nueva factura de compra</h1>
    <div class="flex space-x-2">
      <Button variant="secondary" on:click={cancelar}>Cancelar</Button>
      <Button variant="primary" on:click={guardar} disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar factura'}
      </Button>
    </div>
  </div>

  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p>{error}</p>
    </div>
  {/if}

  {#if guardadoExitoso}
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
      <p>Factura registrada. Redirigiendo al detalle...</p>
    </div>
  {/if}

  <div class="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
    <strong>Próximamente:</strong> carga de factura por PDF/imagen con IA (OCR). Los ítems de la factura se podrán cargar en un próximo sprint.
  </div>

  <!-- Datos de la factura -->
  <div class="bg-white p-6 rounded-lg shadow-md mb-6">
    <h2 class="text-xl font-semibold mb-4">Datos de la factura</h2>
    <p class="text-sm text-gray-500 mb-4">Tipo, sucursal y número son los del comprobante que recibió del proveedor (ej. factura, NC, etc.).</p>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-4">
      <div class="relative lg:col-span-3">
        <label for="proveedor" class="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
        <input
          type="text"
          id="proveedor"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        {/if}
        {#if mostrarSelectorProveedores && proveedoresOptions.length > 0}
          <div
            class="absolute z-10 mt-1 w-full bg-white border border-gray-300 shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm"
          >
            <ul>
              {#each proveedoresOptions as p}
                <li>
                  <button
                    type="button"
                    class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 w-full text-left"
                    on:click={() => seleccionarProveedor(p)}
                    on:mousedown|preventDefault
                  >
                    <span class="font-normal block truncate">{p.Codigo} - {p.Descripcion}</span>
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>

      <div class="lg:col-span-1">
        <label for="documentoTipo" class="block text-sm font-medium text-gray-700 mb-1">Tipo comprobante *</label>
        <input
          id="documentoTipo"
          type="text"
          bind:value={compra.DocumentoTipo}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="Ej. FCA, FCB, N/D"
          maxlength="3"
        />
      </div>
      <div class="lg:col-span-1">
        <label for="documentoSucursal" class="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
        <input
          id="documentoSucursal"
          type="text"
          bind:value={compra.DocumentoSucursal}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="01"
          maxlength="4"
        />
      </div>
      <div class="lg:col-span-1">
        <label for="documentoNumero" class="block text-sm font-medium text-gray-700 mb-1">Número *</label>
        <input
          id="documentoNumero"
          type="text"
          bind:value={compra.DocumentoNumero}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="Nº del comprobante"
        />
      </div>

      <div class="lg:col-span-2">
        <label for="tipoPago" class="block text-sm font-medium text-gray-700 mb-1">Forma de pago</label>
        <select
          id="tipoPago"
          bind:value={compra.TipoPago}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">Seleccionar</option>
          {#each formasPago as fp}
            <option value={fp.value}>{fp.label}</option>
          {/each}
        </select>
      </div>

      <div class="lg:col-span-2">
        <label for="fecha" class="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
        <input
          id="fecha"
          type="date"
          bind:value={compra.Fecha}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      <div class="lg:col-span-2">
        <label for="fechaPago" class="block text-sm font-medium text-gray-700 mb-1">Fecha de pago</label>
        <input
          id="fechaPago"
          type="date"
          bind:value={compra.FechaDePago}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-4">
      <div class="lg:col-span-3">
        <label for="remito" class="block text-sm font-medium text-gray-700 mb-1">Nº remito</label>
        <input
          id="remito"
          type="text"
          bind:value={compra.RemitoNro}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="Opcional"
        />
      </div>
      <div class="lg:col-span-3">
        <label for="ordenCompra" class="block text-sm font-medium text-gray-700 mb-1">Nº orden de compra</label>
        <input
          id="ordenCompra"
          type="text"
          bind:value={compra.OrdenCompraNro}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="Opcional"
        />
      </div>
      <div class="lg:col-span-6">
        <label for="observacion" class="block text-sm font-medium text-gray-700 mb-1">Observación</label>
        <input
          id="observacion"
          type="text"
          bind:value={compra.Observacion}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="Opcional"
        />
      </div>
    </div>
  </div>

  <!-- Importes -->
  <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
    <h2 class="text-lg font-semibold mb-4">Importes</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <div>
        <label for="importeBruto" class="block text-sm font-medium text-gray-700 mb-1">Importe bruto</label>
        <input
          id="importeBruto"
          type="number"
          step="0.01"
          min="0"
          bind:value={compra.ImporteBruto}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      <div>
        <label for="importeBonificado" class="block text-sm font-medium text-gray-700 mb-1">Importe bonificado</label>
        <input
          id="importeBonificado"
          type="number"
          step="0.01"
          min="0"
          bind:value={compra.ImporteBonificado}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      <div>
        <label for="importeNeto" class="block text-sm font-medium text-gray-700 mb-1">Importe neto</label>
        <input
          id="importeNeto"
          type="number"
          step="0.01"
          min="0"
          bind:value={compra.ImporteNeto}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      <div>
        <label for="importeAdicional" class="block text-sm font-medium text-gray-700 mb-1">Importe adicional</label>
        <input
          id="importeAdicional"
          type="number"
          step="0.01"
          min="0"
          bind:value={compra.ImporteAdicional}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      <div>
        <label for="importeIva1" class="block text-sm font-medium text-gray-700 mb-1">Importe IVA 1</label>
        <input
          id="importeIva1"
          type="number"
          step="0.01"
          min="0"
          bind:value={compra.ImporteIva1}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      <div>
        <label for="importeIva2" class="block text-sm font-medium text-gray-700 mb-1">Importe IVA 2</label>
        <input
          id="importeIva2"
          type="number"
          step="0.01"
          min="0"
          bind:value={compra.ImporteIva2}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      <div>
        <label for="percepcion" class="block text-sm font-medium text-gray-700 mb-1">Percepción</label>
        <input
          id="percepcion"
          type="number"
          step="0.01"
          min="0"
          bind:value={compra.Percepcion}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      <div>
        <label for="ingresosBrutos" class="block text-sm font-medium text-gray-700 mb-1">Ingresos brutos</label>
        <input
          id="ingresosBrutos"
          type="number"
          step="0.01"
          min="0"
          bind:value={compra.IngresosBrutos}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      <div>
        <label for="otros1" class="block text-sm font-medium text-gray-700 mb-1">Otros impuestos 1</label>
        <input
          id="otros1"
          type="number"
          step="0.01"
          min="0"
          bind:value={compra.OtrosImpuestos1}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      <div>
        <label for="otros2" class="block text-sm font-medium text-gray-700 mb-1">Otros impuestos 2</label>
        <input
          id="otros2"
          type="number"
          step="0.01"
          min="0"
          bind:value={compra.OtrosImpuestos2}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      <div>
        <label for="otros3" class="block text-sm font-medium text-gray-700 mb-1">Otros impuestos 3</label>
        <input
          id="otros3"
          type="number"
          step="0.01"
          min="0"
          bind:value={compra.OtrosImpuestos3}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
    </div>

    <div class="flex justify-end pt-4 border-t border-gray-200">
      <div class="w-80 space-y-2">
        <div class="flex justify-between text-sm">
          <span class="font-medium text-gray-700">Importe total *</span>
          <input
            type="number"
            step="0.01"
            min="0"
            bind:value={compra.ImporteTotal}
            class="w-32 px-2 py-1 text-right border border-gray-300 rounded"
          />
        </div>
        <div class="flex justify-between text-sm">
          <span class="font-medium text-gray-700">Importe pagado</span>
          <input
            type="number"
            step="0.01"
            min="0"
            bind:value={compra.ImportePagado}
            class="w-32 px-2 py-1 text-right border border-gray-300 rounded"
          />
        </div>
        <div class="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
          <span>Total:</span>
          <span>${fmt(compra.ImporteTotal)}</span>
        </div>
      </div>
    </div>
  </div>

  <p class="text-sm text-gray-500">
    Los ítems de la factura (detalle por artículo) se podrán cargar en un próximo sprint.
  </p>
</div>
