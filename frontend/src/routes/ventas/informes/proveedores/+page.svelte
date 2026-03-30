<script lang="ts">
  import { onMount } from 'svelte';
  import { goto, beforeNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import { Chart } from 'chart.js/auto';
  import DatePicker from '$lib/components/DatePicker.svelte';
  import EntitySelector from '$lib/components/ui/EntitySelector.svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { Factory, BarChart3, ShoppingCart, RefreshCw } from 'lucide-svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { InformeCacheService, idbCacheAdapter } from '$lib/cache';
  import { navigationState } from '$lib/stores/navigationState';

  const INFORME_PATH = '/ventas/informes/proveedores';
  const STORAGE_KEY_ORDEN_INFORME = 'janus314_orden_desde_informe';
  const informeCache = new InformeCacheService(idbCacheAdapter);

  // Guardar filtros al salir de la página para restaurar al volver
  beforeNavigate(({ from }) => {
    if (from?.url.pathname === INFORME_PATH && browser) {
      const currentState = navigationState.getState(INFORME_PATH) || {};
      navigationState.saveState(INFORME_PATH, {
        ...currentState,
        scroll: window.scrollY,
        filters: {
          fechaDesde: formatDate(fechaDesde),
          fechaHasta: formatDate(fechaHasta),
          proveedorCodigo: proveedoresSeleccionados.map((p) => p.codigo).sort().join(','),
          pagoTipo: filtroPagoTipo
        }
      });
    }
  });

  // Interfaces
  interface ProveedorOption {
    codigo: string;
    descripcion: string;
  }

  interface ProductoVenta {
    codigo: string;
    descripcion: string;
    existencia: number;
    existenciaMinima?: number;
    cantidadSugerida?: number;
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
  let loading = $state(false);
  let error = $state<string | null>(null);
  let datosVentas = $state<DatosVentas | null>(null);
  let chart: Chart | null = null;
  let chartCanvas: HTMLCanvasElement;
  let tipoGrafico = $state<'cantidad' | 'importe'>('cantidad');
  let cacheTimestamp = $state<number | null>(null);

  // Filtros
  let fechaDesde = $state<Date>(new Date());
  let fechaHasta = $state<Date>(new Date());
  let proveedoresSeleccionados = $state<ProveedorOption[]>([]);
  let filtroPagoTipo = $state('');
  let formasPago = $state<{ value: string; label: string }[]>([]);
  let mostrarDropdownProveedores = $state(false);

  // Productos seleccionados para crear orden (key: proveedorCodigo|productoCodigo)
  let productosSeleccionados = $state<Set<string>>(new Set());

  // Ordenamiento de la tabla de detalle
  type SortColumn = 'proveedor' | 'producto' | 'existencia' | 'existenciaMinima' | 'cantidadSugerida' | 'cantidad' | 'importe';
  let sortColumn = $state<SortColumn>('proveedor');
  let sortDirection = $state<'asc' | 'desc'>('asc');

  // Interfaz para filas aplanadas
  interface FilaDetalle {
    proveedor: ProveedorVenta;
    producto: ProductoVenta;
  }

  // Función para cambiar ordenamiento
  function toggleSort(column: SortColumn) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
  }

  // Datos ordenados para la tabla (derivado)
  let datosOrdenados = $derived.by(() => {
    if (!datosVentas || !datosVentas.proveedores) return [];
    
    // Aplanar los datos: cada fila es proveedor + producto
    const filas: FilaDetalle[] = [];
    for (const proveedor of datosVentas.proveedores) {
      for (const producto of proveedor.productos) {
        filas.push({ proveedor, producto });
      }
    }
    
    // Ordenar según la columna seleccionada
    filas.sort((a, b) => {
      let valorA: string | number;
      let valorB: string | number;
      
      switch (sortColumn) {
        case 'proveedor':
          valorA = a.proveedor.descripcion.toLowerCase();
          valorB = b.proveedor.descripcion.toLowerCase();
          break;
        case 'producto':
          valorA = a.producto.descripcion.toLowerCase();
          valorB = b.producto.descripcion.toLowerCase();
          break;
        case 'existencia':
          valorA = a.producto.existencia ?? 0;
          valorB = b.producto.existencia ?? 0;
          break;
        case 'existenciaMinima':
          valorA = a.producto.existenciaMinima ?? 0;
          valorB = b.producto.existenciaMinima ?? 0;
          break;
        case 'cantidadSugerida':
          valorA = a.producto.cantidadSugerida ?? 0;
          valorB = b.producto.cantidadSugerida ?? 0;
          break;
        case 'cantidad':
          valorA = a.producto.cantidad;
          valorB = b.producto.cantidad;
          break;
        case 'importe':
          valorA = a.producto.importeTotal;
          valorB = b.producto.importeTotal;
          break;
        default:
          valorA = 0;
          valorB = 0;
      }
      
      // Comparar
      let comparacion: number;
      if (typeof valorA === 'string' && typeof valorB === 'string') {
        comparacion = valorA.localeCompare(valorB);
      } else {
        comparacion = (valorA as number) - (valorB as number);
      }
      
      return sortDirection === 'asc' ? comparacion : -comparacion;
    });
    
    return filas;
  });

  // Inicializar fechas al mes actual y cargar proveedores
  onMount(async () => {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    fechaDesde = primerDiaMes;
    fechaHasta = ultimoDiaMes;
    
    // Cargar proveedores y formas de pago
    await Promise.all([
      new Promise((r) => setTimeout(r, 500)).then(() => cargarTodosLosProveedores()),
      cargarFormasPago()
    ]);
    
    // Restaurar filtros guardados al volver de otra pestaña
    if (browser) {
      const savedState = navigationState.getState(INFORME_PATH);
      const filters = savedState?.filters as { fechaDesde?: string; fechaHasta?: string; proveedorCodigo?: string; pagoTipo?: string } | undefined;
      if (filters?.fechaDesde) fechaDesde = new Date(filters.fechaDesde);
      if (filters?.fechaHasta) fechaHasta = new Date(filters.fechaHasta);
      if (filters?.pagoTipo) filtroPagoTipo = filters.pagoTipo;
      if (filters?.proveedorCodigo && todosLosProveedores.length > 0) {
        const codigos = filters.proveedorCodigo.split(',').filter(Boolean);
        proveedoresSeleccionados = codigos
          .map((c) => todosLosProveedores.find((p) => p.codigo === c.trim()))
          .filter(Boolean) as ProveedorOption[];
      }
      // Si teníamos filtros guardados, restaurar datos desde caché (o fetch si expiró)
      if (filters) {
        cargarDatosVentas();
      }
    }
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

  function buildCacheParams() {
    return {
      fechaDesde: formatDate(fechaDesde),
      fechaHasta: formatDate(fechaHasta),
      proveedorCodigo: proveedoresSeleccionados.map((p) => p.codigo).sort().join(','),
      pagoTipo: filtroPagoTipo
    };
  }

  // Función para cargar los datos de ventas (con caché IndexedDB)
  async function cargarDatosVentas(forceRefresh = false) {
    try {
      loading = true;
      error = null;
      cacheTimestamp = null;
      productosSeleccionados = new Set();

      const params = buildCacheParams();
      const paramsForUrl = new URLSearchParams({
        fechaDesde: params.fechaDesde,
        fechaHasta: params.fechaHasta
      });
      if (params.proveedorCodigo) paramsForUrl.append('proveedorCodigo', params.proveedorCodigo);
      if (params.pagoTipo) paramsForUrl.append('pagoTipo', params.pagoTipo);

      if (!forceRefresh && browser) {
        const cached = await informeCache.get<DatosVentas>('proveedores', params);
        if (cached) {
          datosVentas = cached.data;
          cacheTimestamp = cached.timestamp;
          actualizarGrafico();
          loading = false;
          return;
        }
      }

      const response = await fetchWithAuth(`/informes/ventas-por-proveedor?${paramsForUrl}`);

      if (!response.ok) {
        throw new Error('Error al cargar los datos');
      }

      const result = await response.json();

      if (result.success) {
        datosVentas = result.data;
        cacheTimestamp = Date.now();
        if (browser) {
          await informeCache.set('proveedores', params, result.data);
        }
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
  let todosLosProveedores = $state<ProveedorOption[]>([]);
  let cargandoProveedores = $state(false);
  let busquedaProveedor = $state('');

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

  // Cargar formas de pago para filtro
  async function cargarFormasPago() {
    try {
      const response = await fetchWithAuth('/tipos-pago');
      if (!response.ok) return;
      const result = await response.json();
      formasPago = (result.items || []).map((item: { Codigo: string; Descripcion: string }) => ({
        value: item.Codigo,
        label: item.Descripcion
      }));
    } catch (err) {
      console.error('Error cargando formas de pago:', err);
      formasPago = [];
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

  function keyProducto(proveedor: ProveedorVenta, producto: ProductoVenta): string {
    return `${proveedor.codigo}|${producto.codigo}`;
  }

  function isProductoSeleccionado(proveedor: ProveedorVenta, producto: ProductoVenta): boolean {
    return productosSeleccionados.has(keyProducto(proveedor, producto));
  }

  function toggleProducto(proveedor: ProveedorVenta, producto: ProductoVenta) {
    if (proveedor.codigo === 'SIN_PROVEEDOR') return;
    error = null;
    const key = keyProducto(proveedor, producto);
    const next = new Set(productosSeleccionados);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    productosSeleccionados = next;
  }

  function toggleTodosProductos() {
    if (!datosVentas) return;
    error = null;
    const selectables = datosVentas.proveedores
      .filter((p) => p.codigo !== 'SIN_PROVEEDOR')
      .flatMap((p) => p.productos.map((prod) => keyProducto(p, prod)));
    const todosIncluidos = selectables.every((k) => productosSeleccionados.has(k));
    if (todosIncluidos) {
      const next = new Set(productosSeleccionados);
      selectables.forEach((k) => next.delete(k));
      productosSeleccionados = next;
    } else {
      productosSeleccionados = new Set([...productosSeleccionados, ...selectables]);
    }
  }

  function todosProductosSeleccionados(): boolean {
    if (!datosVentas) return false;
    const selectables = datosVentas.proveedores
      .filter((p) => p.codigo !== 'SIN_PROVEEDOR')
      .flatMap((p) => p.productos.map((prod) => keyProducto(p, prod)));
    return selectables.length > 0 && selectables.every((k) => productosSeleccionados.has(k));
  }

  function crearOrdenConSeleccionados() {
    if (!browser || !datosVentas) return;
    const itemsByProvider = new Map<
      string,
      {
        proveedor: ProveedorVenta;
        items: {
          codigo: string;
          descripcion: string;
          cantidad: number;
          existencia: number;
          cantidadVendidaPeriodo: number;
        }[];
      }
    >();
    for (const proveedor of datosVentas.proveedores) {
      if (proveedor.codigo === 'SIN_PROVEEDOR') continue;
      for (const producto of proveedor.productos) {
        if (!productosSeleccionados.has(keyProducto(proveedor, producto))) continue;
        const cant = producto.cantidadSugerida && producto.cantidadSugerida > 0 ? producto.cantidadSugerida : producto.cantidad;
        const qty = cant > 0 ? cant : producto.cantidad || 1;
        const list = itemsByProvider.get(proveedor.codigo);
        const item = {
          codigo: producto.codigo,
          descripcion: producto.descripcion,
          cantidad: qty,
          existencia: producto.existencia ?? 0,
          cantidadVendidaPeriodo: producto.cantidad ?? 0
        };
        if (list) list.items.push(item);
        else itemsByProvider.set(proveedor.codigo, { proveedor, items: [item] });
      }
    }
    const providers = [...itemsByProvider.values()];
    if (providers.length === 0) {
      error = 'Seleccione al menos un producto';
      return;
    }
    if (providers.length > 1) {
      error = 'Seleccione productos de un solo proveedor para crear la orden';
      return;
    }
    const { proveedor, items } = providers[0];
    const payload = {
      proveedorCodigo: proveedor.codigo,
      proveedorDescripcion: proveedor.descripcion,
      items: items.map((it) => ({
        CodigoArticulo: it.codigo,
        Descripcion: it.descripcion,
        Cantidad: it.cantidad,
        PrecioCostoUnitario: 0,
        Existencia: it.existencia,
        CantidadVendidaPeriodo: it.cantidadVendidaPeriodo
      }))
    };
    error = null;
    sessionStorage.setItem(STORAGE_KEY_ORDEN_INFORME, JSON.stringify(payload));
    goto(`/compras/ordenes/nueva?from=informe&proveedor=${encodeURIComponent(proveedor.codigo)}`);
  }

  // Observador para actualizar el gráfico cuando cambien los datos o el tipo de gráfico
  $effect(() => {
    if (datosVentas && chartCanvas) actualizarGrafico();
  });
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
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      <div>
        <label for="fechaDesde" class="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
        <DatePicker id="fechaDesde" bind:value={fechaDesde} />
      </div>
      <div>
        <label for="fechaHasta" class="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label>
        <DatePicker id="fechaHasta" bind:value={fechaHasta} />
      </div>
      <div>
        <label for="filtroPagoTipo" class="block text-sm font-medium text-gray-700 mb-2">Forma de pago</label>
        <select
          id="filtroPagoTipo"
          bind:value={filtroPagoTipo}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="">Todas</option>
          {#each formasPago as fp}
            <option value={fp.value}>{fp.label}</option>
          {/each}
        </select>
      </div>
      <div class="md:col-span-4">
        <label for="busquedaProveedor" class="block text-sm font-medium text-gray-700 mb-2">
          Filtrar por Proveedores (Opcional)
        </label>
        
        <div class="flex gap-2 mb-2">
          {#if todosLosProveedores.length > 0}
            <button
              type="button"
              onclick={seleccionarTodosLosProveedores}
              class="px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm whitespace-nowrap flex-shrink-0"
              title="Seleccionar todos los proveedores"
            >
              Todos
            </button>
          {/if}
          
          {#if proveedoresSeleccionados.length > 0}
            <button
              type="button"
              onclick={limpiarTodosLosProveedores}
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
        
        {#if proveedoresSeleccionados.length > 0}
          <div class="mb-2">
            <div class="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-2 rounded-md inline-block">
              ✓ {proveedoresSeleccionados.length} proveedor{proveedoresSeleccionados.length !== 1 ? 'es' : ''} seleccionado{proveedoresSeleccionados.length !== 1 ? 's' : ''}
            </div>
          </div>
        {/if}

        <!-- Búsqueda para agregar proveedores -->
        <div class="relative">
          <input
            id="busquedaProveedor"
            type="text"
            bind:value={busquedaProveedor}
            onfocus={() => mostrarDropdownProveedores = true}
            onblur={cerrarDropdownProveedores}
            placeholder="Buscar y agregar proveedores..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          
          <!-- Dropdown de búsqueda -->
          {#if mostrarDropdownProveedores && filtrarProveedores().length > 0}
            <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              <!-- Opción para seleccionar todos -->
              <div class="sticky top-0 bg-gray-50 border-b border-gray-200">
                <button
                  type="button"
                  onclick={seleccionarTodosLosProveedores}
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
                  onclick={() => alternarProveedor(proveedor)}
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
        onclick={() => cargarDatosVentas()}
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
    <!-- Badge caché y botón Actualizar -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
      {#if cacheTimestamp}
        <span class="inline-flex items-center rounded-md bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
          Datos de hace {Math.round((Date.now() - cacheTimestamp) / 60000)} min
        </span>
      {:else}
        <span></span>
      {/if}
      <button
        type="button"
        onclick={() => cargarDatosVentas(true)}
        disabled={loading}
        class="inline-flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
      >
        <Icon icon={RefreshCw} size={16} />
        Actualizar
      </button>
    </div>

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
              onclick={() => tipoGrafico = 'cantidad'}
            >
              Cantidad
            </button>
            <button
              class="px-3 py-1 rounded {tipoGrafico === 'importe' ? 'bg-blue-500 text-white' : 'bg-gray-200'}"
              onclick={() => tipoGrafico = 'importe'}
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
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 class="text-xl font-semibold flex items-center gap-2">
          <Icon icon={BarChart3} size={20} strokeWidth={2.5} glass={true} />
          Detalle Completo por Proveedor
        </h2>
        <button
          type="button"
          onclick={crearOrdenConSeleccionados}
          disabled={productosSeleccionados.size === 0}
          class="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon={ShoppingCart} size={18} />
          Crear orden con productos seleccionados ({productosSeleccionados.size})
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th 
                class="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                onclick={() => toggleSort('proveedor')}
              >
                <div class="flex items-center gap-1">
                  Proveedor
                  {#if sortColumn === 'proveedor'}
                    <span class="text-blue-600">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  {:else}
                    <span class="text-gray-300">▲</span>
                  {/if}
                </div>
              </th>
              <th 
                class="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                onclick={() => toggleSort('producto')}
              >
                <div class="flex items-center gap-1">
                  Producto
                  {#if sortColumn === 'producto'}
                    <span class="text-blue-600">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  {:else}
                    <span class="text-gray-300">▲</span>
                  {/if}
                </div>
              </th>
              <th 
                class="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                onclick={() => toggleSort('existencia')}
              >
                <div class="flex items-center justify-end gap-1">
                  Existencia
                  {#if sortColumn === 'existencia'}
                    <span class="text-blue-600">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  {:else}
                    <span class="text-gray-300">▲</span>
                  {/if}
                </div>
              </th>
              <th 
                class="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                onclick={() => toggleSort('existenciaMinima')}
              >
                <div class="flex items-center justify-end gap-1">
                  Exist. mínima
                  {#if sortColumn === 'existenciaMinima'}
                    <span class="text-blue-600">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  {:else}
                    <span class="text-gray-300">▲</span>
                  {/if}
                </div>
              </th>
              <th 
                class="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                onclick={() => toggleSort('cantidadSugerida')}
              >
                <div class="flex items-center justify-end gap-1">
                  Cant. sugerida
                  {#if sortColumn === 'cantidadSugerida'}
                    <span class="text-blue-600">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  {:else}
                    <span class="text-gray-300">▲</span>
                  {/if}
                </div>
              </th>
              <th 
                class="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                onclick={() => toggleSort('cantidad')}
              >
                <div class="flex items-center justify-end gap-1">
                  Cantidad
                  {#if sortColumn === 'cantidad'}
                    <span class="text-blue-600">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  {:else}
                    <span class="text-gray-300">▲</span>
                  {/if}
                </div>
              </th>
              <th 
                class="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                onclick={() => toggleSort('importe')}
              >
                <div class="flex items-center justify-end gap-1">
                  Importe
                  {#if sortColumn === 'importe'}
                    <span class="text-blue-600">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  {:else}
                    <span class="text-gray-300">▲</span>
                  {/if}
                </div>
              </th>
              <th class="text-center py-3 px-4 font-semibold">
                <label class="flex items-center justify-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={todosProductosSeleccionados()}
                    onchange={toggleTodosProductos}
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span class="text-sm">Seleccionar todos</span>
                </label>
              </th>
            </tr>
          </thead>
          <tbody>
            {#each datosOrdenados as { proveedor, producto }}
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
                    {producto.existencia ?? 0} u
                  </span>
                </td>
                <td class="py-3 px-4 text-right text-sm text-gray-600">
                  {producto.existenciaMinima ?? 0} u
                </td>
                <td class="py-3 px-4 text-right">
                  <span class="text-sm {producto.cantidadSugerida && producto.cantidadSugerida > 0 ? 'font-semibold text-amber-600' : 'text-gray-500'}">
                    {producto.cantidadSugerida ?? 0} u
                  </span>
                </td>
                <td class="py-3 px-4 text-right font-semibold">{producto.cantidad}</td>
                <td class="py-3 px-4 text-right font-semibold">{formatearMoneda(producto.importeTotal)}</td>
                <td class="py-3 px-4 text-center">
                  {#if proveedor.codigo !== 'SIN_PROVEEDOR'}
                    <input
                      type="checkbox"
                      checked={isProductoSeleccionado(proveedor, producto)}
                      onchange={() => toggleProducto(proveedor, producto)}
                      class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  {:else}
                    <span class="text-gray-400">-</span>
                  {/if}
                </td>
              </tr>
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
