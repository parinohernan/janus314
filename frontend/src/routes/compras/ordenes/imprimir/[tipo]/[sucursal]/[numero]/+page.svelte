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

  async function cargarPDF() {
    try {
      loading = true;
      error = null;
      pdfUrl = await DocumentService.generarPDF(tipo, sucursal, numero);
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

  onMount(() => {
    cargarPDF();
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
    />

    <PdfViewer {pdfUrl} />
  {/if}
</div>
