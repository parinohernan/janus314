<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart } from 'chart.js/auto';
  import DatePicker from '$lib/components/DatePicker.svelte';
  import EntitySelector from '$lib/components/ui/EntitySelector.svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { Factory, BarChart3 } from 'lucide-svelte';
  import Icon from '$lib/components/ui/Icon.svelte';

  // Interfaces
  interface ProveedorOption {
    codigo: string;
    descripcion: string;
  }

  interface ProductoVenta {
    codigo: string;
    descripcion: string;
    existencia: number;
    cantidad: number;
    importeTotal: number;
  }

  interface ProveedorVenta {
    codigo: string;
    descripcion: string;
    productos: ProductoVenta[];
    cantidadTotal: number;
    importeTotal: number;
  }

  interface DatosVentas {
    proveedores: ProveedorVenta[];
    totalVentas: number;
    periodo: {
      fechaDesde: string;
      fechaHasta: string;
    };
  }

  // Estado
  let loading = false;
  let error: string | null = null;
  let datosVentas: DatosVentas | null = null;
  let chart: Chart | null = null;
  let chartCanvas: HTMLCanvasElement;
  let tipoGrafico: 'cantidad' | 'importe' = 'cantidad';

  // Filtros
  let fechaDesde: Date = new Date();
  let fechaHasta: Date = new Date();
  let proveedoresSeleccionados: ProveedorOption[] = [];
  let mostrarDropdownProveedores = false;

  // Inicializar fechas al mes actual y cargar proveedores
  onMount(() => {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    fechaDesde = primerDiaMes;
    fechaHasta = ultimoDiaMes;
    
    // Cargar proveedores con un pequeño delay para asegurar que la autenticación esté lista
    setTimeout(() => {
      cargarTodosLosProveedores();
    }, 500);
  });

  // Función para formatear fecha a YYYY-MM-DD
  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Función para formatear moneda
  function formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(valor);
  }

  // Función para cargar los datos de ventas
  async function cargarDatosVentas() {
    try {
      loading = true;
      error = null;

      const params = new URLSearchParams({
        fechaDesde: formatDate(fechaDesde),
        fechaHasta: formatDate(fechaHasta)
      });

      if (proveedoresSeleccionados.length > 0) {
        params.append('proveedorCodigo', proveedoresSeleccionados.map(p => p.codigo).join(','));
      }

      const response = await fetchWithAuth(`/informes/ventas-por-proveedor?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar los datos');
      }

      const result = await response.json();
      
      if (result.success) {
        datosVentas = result.data;
        actualizarGrafico();
      } else {
        throw new Error(result.message || 'Error en el servidor');
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
      datosVentas = null;
    } finally {
      loading = false;
    }
  }

  // Función para actualizar el gráfico
  function actualizarGrafico() {
    if (!datosVentas || !datosVentas.proveedores || datosVentas.proveedores.length === 0) return;
    if (!chartCanvas) return;

    const ctx = chartCanvas.getContext('2d');
    if (!ctx) {
      console.error('No se pudo obtener el contexto del canvas');
      return;
    }

    if (chart) {
      chart.destroy();
    }

    const proveedores = datosVentas.proveedores;
    const totalProveedores = proveedores.length;

    // Crear el gráfico de torta
    chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: proveedores.map((p: ProveedorVenta) => p.descripcion),
        datasets: [{
          data: proveedores.map((p: ProveedorVenta) => 
            tipoGrafico === 'cantidad' ? p.cantidadTotal : p.importeTotal
          ),
          backgroundColor: proveedores.map((_: ProveedorVenta, i: number) => 
            `hsl(${(i * 360) / totalProveedores}, 70%, 50%)`
          )
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: tipoGrafico === 'cantidad' ? 'Cantidad de Ventas por Proveedor' : 'Importe de Ventas por Proveedor',
            padding: {
              top: 10,
              bottom: 20
            }
          },
          legend: {
            position: 'bottom',
            align: 'start',
            labels: {
              boxWidth: 12,
              padding: 8,
              font: {
                size: 11
              },
              generateLabels: function(chart) {
                const data = chart.data;
                if (data.labels && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const dataset = data.datasets[0];
                    const value = dataset.data[i];
                    const backgroundColor = dataset.backgroundColor;
                    
                    // Conversión segura de tipos
                    const numValue = typeof value === 'number' ? value : 0;
                    const formattedValue = tipoGrafico === 'cantidad' 
                      ? `${numValue} u`
                      : formatearMoneda(numValue);
                    
                    // Obtener color de forma segura
                    let fillColor = '#ccc';
                    if (Array.isArray(backgroundColor)) {
                      fillColor = backgroundColor[i] as string;
                    }
                    
                    return {
                      text: `${label}: ${formattedValue}`,
                      fillStyle: fillColor,
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            },
            maxHeight: 150
          },
          tooltip: {
            callbacks: {
              label: function(tooltipItem) {
                const value = tooltipItem.raw as number;
                const label = tooltipItem.label;
                if (tipoGrafico === 'cantidad') {
                  return `${label}: ${value} unidades`;
                } else {
                  return `${label}: ${formatearMoneda(value)}`;
                }
              }
            }
          }
        },
        layout: {
          padding: {
            top: 10,
            bottom: 10,
            left: 10,
            right: 10
          }
        }
      }
    });
  }

  // Variables para selector múltiple de proveedores
  let todosLosProveedores: ProveedorOption[] = [];
  let cargandoProveedores = false;
  let busquedaProveedor = '';

  // Función para cargar todos los proveedores
  async function cargarTodosLosProveedores() {
    try {
      cargandoProveedores = true;
      console.log('🔄 Cargando proveedores...');
      
      // Verificar si estamos en el navegador
      if (typeof window === 'undefined') {
        console.log('⚠️ No estamos en el navegador, saltando carga de proveedores');
        return;
      }
      
      const response = await fetchWithAuth('/proveedores?limit=1000');
      console.log('📡 Respuesta recibida:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📦 Resultado completo:', result);
        // El backend devuelve los datos en result.items, no en result.data
        const proveedoresRaw = result.items || [];
        console.log('🔍 Estructura del primer proveedor:', proveedoresRaw[0]);
        
        // Mapear los datos del backend al formato esperado
        todosLosProveedores = proveedoresRaw.map((proveedor: any) => ({
          codigo: proveedor.Codigo || proveedor.codigo,
          descripcion: proveedor.Descripcion || proveedor.descripcion
        }));
        
        console.log('✅ Proveedores cargados:', todosLosProveedores.length);
        console.log('📋 Primeros proveedores:', todosLosProveedores.slice(0, 3));
      } else {
        const errorText = await response.text();
        console.error('❌ Error en respuesta:', response.status, response.statusText);
        console.error('❌ Contenido del error:', errorText);
      }
    } catch (error) {
      console.error('❌ Error cargando proveedores:', error);
      todosLosProveedores = [];
    } finally {
      cargandoProveedores = false;
    }
  }

  // Función para manejar cambio de proveedor
  function cambiarProveedor(event: Event) {
    const target = event.target as HTMLSelectElement;
    const codigoSeleccionado = target.value;
    
    if (codigoSeleccionado) {
      const proveedor = todosLosProveedores.find(p => p.codigo === codigoSeleccionado);
      if (proveedor && !proveedoresSeleccionados.some(p => p.codigo === proveedor.codigo)) {
        proveedoresSeleccionados = [...proveedoresSeleccionados, proveedor];
      }
      // Limpiar el select después de seleccionar
      target.value = '';
    }
  }

  // Función para alternar selección de proveedor
  function alternarProveedor(proveedor: ProveedorOption) {
    const yaSeleccionado = proveedoresSeleccionados.some(p => p.codigo === proveedor.codigo);
    
    if (yaSeleccionado) {
      proveedoresSeleccionados = proveedoresSeleccionados.filter(p => p.codigo !== proveedor.codigo);
    } else {
      proveedoresSeleccionados = [...proveedoresSeleccionados, proveedor];
    }
  }

  // Función para limpiar todos los proveedores
  function limpiarTodosLosProveedores() {
    proveedoresSeleccionados = [];
  }

  // Función para seleccionar todos los proveedores
  function seleccionarTodosLosProveedores() {
    proveedoresSeleccionados = [...todosLosProveedores];
  }

  // Función para filtrar proveedores por búsqueda
  function filtrarProveedores() {
    if (!busquedaProveedor.trim()) {
      return todosLosProveedores;
    } else {
      const busqueda = busquedaProveedor.toLowerCase();
      return todosLosProveedores.filter(proveedor => 
        proveedor.descripcion.toLowerCase().includes(busqueda) ||
        proveedor.codigo.toLowerCase().includes(busqueda)
      );
    }
  }

  // Función para verificar si un proveedor está seleccionado
  function estaSeleccionado(codigo: string): boolean {
    return proveedoresSeleccionados.some(p => p.codigo === codigo);
  }

  // Función para cerrar dropdown al hacer click fuera
  function cerrarDropdownProveedores() {
    setTimeout(() => {
      mostrarDropdownProveedores = false;
    }, 200);
  }

  // Observador para actualizar el gráfico cuando cambien los datos o el tipo de gráfico
  $: if (datosVentas && chartCanvas) {
    actualizarGrafico();
  }
</script>

<svelte:head>
  <title>Informe de Ventas por Proveedor</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
  <!-- Encabezado -->
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
        <Icon icon={Factory} size={32} strokeWidth={2.5} glass={true} />
        Informe de Ventas por Proveedor
      </h1>
      <p class="text-gray-600 mt-2">Análisis de ventas de productos agrupados por proveedor</p>
    </div>
  </div>

  <!-- Filtros -->
  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h2 class="text-lg font-semibold mb-4">📅 Filtros</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div>
        <label for="fechaDesde" class="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
        <DatePicker id="fechaDesde" bind:value={fechaDesde} />
      </div>
      <div>
        <label for="fechaHasta" class="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label>
        <DatePicker id="fechaHasta" bind:value={fechaHasta} />
      </div>
      <div>
        <label for="proveedor" class="block text-sm font-medium text-gray-700 mb-2">
          Filtrar por Proveedores (Opcional)
        </label>
        
        <!-- Selector principal -->
        <div class="flex gap-2 mb-2">
          <select 
            id="proveedor" 
            on:change={cambiarProveedor}
            class="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={cargandoProveedores}
          >
            <option value="">Agregar proveedor...</option>
            {#each todosLosProveedores as proveedor}
              <option value={proveedor.codigo}>{proveedor.descripcion}</option>
            {/each}
          </select>
          
          {#if todosLosProveedores.length > 0}
            <button
              type="button"
              on:click={seleccionarTodosLosProveedores}
              class="px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm whitespace-nowrap flex-shrink-0"
              title="Seleccionar todos los proveedores"
            >
              Todos
            </button>
          {/if}
          
          {#if proveedoresSeleccionados.length > 0}
            <button
              type="button"
              on:click={limpiarTodosLosProveedores}
              class="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm whitespace-nowrap flex-shrink-0"
              title="Limpiar todos los proveedores"
            >
              Limpiar
            </button>
          {/if}
        </div>
        
        {#if cargandoProveedores}
          <div class="text-sm text-gray-500 mb-2">
            Cargando proveedores...
          </div>
        {/if}
        
        <!-- Contador de proveedores seleccionados -->
        {#if proveedoresSeleccionados.length > 0}
          <div class="mb-2">
            <div class="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-2 rounded-md inline-block">
              ✓ {proveedoresSeleccionados.length} proveedor{proveedoresSeleccionados.length !== 1 ? 'es' : ''} seleccionado{proveedoresSeleccionados.length !== 1 ? 's' : ''}
            </div>
          </div>
        {/if}

        <!-- Búsqueda rápida -->
        <div class="relative">
          <input
            type="text"
            bind:value={busquedaProveedor}
            on:focus={() => mostrarDropdownProveedores = true}
            on:blur={cerrarDropdownProveedores}
            placeholder="Buscar proveedor..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          
          <!-- Dropdown de búsqueda -->
          {#if mostrarDropdownProveedores && filtrarProveedores().length > 0}
            <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              <!-- Opción para seleccionar todos -->
              <div class="sticky top-0 bg-gray-50 border-b border-gray-200">
                <button
                  type="button"
                  on:click={seleccionarTodosLosProveedores}
                  class="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center font-medium text-green-600"
                >
                  <span class="mr-2">✓</span>
                  <div class="flex-1">
                    Seleccionar todos
                  </div>
                  <div class="text-xs text-gray-500">
                    ({todosLosProveedores.length} proveedores)
                  </div>
                </button>
              </div>
              
              <!-- Lista de proveedores -->
              {#each filtrarProveedores() as proveedor}
                <button
                  type="button"
                  on:click={() => alternarProveedor(proveedor)}
                  class="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center"
                >
                  <input
                    type="checkbox"
                    checked={estaSeleccionado(proveedor.codigo)}
                    class="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    readonly
                  />
                  <div>
                    <div class="font-medium text-sm">{proveedor.descripcion}</div>
                    <div class="text-xs text-gray-500">{proveedor.codigo}</div>
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
    
    <!-- Botón Buscar -->
    <div class="flex justify-end">
      <button
        type="button"
        on:click={cargarDatosVentas}
        disabled={loading}
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {#if loading}
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Buscando...
        {:else}
          🔍 Buscar
        {/if}
      </button>
    </div>
  </div>

  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      <p>❌ {error}</p>
    </div>
  {/if}

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  {:else if datosVentas}
    <!-- Estadísticas Generales -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-100 text-sm font-medium">Total Proveedores</p>
            <p class="text-3xl font-bold">{datosVentas.proveedores.length}</p>
          </div>
          <div class="text-4xl">🏭</div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-100 text-sm font-medium">Total Ventas</p>
            <p class="text-3xl font-bold">{formatearMoneda(datosVentas.totalVentas)}</p>
          </div>
          <div class="text-4xl">💰</div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-purple-100 text-sm font-medium">Período</p>
            <p class="text-lg font-bold">
              {new Date(datosVentas.periodo.fechaDesde).toLocaleDateString('es-AR')} - 
              {new Date(datosVentas.periodo.fechaHasta).toLocaleDateString('es-AR')}
            </p>
          </div>
          <div class="text-4xl">📅</div>
        </div>
      </div>
    </div>

    <!-- Gráfico y Resumen -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Gráfico de Ventas</h2>
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
        <div class="h-[500px]">
          <canvas bind:this={chartCanvas}></canvas>
        </div>
      </div>
      
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 class="text-xl font-semibold mb-4">Resumen por Proveedor</h2>
        <div class="space-y-4 max-h-96 overflow-y-auto">
          {#each datosVentas.proveedores as proveedor}
            <div class="border-b pb-3">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <span class="font-medium text-lg">{proveedor.descripcion}</span>
                  <div class="text-sm text-gray-500">Código: {proveedor.codigo}</div>
                </div>
                <div class="text-right">
                  <div class="font-semibold">{formatearMoneda(proveedor.importeTotal)}</div>
                  <div class="text-sm text-gray-500">{proveedor.cantidadTotal} unidades</div>
                </div>
              </div>
              
              <!-- Productos del proveedor -->
              <div class="ml-4 space-y-1">
                {#each proveedor.productos.slice(0, 3) as producto}
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">{producto.descripcion}</span>
                    <span class="font-medium">{producto.cantidad} u - {formatearMoneda(producto.importeTotal)}</span>
                  </div>
                {/each}
                {#if proveedor.productos.length > 3}
                  <div class="text-xs text-gray-500 italic">
                    ... y {proveedor.productos.length - 3} productos más
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Tabla Detallada -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 class="text-xl font-semibold mb-6 flex items-center gap-2">
        <Icon icon={BarChart3} size={20} strokeWidth={2.5} glass={true} />
        Detalle Completo por Proveedor
      </h2>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 font-semibold">Proveedor</th>
              <th class="text-left py-3 px-4 font-semibold">Producto</th>
              <th class="text-right py-3 px-4 font-semibold">Existencia</th>
              <th class="text-right py-3 px-4 font-semibold">Cantidad</th>
              <th class="text-right py-3 px-4 font-semibold">Importe</th>
            </tr>
          </thead>
          <tbody>
            {#each datosVentas.proveedores as proveedor}
              {#each proveedor.productos as producto}
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="py-3 px-4">
                    {#if proveedor.codigo !== 'SIN_PROVEEDOR'}
                      <span class="font-medium">{proveedor.descripcion}</span>
                      <div class="text-sm text-gray-500">{proveedor.codigo}</div>
                    {:else}
                      <span class="text-gray-500 italic">Sin Proveedor</span>
                    {/if}
                  </td>
                  <td class="py-3 px-4">
                    <span class="font-medium">{producto.descripcion}</span>
                    <div class="text-sm text-gray-500">{producto.codigo}</div>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <span class="text-gray-500 text-sm">
                      {producto.existencia || 0} u
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right font-semibold">{producto.cantidad}</td>
                  <td class="py-3 px-4 text-right font-semibold">{formatearMoneda(producto.importeTotal)}</td>
                </tr>
              {/each}
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {:else if !loading}
    <div class="text-center py-12">
      <div class="text-6xl mb-4">🏭</div>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">Selecciona un rango de fechas</h3>
      <p class="text-gray-600">Para ver el informe de ventas por proveedor, selecciona las fechas de inicio y fin.</p>
    </div>
  {/if}
</div>

<style>
  :global(.select-container) {
    width: 100%;
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
