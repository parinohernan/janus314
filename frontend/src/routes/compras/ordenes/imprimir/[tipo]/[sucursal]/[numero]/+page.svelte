<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import PdfViewer from '$lib/components/documentos/PdfViewer.svelte';
  import DocumentToolbar from '$lib/components/documentos/DocumentToolbar.svelte';
  import { DocumentService } from '$lib/services/DocumentService';

  const tipo = $page.params.tipo;
  const sucursal = $page.params.sucursal;
  const numero = $page.params.numero;

  let loading = true;
  let error: string | null = null;
  let pdfUrl: string | null = null;
  /** Solo OC: PDF con códigos/cantidades empresa (actual) o del proveedor */
  let vistaPdf: 'empresa' | 'proveedor' = 'empresa';

  function revocarPdfAnterior() {
    if (pdfUrl && pdfUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pdfUrl);
      pdfUrl = null;
    }
  }

  async function cargarPDF() {
    try {
      loading = true;
      error = null;
      revocarPdfAnterior();
      const opts =
        tipo === 'OC' ? { vista: vistaPdf === 'proveedor' ? ('proveedor' as const) : ('empresa' as const) } : undefined;
      pdfUrl = await DocumentService.generarPDF(tipo, sucursal, numero, opts);
    } catch (err) {
      console.error('Error generando PDF:', err);
      error = err instanceof Error ? err.message : 'Error al generar el PDF';
    } finally {
      loading = false;
    }
  }

  function volver() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      goto('/compras/ordenes');
    }
  }

  function onCambioVista() {
    void cargarPDF();
  }

  $: nombreArchivoDescarga =
    tipo === 'OC' && vistaPdf === 'proveedor'
      ? `${tipo}-${sucursal}-${numero}-proveedor.pdf`
      : `${tipo}-${sucursal}-${numero}.pdf`;

  onMount(() => {
    cargarPDF();
    return () => revocarPdfAnterior();
  });
</script>

<div class="container mx-auto px-4 py-6">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">
      Vista previa de orden de compra {tipo}-{sucursal}-{numero}
    </h1>
    <Button variant="secondary" on:click={volver}>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Volver
    </Button>
  </div>

  {#if tipo === 'OC'}
    <div class="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <span class="text-sm font-medium text-gray-700">Contenido del PDF:</span>
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="radio"
          name="vista-oc-pdf"
          value="empresa"
          bind:group={vistaPdf}
          on:change={onCambioVista}
          class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        Empresa (cliente)
      </label>
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="radio"
          name="vista-oc-pdf"
          value="proveedor"
          bind:group={vistaPdf}
          on:change={onCambioVista}
          class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        Proveedor (si hay relación; sin relación figura —)
      </label>
    </div>
  {/if}

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p>{error}</p>
    </div>
  {:else}
    <DocumentToolbar
      {pdfUrl}
      documentoTipo={tipo}
      documentoSucursal={sucursal}
      documentoNumero={numero}
      nombreArchivoPdf={nombreArchivoDescarga}
    />

    <PdfViewer {pdfUrl} />
  {/if}
</div>
