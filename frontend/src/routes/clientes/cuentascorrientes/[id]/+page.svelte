<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { ClienteService, type Comprobante } from '$lib/services/ClienteService';
  
  const clienteId = $page.params.id;
  let comprobantes: Comprobante[] = [];
  let clienteNombre = '';
  let saldoTotal = 0;
  let loading = true;
  let error: string | null = null;
  
  const loadData = async (): Promise<void> => {
    try {
      loading = true;
      error = null;
      
      // Buscar el cliente para obtener su nombre
      const clientesResult = await ClienteService.obtenerCuentasCorrientes({
        page: 1,
        limit: 100, 
        search: clienteId,
        field: 'Codigo',
        order: 'ASC'
      });
      
      const cliente = clientesResult.items.find(c => c.Codigo === clienteId);
      if (cliente) {
        clienteNombre = cliente.Descripcion;
        saldoTotal = cliente.Saldo;
      }
      
      // Cargar los comprobantes
      comprobantes = await ClienteService.obtenerComprobantes(clienteId);
      
    } catch (err: unknown) {
      console.error('Error cargando datos:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };
  
  onMount(() => {
    loadData();
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
        on:click={loadData}>
        Reintentar
      </button>
    </div>
  {:else if comprobantes.length === 0}
    <div class="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-8 rounded mb-4 text-center">
      <p>No hay comprobantes registrados para este cliente.</p>
    </div>
  {:else}
    <div class="overflow-x-auto bg-white rounded-lg shadow">
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
    </div>
  {/if}
</div> 