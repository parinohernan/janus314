<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import '../components/bot.css';
  import { auth } from '$lib/stores/authStore';
  import { get } from 'svelte/store';
  import LogoJano from '../components/LogoJano.svelte';
  
  // Estado de la interfaz
  let activeTab = 'vendedores'; // 'vendedores' o 'productos'
  let loading = false;
  let error = '';
  
  // Fechas para consultas
  let fechaDesde = '';
  let fechaHasta = '';
  
  // Datos para estadísticas
  let vendedorSeleccionado = '';
  let vendedores: Array<{codigo: string, nombre: string}> = [];
  let estadisticasVendedor: any = null;
  let productosVendedor: Array<any> = [];
  let detalleVentas: Array<any> = [];
  
  // Datos para productos
  let productosMasVendidos: Array<any> = [];
  let productosMenosVendidos: Array<any> = [];
  let rotacionStock: Array<any> = [];
  
  // Inicializar fechas a mes actual
  onMount(() => {
    const hoy = new Date();
    
    // Usar el mes actual en lugar de fechas futuras
    // El primer día del mes actual
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    // El último día del mes actual (o el día actual si estamos en el mismo mes)
    let ultimoDiaMes;
    if (hoy.getDate() < 28) { // Si estamos antes del día 28 del mes
      ultimoDiaMes = hoy; // Usar la fecha de hoy como límite
    } else {
      // Si estamos al final del mes, usar el último día del mes
      ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    }
    
    fechaDesde = formatDate(primerDiaMes);
    fechaHasta = formatDate(ultimoDiaMes);
    
    // Cargar lista de vendedores
    cargarVendedores();
  });
  
  // Formatear fecha para input date
  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Función para volver a la página de inicio
  function volverInicio() {
    goto('/ventas/bot/home');
  }
  
  // Cambiar tab activo
  function cambiarTab(tab: string) {
    activeTab = tab;
    
    // Si cambiamos a productos, cargamos automáticamente los datos
    if (tab === 'productos') {
      cargarEstadisticasProductos();
    }
  }
  
  // Cargar lista de vendedores
  async function cargarVendedores() {
    try {
      loading = true;
      error = '';
      
      try {
        // Obtener todos los vendedores desde la API
        const responseVendedores = await fetchWithAuth('/api/vendedores');
        if (!responseVendedores.ok) {
          throw new Error(`Error al cargar vendedores: ${responseVendedores.status}`);
        }
        
        const vendedoresData = await responseVendedores.json();
        
        if (vendedoresData.success && Array.isArray(vendedoresData.data)) {
          // Mapear los datos de vendedores al formato esperado
          vendedores = vendedoresData.data.map((v: any) => ({
            codigo: v.Codigo,
            nombre: v.Descripcion || v.Codigo
          }));
          
          // Obtener usuario actual desde el store de autenticación
          const authState = get(auth);
          const currentUser = authState.user;
          
          // Si hay un usuario actual y está entre los vendedores, seleccionarlo por defecto
          if (currentUser && authState.isAuthenticated) {
            // Buscar si el usuario actual es un vendedor
            const usuarioVendedor = vendedores.find(v => v.codigo === currentUser.usuario);
            
            if (usuarioVendedor) {
              vendedorSeleccionado = currentUser.usuario;
            } else if (vendedores.length > 0) {
              // Si el usuario no es vendedor, seleccionar el primer vendedor de la lista
              vendedorSeleccionado = vendedores[0].codigo;
            }
          } else if (vendedores.length > 0) {
            // Si no hay usuario actual, seleccionar el primer vendedor
            vendedorSeleccionado = vendedores[0].codigo;
          }
          
          // Si no hay vendedores en la respuesta, usar datos predeterminados
          if (vendedores.length === 0) {
            vendedores = [{ codigo: '1', nombre: 'Vendedor Predeterminado' }];
            vendedorSeleccionado = '1';
          }
        } else {
          // Si hay un error o formato incorrecto, usar datos predeterminados
          throw new Error('Formato de datos incorrecto');
        }
      } catch (err) {
        console.error("Error al cargar vendedores:", err);
        
        // En caso de error, establecer un vendedor por defecto
        vendedores = [{ codigo: '1', nombre: 'Vendedor Predeterminado' }];
        vendedorSeleccionado = '1';
      }
      
      // Cargar estadísticas para el vendedor seleccionado
      if (vendedorSeleccionado) {
        await cargarEstadisticasVendedor();
      }
      
    } catch (err) {
      console.error("Error al inicializar vendedores:", err);
      error = "No se pudieron cargar los vendedores. Intente recargar la página.";
      
      // En caso de error general, establecer un vendedor por defecto
      vendedores = [{ codigo: '1', nombre: 'Vendedor Predeterminado' }];
      vendedorSeleccionado = '1';
    } finally {
      loading = false;
    }
  }
  
  // Cargar estadísticas del vendedor seleccionado
  async function cargarEstadisticasVendedor() {
    if (!vendedorSeleccionado || !fechaDesde || !fechaHasta) return;
    
    try {
      loading = true;
      error = '';
      
      // Crear estructura para datos predeterminados en caso de error
      const datosDefecto = {
        estadisticas: {
          VendedorCodigo: vendedorSeleccionado,
          totalComprobantes: 0,
          montoTotal: 0
        },
        productos: [],
        ventas: []
      };
      
      try {
        // Cargar ventas del vendedor
        const responseVentas = await fetchWithAuth(
          `/informes/vendedores/ventas?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}&vendedorCodigo=${vendedorSeleccionado}`
        );
        
        if (!responseVentas.ok) {
          console.warn(`Error al cargar estadísticas de ventas: ${responseVentas.status}`);
          // Continuar con datos predeterminados
          estadisticasVendedor = datosDefecto.estadisticas;
        } else {
          const ventasData = await responseVentas.json();
          estadisticasVendedor = ventasData.data.find((v: any) => v.VendedorCodigo === vendedorSeleccionado) || datosDefecto.estadisticas;
        }
      } catch (err) {
        console.error("Error en API de estadísticas:", err);
        estadisticasVendedor = datosDefecto.estadisticas;
      }
      
      try {
        // Cargar productos vendidos por el vendedor
        const responseProductos = await fetchWithAuth(
          `/informes/vendedores/productos?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}&vendedorCodigo=${vendedorSeleccionado}`
        );
        
        if (!responseProductos.ok) {
          console.warn(`Error al cargar productos: ${responseProductos.status}`);
          // Continuar con datos predeterminados
          productosVendedor = datosDefecto.productos;
        } else {
          const productosData = await responseProductos.json();
          const vendedorData = productosData.data.vendedores.find((v: any) => v.vendedor === vendedorSeleccionado);
          productosVendedor = vendedorData ? vendedorData.productos : datosDefecto.productos;
        }
      } catch (err) {
        console.error("Error en API de productos:", err);
        productosVendedor = datosDefecto.productos;
      }
      
      try {
        // Cargar detalle de ventas
        const responseDetalle = await fetchWithAuth(
          `/informes/vendedores/detalle?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}&vendedorCodigo=${vendedorSeleccionado}`
        );
        
        if (!responseDetalle.ok) {
          console.warn(`Error al cargar detalle: ${responseDetalle.status}`);
          // Continuar con datos predeterminados
          detalleVentas = datosDefecto.ventas;
        } else {
          const detalleData = await responseDetalle.json();
          detalleVentas = detalleData.data;
        }
      } catch (err) {
        console.error("Error en API de detalle:", err);
        detalleVentas = datosDefecto.ventas;
      }
      
    } catch (err) {
      console.error("Error general al cargar estadísticas:", err);
      error = "No se pudieron cargar todas las estadísticas. Se muestran datos parciales.";
      
      // Usar datos predeterminados si no se establecieron antes
      if (!estadisticasVendedor) {
        estadisticasVendedor = {
          VendedorCodigo: vendedorSeleccionado,
          totalComprobantes: 0,
          montoTotal: 0
        };
      }
      
      if (!productosVendedor) productosVendedor = [];
      if (!detalleVentas) detalleVentas = [];
      
    } finally {
      loading = false;
    }
  }
  
  // Cargar estadísticas de productos
  async function cargarEstadisticasProductos() {
    if (!fechaDesde || !fechaHasta) return;
    
    try {
      loading = true;
      error = '';
      
      // Datos predeterminados en caso de error
      const datosDefecto = {
        masVendidos: [],
        menosVendidos: [],
        rotacion: []
      };
      
      try {
        // Cargar productos más vendidos
        const responseMasVendidos = await fetchWithAuth(
          `/informes/productos/mas-vendidos?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}&limite=10`
        );
        
        if (!responseMasVendidos.ok) {
          console.warn(`Error al cargar productos más vendidos: ${responseMasVendidos.status}`);
          productosMasVendidos = datosDefecto.masVendidos;
        } else {
          const masVendidosData = await responseMasVendidos.json();
          productosMasVendidos = masVendidosData.data;
        }
      } catch (err) {
        console.error("Error en API de productos más vendidos:", err);
        productosMasVendidos = datosDefecto.masVendidos;
      }
      
      try {
        // Cargar productos menos vendidos
        const responseMenosVendidos = await fetchWithAuth(
          `/informes/productos/menos-vendidos?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}&limite=10`
        );
        
        if (!responseMenosVendidos.ok) {
          console.warn(`Error al cargar productos menos vendidos: ${responseMenosVendidos.status}`);
          productosMenosVendidos = datosDefecto.menosVendidos;
        } else {
          const menosVendidosData = await responseMenosVendidos.json();
          productosMenosVendidos = menosVendidosData.data;
        }
      } catch (err) {
        console.error("Error en API de productos menos vendidos:", err);
        productosMenosVendidos = datosDefecto.menosVendidos;
      }
      
      try {
        // Cargar rotación de stock
        const responseRotacion = await fetchWithAuth(
          `/informes/productos/rotacion-stock?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`
        );
        
        if (!responseRotacion.ok) {
          console.warn(`Error al cargar rotación de stock: ${responseRotacion.status}`);
          rotacionStock = datosDefecto.rotacion;
        } else {
          const rotacionData = await responseRotacion.json();
          rotacionStock = rotacionData.data.slice(0, 10); // Mostrar solo los 10 primeros
        }
      } catch (err) {
        console.error("Error en API de rotación de stock:", err);
        rotacionStock = datosDefecto.rotacion;
      }
      
    } catch (err) {
      console.error("Error general al cargar estadísticas de productos:", err);
      error = "No se pudieron cargar todas las estadísticas de productos. Se muestran datos parciales.";
      
      // Usar datos predeterminados si no se establecieron antes
      if (!productosMasVendidos) productosMasVendidos = [];
      if (!productosMenosVendidos) productosMenosVendidos = [];
      if (!rotacionStock) rotacionStock = [];
      
    } finally {
      loading = false;
    }
  }
  
  // Formatear fecha para mostrar
  function formatearFecha(fechaStr: string | null): string {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-AR');
  }
  
  // Formatear monto para mostrar
  function formatearMonto(monto: number | null | undefined): string {
    if (monto === null || monto === undefined) return '$0.00';
    return `$${parseFloat(monto.toString()).toFixed(2)}`;
  }
  
  // Formatear tipo de comprobante
  function formatearTipoComprobante(tipo: string): string {
    const tipos: Record<string, string> = {
      'FAA': 'Factura A',
      'FAB': 'Factura B',
      'FAC': 'Factura C',
      'PRF': 'Prefactura',
      'RMA': 'Remito',
      'NCA': 'NC A',
      'NCB': 'NC B',
      'NCC': 'NC C'
    };
    return tipos[tipo] || tipo;
  }
  
  // Formatear número de comprobante
  function formatearNumeroComprobante(sucursal: string, numero: string): string {
    const sucursalStr = sucursal.padStart(4, '0');
    const numeroStr = numero.padStart(8, '0');
    return `${sucursalStr}-${numeroStr}`;
  }
  
  // Buscar cuando cambien las fechas
  $: if (fechaDesde && fechaHasta) {
    if (activeTab === 'vendedores' && vendedorSeleccionado) {
      cargarEstadisticasVendedor();
    } else if (activeTab === 'productos') {
      cargarEstadisticasProductos();
    }
  }
  
  // Calcular total de ventas en el período
  $: totalVentasPeriodo = detalleVentas.reduce((total, venta) => total + parseFloat(venta.ImporteTotal || 0), 0);
  
  // Calcular promedio de venta
  $: promedioVenta = detalleVentas.length > 0 ? totalVentasPeriodo / detalleVentas.length : 0;
