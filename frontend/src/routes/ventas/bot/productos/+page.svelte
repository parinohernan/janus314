<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import '../../../../app.css';
  import { ArticuloService } from '$lib/services/ArticuloService';
  import { obtenerPrecioSegunLista } from '../components/utils';
  import type { Articulo } from '../components/types';
  import Breadcrumbs from '../components/Breadcrumbs/index.svelte';
  
  // Estado para la búsqueda y paginación
  let searchTerm = '';
  let currentPage = 1;
  let totalPages = 1;
  let totalItems = 0;
  let itemsPerPage = 15;
  let orderField = 'Descripcion';
  let orderDirection: 'ASC' | 'DESC' = 'ASC';
  
  // Estado para la lista de productos
  let productos: Articulo[] = [];
  let loading = true;
  let error = '';
  
  // Lista de precios seleccionada (por defecto Lista 1)
  let listaPrecios: string = '1';
  
  // Debounce para la búsqueda
  let searchTimeout: NodeJS.Timeout;
  
  // Cargar productos
  async function cargarProductos() {
    try {
      loading = true;
      error = '';
      
      const response = await ArticuloService.listarArticulos({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        field: orderField,
        order: orderDirection,
      });
      
      productos = response.items;
      totalPages = response.totalPages;
      totalItems = response.total;
      
      // Si la página actual es mayor que el total de páginas, ir a la primera página
      if (currentPage > totalPages && totalPages > 0) {
        currentPage = 1;
        cargarProductos();
      }
    } catch (err) {
      console.error('Error al cargar productos:', err);
      error = 'No se pudieron cargar los productos. Intente nuevamente.';
      productos = [];
    } finally {
      loading = false;
    }
  }
  
  // Manejar cambio en el filtro de activos
  function cambiarFiltroActivos() {
    currentPage = 1; // Volver a la primera página al cambiar filtro
    cargarProductos();
  }
  
  // Manejar cambio en el término de búsqueda
  function handleSearchChange() {
    // Limpiar el timeout anterior
    if (searchTimeout) clearTimeout(searchTimeout);
    
    // Crear un nuevo timeout para debounce
    searchTimeout = setTimeout(() => {
      currentPage = 1; // Volver a la primera página cuando se busca
      cargarProductos();
    }, 300);
  }
  
  // Cambiar página
  function cambiarPagina(newPage: number) {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    currentPage = newPage;
    cargarProductos();
  }
  
  // Navegar para ver detalles del producto
  function verDetalles(codigo: string) {
    goto(`/ventas/bot/productos/detalles/${codigo}`);
  }
  
  // Navegar a la página de editar producto
  function editarProducto(codigo: string) {
    goto(`/ventas/bot/productos/editar/${codigo}`);
  }
  
  // Navegar a la página de crear nuevo producto
  function crearNuevoProducto() {
    goto('/ventas/bot/productos/nuevo');
  }
  
  // Navegar a home
  function volverHome() {
    goto('/ventas/bot/home');
  }
  
  // Formatear número como moneda
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value);
  }
  
  // Calcular precio con impuestos
  function calcularPrecioConImpuestos(producto: Articulo): number {
    return obtenerPrecioSegunLista(producto, listaPrecios);
  }
  
  // Cargar datos al montar el componente
  onMount(() => {
    cargarProductos();
  });
</script>

