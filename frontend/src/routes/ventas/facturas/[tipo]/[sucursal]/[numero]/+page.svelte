<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_API_URL } from '$env/static/public';
  import Button from '$lib/components/ui/Button.svelte';
  import { formatDateOnly } from '$lib/utils/dateUtils';
  
  // Interfaces
  interface FacturaDetalle {
    DocumentoTipo: string;
    DocumentoSucursal: string;
    DocumentoNumero: string;
    Fecha: string;
    ClienteCodigo: string;
    Cliente: {
      Codigo: string;
      Descripcion: string;
    };
    ImporteBruto: number;
    ImporteIva1: number;
    ImporteIva2: number;
    ImporteTotal: number;
    FechaAnulacion: string | null;
    Observacion: string;
    Items: {
      ArticuloCodigo: string;
      Descripcion: string;
      Cantidad: number;
      PrecioUnitario: number;
      PorcentajeIva: number;
      Subtotal: number;
    }[];
  }
  
  // Params de la URL
  const tipo = $page.params.tipo;
  const sucursal = $page.params.sucursal;
  const numero = $page.params.numero;
  
  // Estados
  let factura: FacturaDetalle | null = null;
  let loading = true;
  let error: string | null = null;
  
  // Cargar datos de la factura
  onMount(async () => {
    try {
      loading = true;
      error = null;
      
      const response = await fetch(`${PUBLIC_API_URL}/facturas/${tipo}/${sucursal}/${numero}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Factura no encontrada');
        }
        throw new Error('Error al cargar la factura');
      }
      
      const data = await response.json();
      factura = data;
      
    } catch (err) {
      console.error('Error cargando factura:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  });
  
  // Volver al listado
  const volver = () => {
    goto('/ventas/facturas');
  };
  
  // Anular factura
  const anularFactura = async () => {
    if (!factura) return;
    
    if (!confirm('¿Está seguro que desea anular esta factura?')) {
      return;
    }
    
    try {
      loading = true;
      
      const response = await fetch(
        `${PUBLIC_API_URL}/facturas/anular/${tipo}/${sucursal}/${numero}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al anular la factura');
      }
      
      alert('Factura anulada correctamente');
      
      // Recargar los datos
      const facturaResponse = await fetch(`${PUBLIC_API_URL}/facturas/${tipo}/${sucursal}/${numero}`);
      if (facturaResponse.ok) {
        factura = await facturaResponse.json();
      }
      
    } catch (err) {
      console.error('Error anulando factura:', err);
      alert(err instanceof Error ? err.message : 'Error al anular la factura');
    } finally {
      loading = false;
    }
  };
  
  // Imprimir factura
  const imprimirFactura = () => {
    window.print();
  };
  
  // Obtener descripción del tipo de documento
  const getTipoDocumentoLabel = (tipo: string) => {
    switch (tipo) {
      case 'FCA': return 'Factura A';
      case 'FCB': return 'Factura B';
      case 'FCC': return 'Factura C';
      case 'PRF': return 'Prefactura';
      case 'NCA': return 'Nota de Crédito A';
      case 'NCB': return 'Nota de Crédito B';
      case 'NCC': return 'Nota de Crédito C';
      default: return tipo;
    }
  };
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">
      {#if factura}
        {getTipoDocumentoLabel(factura.DocumentoTipo)} {factura.DocumentoSucursal}-{factura.DocumentoNumero}
      {:else}
        Detalle de Factura
      {/if}
    </h1>
    <div class="flex space-x-2">
      <Button variant="secondary" on:click={volver}>Volver</Button>
      
      {#if factura && !factura.FechaAnulacion}
        <Button variant="danger" on:click={anularFactura} disabled={loading}>Anular</Button>
      {/if}
      
      <Button variant="primary" on:click={imprimirFactura} disabled={!factura || loading}>Imprimir</Button>
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
  {:else if factura}
    <!-- Estado de la factura -->
    {#if factura.FechaAnulacion}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p class="font-semibold">FACTURA ANULADA</p>
        <p>Fecha de anulación: {formatDateOnly(factura.FechaAnulacion)}</p>
      </div>
    {/if}
    
    <!-- Cabecera de factura -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">Datos de la Factura</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <p class="text-sm font-medium text-gray-700">Tipo de Documento</p>
          <p class="mt-1">{getTipoDocumentoLabel(factura.DocumentoTipo)}</p>
        </div>
        
        <div>
          <p class="text-sm font-medium text-gray-700">Número</p>
          <p class="mt-1">{factura.DocumentoSucursal}-{factura.DocumentoNumero}</p>
        </div>
        
        <div>
          <p class="text-sm font-medium text-gray-700">Fecha</p>
          <p class="mt-1">{formatDateOnly(factura.Fecha)}</p>
        </div>
        
        <div>
          <p class="text-sm font-medium text-gray-700">Cliente</p>
          <p class="mt-1">{factura.Cliente.Codigo} - {factura.Cliente.Descripcion}</p>
        </div>
        
        {#if factura.Observacion}
          <div class="md:col-span-2 lg:col-span-4">
            <p class="text-sm font-medium text-gray-700">Observaciones</p>
            <p class="mt-1">{factura.Observacion}</p>
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Artículos de la factura -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">Artículos</h2>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">IVA %</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each factura.Items as item, i}
              <tr class={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td class="px-4 py-3 whitespace-nowrap text-sm">{item.ArticuloCodigo}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">{item.Descripcion}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">{item.Cantidad}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  ${item.PrecioUnitario.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">{item.PorcentajeIva}%</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  ${item.Subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      <!-- Totales -->
      <div class="mt-6 flex justify-end">
        <div class="w-64 space-y-2">
          <div class="flex justify-between">
            <span class="font-medium">Subtotal:</span>
            <span>${factura.ImporteBruto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">IVA:</span>
            <span>${(factura.ImporteIva1 + (factura.ImporteIva2 || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span>${factura.ImporteTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Estilos para impresión */
  @media print {
    :global(button), :global(.no-print) {
      display: none !important;
    }
    
    :global(body) {
      font-size: 12pt;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
    }
    
    @page {
      margin: 1.5cm;
    }
  }
</style> 