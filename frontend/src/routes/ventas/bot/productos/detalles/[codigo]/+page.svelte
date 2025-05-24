<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import '../../../../../../app.css';
  import { ProveedorService, type Proveedor } from '$lib/services/ProveedorService';
  import { RubroService, type Rubro } from '$lib/services/RubroService';
  import Breadcrumbs from '../../../components/Breadcrumbs/index.svelte';
  
  // Exportar las propiedades del componente
  export let data: { articulo: any };

  // Datos del producto
  let producto = data.articulo || {};
  
  // Información adicional
  let proveedor: Proveedor | null = null;
  let rubro: Rubro | null = null;
  let loading = false;
  let error = '';

  // Cargar información adicional
  async function cargarInformacionAdicional() {
    try {
      loading = true;
      error = '';
      
      // Cargar información del proveedor si existe
      if (producto.ProveedorCodigo) {
        const proveedores = await ProveedorService.obtenerProveedores();
        proveedor = proveedores.find(p => p.Codigo === producto.ProveedorCodigo) || null;
      }
      
      // Cargar información del rubro si existe
      if (producto.RubroCodigo) {
        const rubros = await RubroService.obtenerRubros();
        rubro = rubros.find(r => r.Codigo === producto.RubroCodigo) || null;
      }
      
    } catch (err) {
      console.error('Error al cargar información adicional:', err);
      error = 'Error al cargar información adicional. Algunos datos podrían no estar disponibles.';
    } finally {
      loading = false;
    }
  }

  // Volver al listado de productos
  function volverListado() {
    goto('/ventas/bot/productos');
  }

  // Ir a edición del producto
  function editarProducto() {
    goto(`/ventas/bot/productos/editar/${producto.Codigo}`);
  }

  // Cargar datos adicionales al montar el componente
  onMount(() => {
    cargarInformacionAdicional();
  });

  // Formatear precio para mostrar
  function formatearPrecio(precio: number | string | null | undefined): string {
    return precio ? `$${Number(precio).toFixed(2)}` : '$0.00';
  }
  
  // Formatear porcentaje para mostrar
  function formatearPorcentaje(valor: number | string | null | undefined): string {
    return valor ? `${Number(valor).toFixed(2)}%` : '0.00%';
  }
  
  // Determinar el estado de stock
  function estadoStock(actual: number | null | undefined, minimo: number | null | undefined): string {
    if (!actual || !minimo) return 'normal';
    return actual <= minimo ? 'bajo' : 'normal';
  }
</script>

