<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { PUBLIC_API_URL } from '$env/static/public';

  interface Comprobante {
    Fecha: string;
    Detalle: string;
    Debitos: number;
    Creditos: number;
    Saldo: number;
  }

  let comprobantes: Comprobante[] = [];
  let loading = true;
  let error: string | null = null;
  let clienteDescripcion = '';

  const loadComprobantes = async (): Promise<void> => {
    try {
      loading = true;
      error = null;
      
      const response = await fetch(`${PUBLIC_API_URL}/clientes/${$page.params.id}/comprobantes`);
      
      if (!response.ok) {
        throw new Error('Error al cargar los comprobantes');
      }
      
      const data = await response.json();
      comprobantes = data.items || [];

      // Obtener la descripción del cliente
      const clienteResponse = await fetch(`${PUBLIC_API_URL}/clientes/${$page.params.id}`);
      if (clienteResponse.ok) {
        const clienteData = await clienteResponse.json();
        clienteDescripcion = clienteData.Descripcion;
      }
      
    } catch (err: unknown) {
      console.error('Error cargando comprobantes:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };

  onMount(() => {
    loadComprobantes();
  });
</script>

<svelte:head>
  <title>Resumen de Comprobantes - {clienteDescripcion}</title>
</svelte:head>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-4">
    <div>
      <h1 class="text-2xl font-bold">Resumen de Comprobantes</h1>
      <p class="text-gray-600">{clienteDescripcion}</p>
    </div>
    <Button variant="secondary" on:click={() => goto('/clientes/cuentascorrientes')}>
      Volver
    </Button>
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
                {new Date(comprobante.Fecha).toLocaleDateString()}
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
  {/if}
</div> 