</script>

<div class="telegram-webapp">
  <!-- Header con título y botón volver -->
  <header class="header">
    <div class="header-content">
      <button class="btn-back" on:click={volverInicio} aria-label="Volver">
        <span class="back-icon">←</span>
      </button>
      <div class="title-container">
        <LogoJano size="small" animated={false} />
        <h2 class="page-subtitle">Estadísticas</h2>
      </div>
    </div>
  </header>
  
  <!-- Selección de fechas y filtros -->
  <div class="filtros-container">
    <div class="fecha-container">
      <div class="fecha-grupo">
        <label for="fecha-desde">Desde:</label>
        <input 
          type="date" 
          id="fecha-desde" 
          bind:value={fechaDesde} 
          class="input-fecha" 
        />
      </div>
      
      <div class="fecha-grupo">
        <label for="fecha-hasta">Hasta:</label>
        <input 
          type="date" 
          id="fecha-hasta" 
          bind:value={fechaHasta} 
          class="input-fecha" 
        />
      </div>
    </div>
  </div>
  
  <!-- Tabs para cambiar entre estadísticas -->
  <div class="tabs-container">
    <button 
      class="tab-button {activeTab === 'vendedores' ? 'active' : ''}" 
      on:click={() => cambiarTab('vendedores')}
    >
      👤 Vendedores
    </button>
    <button 
      class="tab-button {activeTab === 'productos' ? 'active' : ''}" 
      on:click={() => cambiarTab('productos')}
    >
      📦 Productos
    </button>
  </div>
  
  {#if loading}
    <div class="loading-container">
      <span class="loader"></span>
      <p>Cargando datos...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <p class="error-message">{error}</p>
      <button class="btn-reintentar" on:click={() => activeTab === 'vendedores' ? cargarEstadisticasVendedor() : cargarEstadisticasProductos()}>
        Reintentar
      </button>
    </div>
  {:else}
    <!-- Contenido para estadísticas de vendedores -->
    {#if activeTab === 'vendedores'}
      <div class="vendedores-container">
        <div class="select-container">
          <label for="select-vendedor">Seleccionar Vendedor:</label>
          <select 
            id="select-vendedor" 
            bind:value={vendedorSeleccionado} 
            on:change={cargarEstadisticasVendedor}
            class="select-input"
          >
            {#each vendedores as vendedor}
              <option value={vendedor.codigo}>{vendedor.nombre}</option>
            {/each}
          </select>
        </div>
        
        {#if estadisticasVendedor}
          <div class="stats-cards">
            <div class="stat-card">
              <div class="stat-icon">🧾</div>
              <div class="stat-content">
                <div class="stat-value">{estadisticasVendedor.totalComprobantes || 0}</div>
                <div class="stat-label">Comprobantes</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">💰</div>
              <div class="stat-content">
                <div class="stat-value">{formatearMonto(estadisticasVendedor.montoTotal)}</div>
                <div class="stat-label">Ventas Totales</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">📊</div>
              <div class="stat-content">
                <div class="stat-value">{formatearMonto(promedioVenta)}</div>
                <div class="stat-label">Promedio por Venta</div>
              </div>
            </div>
          </div>
          
          <!-- Productos vendidos por el vendedor -->
          <div class="seccion">
            <h3 class="seccion-titulo">Productos Vendidos</h3>
            {#if productosVendedor.length > 0}
              <div class="tabla-container">
                <table class="tabla-datos">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each productosVendedor as producto}
                      <tr>
                        <td>{producto.descripcion || producto.codigo}</td>
                        <td class="text-center">{producto.cantidad}</td>
                        <td class="text-right">{formatearMonto(producto.montoTotal)}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {:else}
              <p class="no-data-message">No hay productos vendidos en este período</p>
            {/if}
          </div>
          
          <!-- Detalle de ventas -->
          <div class="seccion">
            <h3 class="seccion-titulo">Detalle de Ventas</h3>
            {#if detalleVentas.length > 0}
              <div class="tabla-container">
                <table class="tabla-datos">
                  <thead>
                    <tr>
                      <th>Comprobante</th>
                      <th>Fecha</th>
                      <th>Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each detalleVentas as venta}
                      <tr>
                        <td>
                          {formatearTipoComprobante(venta.DocumentoTipo)} 
                          {formatearNumeroComprobante(venta.DocumentoSucursal, venta.DocumentoNumero)}
                        </td>
                        <td>{formatearFecha(venta.Fecha)}</td>
                        <td class="text-right">{formatearMonto(venta.ImporteTotal)}</td>
                      </tr>
                    {/each}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="2" class="text-right"><strong>Total:</strong></td>
                      <td class="text-right"><strong>{formatearMonto(totalVentasPeriodo)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            {:else}
              <p class="no-data-message">No hay ventas en este período</p>
            {/if}
          </div>
        {:else}
          <p class="no-data-message">Seleccione un vendedor para ver sus estadísticas</p>
        {/if}
      </div>
    
    <!-- Contenido para estadísticas de productos -->
    {:else if activeTab === 'productos'}
      <div class="productos-container">
        <!-- Productos más vendidos -->
        <div class="seccion">
          <h3 class="seccion-titulo">Productos Más Vendidos</h3>
          {#if productosMasVendidos.length > 0}
            <div class="tabla-container">
              <table class="tabla-datos">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Stock</th>
                    <th>Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {#each productosMasVendidos as producto}
                    <tr>
                      <td>{producto.descripcion || producto.codigo}</td>
                      <td class="text-center">{producto.cantidad}</td>
                      <td class="text-center">{producto.stock}</td>
                      <td class="text-right">{formatearMonto(producto.montoTotal)}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <p class="no-data-message">No hay datos de productos vendidos en este período</p>
          {/if}
        </div>
        
        <!-- Productos menos vendidos -->
        <div class="seccion">
          <h3 class="seccion-titulo">Productos Menos Vendidos</h3>
          {#if productosMenosVendidos.length > 0}
            <div class="tabla-container">
              <table class="tabla-datos">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {#each productosMenosVendidos as producto}
                    <tr>
                      <td>{producto.descripcion || producto.codigo}</td>
                      <td class="text-center">{producto.cantidad}</td>
                      <td class="text-center">{producto.stock}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <p class="no-data-message">No hay datos de productos menos vendidos en este período</p>
          {/if}
        </div>
        
        <!-- Rotación de stock -->
        <div class="seccion">
          <h3 class="seccion-titulo">Rotación de Stock</h3>
          {#if rotacionStock.length > 0}
            <div class="tabla-container">
              <table class="tabla-datos">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Stock</th>
                    <th>Vendidos</th>
                    <th>Índice</th>
                  </tr>
                </thead>
                <tbody>
                  {#each rotacionStock as producto}
                    <tr>
                      <td>{producto.descripcion || producto.codigo}</td>
                      <td class="text-center">{producto.stock}</td>
                      <td class="text-center">{producto.cantidadVendida}</td>
                      <td class="text-center">{producto.rotacion.toFixed(2)}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <p class="no-data-message">No hay datos de rotación de stock en este período</p>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .telegram-webapp {
    padding: 16px;
    max-width: 100%;
    min-height: 100vh;
    color: var(--tg-theme-text-color, #000);
    background: var(--tg-theme-bg-color, #fff);
  }

  .header {
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .title-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-back {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--tg-theme-button-color, #2481cc);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
  }

  .page-subtitle {
    font-size: 1.5rem;
    margin: 0;
    color: var(--tg-theme-text-color, #000);
  }

  .filtros-container {
    margin-bottom: 16px;
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    padding: 12px;
    border-radius: 8px;
  }

  .fecha-container {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .fecha-grupo {
    flex: 1;
    min-width: 120px;
  }

  .fecha-grupo label {
    display: block;
    margin-bottom: 6px;
    font-size: 0.9rem;
    color: var(--tg-theme-hint-color, #777);
  }

  .input-fecha {
    width: 100%;
    padding: 8px;
    border: 1px solid var(--tg-theme-hint-color, #ccc);
    border-radius: 6px;
    background-color: var(--tg-theme-bg-color, #fff);
    color: var(--tg-theme-text-color, #000);
  }

  .tabs-container {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--tg-theme-hint-color, #eee);
  }

  .tab-button {
    background: none;
    border: none;
    padding: 10px 16px;
    cursor: pointer;
    font-size: 1rem;
    color: var(--tg-theme-hint-color, #777);
    font-weight: 500;
    position: relative;
  }

  .tab-button.active {
    color: var(--tg-theme-button-color, #2481cc);
  }

  .tab-button.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background-color: var(--tg-theme-button-color, #2481cc);
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 0;
    color: var(--tg-theme-hint-color, #777);
  }

  .loader {
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top: 3px solid var(--tg-theme-button-color, #2481cc);
    border-radius: 50%;
    width: 30px;
    height: 30px;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-container {
    background-color: #ffebee;
    padding: 16px;
    border-radius: 8px;
    margin: 16px 0;
    text-align: center;
  }

  .error-message {
    color: #d32f2f;
    margin: 0 0 12px 0;
  }

  .btn-reintentar {
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .select-container {
    margin-bottom: 16px;
  }

  .select-container label {
    display: block;
    margin-bottom: 6px;
    font-size: 0.9rem;
    color: var(--tg-theme-hint-color, #777);
  }

  .select-input {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--tg-theme-hint-color, #ccc);
    border-radius: 6px;
    background-color: var(--tg-theme-bg-color, #fff);
    color: var(--tg-theme-text-color, #000);
    font-size: 1rem;
  }

  .stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
  }

  .stat-card {
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stat-icon {
    font-size: 1.8rem;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--tg-theme-button-color, #2481cc);
  }

  .stat-label {
    font-size: 0.85rem;
    color: var(--tg-theme-hint-color, #777);
  }

  .seccion {
    margin-bottom: 24px;
  }

  .seccion-titulo {
    font-size: 1.1rem;
    margin: 0 0 12px 0;
    color: var(--tg-theme-text-color, #000);
  }

  .tabla-container {
    overflow-x: auto;
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 8px;
    max-height: 400px;
    overflow-y: auto;
  }

  .tabla-datos {
    width: 100%;
    border-collapse: collapse;
  }

  .tabla-datos th, 
  .tabla-datos td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  .tabla-datos th {
    background-color: rgba(0, 0, 0, 0.05);
    color: var(--tg-theme-hint-color, #777);
    font-weight: 500;
    font-size: 0.85rem;
    position: sticky;
    top: 0;
  }

  .text-center {
    text-align: center;
  }

  .text-right {
    text-align: right;
  }

  .no-data-message {
    color: var(--tg-theme-hint-color, #777);
    text-align: center;
    padding: 16px;
  }

  .productos-container .seccion:last-child,
  .vendedores-container .seccion:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 480px) {
    .page-subtitle {
      font-size: 1.3rem;
    }
    
    .tab-button {
      font-size: 0.9rem;
      padding: 8px 12px;
    }
    
    .stat-card {
      padding: 10px;
    }
    
    .stat-icon {
      font-size: 1.5rem;
    }
    
    .stat-value {
      font-size: 1rem;
    }
    
    .tabla-datos th, 
    .tabla-datos td {
      padding: 8px;
      font-size: 0.85rem;
    }
  }
</style> 