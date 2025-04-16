<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { formatDate } from '$lib/utils/dateUtils';

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  interface Comprobante {
    Fecha: string;
    Detalle: string;
    Debitos: number;
    Creditos: number;
    Saldo: number;
  }

  interface Pagination {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  }

  let comprobantes: Comprobante[] = [];
  let loading = true;
  let error: string | null = null;
  let clienteDescripcion = '';
  let clienteCodigo = '';
  let saldoTotal = 0;

  let pagination: Pagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  };

  let showModal = false;
  let reportText = '';

  const loadComprobantes = async (): Promise<void> => {
    try {
      loading = true;
      error = null;
      
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString()
      });
      
      const response = await fetch(`${PUBLIC_API_URL}/clientes/${$page.params.id}/comprobantes?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar los comprobantes');
      }
      
      const data = await response.json();
      comprobantes = data.items || [];
      
      // Calcular saldo total
      saldoTotal = comprobantes.length > 0 ? comprobantes[0].Saldo : 0;

      // Actualizar la paginación con los datos del servidor
      pagination = {
        currentPage: parseInt(data.meta?.currentPage || pagination.currentPage, 10),
        totalPages: parseInt(data.meta?.totalPages || 1, 10),
        totalItems: parseInt(data.meta?.totalItems || 0, 10),
        limit: parseInt(data.meta?.itemsPerPage || pagination.limit, 10)
      };

      // Obtener la descripción del cliente
      const clienteResponse = await fetch(`${PUBLIC_API_URL}/clientes/${$page.params.id}`);
      if (clienteResponse.ok) {
        const clienteData = await clienteResponse.json();
        clienteDescripcion = clienteData.Descripcion;
        clienteCodigo = clienteData.Codigo;
      }
      
    } catch (err: unknown) {
      console.error('Error cargando comprobantes:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };

  const goToPage = (page: number): void => {
    if (page < 1 || page > pagination.totalPages) return;
    pagination.currentPage = page;
    loadComprobantes();
  };

  const handleLimitChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    pagination.limit = parseInt(target.value, 10);
    pagination.currentPage = 1;
    loadComprobantes();
  };

  async function generateAndShowReport() {
    reportText = '';
    reportText += `CUENTA CORRIENTE - ${clienteDescripcion}\n`;
    reportText += `Fecha: ${new Date().toLocaleDateString()}\n`;
    reportText += `----------------------------------------\n`;
    reportText += `Saldo: ${formatCurrency(saldoTotal)}\n`;
    reportText += `----------------------------------------\n\n`;
    
    reportText += `DETALLE DE MOVIMIENTOS:\n`;
    reportText += `----------------------------------------\n`;
    
    comprobantes.forEach(comp => {
      reportText += `${formatDate(comp.Fecha)} | ${comp.Detalle}\n`;
      reportText += `Débitos: ${formatCurrency(comp.Debitos)} | Créditos: ${formatCurrency(comp.Creditos)}\n`;
      reportText += `Saldo: ${formatCurrency(comp.Saldo)}\n`;
      reportText += `----------------------------------------\n`;
    });
    
    showModal = true;
  }

  async function shareReport() {
    try {
      if (navigator.share) {
        const blob = new Blob([reportText], { type: 'text/plain' });
        const file = new File([blob], `cuenta_corriente_${clienteCodigo}.txt`, { type: 'text/plain' });
        
        await navigator.share({
          title: `Cuenta Corriente - ${clienteDescripcion}`,
          text: 'Reporte de cuenta corriente',
          files: [file]
        });
      } else {
        // Fallback para navegadores que no soportan Web Share API
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportText));
        element.setAttribute('download', `cuenta_corriente_${clienteCodigo}.txt`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  }

  onMount(() => {
    loadComprobantes();
  });
</script>

<svelte:head>
  <title>Detalles de Cuentas Corrientes - {clienteDescripcion}</title>
</svelte:head>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-4">
    <div>
      <h1 class="text-2xl font-bold">Detalle de cuentas corrientes</h1>
      <h1 class="text-2xl font-bold">{clienteDescripcion} - {clienteCodigo}</h1>
    </div>
    <div class="flex gap-2">
      <Button variant="secondary" on:click={generateAndShowReport}>
        Generar Reporte
      </Button>
      <Button variant="secondary" on:click={() => goto('/clientes/cuentascorrientes')}>
        Volver
      </Button>
    </div>
  </div>

  <div class="mb-4 bg-white p-4 rounded-lg shadow-sm">
    <div class="flex justify-end">
      <div class="w-48">
        <label for="limit" class="block text-sm font-medium text-gray-700 mb-1">Mostrar</label>
        <select
          id="limit"
          bind:value={pagination.limit}
          on:change={handleLimitChange}
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={5}>5 por página</option>
          <option value={10}>10 por página</option>
          <option value={25}>25 por página</option>
          <option value={50}>50 por página</option>
        </select>
      </div>
    </div>
  </div>

  {#if loading}
    <div class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      <p class="mt-2 text-gray-600">Cargando comprobantes...</p>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p class="font-bold">Error al cargar los datos</p>
      <p>{error}</p>
      <button 
        class="mt-2 bg-red-200 hover:bg-red-300 text-red-800 px-3 py-1 rounded"
        on:click={loadComprobantes}>
        Reintentar
      </button>
    </div>
  {:else if comprobantes.length === 0}
    <div class="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-8 rounded mb-4 text-center">
      <p>No hay comprobantes para mostrar</p>
    </div>
  {:else}
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalle</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Débitos</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Créditos</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each comprobantes as comprobante}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                {formatDate(comprobante.Fecha)}
              </td>
              <td class="px-6 py-4">
                {comprobante.Detalle}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                ${comprobante.Debitos.toFixed(2)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                ${comprobante.Creditos.toFixed(2)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                ${comprobante.Saldo.toFixed(2)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    {#if pagination.totalPages > 1}
      <div class="mt-4">
        <div class="flex justify-between items-center text-sm">
          <div class="text-gray-600">
            Mostrando {(pagination.currentPage - 1) * pagination.limit + 1} a {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} de {pagination.totalItems} comprobantes
          </div>
          
          <div class="flex space-x-1">
            <button 
              class="px-3 py-1 rounded border {pagination.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}"
              on:click={() => goToPage(1)}
              disabled={pagination.currentPage === 1}
            >
              &laquo;
            </button>
            
            <button 
              class="px-3 py-1 rounded border {pagination.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}"
              on:click={() => goToPage(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              &lsaquo;
            </button>
            
            {#each Array(Math.min(5, pagination.totalPages)) as _, i}
              {@const pageNum = pagination.currentPage <= 3 
                ? i + 1 
                : pagination.currentPage >= pagination.totalPages - 2 
                  ? pagination.totalPages - 4 + i 
                  : pagination.currentPage - 2 + i}
              
              {#if pageNum > 0 && pageNum <= pagination.totalPages}
                <button 
                  class="px-3 py-1 rounded border {pageNum === pagination.currentPage ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white hover:bg-gray-50'}"
                  on:click={() => goToPage(pageNum)}
                >
                  {pageNum}
                </button>
              {/if}
            {/each}
            
            <button 
              class="px-3 py-1 rounded border {pagination.currentPage === pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}"
              on:click={() => goToPage(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              &rsaquo;
            </button>
            
            <button 
              class="px-3 py-1 rounded border {pagination.currentPage === pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}"
              on:click={() => goToPage(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>
    {/if}
  {/if}

  <!-- Agregar el modal al final del archivo -->
  {#if showModal}
    <button 
      class="modal-backdrop" 
      on:click={() => showModal = false}
      aria-label="Cerrar modal"
    
    ></button>
    <div 
      class="modal" 
      role="dialog" 
      aria-labelledby="modal-title"
      aria-modal="true"
    >
      <div class="modal-content">
        <h3 id="modal-title">Reporte de Cuenta Corriente</h3>
        <pre class="report-text">{reportText}</pre>
        <div class="modal-actions">
          <Button variant="secondary" on:click={() => showModal = false}>
            Cerrar
          </Button>
          <Button variant="primary" on:click={shareReport}>
            Compartir
          </Button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }

  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 2rem;
    border-radius: 8px;
    z-index: 1001;
    max-width: 80%;
    max-height: 80vh;
    overflow-y: auto;
  }

  .modal-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .report-text {
    white-space: pre-wrap;
    font-family: monospace;
    background: #f5f5f5;
    padding: 1rem;
    border-radius: 4px;
    max-height: 50vh;
    overflow-y: auto;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1rem;
  }
</style> 