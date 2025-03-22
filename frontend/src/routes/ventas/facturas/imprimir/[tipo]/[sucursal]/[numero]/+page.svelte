<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { PUBLIC_API_URL } from '$env/static/public';
  import Button from '$lib/components/ui/Button.svelte';
  import PdfViewer from '$lib/components/documentos/PdfViewer.svelte';
  import DocumentToolbar from '$lib/components/documentos/DocumentToolbar.svelte';
  import { DocumentService } from '$lib/services/DocumentService';
  
  // Obtener parámetros de la URL
  const tipo = $page.params.tipo;
  const sucursal = $page.params.sucursal;
  const numero = $page.params.numero;
  
  // Estados
  let loading = true;
  let error: string | null = null;
  let factura: any = null;
  let pdfUrl: string | null = null;
  
  // Cargar datos de la factura
  async function cargarFactura() {
    try {
      loading = true;
      error = null;
      
      const response = await fetch(`${PUBLIC_API_URL}/facturas/${tipo}/${sucursal}/${numero}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar la factura');
      }
      
      factura = await response.json();
      
      // Generar PDF
      pdfUrl = await DocumentService.generarPDF(tipo, sucursal, numero);
      
    } catch (err) {
      console.error('Error cargando factura:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  }
  
  // Volver a la lista de facturas
  function volver() {
    goto('/ventas/facturas');
  }
  
  // Cargar datos al montar el componente
  onMount(() => {
    cargarFactura();
  });
</script>

<div class="container mx-auto px-4 py-6">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">
      Vista previa de factura {tipo}-{sucursal}-{numero}
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
    <!-- Barra de herramientas -->
    <DocumentToolbar 
      {pdfUrl}
      documentoTipo={tipo}
      documentoSucursal={sucursal}
      documentoNumero={numero}
    />
    
    <!-- Vista previa del PDF -->
    <PdfViewer {pdfUrl} />

    <!-- Buscar la línea 249 y agregar una verificación para evitar el error -->
    {#if factura && factura.data && factura.data.encabezado}
      <!-- Reemplazar la línea problemática con una versión segura -->
      <span>{factura.data.encabezado.ImporteTotal ? factura.data.encabezado.ImporteTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '$0,00'}</span>
    {:else}
      <span>$0,00</span>
    {/if}
  {/if}
</div> 