<div class="detalle-producto-container">
  <!-- Breadcrumbs -->
  <Breadcrumbs />
  
  <!-- Header con título y botones de acción -->
  <header class="header">
    <div class="header-title">
      <h1>Detalles del Producto</h1>
      <div class="product-code">Código: {producto.Codigo}</div>
    </div>
    <div class="header-actions">
      <button class="btn-back" on:click={volverListado} aria-label="Volver al listado">
        <span class="icon">←</span> <span class="label">Volver</span>
      </button>
      
      <button class="btn-edit" on:click={editarProducto} aria-label="Editar producto">
        <span class="icon">✏️</span> <span class="label">Editar</span>
      </button>
    </div>
  </header>
  
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <span>Cargando información adicional...</span>
    </div>
  {:else if error}
    <div class="error-message">
      <p>{error}</p>
      <button on:click={() => error = ''}>Cerrar</button>
    </div>
  {/if}
  
  <!-- Contenido principal -->
  <div class="product-details">
    <!-- Sección de información básica -->
    <section class="detail-section">
      <h2>Información General</h2>
      
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">Descripción</div>
          <div class="detail-value">{producto.Descripcion || 'No disponible'}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">Código de Barras</div>
          <div class="detail-value">{producto.CodigoBarras || 'No especificado'}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">Proveedor</div>
          <div class="detail-value">{proveedor?.Descripcion || 'No especificado'}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">Rubro</div>
          <div class="detail-value">{rubro?.Descripcion || 'No especificado'}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">Estado</div>
          <div class="detail-value">
            <span class="status-indicator {producto.Activo ? 'active' : 'inactive'}">
              {producto.Activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Sección de inventario -->
    <section class="detail-section">
      <h2>Inventario</h2>
      
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">Existencia Actual</div>
          <div class="detail-value stock-level {estadoStock(producto.Existencia, producto.ExistenciaMinima)}">
            {producto.Existencia || 0} {producto.UnidadVenta || 'u'}
          </div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">Existencia Mínima</div>
          <div class="detail-value">{producto.ExistenciaMinima || 0} {producto.UnidadVenta || 'u'}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">Existencia Máxima</div>
          <div class="detail-value">{producto.ExistenciaMaxima || 0} {producto.UnidadVenta || 'u'}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">Unidad de Venta</div>
          <div class="detail-value">{producto.UnidadVenta || 'u'}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">Ubicación en Depósito</div>
          <div class="detail-value">{producto.UbicacionDeposito || 'No especificada'}</div>
        </div>
      </div>
    </section>
    
    <!-- Sección de precios -->
    <section class="detail-section">
      <h2>Precios y Costos</h2>
      
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">Precio de Costo</div>
          <div class="detail-value">{formatearPrecio(producto.PrecioCosto)}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">Precio de Costo + IVA</div>
          <div class="detail-value">{formatearPrecio(producto.PrecioCostoMasImp)}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">IVA Principal</div>
          <div class="detail-value">{producto.PorcentajeIVA1 || producto.PorcentajeIva1 || 21}%</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">IVA Secundario</div>
          <div class="detail-value">{producto.PorcentajeIVA2 || producto.PorcentajeIva2 || 0}%</div>
        </div>
      </div>
    </section>
    
    <!-- Sección de listas de precios -->
    <section class="detail-section">
      <h2>Listas de Precios</h2>
      
      <div class="price-list-grid">
        <div class="price-list-item">
          <div class="price-list-name">Lista 1</div>
          <div class="price-list-value">{formatearPorcentaje(producto.Lista1)}</div>
        </div>
        
        <div class="price-list-item">
          <div class="price-list-name">Lista 2</div>
          <div class="price-list-value">{formatearPorcentaje(producto.Lista2)}</div>
        </div>
        
        <div class="price-list-item">
          <div class="price-list-name">Lista 3</div>
          <div class="price-list-value">{formatearPorcentaje(producto.Lista3)}</div>
        </div>
        
        <div class="price-list-item">
          <div class="price-list-name">Lista 4</div>
          <div class="price-list-value">{formatearPorcentaje(producto.Lista4)}</div>
        </div>
        
        <div class="price-list-item">
          <div class="price-list-name">Lista 5</div>
          <div class="price-list-value">{formatearPorcentaje(producto.Lista5)}</div>
        </div>
      </div>
    </section>
  </div>
</div>

<style>
  .detalle-producto-container {
    padding: 16px;
    max-width: 100%;
    color: var(--tg-theme-text-color, #000);
    background: var(--tg-theme-bg-color, #fff);
    min-height: 100vh;
  }
  
  .header {
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .header-title {
    display: flex;
    flex-direction: column;
  }
  
  .header-title h1 {
    font-size: 1.8rem;
    margin: 0 0 4px 0;
    color: var(--tg-theme-text-color, #000);
  }
  
  .product-code {
    font-size: 1rem;
    color: var(--tg-theme-hint-color, #777);
  }
  
  .header-actions {
    display: flex;
    gap: 10px;
  }
  
  .btn-back, .btn-edit {
    padding: 8px 16px;
    border-radius: 8px;
    border: none;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.9rem;
    cursor: pointer;
  }
  
  .btn-back {
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    color: var(--tg-theme-text-color, #000);
  }
  
  .btn-edit {
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
  }
  
  .icon {
    font-size: 1.1rem;
  }
  
  .loading-state, .error-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 8px;
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
  }
  
  .spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--tg-theme-hint-color, #ccc);
    border-top-color: var(--tg-theme-button-color, #2481cc);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 12px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .error-message {
    color: #f44336;
  }
  
  .error-message button {
    margin-top: 10px;
    padding: 6px 12px;
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .product-details {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .detail-section {
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 8px;
    padding: 20px;
  }
  
  .detail-section h2 {
    font-size: 1.4rem;
    margin: 0 0 16px 0;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--tg-theme-hint-color, #ccc);
    color: var(--tg-theme-text-color, #000);
  }
  
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  
  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .detail-label {
    font-size: 0.9rem;
    color: var(--tg-theme-hint-color, #777);
  }
  
  .detail-value {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--tg-theme-text-color, #000);
  }
  
  .status-indicator {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  .status-indicator.active {
    background-color: rgba(76, 175, 80, 0.2);
    color: #388e3c;
  }
  
  .status-indicator.inactive {
    background-color: rgba(244, 67, 54, 0.2);
    color: #d32f2f;
  }
  
  .stock-level.bajo {
    color: #f44336;
  }
  
  .stock-level.normal {
    color: #388e3c;
  }
  
  .price-list-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
  }
  
  .price-list-item {
    border: 1px solid var(--tg-theme-hint-color, #ccc);
    border-radius: 6px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .price-list-name {
    font-size: 0.9rem;
    color: var(--tg-theme-hint-color, #777);
  }
  
  .price-list-value {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--tg-theme-text-color, #000);
  }
  
  @media (max-width: 600px) {
    .detail-grid, .price-list-grid {
      grid-template-columns: 1fr;
    }
    
    .header {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .header-actions {
      width: 100%;
      justify-content: space-between;
    }
  }
</style> 