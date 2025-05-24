<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import '../../../../app.css';
  import '../components/bot.css';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import LogoJano from '../components/LogoJano.svelte';
  import { auth } from '$lib/stores/authStore';
  import { get } from 'svelte/store';
  
  // Estado para la búsqueda y paginación
  let searchTerm = '';
  let currentPage = 1;
  let totalPages = 1;
  let totalItems = 0;
  let itemsPerPage = 15;
  let orderField = 'Descripcion';
  let orderDirection = 'ASC';
  
  // Estado para la lista de productos
  let productos: any[] = [];
  let loading = true;
  let error = '';
  
  // Debounce para la búsqueda
  let searchTimeout: NodeJS.Timeout | null = null;
  
  // Estado para la lista de proveedores y el proveedor seleccionado
  let proveedores: any[] = [];
  let proveedorSeleccionado = 'todos';
  
  // Función para cargar la lista de proveedores
  async function cargarProveedores() {
    try {
      const response = await fetchWithAuth('/api/proveedores?activo=1');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transformar la respuesta al formato necesario
      proveedores = [
        { codigo: 'todos', descripcion: 'Todos los proveedores' },
        ...data.items.map((p: any) => ({
          codigo: p.Codigo,
          descripcion: p.Descripcion
        }))
      ];
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      // Fallback para no bloquear la funcionalidad
      proveedores = [{ codigo: 'todos', descripcion: 'Todos los proveedores' }];
    }
  }
  
  // Cargar productos con stock bajo
  async function cargarProductosBajoStock() {
    try {
      loading = true;
      error = '';
      
      // Verificar autenticación
      const authState = get(auth);
      if (!authState.isAuthenticated) {
        error = 'No está autenticado. Por favor inicie sesión.';
        loading = false;
        return;
      }
      
      const response = await fetchWithAuth(
        `/api/articulos/stock-bajo?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}&field=${orderField}&order=${orderDirection}&proveedor=${proveedorSeleccionado}`
      );
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("data", data);
      productos = data.items;
      totalPages = data.totalPages;
      totalItems = data.totalItems;
      
      // Si la página actual es mayor que el total de páginas, ir a la primera página
      if (currentPage > totalPages && totalPages > 0) {
        currentPage = 1;
        cargarProductosBajoStock();
      }
    } catch (err) {
      console.error('Error al cargar productos con stock bajo:', err);
      error = 'No se pudieron cargar las alertas de stock. Intente nuevamente.';
      productos = [];
    } finally {
      loading = false;
    }
  }
  
  // Manejar cambio en el término de búsqueda
  function handleSearchChange() {
    // Limpiar el timeout anterior
    if (searchTimeout) clearTimeout(searchTimeout);
    
    // Crear un nuevo timeout para debounce
    searchTimeout = setTimeout(() => {
      currentPage = 1; // Volver a la primera página cuando se busca
      cargarProductosBajoStock();
    }, 300) as NodeJS.Timeout;
  }
  
  // Cambiar página
  function cambiarPagina(newPage: number) {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    currentPage = newPage;
    cargarProductosBajoStock();
  }
  
  // Navegar para ver detalles del producto
  function verDetalles(codigo: string) {
    goto(`/ventas/bot/productos/detalles/${codigo}`);
  }
  
  // Navegar a home
  function volverHome() {
    goto('/ventas/bot/home');
  }
  
  // Calcular porcentaje de stock
  function calcularPorcentajeStock(existencia: number, existenciaMinima: number) {
    if (existenciaMinima <= 0) return 100;
    
    const porcentaje = (existencia / existenciaMinima) * 100;
    // Limitar entre 0 y 100
    return Math.max(0, Math.min(100, porcentaje));
  }
  
  // Determinar clase de alerta según el nivel de stock
  function getClaseAlerta(existencia: number, existenciaMinima: number) {
    const porcentaje = calcularPorcentajeStock(existencia, existenciaMinima);
    
    if (porcentaje <= 25) return 'critico';
    if (porcentaje <= 50) return 'bajo';
    if (porcentaje <= 75) return 'medio';
    return 'normal';
  }
  
  // Función para manejar el cambio de proveedor
  function cambiarProveedor() {
    currentPage = 1;
    cargarProductosBajoStock();
  }
  
  // Cargar datos al montar el componente
  onMount(() => {
    cargarProveedores();
    cargarProductosBajoStock();
  });
</script>

