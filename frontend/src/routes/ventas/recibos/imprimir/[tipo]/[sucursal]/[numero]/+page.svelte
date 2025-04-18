<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { PUBLIC_API_URL } from '$env/static/public';
  import Button from '$lib/components/ui/Button.svelte';
  import { formatDate } from '$lib/utils/dateUtils';
  import html2pdf from 'html2pdf.js';
  import ReciboPDF from './ReciboPDF.svelte';

  // Obtener parámetros de la URL
  const tipo = $page.params.tipo;
  const sucursal = $page.params.sucursal;
  const numero = $page.params.numero;

  // Estado para los datos del recibo
  let recibo: any = null;
  let loading = true;
  let error: string | null = null;
  let contentRef: HTMLElement;
  let pdfContentRef: HTMLElement;

  // Cargar datos del recibo
  const cargarRecibo = async () => {
    try {
      loading = true;
      error = null;
      
      console.log('Cargando recibo:', { tipo, sucursal, numero });
      const response = await fetch(`${PUBLIC_API_URL}/recibos/${tipo}/${sucursal}/${numero}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error response:', errorData);
        
        if (response.status === 404) {
          throw new Error('Recibo no encontrado');
        }
        throw new Error(errorData?.message || 'Error al cargar el recibo');
      }
      
      recibo = await response.json();
      console.log('Recibo cargado:', recibo);
    } catch (err) {
      console.error('Error cargando recibo:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };

  // Función para imprimir el recibo
  const imprimirRecibo = () => {
    window.print();
  };

  // Función para generar PDF
  const generarPDF = async () => {
    if (!pdfContentRef) return;
    
    const opt = {
      margin: 10,
      filename: `recibo-${tipo}-${sucursal}-${numero}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: true
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    try {
      await html2pdf().set(opt).from(pdfContentRef).save();
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('Error al generar el PDF');
    }
  };

  // Función para compartir
  const compartirRecibo = async () => {
    if (!pdfContentRef) return;
    
    try {
      const opt = {
        margin: 10,
        filename: `recibo-${tipo}-${sucursal}-${numero}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      const pdf = await html2pdf().set(opt).from(pdfContentRef).output('blob');
      
      // Verificamos si el navegador soporta la API de compartir
      if (navigator.share) {
        const file = new File([pdf], `recibo-${tipo}-${sucursal}-${numero}.pdf`, { type: 'application/pdf' });
        await navigator.share({
          title: 'Recibo de Pago',
          text: `Recibo ${tipo}-${sucursal}-${numero}`,
          files: [file]
        });
      } else {
        // Si no soporta compartir, descargamos el PDF
        generarPDF();
      }
    } catch (err) {
      console.error('Error compartiendo recibo:', err);
      alert('Error al compartir el recibo');
    }
  };

  // Función para volver a la lista de recibos
  const volverALista = () => {
    goto('/ventas/recibos');
  };

  // Cargar datos al montar el componente
  onMount(() => {
    cargarRecibo();
  });
</script>

<div class="container mx-auto px-4 py-8">
  <!-- Botones de acción (no se imprimen) -->
  <div class="flex justify-between mb-6 print:hidden">
    <Button variant="secondary" on:click={volverALista}>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Volver
    </Button>
    <div class="flex gap-2">
      <Button variant="primary" on:click={imprimirRecibo}>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Imprimir
      </Button>
      <Button variant="primary" on:click={generarPDF}>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Descargar PDF
      </Button>
      <Button variant="primary" on:click={compartirRecibo}>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Compartir
      </Button>
    </div>
  </div>

  <!-- Contenido del recibo -->
  {#if loading}
    <div class="flex justify-center items-center py-12 print:hidden">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 print:hidden">
      <p>{error}</p>
    </div>
  {:else if recibo}
    <!-- Versión para pantalla -->
    <div bind:this={contentRef} class="bg-white rounded-lg shadow-sm p-8 max-w-4xl mx-auto print:shadow-none print:p-0">
      <!-- Encabezado del recibo -->
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold mb-2">RECIBO</h1>
        <p class="text-gray-600">Número: {recibo.DocumentoSucursal}-{recibo.DocumentoNumero}</p>
        <p class="text-gray-600">Fecha: {formatDate(recibo.Fecha)}</p>
        {#if recibo.FechaAnulacion}
          <div class="mt-2">
            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
              ANULADO
            </span>
            <p class="text-sm text-red-600 mt-1">Fecha de anulación: {formatDate(recibo.FechaAnulacion)}</p>
          </div>
        {/if}
      </div>

      <!-- Información del cliente -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold mb-2">Cliente</h2>
        <div class="border rounded p-4">
          <p class="font-medium">{recibo.ClienteRelacion?.Descripcion || 'Cliente no asignado'}</p>
          {#if recibo.ClienteRelacion?.NombreFantasia}
            <p class="text-gray-600">{recibo.ClienteRelacion.NombreFantasia}</p>
          {/if}
        </div>
      </div>

      <!-- Detalles del pago -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold mb-2">Detalles del Pago</h2>
        <div class="grid grid-cols-2 gap-4">
          <!-- Columna de Deuda -->
          <div class="border rounded overflow-hidden">
            <h3 class="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">Documentos de Deuda</h3>
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Importe</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#if recibo.Items && recibo.Items.length > 0}
                  {#each recibo.Items as item}
                    <tr>
                      <td class="px-4 py-2 whitespace-nowrap">
                        {item.FacturaTipo}-{item.FacturaSucursal}-{item.FacturaNumero}
                      </td>
                      <td class="px-4 py-2 whitespace-nowrap text-right">
                        {item.ImportePagado.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                      </td>
                    </tr>
                  {/each}
                {:else}
                  <tr>
                    <td colspan="2" class="px-4 py-2 text-center text-gray-500">No hay documentos de deuda</td>
                  </tr>
                {/if}
              </tbody>
            </table>
          </div>

          <!-- Columna de Pagos -->
          <div class="border rounded overflow-hidden">
            <h3 class="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">Documentos de Pago</h3>
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Importe</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#if recibo.Valores && recibo.Valores.length > 0}
                  {#each recibo.Valores as valor}
                    <tr>
                      <td class="px-4 py-2 whitespace-nowrap">
                        {valor.ValorCodigo}
                        {#if valor.ValorNumero}
                          - {valor.ValorNumero}
                        {/if}
                        {#if valor.Valorbanco}
                          ({valor.Valorbanco})
                        {/if}
                      </td>
                      <td class="px-4 py-2 whitespace-nowrap text-right">
                        {valor.ValorImporte.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                      </td>
                    </tr>
                  {/each}
                {:else}
                  <tr>
                    <td colspan="2" class="px-4 py-2 text-center text-gray-500">No hay documentos de pago</td>
                  </tr>
                {/if}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Total -->
        <div class="mt-4 border rounded p-4 bg-gray-50">
          <div class="flex justify-between items-center">
            <span class="font-medium">Total:</span>
            <span class="font-bold">
              {recibo.ImporteTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
            </span>
          </div>
        </div>
      </div>

      <!-- Observaciones -->
      {#if recibo.Observaciones}
        <div class="mb-8">
          <h2 class="text-lg font-semibold mb-2">Observaciones</h2>
          <div class="border rounded p-4">
            <p class="whitespace-pre-line">{recibo.Observaciones}</p>
          </div>
        </div>
      {/if}

      <!-- Pie del recibo -->
      <div class="mt-12 pt-8 border-t">
        <div class="grid grid-cols-2 gap-8">
          <div>
            <p class="text-center font-medium">Firma del Cliente</p>
            <div class="border-t border-dashed mt-16"></div>
          </div>
          <div>
            <p class="text-center font-medium">Firma del Empleado</p>
            <div class="border-t border-dashed mt-16"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Versión para PDF (oculta) -->
    <div class="hidden">
      <div bind:this={pdfContentRef}>
        <ReciboPDF {recibo} />
      </div>
    </div>
  {/if}
</div>

<style>
  @media print {
    :global(body) {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    
    .print\:hidden {
      display: none !important;
    }
    
    .container {
      padding: 0 !important;
      margin: 0 !important;
    }
    
    .bg-white {
      box-shadow: none !important;
    }

    @page {
      margin: 0.5cm;
    }
  }

  /* Estilos específicos para PDF */
  :global(.pdf-version) {
    background-color: #ffffff !important;
  }

  :global(.pdf-version .bg-gray-50) {
    background-color: #f9fafb !important;
  }

  :global(.pdf-version .bg-red-100) {
    background-color: #fee2e2 !important;
  }

  :global(.pdf-version .text-red-800) {
    color: #991b1b !important;
  }

  :global(.pdf-version .text-red-600) {
    color: #dc2626 !important;
  }

  :global(.pdf-version .text-gray-600) {
    color: #4b5563 !important;
  }

  :global(.pdf-version .text-gray-500) {
    color: #6b7280 !important;
  }

  :global(.pdf-version .border) {
    border-color: #e5e7eb !important;
  }

  :global(.pdf-version .border-t) {
    border-top-color: #e5e7eb !important;
  }
</style> 