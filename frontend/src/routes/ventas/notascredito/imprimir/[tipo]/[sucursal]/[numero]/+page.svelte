<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { PUBLIC_API_URL } from '$env/static/public';
  import Button from '$lib/components/ui/Button.svelte';
  import { goto } from '$app/navigation';

  // Obtener parámetros de la URL
  const { tipo, sucursal, numero } = $page.params;

  let loading = false;
  let error: string | null = null;

  onMount(async () => {
    try {
      loading = true;
      
      // Construir la URL para obtener el PDF
      const url = `${PUBLIC_API_URL}/notascredito/pdf/${tipo}/${sucursal}/${numero}`;
      
      // Realizar la solicitud para obtener el PDF
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Nota de crédito no encontrada');
        }
        throw new Error('Error al generar el PDF');
      }

      // Obtener el blob del PDF
      const blob = await response.blob();
      
      // Crear URL del blob
      const pdfUrl = URL.createObjectURL(blob);
      
      // Abrir el PDF en una nueva pestaña
      window.open(pdfUrl, '_blank');
      
      // Liberar el objeto URL después de un breve delay
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      
    } catch (err) {
      console.error('Error:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  });

  // Función para volver a la lista
  const volverALista = () => {
    goto('/ventas/notascredito');
  };
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">
      Imprimir Nota de Crédito {tipo}-{sucursal}-{numero}
    </h1>
    <Button variant="secondary" on:click={volverALista}>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
      </svg>
      Volver a la lista
    </Button>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      <span class="ml-3">Generando PDF...</span>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong class="font-bold">Error: </strong>
      <span class="block sm:inline">{error}</span>
    </div>
  {:else}
    <div class="bg-gray-50 p-4 rounded-lg text-center">
      <p class="text-gray-600">
        El PDF se abrirá en una nueva pestaña. Si no se abre automáticamente, 
        verifique que su navegador no esté bloqueando las ventanas emergentes.
      </p>
    </div>
  {/if}
</div> 