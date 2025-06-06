<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import '../components/bot.css';
  import LogoJano from '../components/LogoJano.svelte';

  // Interfaces
  interface Recibo {
    DocumentoTipo: string;
    DocumentoSucursal: string;
    DocumentoNumero: string;
    Fecha: string;
    ImporteTotal: number;
    FechaAnulacion: string | null;
    ClienteRelacion?: {
      Descripcion: string;
      NombreFantasia: string;
    }
  }

  // Función para formatear fecha
  function formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Estado
  let recibos: Recibo[] = [];
  let loading = true;
  let error: string | null = null;

  // Paginación
  let currentPage = 1;
  let totalPages = 1;
  let itemsPerPage = 10;

  // Cargar recibos
  async function cargarRecibos() {
    try {
      loading = true;
      error = null;

      const response = await fetchWithAuth('/recibos', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          orderBy: 'Fecha',
          orderDir: 'desc'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar los recibos');
      }

      const data = await response.json();
      console.log(data);
      recibos = data.items;
      totalPages = data.meta.totalPages;
      currentPage = data.meta.currentPage;

    } catch (err) {
      console.error('Error cargando recibos:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  }

  // Cambiar página
  function cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPages) {
      currentPage = nuevaPagina;
      cargarRecibos();
    }
  }

  // Ver detalle de recibo
  function verDetalle(tipo: string, sucursal: string, numero: string) {
    goto(`/ventas/bot/recibos/imprimir/${tipo}/${sucursal}/${numero}`);
  }

  // Volver al home
  function volverHome() {
    goto('/ventas/bot/home');
  }

  // Función para ir a nuevo recibo
  function abrirModal() {
    goto('/ventas/bot/recibos/nuevo');
  }

  onMount(() => {
    cargarRecibos();
  });
</script>

<div class="recibos-container">
  <!-- Header con botones de navegación -->
  <header class="header">
    <div class="header-content">
      <button class="btn-back" on:click={volverHome} aria-label="Volver">
        <span class="back-icon">←</span>
      </button>
      <div class="title-container">
        <LogoJano size="small" animated={false} />
        <h2 class="page-subtitle">Recibos</h2>
      </div>
    </div>
  </header>

  <!-- Botón Nuevo Recibo -->
  <div class="action-bar">
    <button class="btn-nuevo" on:click={abrirModal}>
      <span class="plus-icon">+</span>
      Nuevo Recibo
    </button>
  </div>

  <!-- Loading y Errores -->
  {#if loading}
    <div class="loading-container">
      <span class="loader"></span>
      <p>Cargando recibos...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <p class="error-message">{error}</p>
      <button class="btn-reintentar" on:click={cargarRecibos}>
        Reintentar
      </button>
    </div>
  {:else if recibos.length === 0}
    <div class="empty-state">
      <p>No se encontraron recibos.</p>
    </div>
  {:else}
    <!-- Lista de Recibos -->
    <div class="recibos-list">
      {#each recibos as recibo}
        <button 
          class="recibo-card"
          on:click={() => verDetalle(recibo.DocumentoTipo, recibo.DocumentoSucursal, recibo.DocumentoNumero)}
        >
          <div class="recibo-header">
            <span class="recibo-numero">{recibo.DocumentoSucursal}-{recibo.DocumentoNumero}</span>
            <span class="recibo-fecha">{formatDate(recibo.Fecha)}</span>
          </div>
          <div class="recibo-cliente">
            {recibo.ClienteRelacion?.Descripcion || 'Cliente no asignado'}
          </div>
          <div class="recibo-footer">
            <span class="recibo-total">
              {recibo.ImporteTotal?.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) || '$0,00'}
            </span>
            <span class="recibo-estado" class:anulado={recibo.FechaAnulacion}>
              {recibo.FechaAnulacion ? 'Anulado' : 'Activo'}
            </span>
          </div>
        </button>
      {/each}
    </div>

    <!-- Paginación Simple -->
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
  .recibos-container {
    padding: 16px;
    max-width: 100%;
    min-height: 100vh;
    color: var(--tg-theme-text-color, #000);
    background: var(--tg-theme-bg-color, #fff);
  }

  .header {
    margin-bottom: 16px;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .btn-back {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--tg-theme-button-color, #2481cc);
    padding: 4px;
  }

  .title-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .page-subtitle {
    font-size: 1.5rem;
    margin: 0;
    color: var(--tg-theme-text-color, #000);
  }

  .action-bar {
    margin-bottom: 16px;
  }

  .btn-nuevo {
    width: 100%;
    padding: 12px;
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
  }

  .plus-icon {
    font-size: 1.2rem;
    font-weight: bold;
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
  }

  .empty-state {
    text-align: center;
    padding: 32px 16px;
    color: var(--tg-theme-hint-color, #777);
  }

  .recibos-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .recibo-card {
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border: none;
    border-radius: 8px;
    padding: 16px;
    width: 100%;
    text-align: left;
    cursor: pointer;
  }

  .recibo-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .recibo-numero {
    font-weight: bold;
    color: var(--tg-theme-text-color, #000);
  }

  .recibo-fecha {
    color: var(--tg-theme-hint-color, #777);
    font-size: 0.9rem;
  }

  .recibo-cliente {
    margin-bottom: 8px;
    color: var(--tg-theme-text-color, #000);
  }

  .recibo-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .recibo-total {
    font-weight: bold;
    color: var(--tg-theme-text-color, #000);
  }

  .recibo-estado {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    background: #e8f5e9;
    color: #2e7d32;
  }

  .recibo-estado.anulado {
    background: #ffebee;
    color: #c62828;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin-top: 24px;
    padding: 16px 0;
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
</style> 