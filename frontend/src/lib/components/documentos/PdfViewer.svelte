<script lang="ts">
  export let pdfUrl: string | null = null;
  export let height: string = "70vh";
</script>

{#if pdfUrl}
  <div class="bg-white rounded-lg shadow-sm overflow-hidden" style="height: {height};">
    <iframe 
      src={pdfUrl} 
      title="Vista previa de documento" 
      class="w-full h-full" 
      frameborder="0"
    ></iframe>
  </div>
{:else}
  <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
    <p>No se pudo generar la vista previa del documento.</p>
  </div>
{/if} 