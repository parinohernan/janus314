<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import '../../../../app.css';
  import { ClienteService, type ClienteCuentaCorriente } from '$lib/services/ClienteService';
  
  // Estado para la búsqueda y paginación
  let searchTerm = '';
  let currentPage = 1;
  let totalPages = 1;
  let totalItems = 0;
  let itemsPerPage = 15;
  let orderField = 'Codigo';
  let orderDirection: 'ASC' | 'DESC' = 'ASC';
  
  // Estado para la lista de clientes
  let clientes: ClienteCuentaCorriente[] = [];
  let loading = true;
  let error = '';
  
  // Debounce para la búsqueda
  let searchTimeout: NodeJS.Timeout;
  
  // Cargar clientes
  async function cargarClientes() {
    try {
      loading = true;
      error = '';
      
      const response = await ClienteService.obtenerCuentasCorrientes({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        field: orderField,
        order: orderDirection
      });
      
      clientes = response.items;
      totalPages = response.totalPages;
      totalItems = response.totalItems;
      
      // Si la página actual es mayor que el total de páginas, ir a la primera página
      if (currentPage > totalPages && totalPages > 0) {
        currentPage = 1;
        cargarClientes();
      }
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      error = 'No se pudieron cargar los clientes. Intente nuevamente.';
      clientes = [];
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
      cargarClientes();
    }, 300);
  }
  
  // Cambiar página
  function cambiarPagina(newPage: number) {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    currentPage = newPage;
    cargarClientes();
  }
  
  // Navegar para editar cliente
  function editarCliente(codigo: string) {
    goto(`/ventas/bot/clientes/editar/${codigo}`);
  }
  
  // Navegar para ver detalles del cliente
  function verDetalles(codigo: string) {
    goto(`/ventas/bot/clientes/detalles/${codigo}`);
  }
  
  // Navegar para crear nuevo cliente
  function nuevoCliente() {
    goto('/ventas/bot/clientes/nuevo-cliente');
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
  
  // Cargar datos al montar el componente
  onMount(() => {
    cargarClientes();
  });
</script>

<div class="clientes-container">
  <!-- Header con botones de navegación -->
  <header class="header">
    <div class="header-title">
      <h1>Clientes</h1>
    </div>
    <div class="header-actions">
      <button class="btn-back" on:click={volverHome} aria-label="Volver a inicio">
        <span class="icon">←</span> <span class="label">Volver</span>
      </button>
      <button class="btn-nuevo" on:click={nuevoCliente}>
        <span class="icon">+</span> <span class="label">Nuevo Cliente</span>
      </button>
    </div>
  </header>
  
  <!-- Barra de búsqueda -->
  <div class="search-bar">
    <input
      type="text"
      placeholder="Buscar clientes..."
      bind:value={searchTerm}
      on:input={handleSearchChange}
    />
  </div>
  
  <!-- Mensaje de carga o error -->
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <span>Cargando clientes...</span>
    </div>
  {:else if error}
    <div class="error-state">
      <span>{error}</span>
      <button on:click={cargarClientes}>Reintentar</button>
    </div>
  {:else if clientes.length === 0}
    <div class="empty-state">
      <p>No se encontraron clientes{searchTerm ? ` para "${searchTerm}"` : ''}</p>
    </div>
  {:else}
    <!-- Lista de clientes -->
    <div class="clientes-list">
      {#each clientes as cliente (cliente.Codigo)}
        <div class="cliente-card">
          <div class="cliente-info">
            <div class="cliente-codigo">{cliente.Codigo}</div>
            <div class="cliente-nombre">{cliente.Descripcion}</div>
            <div class="cliente-saldo" class:negativo={cliente.Saldo < 0}>
              {formatCurrency(cliente.Saldo)}
            </div>
          </div>
          <div class="cliente-actions">
            <button 
              class="btn-ver" 
              on:click={() => verDetalles(cliente.Codigo)}
              aria-label={`Ver detalles de ${cliente.Descripcion}`}
            >
              👁️
            </button>
            <button 
              class="btn-editar" 
              on:click={() => editarCliente(cliente.Codigo)}
              aria-label={`Editar ${cliente.Descripcion}`}
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
  .clientes-container {
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
  
  .search-bar {
    margin-bottom: 20px;
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
  
  .clientes-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }
  
  .cliente-card {
    padding: 16px;
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .cliente-info {
    flex: 1;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 16px;
  }
  
  .cliente-codigo {
    font-size: 0.9rem;
    color: var(--tg-theme-hint-color, #777);
    font-weight: 500;
  }
  
  .cliente-nombre {
    font-size: 1rem;
    font-weight: 500;
    color: var(--tg-theme-text-color, #000);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .cliente-saldo {
    font-size: 0.9rem;
    font-weight: 500;
    color: #4caf50;
  }
  
  .cliente-saldo.negativo {
    color: #f44336;
  }
  
  .cliente-actions {
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
    .cliente-info {
      grid-template-columns: 1fr;
      gap: 6px;
    }
    
    .cliente-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    
    .cliente-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
</style> 