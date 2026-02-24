<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { formatDate } from '$lib/utils/dateUtils';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { EmpresaService } from '$lib/services/EmpresaService';
  import { auth } from '$lib/stores/authStore';
  import { get } from 'svelte/store';

  const DOC_TIPO = 'RCP';

  let loading = false;
  let error: string | null = null;
  let showCancelConfirm = false;

  let proveedoresOptions: { Codigo: string; Descripcion: string }[] = [];
  let proveedoresLoading = false;
  let proveedorSearch = '';
  let proveedorSeleccionado: { Codigo: string; Descripcion: string } | null = null;
  let timeoutProveedor: ReturnType<typeof setTimeout> | null = null;

  let fecha = new Date().toISOString().slice(0, 10);
  let documentoSucursal = '';
  let documentoNumero = '';

  let documentosDeuda: any[] = [];
  let loadingDocumentosDeuda = false;
  let documentosDeudaSeleccionados: any[] = [];
  let importesDeudaEditados: Record<string, number> = {};
  let importeTotalPagar = 0;

  let documentosCredito: any[] = [];
  let documentosCreditoSeleccionados: any[] = [];
  let importesCreditoEditados: Record<string, number> = {};
  let importeTotalCredito = 0;

  let tiposPagoOptions: { Codigo: string; Descripcion: string }[] = [];
  let formasPago: { Codigo: string; Descripcion?: string; Importe: number; Numero?: string; Banco?: string; Fecha?: string }[] = [];
  let importeTotalFormasPago = 0;
  let mostrarFormaPagoForm = false;
  let nuevaFormaPago = { Codigo: 'EFE', Importe: 0, Numero: '', Banco: '', Fecha: fecha };
  let errorFormaPago: string | null = null;

  $: saldoPendiente = importeTotalPagar - importeTotalCredito - importeTotalFormasPago;
  $: saldoCero = Math.abs(saldoPendiente) < 0.01;

  function getDocKey(doc: any) {
    return `${doc.DocumentoTipo}-${doc.DocumentoSucursal}-${doc.DocumentoNumero}`;
  }
  function isDocDeudaSeleccionado(doc: any) {
    return documentosDeudaSeleccionados.some((d) => getDocKey(d) === getDocKey(doc));
  }
  function getImporteDeuda(doc: any) {
    const key = getDocKey(doc);
    const saldo = (doc.ImporteTotal || 0) - (doc.ImportePagado || 0);
    return importesDeudaEditados[key] !== undefined ? importesDeudaEditados[key] : saldo;
  }
  function toggleDocDeuda(doc: any) {
    const key = getDocKey(doc);
    const idx = documentosDeudaSeleccionados.findIndex((d) => getDocKey(d) === key);
    if (idx === -1) {
      documentosDeudaSeleccionados = [...documentosDeudaSeleccionados, doc];
      const saldo = (doc.ImporteTotal || 0) - (doc.ImportePagado || 0);
      importesDeudaEditados[key] = saldo;
    } else {
      documentosDeudaSeleccionados = documentosDeudaSeleccionados.filter((_, i) => i !== idx);
      const next = { ...importesDeudaEditados };
      delete next[key];
      importesDeudaEditados = next;
    }
    importeTotalPagar = documentosDeudaSeleccionados.reduce(
      (s, d) => s + (importesDeudaEditados[getDocKey(d)] ?? 0),
      0
    );
  }
  function setImporteDeuda(doc: any, val: number) {
    const key = getDocKey(doc);
    const saldo = (doc.ImporteTotal || 0) - (doc.ImportePagado || 0);
    importesDeudaEditados[key] = Math.min(Math.max(0, val), saldo);
    importesDeudaEditados = { ...importesDeudaEditados };
    importeTotalPagar = documentosDeudaSeleccionados.reduce(
      (s, d) => s + (importesDeudaEditados[getDocKey(d)] ?? 0),
      0
    );
  }

  function isDocCreditoSeleccionado(doc: any) {
    return documentosCreditoSeleccionados.some((d) => d.documento === doc.documento);
  }
  function getImporteCredito(doc: any) {
    return importesCreditoEditados[doc.documento] !== undefined ? importesCreditoEditados[doc.documento] : doc.saldo;
  }
  function toggleDocCredito(doc: any) {
    const idx = documentosCreditoSeleccionados.findIndex((d) => d.documento === doc.documento);
    if (idx === -1) {
      documentosCreditoSeleccionados = [...documentosCreditoSeleccionados, doc];
      importesCreditoEditados[doc.documento] = doc.saldo;
    } else {
      documentosCreditoSeleccionados = documentosCreditoSeleccionados.filter((_, i) => i !== idx);
      const next = { ...importesCreditoEditados };
      delete next[doc.documento];
      importesCreditoEditados = next;
    }
    importeTotalCredito = documentosCreditoSeleccionados.reduce(
      (s, d) => s + (importesCreditoEditados[d.documento] ?? 0),
      0
    );
  }
  function setImporteCredito(doc: any, val: number) {
    importesCreditoEditados[doc.documento] = Math.min(Math.max(0, val), doc.saldo);
    importesCreditoEditados = { ...importesCreditoEditados };
    importeTotalCredito = documentosCreditoSeleccionados.reduce(
      (s, d) => s + (importesCreditoEditados[d.documento] ?? 0),
      0
    );
  }

  const buscarProveedores = async (q: string) => {
    if (timeoutProveedor) clearTimeout(timeoutProveedor);
    if (!q || q.length < 2) {
      proveedoresOptions = [];
      return;
    }
    proveedoresLoading = true;
    timeoutProveedor = setTimeout(async () => {
      try {
        const res = await fetchWithAuth('/proveedores', { params: { search: q, limit: 15 } });
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
    proveedorSeleccionado = p;
    proveedorSearch = p.Descripcion;
    proveedoresOptions = [];
    cargarDocumentos(p.Codigo);
  };

  const cargarDocumentos = async (codigo: string) => {
    if (!codigo) return;
    loadingDocumentosDeuda = true;
    documentosDeuda = [];
    documentosCredito = [];
    documentosDeudaSeleccionados = [];
    documentosCreditoSeleccionados = [];
    importesDeudaEditados = {};
    importesCreditoEditados = {};
    importeTotalPagar = 0;
    importeTotalCredito = 0;
    try {
      const [rD, rC] = await Promise.all([
        fetchWithAuth(`/proveedores-recibos/docdeuda/${encodeURIComponent(codigo)}`),
        fetchWithAuth(`/proveedores-recibos/doccredito/${encodeURIComponent(codigo)}`)
      ]);
      const dataD = await rD.json();
      const dataC = await rC.json();
      documentosDeuda = dataD.data || [];
      documentosCredito = dataC.data || [];
    } finally {
      loadingDocumentosDeuda = false;
    }
  };

  const obtenerProximoNumero = async () => {
    try {
      const sucursal = await EmpresaService.obtenerSucursal();
      documentoSucursal = sucursal || '01';
      const res = await fetchWithAuth(`/numeros-control/${DOC_TIPO}/${documentoSucursal}`);
      if (res.ok) {
        const data = await res.json();
        documentoNumero = (data.data?.proximoNumero || '00000001').toString().padStart(8, '0');
      }
    } catch (_) {}
  };

  const cargarTiposPago = async () => {
    const res = await fetchWithAuth('/tipos-pago', { params: { limit: 50 } });
    if (!res.ok) return;
    const data = await res.json();
    tiposPagoOptions = data.items || [];
    if (tiposPagoOptions.length > 0) nuevaFormaPago.Codigo = tiposPagoOptions[0].Codigo;
  };

  const agregarFormaPago = () => {
    if (nuevaFormaPago.Importe <= 0) {
      errorFormaPago = 'El importe debe ser mayor a 0';
      return;
    }
    if (nuevaFormaPago.Importe > saldoPendiente) {
      errorFormaPago = `El importe no puede exceder el saldo pendiente (${saldoPendiente.toFixed(2)})`;
      return;
    }
    errorFormaPago = null;
    const desc = tiposPagoOptions.find((t) => t.Codigo === nuevaFormaPago.Codigo)?.Descripcion ?? nuevaFormaPago.Codigo;
    formasPago = [
      ...formasPago,
      {
        Codigo: nuevaFormaPago.Codigo,
        Descripcion: desc,
        Importe: nuevaFormaPago.Importe,
        Numero: nuevaFormaPago.Numero,
        Banco: nuevaFormaPago.Banco,
        Fecha: nuevaFormaPago.Fecha || fecha
      }
    ];
    importeTotalFormasPago = formasPago.reduce((s, f) => s + (f.Importe || 0), 0);
    nuevaFormaPago = { Codigo: nuevaFormaPago.Codigo, Importe: 0, Numero: '', Banco: '', Fecha: fecha };
    mostrarFormaPagoForm = false;
  };

  const quitarFormaPago = (i: number) => {
    formasPago = formasPago.filter((_, idx) => idx !== i);
    importeTotalFormasPago = formasPago.reduce((s, f) => s + (f.Importe || 0), 0);
  };

  const handleCancel = () => {
    showCancelConfirm = true;
  };
  const confirmCancel = () => {
    showCancelConfirm = false;
    goto('/compras/recibos');
  };

  const grabar = async () => {
    if (!proveedorSeleccionado) {
      error = 'Seleccione un proveedor';
      return;
    }
    if (documentosDeudaSeleccionados.length === 0) {
      error = 'Seleccione al menos un documento a pagar';
      return;
    }
    if (!saldoCero) {
      error = 'El total de formas de pago debe coincidir con el importe a pagar';
      return;
    }
    const docsDeuda = documentosDeudaSeleccionados.map((d) => ({
      DocumentoTipo: d.DocumentoTipo,
      DocumentoSucursal: d.DocumentoSucursal,
      DocumentoNumero: d.DocumentoNumero,
      Importe: importesDeudaEditados[getDocKey(d)] ?? 0
    }));
    const body = {
      DocumentoTipo: DOC_TIPO,
      DocumentoSucursal: documentoSucursal,
      DocumentoNumero: documentoNumero.toString().padStart(8, '0'),
      Fecha: fecha,
      ProveedorCodigo: proveedorSeleccionado.Codigo,
      DocumentosDeuda: docsDeuda,
      DocumentosCredito: documentosCreditoSeleccionados.map((d) => ({
        Documento: d.documento,
        Importe: importesCreditoEditados[d.documento] ?? 0
      })),
      FormasPago: formasPago.map((f) => ({
        Codigo: f.Codigo,
        Importe: f.Importe,
        Numero: f.Numero,
        Banco: f.Banco,
        Fecha: f.Fecha || fecha
      })),
      ImporteTotal: importeTotalPagar - importeTotalCredito,
      VendedorCodigo: get(auth)?.user?.usuario || '1'
    };
    loading = true;
    error = null;
    try {
      const res = await fetchWithAuth('/proveedores-recibos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Error al grabar');
      goto('/compras/recibos');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al grabar';
    } finally {
      loading = false;
    }
  };

  onMount(() => {
    cargarTiposPago();
    obtenerProximoNumero();
  });
</script>

<svelte:head>
  <title>Nuevo comprobante de pago (recibo)</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">Nuevo comprobante de pago (recibo)</h1>

    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>{error}</p>
      </div>
    {/if}

    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Proveedor -->
        <div class="md:col-span-1 relative">
          <label for="proveedor-search" class="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
          <div class="relative">
            <input
              id="proveedor-search"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm pr-10"
              placeholder="Buscar proveedor..."
              bind:value={proveedorSearch}
              on:input={() => buscarProveedores(proveedorSearch)}
              on:focus={() => proveedorSeleccionado && (proveedorSearch = '')}
              disabled={!!proveedorSeleccionado}
              autocomplete="off"
            />
            {#if proveedoresLoading}
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            {/if}
            {#if proveedoresOptions.length > 0 && !proveedorSeleccionado}
              <div class="absolute z-10 mt-1 w-full bg-white border border-gray-300 shadow-lg rounded-md max-h-60 overflow-auto">
                {#each proveedoresOptions as p}
                  <button
                    type="button"
                    class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                    on:click={() => seleccionarProveedor(p)}
                  >
                    <div class="font-medium">{p.Descripcion}</div>
                    <div class="text-xs text-gray-500">Código: {p.Codigo}</div>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
          {#if proveedorSeleccionado}
            <div class="mt-2 p-2 bg-blue-50 rounded-md flex justify-between items-center">
              <div>
                <p class="font-medium">{proveedorSeleccionado.Descripcion}</p>
                <p class="text-sm text-gray-600">Código: {proveedorSeleccionado.Codigo}</p>
              </div>
              <button
                type="button"
                class="text-sm text-blue-600 hover:text-blue-800"
                on:click={() => {
                  proveedorSeleccionado = null;
                  proveedorSearch = '';
                  documentosDeuda = [];
                  documentosCredito = [];
                }}
              >
                Cambiar
              </button>
            </div>
          {/if}
        </div>

        <!-- Datos del comprobante -->
        <div class="md:col-span-1">
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label for="tipo-doc" class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <Input id="tipo-doc" value={DOC_TIPO} disabled className="bg-gray-100" />
            </div>
            <div>
              <label for="numero-doc" class="block text-sm font-medium text-gray-700 mb-1">Número</label>
              <Input
                id="numero-doc"
                value={documentoSucursal && documentoNumero ? `${documentoSucursal}-${documentoNumero}` : 'Cargando...'}
                disabled
                className="bg-gray-100"
              />
            </div>
            <div>
              <label for="fecha-recibo" class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                id="fecha-recibo"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                bind:value={fecha}
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Documentos de deuda -->
      <div class="mt-6 border-t pt-6">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-lg font-medium text-gray-900">Documentos de deuda (facturas / ND)</h3>
          {#if proveedorSeleccionado}
            <button
              type="button"
              class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              on:click={() => cargarDocumentos(proveedorSeleccionado!.Codigo)}
              disabled={loadingDocumentosDeuda}
            >
              {loadingDocumentosDeuda ? 'Cargando...' : 'Recargar'}
            </button>
          {/if}
        </div>
        {#if !proveedorSeleccionado}
          <div class="h-20 flex items-center justify-center bg-gray-100 rounded">
            <span class="text-gray-500">Seleccione un proveedor</span>
          </div>
        {:else if loadingDocumentosDeuda}
          <div class="h-20 flex items-center justify-center bg-gray-100 rounded">
            <span class="text-gray-500">Cargando documentos...</span>
          </div>
        {:else if documentosDeuda.length === 0}
          <div class="h-20 flex items-center justify-center bg-gray-100 rounded">
            <span class="text-gray-500">No hay documentos con saldo</span>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Importe total</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Importe pagado</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Importe a pagar</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each documentosDeuda as doc}
                  {@const saldo = (doc.ImporteTotal || 0) - (doc.ImportePagado || 0)}
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.DocumentoTipo}-{doc.DocumentoSucursal}-{doc.DocumentoNumero}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(doc.Fecha)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(doc.ImporteTotal || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(doc.ImportePagado || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {#if isDocDeudaSeleccionado(doc)}
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={saldo}
                          class="w-24 rounded-md border border-gray-300 shadow-sm text-sm"
                          value={getImporteDeuda(doc)}
                          on:input={(e) => setImporteDeuda(doc, parseFloat((e.target as HTMLInputElement).value) || 0)}
                        />
                      {:else}
                        {saldo.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                      {/if}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        type="button"
                        class={`px-3 py-1 rounded-md ${isDocDeudaSeleccionado(doc) ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50'}`}
                        on:click={() => toggleDocDeuda(doc)}
                      >
                        {isDocDeudaSeleccionado(doc) ? 'Quitar' : 'Seleccionar'}
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
              <tfoot class="bg-gray-50">
                <tr>
                  <td colspan="4" class="px-6 py-4 text-right text-sm font-medium text-gray-900">Total a pagar:</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    {importeTotalPagar.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        {/if}
      </div>

      <!-- Documentos de crédito -->
      {#if proveedorSeleccionado && documentosCredito.length > 0}
        <div class="mt-6 border-t pt-6">
          <h3 class="text-lg font-medium text-gray-900 mb-2">Documentos de crédito (notas de crédito)</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Importe a usar</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each documentosCredito as doc}
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.documento}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(doc.saldo || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {#if isDocCreditoSeleccionado(doc)}
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={doc.saldo}
                          class="w-24 rounded-md border border-gray-300 shadow-sm text-sm"
                          value={getImporteCredito(doc)}
                          on:input={(e) => setImporteCredito(doc, parseFloat((e.target as HTMLInputElement).value) || 0)}
                        />
                      {:else}
                        —
                      {/if}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        type="button"
                        class={`px-3 py-1 rounded-md ${isDocCreditoSeleccionado(doc) ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50'}`}
                        on:click={() => toggleDocCredito(doc)}
                      >
                        {isDocCreditoSeleccionado(doc) ? 'Quitar' : 'Seleccionar'}
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
              <tfoot class="bg-gray-50">
                <tr>
                  <td class="px-6 py-4 text-right text-sm font-medium text-gray-900">Total crédito:</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {importeTotalCredito.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                  </td>
                  <td></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      {/if}

      <!-- Formas de pago -->
      <div class="mt-6 border-t pt-6">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-lg font-medium text-gray-900">Formas de pago</h3>
          <button
            type="button"
            class="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            on:click={() => { mostrarFormaPagoForm = !mostrarFormaPagoForm; errorFormaPago = null; }}
          >
            {mostrarFormaPagoForm ? 'Cancelar' : 'Agregar forma de pago'}
          </button>
        </div>
        {#if errorFormaPago}
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">{errorFormaPago}</div>
        {/if}
        {#if mostrarFormaPagoForm}
          <div class="bg-gray-50 p-4 rounded-md mb-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label for="fp-tipo" class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  id="fp-tipo"
                  class="block w-full rounded-md border-gray-300 shadow-sm text-sm"
                  bind:value={nuevaFormaPago.Codigo}
                >
                  {#each tiposPagoOptions as t}
                    <option value={t.Codigo}>{t.Descripcion || t.Codigo}</option>
                  {/each}
                  {#if tiposPagoOptions.length === 0}
                    <option value="EFE">Efectivo</option>
                  {/if}
                </select>
              </div>
              <div>
                <label for="fp-importe" class="block text-sm font-medium text-gray-700 mb-1">Importe</label>
                <input
                  id="fp-importe"
                  type="number"
                  step="0.01"
                  min="0"
                  class="block w-full rounded-md border-gray-300 shadow-sm text-sm"
                  bind:value={nuevaFormaPago.Importe}
                />
              </div>
              <div class="flex items-end">
                <button type="button" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm" on:click={agregarFormaPago}>
                  Agregar
                </button>
              </div>
            </div>
          </div>
        {/if}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Importe</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adjuntar comprobante (imagen)</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each formasPago as fp, i}
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fp.Descripcion || fp.Codigo}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(fp.Importe || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-amber-600 font-medium">Próximamente</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button type="button" class="text-red-600 hover:text-red-800" on:click={() => quitarFormaPago(i)}>Eliminar</button>
                  </td>
                </tr>
              {/each}
            </tbody>
            <tfoot class="bg-gray-50">
              <tr>
                <td class="px-6 py-4 text-right text-sm font-medium text-gray-900">Total formas de pago:</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                  {importeTotalFormasPago.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                </td>
                <td></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Resumen -->
      <div class="mt-6 border-t pt-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Resumen</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-gray-50 p-4 rounded-md">
            <div class="flex justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">Total documentos deuda:</span>
              <span class="text-sm font-medium text-red-600">{importeTotalPagar.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</span>
            </div>
            <div class="flex justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">Total crédito:</span>
              <span class="text-sm font-medium text-blue-600">-{importeTotalCredito.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</span>
            </div>
            <div class="flex justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">Total formas de pago:</span>
              <span class="text-sm font-medium text-green-600">-{importeTotalFormasPago.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</span>
            </div>
            <div class="flex justify-between pt-2 border-t">
              <span class="text-sm font-medium text-gray-900">Saldo pendiente:</span>
              <span class="text-sm font-medium {saldoPendiente > 0 ? 'text-red-600' : 'text-green-600'}">
                {saldoPendiente.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <Button variant="secondary" on:click={handleCancel} disabled={loading}>Cancelar</Button>
        <Button variant="primary" on:click={grabar} disabled={loading || !proveedorSeleccionado || !saldoCero}>
          {loading ? 'Grabando...' : 'Grabar'}
        </Button>
      </div>
    </div>
  </div>
</div>

<!-- Modal cancelar -->
{#if showCancelConfirm}
  <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
      <h3 class="text-lg font-medium text-gray-900 mb-4">¿Cancelar?</h3>
      <p class="text-sm text-gray-500 mb-6">Se perderán los datos ingresados.</p>
      <div class="flex justify-end gap-3">
        <Button variant="secondary" on:click={() => (showCancelConfirm = false)}>No, continuar</Button>
        <Button variant="primary" on:click={confirmCancel}>Sí, cancelar</Button>
      </div>
    </div>
  </div>
{/if}
