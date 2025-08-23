<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import Pagination from '$lib/components/ui/Pagination.svelte';
  import { ClienteService, type Comprobante } from '$lib/services/ClienteService';
  import { DatosEmpresaService, type DatosEmpresa } from '$lib/services/DatosEmpresaService';
  
  const clienteId = $page.params.id;
  let comprobantes: Comprobante[] = [];
  let clienteNombre = '';
  let saldoTotal = 0;
  let loading = true;
  let error: string | null = null;
  let datosEmpresa: DatosEmpresa | null = null;
  let cliente: any = null;
  
  // Variables de paginación
  let currentPage = 1;
  let totalPages = 1;
  let totalItems = 0;
  let itemsPerPage = 10;
  
  const itemsPerPageOptions = [10, 25, 50, 100];
  

  
  const loadData = async (page: number = 1): Promise<void> => {
    try {
      loading = true;
      error = null;
      
      // Cargar datos de la empresa
      datosEmpresa = await DatosEmpresaService.obtenerDatosEmpresa();
      
      // Buscar el cliente para obtener su nombre
      const clientesResult = await ClienteService.obtenerCuentasCorrientes({
        page: 1,
        limit: 100, 
        search: clienteId,
        field: 'Codigo',
        order: 'ASC'
      });
      
      cliente = clientesResult.items.find(c => c.Codigo === clienteId);
      if (cliente) {
        clienteNombre = cliente.Descripcion;
        saldoTotal = cliente.Saldo;
      }
      
      // Cargar los comprobantes con paginación
      const comprobantesResult = await ClienteService.obtenerComprobantes(clienteId, {
        page,
        limit: itemsPerPage,
        search: '',
        field: 'Fecha',
        order: 'DESC'
      });
      
      comprobantes = comprobantesResult.items;
      currentPage = comprobantesResult.currentPage;
      totalPages = comprobantesResult.totalPages;
      totalItems = comprobantesResult.totalItems;
      
    } catch (err: unknown) {
      console.error('Error cargando datos:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };
  
  const handlePageChange = (event: CustomEvent<{ page: number }>) => {
    loadData(event.detail.page);
  };
  
  const handleItemsPerPageChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    itemsPerPage = parseInt(target.value);
    loadData(1); // Volver a la primera página
  };
  
  onMount(() => {
    loadData(1);
  });
  
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR');
  };
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-AR', { 
      style: 'currency', 
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Función para imprimir la cuenta corriente
  const imprimirCuentaCorriente = () => {
    window.print();
  };

  // Función para generar PDF usando el backend
  const generarPDF = async () => {
    try {
      await ClienteService.generarPDFCuentaCorriente(clienteId);
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('Error al generar el PDF');
    }
  };

  // Función para compartir
  const compartirCuentaCorriente = async () => {
    try {
      // Generar PDF usando el backend
      const response = await fetch(`/api/clientes/${clienteId}/cuenta-corriente/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al generar el PDF');
      }

      const blob = await response.blob();
      
      // Verificamos si el navegador soporta la API de compartir
      if (navigator.share) {
        const file = new File([blob], `cuenta-corriente-${clienteId}.pdf`, { type: 'application/pdf' });
        await navigator.share({
          title: 'Cuenta Corriente',
          text: `Cuenta corriente de ${clienteNombre}`,
          files: [file]
        });
      } else {
        // Si no soporta compartir, descargamos el PDF
        generarPDF();
      }
    } catch (err) {
      console.error('Error compartiendo cuenta corriente:', err);
      alert('Error al compartir la cuenta corriente');
    }
  };

  // Función para generar PDF de prueba (sin autenticación)
  const generarPDFPrueba = async () => {
    try {
      await ClienteService.generarPDFCuentaCorrientePrueba(clienteId);
    } catch (err) {
      console.error('Error generando PDF de prueba:', err);
      alert('Error al generar el PDF de prueba');
    }
  };
</script>

<svelte:head>
  <title>Cuenta Corriente: {clienteNombre || clienteId}</title>
</svelte:head>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-4">
    <div>
      <Button 
        variant="secondary" 
        size="sm" 
        on:click={() => goto('/clientes/cuentascorrientes')}
      >
        Volver a Cuentas Corrientes
      </Button>
    </div>
    <div class="flex gap-2 print:hidden">
      <Button variant="primary" on:click={imprimirCuentaCorriente}>
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
      <Button variant="primary" on:click={compartirCuentaCorriente}>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Compartir
      </Button>
      <Button variant="secondary" on:click={generarPDFPrueba}>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        PDF Prueba
      </Button>
    </div>
  </div>

  <div class="bg-white p-6 rounded-lg shadow-md mb-6">
    <h1 class="text-2xl font-bold mb-2">Cuenta Corriente</h1>
    
    {#if !loading && !error}
      <div class="flex flex-col md:flex-row md:justify-between">
        <div>
          <h2 class="text-xl font-semibold">{clienteNombre}</h2>
          <p class="text-gray-600">Código: {clienteId}</p>
        </div>
        <div class="mt-4 md:mt-0">
          <p class="text-lg">
            Saldo actual: 
            <span class="{saldoTotal < 0 ? 'text-red-600' : 'text-green-600'} font-bold">
              {formatCurrency(saldoTotal)}
            </span>
          </p>
        </div>
      </div>
    {/if}
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
        on:click={() => loadData(1)}>
        Reintentar
      </button>
    </div>
  {:else if comprobantes.length === 0}
    <div class="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-8 rounded mb-4 text-center">
      <p>No hay comprobantes registrados para este cliente.</p>
    </div>
  {:else}
    <div class="overflow-x-auto bg-white rounded-lg shadow">
      <!-- Controles de paginación -->
      <div class="flex justify-between items-center p-4 border-b">
        <div class="flex items-center gap-2">
          <label for="itemsPerPage" class="text-sm text-gray-700">Elementos por página:</label>
          <select
            id="itemsPerPage"
            bind:value={itemsPerPage}
            on:change={handleItemsPerPageChange}
            class="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            {#each itemsPerPageOptions as option}
              <option value={option}>{option}</option>
            {/each}
          </select>
        </div>
        <div class="text-sm text-gray-600">
          Total: {totalItems} comprobantes
        </div>
      </div>
      
      <table class="min-w-full">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Detalle
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Débito
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Crédito
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Saldo
            </th>
          </tr>
        </thead>
        <tbody>
          {#each comprobantes as comprobante, index}
            <tr class="{index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100">
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                {formatDate(comprobante.Fecha)}
              </td>
              <td class="px-6 py-4 border-b border-gray-200">
                {comprobante.Detalle}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right border-b border-gray-200 text-red-600">
                {comprobante.Debitos > 0 ? formatCurrency(comprobante.Debitos) : ''}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right border-b border-gray-200 text-green-600">
                {comprobante.Creditos > 0 ? formatCurrency(comprobante.Creditos) : ''}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right border-b border-gray-200 font-medium {comprobante.Saldo < 0 ? 'text-red-600' : 'text-green-600'}">
                {formatCurrency(comprobante.Saldo)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      
      <!-- Paginación -->
      <Pagination
        {currentPage}
        {totalPages}
        {totalItems}
        {itemsPerPage}
        on:pageChange={handlePageChange}
      />
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
</style> 