<div class="productos-container">
  <!-- Breadcrumbs personalizados -->
  <Breadcrumbs 
    customPath={[
      { label: 'Home', path: '/ventas/bot' },
      { label: 'Productos', path: '/ventas/bot/productos' }
    ]}
  />

  <!-- Header con botones de navegación -->
  <header class="header">
    <div class="header-title">
      <h1>Productos</h1>
    </div>
    <div class="header-actions">
      <button class="btn-back" on:click={volverHome} aria-label="Volver a inicio">
        <span class="icon">←</span> <span class="label">Volver</span>
      </button>
      <button class="btn-nuevo" on:click={crearNuevoProducto} aria-label="Crear nuevo producto">
        <span class="icon">+</span> <span class="label">Nuevo</span>
      </button>
    </div>
  </header>
  
  <!-- Barra de búsqueda y filtros -->
  <div class="search-filter-container">
    <div class="search-bar">
      <input
        type="text"
        placeholder="Buscar productos..."
        bind:value={searchTerm}
        on:input={handleSearchChange}
      />
    </div>
    
    <!-- <div class="filter-options">
      <label class="filter-switch">
        <input 
          type="checkbox" 
          bind:checked={mostrarActivos} 
          on:change={cambiarFiltroActivos}
        >
        <span class="switch-slider"></span>
        <span class="switch-label">Mostrar productos activos</span>
      </label>
    </div> -->
  </div>
  
  <!-- Mensaje de carga o error -->
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <span>Cargando productos...</span>
    </div>
  {:else if error}
    <div class="error-state">
      <span>{error}</span>
      <button on:click={cargarProductos}>Reintentar</button>
    </div>
  {:else if productos.length === 0}
    <div class="empty-state">
      <p>No se encontraron productos{searchTerm ? ` para "${searchTerm}"` : ''}</p>
    </div>
  {:else}
    <!-- Lista de productos -->
    <div class="productos-list">
      {#each productos as producto (producto.Codigo)}
        <div class="producto-card">
          <div class="producto-info">
            <div class="producto-codigo">{producto.Codigo}</div>
            <div class="producto-nombre">{producto.Descripcion}</div>
            <div class="producto-precios">
              <div class="precio-costo">
                <span class="precio-label">Costo:</span> 
                <span class="precio-valor">{formatCurrency(producto.PrecioCosto || 0)}</span>
              </div>
              <div class="precio-venta">
                <span class="precio-label">Precio:</span> 
                <span class="precio-valor">{formatCurrency(calcularPrecioConImpuestos(producto))}</span>
              </div>
            </div>
          </div>
          <div class="producto-actions">
            <button 
              class="btn-ver" 
              on:click={() => verDetalles(producto.Codigo)}
              aria-label={`Ver detalles de ${producto.Descripcion}`}
            >
              👁️
            </button>
            <button 
              class="btn-editar" 
              on:click={() => editarProducto(producto.Codigo)}
              aria-label={`Editar ${producto.Descripcion}`}
            >
              ✏️
            </button>
          </div>
        </div>
      {/each}
    </div>
    
    <!-- Paginación -->
    {#if totalPages > 1}
      <div class="pagination">
        <button 
          class="btn-page" 
          disabled={currentPage === 1}
          on:click={() => cambiarPagina(currentPage - 1)}
          aria-label="Página anterior"
        >
          ←
        </button>
        
        <span class="page-info">
          Página {currentPage} de {totalPages}
        </span>
        
        <button 
          class="btn-page" 
          disabled={currentPage === totalPages}
          on:click={() => cambiarPagina(currentPage + 1)}
          aria-label="Página siguiente"
        >
          →
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .productos-container {
    padding: 16px;
    max-width: 100%;
    color: var(--tg-theme-text-color, #000);
    background: var(--tg-theme-bg-color, #fff);
    min-height: 100vh;
  }
  
  .header {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .header-title h1 {
    font-size: 1.8rem;
    margin: 0;
    color: var(--tg-theme-text-color, #000);
  }
  
  .header-actions {
    display: flex;
    gap: 10px;
  }
  
  .btn-back, .btn-nuevo {
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
  
  .btn-nuevo {
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
  }
  
  .icon {
    font-size: 1.1rem;
  }
  
  .search-filter-container {
    margin-bottom: 20px;
  }
  
  .search-bar {
    margin-bottom: 12px;
  }
  
  .search-bar input {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--tg-theme-hint-color, #ccc);
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    color: var(--tg-theme-text-color, #000);
    font-size: 1rem;
  }
  
  /* .filter-options {
    display: flex;
    gap: 16px;
    margin-bottom: 8px;
  }
  
  .filter-switch {
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
    cursor: pointer;
  }
  
  .filter-switch input {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
  }
  
  .switch-slider {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 22px;
    background-color: var(--tg-theme-hint-color, #ccc);
    border-radius: 34px;
    transition: .4s;
  }
  
  .switch-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    border-radius: 50%;
    transition: .4s;
  }
  
  input:checked + .switch-slider {
    background-color: var(--tg-theme-button-color, #2481cc);
  }
  
  input:checked + .switch-slider:before {
    transform: translateX(18px);
  }
  
  .switch-label {
    font-size: 0.9rem;
    color: var(--tg-theme-text-color, #000);
  } */
  
  .loading-state, .error-state, .empty-state {
    padding: 24px;
    text-align: center;
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 8px;
    margin-bottom: 16px;
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
  
  .error-state button {
    margin-top: 12px;
    padding: 8px 16px;
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
  
  .productos-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }
  
  .producto-card {
    padding: 16px;
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .producto-info {
    flex: 1;
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    align-items: center;
    gap: 8px 16px;
  }
  
  .producto-codigo {
    font-size: 0.9rem;
    color: var(--tg-theme-hint-color, #777);
    font-weight: 500;
    grid-row: 1;
    grid-column: 1;
  }
  
  .producto-nombre {
    font-size: 1rem;
    font-weight: 500;
    color: var(--tg-theme-text-color, #000);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    grid-row: 1;
    grid-column: 2;
  }
  
  .producto-precios {
    grid-row: 2;
    grid-column: 1 / span 2;
    display: flex;
    gap: 16px;
    font-size: 0.85rem;
  }
  
  .precio-label {
    color: var(--tg-theme-hint-color, #777);
  }
  
  .precio-valor {
    font-weight: 500;
  }
  
  .precio-costo {
    color: #f44336;
  }
  
  .precio-venta {
    color: #4caf50;
  }
  
  .producto-actions {
    display: flex;
    gap: 8px;
  }
  
  .btn-ver, .btn-editar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--tg-theme-bg-color, #fff);
    cursor: pointer;
  }
  
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin-top: 24px;
  }
  
  .btn-page {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  
  .btn-page:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .page-info {
    font-size: 0.9rem;
    color: var(--tg-theme-hint-color, #777);
  }
  
  @media (max-width: 360px) {
    .producto-info {
      grid-template-columns: 1fr;
      grid-template-rows: auto auto auto;
      gap: 6px;
    }
    
    .producto-codigo {
      grid-row: 1;
      grid-column: 1;
    }
    
    .producto-nombre {
      grid-row: 2;
      grid-column: 1;
    }
    
    .producto-precios {
      grid-row: 3;
      grid-column: 1;
    }
    
    .producto-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    
    .producto-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
</style> 