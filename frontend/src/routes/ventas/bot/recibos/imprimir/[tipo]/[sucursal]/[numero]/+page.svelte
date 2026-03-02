<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import html2pdf from 'html2pdf.js';
  import ReciboPDF from './ReciboPDF.svelte';
  import { toast } from '$lib/utils/toast';

  // Obtener parámetros de la URL
  const tipo = $page.params.tipo;
  const sucursal = $page.params.sucursal;
  const numero = $page.params.numero;

  // Estado para los datos del recibo
  let recibo: any = null;
  let loading = true;
  let error: string | null = null;
  let pdfContentRef: HTMLElement;

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

  // Cargar datos del recibo
  const cargarRecibo = async () => {
    try {
      loading = true;
      error = null;
      
      const response = await fetchWithAuth(`/recibos/${tipo}/${sucursal}/${numero}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Recibo no encontrado');
        }
        throw new Error('Error al cargar el recibo');
      }
      
      recibo = await response.json();
    } catch (err) {
      console.error('Error cargando recibo:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };

  // Función para compartir por WhatsApp
  const compartirWhatsApp = async () => {
    if (!pdfContentRef) return;
    
    try {
      const opt = {
        margin: 10,
        filename: `recibo-${tipo}-${sucursal}-${numero}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      const pdf = await html2pdf().set(opt).from(pdfContentRef).output('blob');
      
      // Verificamos si el navegador soporta la API de compartir
      if (navigator.share) {
        const file = new File([pdf], `recibo-${tipo}-${sucursal}-${numero}.pdf`, { type: 'application/pdf' });
        await navigator.share({
          title: 'Recibo de Pago',
          text: `Recibo ${tipo}-${sucursal}-${numero}`,
          files: [file]
        });
      } else {
        // Si no soporta compartir, descargamos el PDF
        const pdfUrl = URL.createObjectURL(pdf);
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = `recibo-${tipo}-${sucursal}-${numero}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pdfUrl);
      }
    } catch (err) {
      console.error('Error compartiendo recibo:', err);
      toast.error('Error al compartir el recibo');
    }
  };

  // Función para volver a la lista
  const volverALista = () => {
    goto('/ventas/bot/recibos');
  };

  onMount(() => {
    cargarRecibo();
  });
</script>

<div class="recibo-container">
  <!-- Botones de acción -->
  <div class="action-bar">
    <button class="btn-back" on:click={volverALista}>
      <span class="back-icon">←</span>
      <span>Volver</span>
    </button>
    <button class="btn-share" on:click={compartirWhatsApp}>
      <span class="share-icon">↗️</span>
      <span>Compartir</span>
    </button>
  </div>

  <!-- Loading y Errores -->
  {#if loading}
    <div class="loading-container">
      <span class="loader"></span>
      <p>Cargando recibo...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <p class="error-message">{error}</p>
      <button class="btn-reintentar" on:click={cargarRecibo}>
        Reintentar
      </button>
    </div>
  {:else if recibo}
    <!-- Contenido del recibo -->
    <div class="recibo-content">
      <div class="recibo-header">
        <h1>RECIBO</h1>
        <p class="recibo-numero">Número: {recibo.DocumentoSucursal}-{recibo.DocumentoNumero}</p>
        <p class="recibo-fecha">Fecha: {formatDate(recibo.Fecha)}</p>
        {#if recibo.FechaAnulacion}
          <div class="recibo-anulado">
            <span class="anulado-badge">ANULADO</span>
            <p class="anulado-fecha">Fecha de anulación: {formatDate(recibo.FechaAnulacion)}</p>
          </div>
        {/if}
      </div>

      <!-- Cliente -->
      <div class="recibo-section">
        <h2>Cliente</h2>
        <div class="cliente-info">
          <p>{recibo.ClienteRelacion?.Descripcion || 'Cliente no asignado'}</p>
          {#if recibo.ClienteRelacion?.NombreFantasia}
            <p class="nombre-fantasia">{recibo.ClienteRelacion.NombreFantasia}</p>
          {/if}
        </div>
      </div>

      <!-- Detalles del Pago -->
      <div class="recibo-section">
        <h2>Detalles del Pago</h2>
        
        <!-- Documentos de Deuda -->
        <div class="detalles-grid">
          <div class="detalles-column">
            <h3>Documentos de Deuda</h3>
            <div class="table-container">
              {#if recibo.Items && recibo.Items.length > 0}
                {#each recibo.Items as item}
                  <div class="table-row">
                    <span class="documento">{item.FacturaTipo}-{item.FacturaSucursal}-{item.FacturaNumero}</span>
                    <span class="importe">{item.ImportePagado.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</span>
                  </div>
                {/each}
              {:else}
                <p class="no-items">No hay documentos de deuda</p>
              {/if}
            </div>
          </div>

          <!-- Documentos de Pago -->
          <div class="detalles-column">
            <h3>Documentos de Pago</h3>
            <div class="table-container">
              {#if recibo.Valores && recibo.Valores.length > 0}
                {#each recibo.Valores as valor}
                  <div class="table-row">
                    <span class="documento">
                      {valor.ValorCodigo}
                      {#if valor.ValorNumero} - {valor.ValorNumero}{/if}
                      {#if valor.Valorbanco} ({valor.Valorbanco}){/if}
                    </span>
                    <span class="importe">{valor.ValorImporte.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</span>
                  </div>
                {/each}
              {:else}
                <p class="no-items">No hay documentos de pago</p>
              {/if}
            </div>
          </div>
        </div>

        <!-- Total -->
        <div class="total-section">
          <span class="total-label">Total:</span>
          <span class="total-amount">
            {recibo.ImporteTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
          </span>
        </div>
      </div>

      <!-- Observaciones -->
      {#if recibo.Observaciones}
        <div class="recibo-section">
          <h2>Observaciones</h2>
          <div class="observaciones-content">
            <p>{recibo.Observaciones}</p>
          </div>
        </div>
      {/if}
    </div>

    <!-- Versión para PDF (oculta) -->
    <div class="hidden">
      <div bind:this={pdfContentRef}>
        <ReciboPDF {recibo} />
      </div>
    </div>
  {/if}
</div>

<style>
  .recibo-container {
    padding: 16px;
    max-width: 100%;
    background: var(--tg-theme-bg-color, #fff);
    color: var(--tg-theme-text-color, #000);
  }

  .action-bar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .btn-back, .btn-share {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    background: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    font-size: 1rem;
    cursor: pointer;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 0;
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
    padding: 16px;
    background: #ffebee;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .error-message {
    color: #d32f2f;
    margin-bottom: 8px;
  }

  .btn-reintentar {
    background: #d32f2f;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }

  .recibo-content {
    background: var(--tg-theme-bg-color, #fff);
    border-radius: 12px;
    overflow: hidden;
  }

  .recibo-header {
    text-align: center;
    padding: 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  .recibo-header h1 {
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0 0 8px 0;
  }

  .recibo-anulado {
    margin-top: 8px;
  }

  .anulado-badge {
    background: #ffebee;
    color: #d32f2f;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
  }

  .recibo-section {
    padding: 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  .recibo-section h2 {
    font-size: 1.2rem;
    font-weight: bold;
    margin: 0 0 12px 0;
  }

  .cliente-info {
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    padding: 12px;
    border-radius: 8px;
  }

  .detalles-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .detalles-column {
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 8px;
    overflow: hidden;
  }

  .detalles-column h3 {
    background: rgba(0, 0, 0, 0.05);
    padding: 8px 12px;
    margin: 0;
    font-size: 1rem;
    font-weight: bold;
  }

  .table-container {
    padding: 12px;
  }

  .table-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  .table-row:last-child {
    border-bottom: none;
  }

  .no-items {
    text-align: center;
    color: var(--tg-theme-hint-color, #999);
    padding: 12px;
  }

  .total-section {
    margin-top: 16px;
    padding: 12px;
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .total-label {
    font-weight: bold;
  }

  .total-amount {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--tg-theme-button-color, #2481cc);
  }

  .observaciones-content {
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    padding: 12px;
    border-radius: 8px;
  }

  .hidden {
    display: none;
  }

  @media (min-width: 640px) {
    .detalles-grid {
      grid-template-columns: 1fr 1fr;
    }
  }
</style> 