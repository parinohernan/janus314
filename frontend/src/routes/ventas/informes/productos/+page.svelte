<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart } from 'chart.js/auto';
  import DatePicker from '$lib/components/DatePicker.svelte';
  import EntitySelector from '$lib/components/ui/EntitySelector.svelte';
  import { PUBLIC_API_URL } from '$env/static/public';

  // Inicializar fechas con valores válidos
  let fechaDesde: Date = new Date();
  fechaDesde.setMonth(fechaDesde.getMonth() - 1);
  fechaDesde.setHours(0, 0, 0, 0);
  
  let fechaHasta: Date = new Date();
  fechaHasta.setHours(23, 59, 59, 999);
  
  let productosSeleccionados: { codigo: string; descripcion: string }[] = [];
  let datosVentas: any = null;
  let chart: Chart | null = null;
  let chartCanvas: HTMLCanvasElement;
  let tipoGrafico: 'cantidad' | 'importe' = 'cantidad';
  const MAX_PRODUCTOS = 5;

  // Función para formatear fecha a YYYY-MM-DD
  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Función para cargar los datos de ventas
  async function cargarDatosVentas() {
    if (productosSeleccionados.length === 0) return;

    try {
      const params = new URLSearchParams({
        fechaDesde: formatDate(fechaDesde),
        fechaHasta: formatDate(fechaHasta),
        productos: productosSeleccionados.map(p => p.codigo).join(',')
      });

      const response = await fetch(`${PUBLIC_API_URL}/informes/ventas-por-productos?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en la respuesta:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('La respuesta no es JSON');
      }

      datosVentas = await response.json();
      actualizarGrafico();
    } catch (error) {
      console.error('Error al cargar datos de ventas:', error);
      datosVentas = null;
    }
  }

  // Función para actualizar el gráfico
  function actualizarGrafico() {
    if (!datosVentas || !datosVentas.productos || datosVentas.productos.length === 0) return;
    if (!chartCanvas) return;

    const ctx = chartCanvas.getContext('2d');
    if (!ctx) {
      console.error('No se pudo obtener el contexto del canvas');
      return;
    }

    if (chart) {
      chart.destroy();
    }

    // Crear el gráfico de torta
    chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: datosVentas.productos.map((p: any) => p.descripcion),
        datasets: [{
          data: datosVentas.productos.map((p: any) => 
            tipoGrafico === 'cantidad' ? p.cantidad : p.importeTotal
          ),
          backgroundColor: datosVentas.productos.map((_: any, i: number) => 
            `hsl(${(i * 360) / datosVentas.productos.length}, 70%, 50%)`
          )
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: tipoGrafico === 'cantidad' ? 'Cantidad de Ventas por Producto' : 'Importe de Ventas por Producto'
          },
          legend: {
            position: 'right'
          },
          tooltip: {
            callbacks: {
              label: function(tooltipItem) {
                const value = tooltipItem.raw as number;
                const label = tooltipItem.label;
                if (tipoGrafico === 'cantidad') {
                  return `${label}: ${value} unidades`;
                } else {
                  return `${label}: $${value.toFixed(2)}`;
                }
              }
            }
          }
        }
      }
    });
  }

  // Observadores para actualizar datos cuando cambien las fechas o productos
  $: if (fechaDesde && fechaHasta && productosSeleccionados.length > 0) {
    cargarDatosVentas();
  }

  // Observador para actualizar el gráfico cuando cambien los datos o el tipo de gráfico
  $: if (datosVentas && chartCanvas) {
    actualizarGrafico();
  }

  function handleProductoSelect(event: CustomEvent) {
    const { value, label } = event.detail;
    if (value && !productosSeleccionados.some(p => p.codigo === value)) {
      if (productosSeleccionados.length < MAX_PRODUCTOS) {
        productosSeleccionados = [...productosSeleccionados, { codigo: value, descripcion: label }];
      }
    }
  }

  function removeProducto(codigo: string) {
    productosSeleccionados = productosSeleccionados.filter(p => p.codigo !== codigo);
  }
</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-6">Informe de Ventas por Productos</h1>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
    <div>
      <label for="fechaDesde" class="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
      <DatePicker 
        id="fechaDesde" 
        bind:value={fechaDesde}
      />
    </div>
    <div>
      <label for="fechaHasta" class="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label>
      <DatePicker 
        id="fechaHasta" 
        bind:value={fechaHasta}
      />
    </div>
  </div>

  <div class="mb-6">
    <label for="productoSelector" class="block text-sm font-medium text-gray-700 mb-2">
      Seleccionar Productos (máximo {MAX_PRODUCTOS})
    </label>
    <EntitySelector
      id="productoSelector"
      label=""
      placeholder="Buscar producto..."
      apiEndpoint="/articulos"
      valueField="Codigo"
      labelField="Descripcion"
      minSearchLength={3}
      on:select={handleProductoSelect}
    />
  </div>

  {#if productosSeleccionados.length > 0}
    <div class="mb-4">
      <h2 class="text-lg font-semibold mb-2">Productos Seleccionados:</h2>
      <div class="flex flex-wrap gap-2">
        {#each productosSeleccionados as producto}
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
            {producto.descripcion}
            <button 
              class="ml-2 text-blue-600 hover:text-blue-800" 
              on:click={() => removeProducto(producto.codigo)}
            >
              ×
            </button>
          </span>
        {/each}
      </div>
    </div>
  {/if}

  {#if datosVentas}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">Gráfico de Ventas</h2>
          <div class="flex gap-2">
            <button
              class="px-3 py-1 rounded {tipoGrafico === 'cantidad' ? 'bg-blue-500 text-white' : 'bg-gray-200'}"
              on:click={() => tipoGrafico = 'cantidad'}
            >
              Cantidad
            </button>
            <button
              class="px-3 py-1 rounded {tipoGrafico === 'importe' ? 'bg-blue-500 text-white' : 'bg-gray-200'}"
              on:click={() => tipoGrafico = 'importe'}
            >
              Importe
            </button>
          </div>
        </div>
        <div class="h-96">
          <canvas bind:this={chartCanvas}></canvas>
        </div>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">Resumen de Ventas</h2>
        <div class="space-y-4">
          {#each datosVentas.productos as producto}
            <div class="border-b pb-2">
              <div class="flex justify-between">
                <span class="font-medium">{producto.descripcion}</span>
                <span class="text-gray-600">Código: {producto.codigo}</span>
              </div>
              <div class="flex justify-between mt-1">
                <span>Cantidad: {producto.cantidad}</span>
                <span class="font-medium">Total: ${producto.importeTotal.toFixed(2)}</span>
              </div>
            </div>
          {/each}
          <div class="pt-2 border-t">
            <div class="flex justify-between font-bold">
              <span>Total General:</span>
              <span>${datosVentas.totalVentas.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else if productosSeleccionados.length > 0}
    <div class="text-center text-gray-500 py-8">
      Cargando datos...
    </div>
  {:else}
    <div class="text-center text-gray-500 py-8">
      Seleccione al menos un producto para ver el informe
    </div>
  {/if}
</div>

<style>
  :global(.select-container) {
    width: 100%;
  }
</style> 