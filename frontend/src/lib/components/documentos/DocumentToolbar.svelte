<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import { DocumentService } from '$lib/services/DocumentService';
  
  export let pdfUrl: string | null = null;
  export let documentoTipo: string = '';
  export let documentoSucursal: string = '';
  export let documentoNumero: string = '';
  
  // Funciones para manejar acciones
  function imprimir() {
    if (pdfUrl) {
      DocumentService.imprimirPDF(pdfUrl);
    }
  }
  
  function descargar() {
    if (pdfUrl) {
      DocumentService.descargarPDF(
        pdfUrl, 
        `${documentoTipo}-${documentoSucursal}-${documentoNumero}.pdf`
      );
    }
  }
  
  async function compartir() {
    if (!pdfUrl) return;
    
    const resultado = await DocumentService.compartirPDF(
      pdfUrl,
      `${documentoTipo}-${documentoSucursal}-${documentoNumero}`,
      `${documentoTipo}-${documentoSucursal}-${documentoNumero}.pdf`
    );
    
    if (!resultado) {
      alert('La función de compartir no está disponible en este navegador');
    }
  }
</script>

<div class="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-wrap gap-2">
  <Button variant="primary" on:click={imprimir} disabled={!pdfUrl}>
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
    Imprimir
  </Button>
  
  <Button variant="secondary" on:click={descargar} disabled={!pdfUrl}>
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
    Descargar
  </Button>
  
  <Button variant="secondary" on:click={compartir} disabled={!pdfUrl}>
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
    Compartir
  </Button>
  
  <slot></slot>
</div> 