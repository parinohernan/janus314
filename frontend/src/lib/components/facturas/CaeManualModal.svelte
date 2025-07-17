<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  
  // Props
  export let show = false;
  export let factura: {
    DocumentoTipo: string;
    DocumentoSucursal: string;
    DocumentoNumero: string;
  };
  
  // Estados
  let cae = '';
  let fechaVencimiento = '';
  let loading = false;
  let error: string | null = null;
  
  // Event dispatcher para comunicarse con el componente padre
  const dispatch = createEventDispatcher();
  
  // Función para cerrar el modal
  function close() {
    show = false;
    dispatch('close');
    // Limpiar campos
    cae = '';
    fechaVencimiento = '';
    error = null;
  }
  
  // Función para validar campos
  function validarCampos(): boolean {
    console.log('🔍 Validando campos:', { cae, fechaVencimiento });
    
    // Validar CAE
    if (!cae || !cae.trim()) {
      error = 'El CAE es obligatorio';
      console.log('❌ CAE vacío o nulo');
      return false;
    }
    
    const caeLimpio = cae.trim();
    if (!/^\d+$/.test(caeLimpio)) {
      error = 'El CAE debe ser un número válido';
      console.log('❌ CAE no es numérico:', caeLimpio);
      return false;
    }
    
    // Validar fecha de vencimiento
    if (!fechaVencimiento) {
      error = 'La fecha de vencimiento es obligatoria';
      console.log('❌ Fecha de vencimiento vacía');
      return false;
    }
    
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fechaVencimiento)) {
      error = 'La fecha debe tener el formato YYYY-MM-DD';
      console.log('❌ Formato de fecha inválido:', fechaVencimiento);
      return false;
    }
    
    // Verificar que la fecha no sea anterior a hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaVenc = new Date(fechaVencimiento);
    
    if (fechaVenc < hoy) {
      error = 'La fecha de vencimiento no puede ser anterior a hoy';
      console.log('❌ Fecha anterior a hoy:', fechaVenc, 'vs', hoy);
      return false;
    }
    
    console.log('✅ Validación exitosa');
    error = null;
    return true;
  }
  
  // Función para guardar CAE
  async function guardarCae() {
    console.log('🚀 Iniciando guardado de CAE...');
    console.log('📊 Datos a enviar:', {
      tipo: factura.DocumentoTipo,
      puntoVenta: factura.DocumentoSucursal,
      numero: factura.DocumentoNumero,
      cae: cae.trim(),
      fechaVencimiento
    });
    
    if (!validarCampos()) {
      console.log('❌ Validación falló, no se procede con el guardado');
      return;
    }
    
    loading = true;
    error = null;
    
    try {
      const { AfipService } = await import('$lib/services/AfipService');
      
      const result = await AfipService.colocarCaeManualmente(
        factura.DocumentoTipo,
        factura.DocumentoSucursal,
        factura.DocumentoNumero,
        cae.trim(),
        fechaVencimiento
      );
      
      console.log('📊 Resultado del servicio:', result);
      
      if (result.success) {
        console.log('✅ CAE guardado exitosamente');
        dispatch('caeGuardado', result.data);
        close();
      } else {
        console.log('❌ Error en el servicio:', result.error);
        error = result.error || 'Error al guardar el CAE';
      }
    } catch (err) {
      console.error('💥 Error guardando CAE:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  }
  
  // Establecer fecha mínima como hoy
  $: fechaMinima = new Date().toISOString().split('T')[0];
</script>

{#if show}
  <div 
    class="modal-backdrop" 
    on:click|self={close}
    on:keydown={(e) => e.key === 'Escape' && close()}
    role="presentation"
  >
    <div 
      class="modal-content" 
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabindex="-1"
    >
      <div class="modal-header">
        <h3 id="modal-title">Colocar CAE Manualmente</h3>
        <button 
          class="close-button" 
          on:click={close}
          aria-label="Cerrar"
          type="button"
        >×</button>
      </div>
      
      <div class="modal-body">
        <div class="warning-box">
          <div class="warning-icon">⚠️</div>
          <div class="warning-content">
            <h4>Importante</h4>
            <p>Debe usar datos reales consultados en la página de AFIP o ARCA (afip.gob.ar).</p>
            <p><strong>En AFIP SOLO PODRÁS CONSULTAR PASADAS LAS 24 HORAS</strong> desde la autorización del comprobante.</p>
            <p>El CAE y fecha de vencimiento deben corresponder exactamente con los datos autorizados por AFIP.</p>
          </div>
        </div>
        
        <div class="form-section">
          <h4>Datos del Comprobante</h4>
          <div class="comprobante-info">
            <div class="info-row">
              <span class="label">Tipo:</span>
              <span class="value">{factura.DocumentoTipo}</span>
            </div>
            <div class="info-row">
              <span class="label">Número:</span>
              <span class="value">{factura.DocumentoSucursal}-{factura.DocumentoNumero}</span>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <h4>Datos del CAE</h4>
          
          <div class="form-group">
            <label for="cae">Número de CAE *</label>
            <Input
              id="cae"
              type="text"
              bind:value={cae}
              placeholder="Ingrese el número de CAE"
              maxlength="14"
              disabled={loading}
            />
            <small>Ingrese solo números</small>
          </div>
          
          <div class="form-group">
            <label for="fechaVencimiento">Fecha de Vencimiento *</label>
            <Input
              id="fechaVencimiento"
              type="date"
              bind:value={fechaVencimiento}
              min={fechaMinima}
              disabled={loading}
            />
            <small>Formato: YYYY-MM-DD</small>
          </div>
        </div>
        
        {#if error}
          <div class="error-message">
            <div class="error-icon">❌</div>
            <span>{error}</span>
          </div>
        {/if}
        
        <div class="actions">
          <Button variant="secondary" on:click={close} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" on:click={guardarCae} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar CAE'}
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .close-button:hover {
    color: #374151;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .warning-box {
    display: flex;
    align-items: flex-start;
    background-color: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 6px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .warning-icon {
    font-size: 1.25rem;
    margin-right: 0.75rem;
    margin-top: 0.125rem;
  }
  
  .warning-content h4 {
    margin: 0 0 0.5rem 0;
    color: #92400e;
    font-size: 1rem;
    font-weight: 600;
  }
  
  .warning-content p {
    margin: 0 0 0.25rem 0;
    color: #92400e;
    font-size: 0.875rem;
    line-height: 1.4;
  }
  
  .form-section {
    margin-bottom: 1.5rem;
  }
  
  .form-section h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
  }
  
  .comprobante-info {
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 1rem;
  }
  
  .info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  
  .info-row:last-child {
    margin-bottom: 0;
  }
  
  .label {
    font-weight: 500;
    color: #6b7280;
  }
  
  .value {
    font-weight: 600;
    color: #111827;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }
  
  .form-group small {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .error-message {
    display: flex;
    align-items: center;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 0.75rem;
    margin-bottom: 1rem;
    color: #dc2626;
  }
  
  .error-icon {
    margin-right: 0.5rem;
    font-size: 1rem;
  }
  
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }
</style> 