<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  // Propiedades del formulario
  export let isOpen: boolean = false;
  
  // Estado del formulario
  let nombre: string = '';
  let email: string = '';
  let telefono: string = '';
  let nombreNegocio: string = '';
  let tipoNegocio: string = '';
  let mensaje: string = '';
  let isLoading: boolean = false;
  let error: string | null = null;
  let success: string | null = null;

  // Función para cerrar el modal
  function cerrarModal() {
    dispatch('close');
    // Limpiar el formulario
    nombre = '';
    email = '';
    telefono = '';
    nombreNegocio = '';
    tipoNegocio = '';
    mensaje = '';
    error = null;
    success = null;
  }

  // Función para manejar eventos de teclado
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      cerrarModal();
    }
  }

  // Función para manejar eventos de teclado en el overlay
  function handleOverlayKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      cerrarModal();
    }
  }

  // Función para manejar eventos de teclado en el contenido del modal
  function handleModalKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.stopPropagation();
    }
  }

  // Función para enviar el formulario
  async function enviarSolicitud() {
    isLoading = true;
    error = null;
    success = null;

    try {
      const response = await fetch('https://janus314-api.osvi.lat/api/solicitudes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre,
          email,
          telefono,
          nombreNegocio,
          tipoNegocio,
          mensaje,
          fechaHora: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Error al enviar la solicitud');
      }

      success = '¡Solicitud enviada con éxito! Nos pondremos en contacto contigo pronto.';
      setTimeout(() => {
        cerrarModal();
      }, 2000);
    } catch (err) {
      error = 'Error al enviar la solicitud. Por favor, intenta nuevamente.';
      console.error('Error:', err);
    } finally {
      isLoading = false;
    }
  }
</script>

{#if isOpen}
  <div 
    class="modal-overlay" 
    on:click={cerrarModal}
    on:keydown={handleOverlayKeydown}
    role="button"
    tabindex="0"
    aria-label="Cerrar formulario"
  >
    <div 
      class="modal-content" 
      on:click|stopPropagation 
      on:keydown={handleModalKeydown}
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
      tabindex="-1"
    >
      <button 
        class="close-button" 
        on:click={cerrarModal}
        aria-label="Cerrar formulario"
        type="button"
      >×</button>
      
      <h2 id="modal-title">Solicitar Prueba Gratuita</h2>
      
      {#if error}
        <div class="error-message" role="alert">{error}</div>
      {/if}
      
      {#if success}
        <div class="success-message" role="status">{success}</div>
      {/if}
      
      <form on:submit|preventDefault={enviarSolicitud}>
        <div class="form-group">
          <label for="nombre">Nombre completo *</label>
          <input
            type="text"
            id="nombre"
            bind:value={nombre}
            required
            placeholder="Tu nombre completo"
            aria-required="true"
          />
        </div>
        
        <div class="form-group">
          <label for="email">Correo electrónico *</label>
          <input
            type="email"
            id="email"
            bind:value={email}
            required
            placeholder="tu@email.com"
            aria-required="true"
          />
        </div>
        
        <div class="form-group">
          <label for="telefono">Teléfono *</label>
          <input
            type="tel"
            id="telefono"
            bind:value={telefono}
            required
            placeholder="Tu número de teléfono"
            aria-required="true"
          />
        </div>
        
        <div class="form-group">
          <label for="nombreNegocio">Nombre del negocio *</label>
          <input
            type="text"
            id="nombreNegocio"
            bind:value={nombreNegocio}
            required
            placeholder="Nombre de tu negocio"
            aria-required="true"
          />
        </div>
        
        <div class="form-group">
          <label for="tipoNegocio">Tipo de negocio *</label>
          <select 
            id="tipoNegocio" 
            bind:value={tipoNegocio} 
            required
            aria-required="true"
          >
            <option value="">Selecciona un tipo</option>
            <option value="retail">Tienda minorista</option>
            <option value="restaurant">Restaurante/Café</option>
            <option value="services">Servicios</option>
            <option value="other">Otro</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="mensaje">Mensaje (opcional)</label>
          <textarea
            id="mensaje"
            bind:value={mensaje}
            placeholder="Cuéntanos más sobre tu negocio..."
            rows="3"
            aria-required="false"
          ></textarea>
        </div>
        
        <button 
          type="submit" 
          class="submit-button" 
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? 'Enviando...' : 'Enviar Solicitud'}
        </button>
      </form>
    </div>
  </div>
{/if}

<svelte:window on:keydown={handleKeydown} />

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: var(--tg-theme-bg-color, white);
    padding: 2rem;
    border-radius: 12px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
  }

  .close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--tg-theme-text-color, #333);
  }

  h2 {
    margin-bottom: 1.5rem;
    color: var(--tg-theme-text-color, #333);
    text-align: center;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--tg-theme-text-color, #333);
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--tg-theme-hint-color, #ddd);
    border-radius: 6px;
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    color: var(--tg-theme-text-color, #333);
  }

  textarea {
    resize: vertical;
  }

  .submit-button {
    width: 100%;
    padding: 1rem;
    background: var(--tg-theme-button-color, #FF6B6B);
    color: var(--tg-theme-button-text-color, white);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    margin-top: 1rem;
  }

  .submit-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .error-message {
    background: #ffebee;
    color: #d32f2f;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }

  .success-message {
    background: #e8f5e9;
    color: #388e3c;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }
</style> 