<div class="alerta-stock-container">
  <!-- Header con botones de navegación -->
  <header class="header">
    <div class="header-content">
      <button class="btn-back" on:click={volverHome} aria-label="Volver">
        <span class="back-icon">←</span>
      </button>
      <div class="title-container">
        <LogoJano size="small" animated={false} />
        <h2 class="page-subtitle">Alerta de Stock</h2>
      </div>
    </div>
  </header>
  
  <!-- Barra de búsqueda -->
  <div class="search-filter-container">
    <div class="filter-row">
      <div class="search-bar">
        <input
          type="text"
          placeholder="Buscar productos..."
          bind:value={searchTerm}
          on:input={handleSearchChange}
        />
      </div>
      
      <div class="filter-select">
        <select 
          bind:value={proveedorSeleccionado}
          on:change={cambiarProveedor}
          aria-label="Filtrar por proveedor"
        >
          {#each proveedores as proveedor}
            <option value={proveedor.codigo}>{proveedor.descripcion}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>
  
  <!-- Mensaje de carga o error -->
  {#if loading}
    <div class="loading-container">
      <span class="loader"></span>
      <p>Cargando alertas de stock...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <p class="error-message">{error}</p>
      <button class="btn-reintentar" on:click={cargarProductosBajoStock}>
        Reintentar
      </button>
    </div>
  {:else if productos.length === 0}
    <div class="empty-state">
      <p>No se encontraron productos con stock bajo{searchTerm ? ` para "${searchTerm}"` : ''}.</p>
      <p>¡Muy bien! Todo el inventario está en niveles adecuados.</p>
    </div>
  {:else}
    <!-- Lista de productos con stock bajo -->
    <div class="alertas-list">
      {#each productos as producto (producto.Codigo)}
        <button 
          class="alerta-card {getClaseAlerta(producto.Existencia, producto.ExistenciaMinima)}"
          on:click={() => verDetalles(producto.Codigo)}
          aria-label="Ver detalles de {producto.Descripcion}"
        >
          <div class="alerta-info">
            <div class="alerta-codigo">{producto.Codigo}</div>
            <div class="alerta-nombre">{producto.Descripcion}</div>
            <div class="alerta-stock">
              <div class="stock-value">
                <span class="stock-actual">{producto.Existencia}</span>
                <span class="stock-separator">/</span>
                <span class="stock-minimo">{producto.ExistenciaMinima}</span>
              </div>
              <div class="stock-bar-container">
                <div class="stock-bar" style="width: {calcularPorcentajeStock(producto.Existencia, producto.ExistenciaMinima)}%"></div>
              </div>
            </div>
          </div>
        </button>
      {/each}
    </div>
    
    <!-- Paginación -->
    {#if totalPages > 1}
      <div class="pagination">
        <button 
          class="pagination-button" 
          disabled={currentPage === 1}
          on:click={() => cambiarPagina(currentPage - 1)}
        >
          ←
        </button>
        
        <span class="pagination-info">Página {currentPage} de {totalPages}</span>
        
        <button 
          class="pagination-button" 
          disabled={currentPage === totalPages}
          on:click={() => cambiarPagina(currentPage + 1)}
        >
          →
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .alerta-stock-container {
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

  .search-filter-container {
    margin-bottom: 16px;
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    padding: 12px;
    border-radius: 8px;
  }

  .filter-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  
  .search-bar {
    flex: 1;
    min-width: 200px;
  }
  
  .filter-select {
    width: 200px;
  }
  
  .search-bar input {
    width: 100%;
    padding: 10px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 6px;
    font-size: 1rem;
    background-color: var(--tg-theme-bg-color, #fff);
  }
  
  .filter-select select {
    width: 100%;
    padding: 10px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 6px;
    font-size: 1rem;
    background-color: var(--tg-theme-bg-color, #fff);
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

  .empty-state {
    text-align: center;
    padding: 32px 16px;
    color: var(--tg-theme-hint-color, #777);
  }

  .alertas-list {
    display: grid;
    gap: 12px;
    margin-bottom: 16px;
  }

  .alerta-card {
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    padding: 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    border-left: 4px solid #ccc;
  }

  .alerta-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .alerta-card.critico {
    border-left-color: #f44336;
    background-color: rgba(244, 67, 54, 0.05);
  }

  .alerta-card.bajo {
    border-left-color: #ff9800;
    background-color: rgba(255, 152, 0, 0.05);
  }

  .alerta-card.medio {
    border-left-color: #ffc107;
    background-color: rgba(255, 193, 7, 0.05);
  }

  .alerta-card.normal {
    border-left-color: #4caf50;
    background-color: rgba(76, 175, 80, 0.05);
  }

  .alerta-codigo {
    font-size: 0.9rem;
    color: var(--tg-theme-hint-color, #777);
    margin-bottom: 4px;
  }

  .alerta-nombre {
    font-size: 1.1rem;
    font-weight: 500;
    margin-bottom: 8px;
    color: var(--tg-theme-text-color, #000);
  }

  .alerta-stock {
    margin-top: 8px;
  }

  .stock-value {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
    font-size: 0.9rem;
  }

  .stock-actual {
    font-weight: bold;
  }

  .stock-separator {
    color: var(--tg-theme-hint-color, #777);
  }

  .stock-minimo {
    color: var(--tg-theme-hint-color, #777);
  }

  .stock-bar-container {
    height: 6px;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
    overflow: hidden;
  }

  .stock-bar {
    height: 100%;
    background-color: var(--tg-theme-button-color, #2481cc);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .alerta-card.critico .stock-bar {
    background-color: #f44336;
  }

  .alerta-card.bajo .stock-bar {
    background-color: #ff9800;
  }

  .alerta-card.medio .stock-bar {
    background-color: #ffc107;
  }

  .alerta-card.normal .stock-bar {
    background-color: #4caf50;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin: 24px 0;
  }

  .pagination-button {
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .pagination-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .pagination-info {
    font-size: 0.9rem;
    color: var(--tg-theme-hint-color, #777);
  }

  /* Estilos responsivos */
  @media (max-width: 480px) {
    .page-subtitle {
      font-size: 1.3rem;
    }
    
    .alerta-nombre {
      font-size: 1rem;
    }
    
    .alerta-card {
      padding: 12px;
    }
    
    .filter-row {
      flex-direction: column;
    }
    
    .filter-select {
      width: 100%;
    }
  }
</style> 