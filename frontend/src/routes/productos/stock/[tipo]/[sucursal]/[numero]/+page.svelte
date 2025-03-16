<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { formatDate, formatDateOnly } from '$lib/utils/dateUtils';
  
  // Parámetros de la URL
  const tipo = $page.params.tipo;
  const sucursal = $page.params.sucursal;
  const numero = $page.params.numero;
  
  // Tipos para la respuesta de la API
  interface MovimientoEncabezado {
    DocumentoTipo: string;
    DocumentoSucursal: string;
    DocumentoNumero: string;
    Fecha: string;
    MovimientoTipo: string;
    Observacion: string | null;
  }
  
  interface MovimientoItem {
    CodigoArticulo: string;
    Descripcion: string;
    Cantidad: number;
    PrecioCosto: number;
  }
  
  interface MovimientoDetalle {
    encabezado: MovimientoEncabezado;
    items: MovimientoItem[];
  }
  
  // Estado local
  let movimiento: MovimientoDetalle | null = null;
  let loading = true;
  let error: string | null = null;
  let totalCantidad = 0;
  let totalValorizado = 0;
  
  // Cargar datos del movimiento
  onMount(async () => {
    try {
      const response = await fetch(
        `${PUBLIC_API_URL}/movimientos-stock/${tipo}/${sucursal}/${numero}`
      );
      
      if (!response.ok) {
        throw new Error('Error al cargar el detalle del movimiento');
      }
      
      movimiento = await response.json();
      
      // Calcular totales
      if (movimiento && movimiento.items) {
        totalCantidad = movimiento.items.reduce((sum, item) => sum + item.Cantidad, 0);
        totalValorizado = movimiento.items.reduce(
          (sum, item) => sum + item.Cantidad * item.PrecioCosto, 
          0
        );
      }
    } catch (err) {
      console.error('Error cargando movimiento:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  });
  
  // Formatear el tipo de movimiento
  const formatMovimientoTipo = (tipo: string | null): string => {
    if (!tipo) return 'Desconocido';
    return tipo === 'ING' ? 'Ingreso' : 'Egreso';
  };
  
  // Eliminar el movimiento
  const eliminarMovimiento = async () => {
    if (!confirm('¿Está seguro de eliminar este movimiento? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      loading = true;
      
      const response = await fetch(
        `${PUBLIC_API_URL}/movimientos-stock/${tipo}/${sucursal}/${numero}`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el movimiento');
      }
      
      alert('Movimiento eliminado correctamente');
      goto('/productos/stock');
    } catch (err) {
      console.error('Error eliminando movimiento:', err);
      alert(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      loading = false;
    }
  };
  
  // Imprimir el movimiento
  const imprimirMovimiento = () => {
    window.print();
  };
</script>

<svelte:head>
  <title>Detalle de Movimiento de Stock</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Encabezado -->
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">
      Detalle de Movimiento de Stock
    </h1>
    <div class="space-x-2">
      <Button variant="secondary" on:click={() => goto('/productos/stock')}>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        Volver
      </Button>
      <Button variant="secondary" on:click={imprimirMovimiento}>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clip-rule="evenodd" />
        </svg>
        Imprimir
      </Button>
      <Button variant="danger" on:click={eliminarMovimiento} disabled={loading}>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        Eliminar
      </Button>
    </div>
  </div>
  
  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p>{error}</p>
    </div>
  {:else if movimiento}
    <!-- Datos del encabezado -->
    <div class="bg-white p-6 rounded-lg shadow-sm mb-6">
      <h2 class="text-lg font-semibold mb-4">Información del Movimiento</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <p class="text-sm font-medium text-gray-500">Tipo de Documento</p>
          <p class="text-base font-medium">{movimiento.encabezado.DocumentoTipo}</p>
        </div>
        
        <div>
          <p class="text-sm font-medium text-gray-500">Sucursal</p>
          <p class="text-base font-medium">{movimiento.encabezado.DocumentoSucursal}</p>
        </div>
        
        <div>
          <p class="text-sm font-medium text-gray-500">Número</p>
          <p class="text-base font-medium">{movimiento.encabezado.DocumentoNumero}</p>
        </div>
        
        <div>
          <p class="text-sm font-medium text-gray-500">Fecha</p>
          <p class="text-base font-medium">{formatDateOnly(movimiento.encabezado.Fecha)}</p>
        </div>
        
        <div>
          <p class="text-sm font-medium text-gray-500">Tipo de Movimiento</p>
          <p class="text-base font-medium">
            <span class={movimiento.encabezado.MovimientoTipo === 'ING' ? 'text-green-600' : 'text-red-600'}>
              {formatMovimientoTipo(movimiento.encabezado.MovimientoTipo)}
            </span>
          </p>
        </div>
        
        <div class="md:col-span-3">
          <p class="text-sm font-medium text-gray-500">Observación</p>
          <p class="text-base font-medium">{movimiento.encabezado.Observacion || '-'}</p>
        </div>
      </div>
    </div>
    
    <!-- Detalle de artículos -->
    <div class="bg-white p-6 rounded-lg shadow-sm mb-6">
      <h2 class="text-lg font-semibold mb-4">Artículos del Movimiento</h2>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
              <!-- <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th> -->
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each movimiento.items as item, index}
              <tr class={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td class="px-4 py-3 text-sm text-gray-900">{item.CodigoArticulo}</td>
                <td class="px-4 py-3 text-sm text-gray-900">{item.Descripcion}</td>
                <td class="px-4 py-3 text-sm text-gray-900 text-right">{item.Cantidad.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <!-- <td class="px-4 py-3 text-sm text-gray-900 text-right">${item.PrecioCosto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td> -->
                <!-- <td class="px-4 py-3 text-sm text-gray-900 text-right">${(item.Cantidad * item.PrecioCosto).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td> -->
              </tr>
            {/each}
            
            <!-- Totales -->
            <tr class="bg-gray-100 font-semibold">
              <td colspan="2" class="px-4 py-3 text-sm text-gray-900">Totales</td>
              <td class="px-4 py-3 text-sm text-gray-900 text-right">{totalCantidad.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td class="px-4 py-3 text-sm text-gray-900"></td>
              <!-- <td class="px-4 py-3 text-sm text-gray-900 text-right">${totalValorizado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td> -->
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<!-- Estilos para impresión -->
<style>
  @media print {
    :global(button), :global(.no-print) {
      display: none !important;
    }
    
    :global(body) {
      font-size: 12pt;
    }
    
    :global(table) {
      page-break-inside: avoid;
    }
  }
</style> 