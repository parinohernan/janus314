<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  
  export let comprobante: {
    tipo: string;
    sucursal: string;
    numero: string;
    fecha?: string;
    clienteCodigo?: string;
    clienteNombre?: string;
    clienteTelefono?: string;
    total: number;
    vendedorCodigo?: string;
    vendedorNombre?: string;
    items?: Array<{
      codigo: string;
      descripcion: string;
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
    }>;
  };
  
  export let mostrar: boolean = false;
  export let onClose: () => void = () => {};
  
  let compartidoExitoso = false;
  let numeroTelefono = '';
  let telefonoOriginal = '';
  let mostrarBotonActualizar = false;
  let cargandoTelefono = false;
  let errorCargaTelefono = '';
  
  // Formatear el número de comprobante para mostrar
  $: numeroFormateado = formatearNumeroComprobante(comprobante.sucursal, comprobante.numero);
  
  // Formatear tipo de comprobante para mostrar
  $: tipoComprobante = obtenerTipoComprobante(comprobante.tipo);
  
  // Determinar si está en Telegram
  let esTelegram = false;
  
  // Función para obtener los datos del cliente desde el backend
  async function cargarDatosCliente(codigoCliente: string) {
    if (!codigoCliente) return;
    
    try {
      cargandoTelefono = true;
      errorCargaTelefono = '';
      console.log("Obteniendo datos del cliente con código:", codigoCliente);
      
      const response = await fetchWithAuth(`/clientes/${codigoCliente}`);
      
      if (!response.ok) {
        throw new Error(`Error al obtener datos del cliente: ${response.status}`);
      }
      
      const cliente = await response.json();
      console.log("Datos del cliente obtenidos:", cliente);
      
      if (cliente && cliente.Telefono) {
        // Actualizar el teléfono con el valor del backend
        const telefonoBackend = cliente.Telefono.replace(/[\s\-()]/g, '');
        
        // Si empieza con 0, quitarlo
        numeroTelefono = telefonoBackend.startsWith('0') ? telefonoBackend.substring(1) : telefonoBackend;
        telefonoOriginal = numeroTelefono;
        
        console.log("Teléfono obtenido del backend:", numeroTelefono);
      } else {
        // Si no hay teléfono en el backend, usar el del comprobante como respaldo
        if (comprobante.clienteTelefono) {
          numeroTelefono = comprobante.clienteTelefono.replace(/[\s\-()]/g, '');
          if (numeroTelefono.startsWith('0')) {
            numeroTelefono = numeroTelefono.substring(1);
          }
          telefonoOriginal = numeroTelefono;
        } else {
          numeroTelefono = '';
          telefonoOriginal = '';
        }
      }
    } catch (err) {
      console.error("Error al cargar datos del cliente:", err);
      errorCargaTelefono = 'No se pudo cargar el teléfono del cliente';
      
      // Usar el teléfono del comprobante como respaldo
      if (comprobante.clienteTelefono) {
        numeroTelefono = comprobante.clienteTelefono.replace(/[\s\-()]/g, '');
        if (numeroTelefono.startsWith('0')) {
          numeroTelefono = numeroTelefono.substring(1);
        }
        telefonoOriginal = numeroTelefono;
      } else {
        numeroTelefono = '';
        telefonoOriginal = '';
      }
    } finally {
      cargandoTelefono = false;
    }
  }
  
  onMount(() => {
    // Verificar si estamos en Telegram WebApp
    esTelegram = typeof window !== 'undefined' && 'Telegram' in window;
    
    console.log("codigo del cliente", comprobante.clienteCodigo);
    
    // Cargar datos del cliente desde el backend si tenemos el código
    if (comprobante.clienteCodigo) {
      cargarDatosCliente(comprobante.clienteCodigo);
    } else {
      // Si no hay código de cliente, usar el teléfono del comprobante si está disponible
      if (comprobante.clienteTelefono) {
        numeroTelefono = comprobante.clienteTelefono.replace(/[\s\-()]/g, '');
        if (numeroTelefono.startsWith('0')) {
          numeroTelefono = numeroTelefono.substring(1);
        }
        telefonoOriginal = numeroTelefono;
      } else {
        numeroTelefono = '';
        telefonoOriginal = '';
      }
    }
  });
  
  // Función para formatear el número de comprobante
  function formatearNumeroComprobante(sucursal: string, numero: string): string {
    const sucursalFormateada = sucursal.padStart(4, '0');
    const numeroFormateado = numero.padStart(8, '0');
    return `${sucursalFormateada}-${numeroFormateado}`;
  }
  
  // Función para determinar el tipo de comprobante según su código
  function obtenerTipoComprobante(tipo: string): string {
    const tipos: Record<string, string> = {
      'PRF': 'Prefactura',
      'FAA': 'Factura A',
      'FAB': 'Factura B',
      'FAC': 'Factura C',
      'FAE': 'Factura E',
      'RMA': 'Remito',
      'NCA': 'Nota de Crédito A',
      'NCB': 'Nota de Crédito B',
      'NCC': 'Nota de Crédito C',
      'NDA': 'Nota de Débito A',
      'NDB': 'Nota de Débito B',
      'NDC': 'Nota de Débito C'
    };
    
    return tipos[tipo] || tipo;
  }
  
  // Detectar cambios en el número de teléfono
  function verificarCambioTelefono() {
    if (telefonoOriginal && numeroTelefono && telefonoOriginal !== numeroTelefono) {
      mostrarBotonActualizar = true;
    } else {
      mostrarBotonActualizar = false;
    }
  }
  
  // Función para compartir por WhatsApp
  function compartirPorWhatsApp() {
    if (!numeroTelefono) {
      alert('Por favor ingrese un número de teléfono');
      return;
    }
    
    // Limpiar el número de teléfono (quitar espacios y guiones)
    const numeroLimpio = numeroTelefono.replace(/[\s-]/g, '');
    
    // Validar que sea un número válido
    if (!/^\d{10,}$/.test(numeroLimpio)) {
      alert('Por favor ingrese un número válido (mínimo 10 dígitos)');
      return;
    }

    // Crear mensaje para compartir
    const mensaje = `
*${tipoComprobante} ${numeroFormateado}*
Fecha: ${comprobante.fecha || new Date().toLocaleDateString()}
Cliente: ${comprobante.clienteNombre || 'Consumidor Final'}
Total: $${comprobante.total.toFixed(2)}

${comprobante.items && comprobante.items.length > 0 ? 'Artículos:' : ''}
${comprobante.items ? comprobante.items.map(item => 
  `• ${item.descripcion} x${item.cantidad} = $${item.subtotal.toFixed(2)}`
).join('\n') : ''}

Gracias por su compra!
    `.trim();
    
    // Agregar el prefijo del país (54 para Argentina) si no lo tiene
    const numeroCompleto = numeroLimpio.startsWith('54') ? numeroLimpio : `54${numeroLimpio}`;
    const url = `https://wa.me/${numeroCompleto}?text=${encodeURIComponent(mensaje)}`;
    
    // Abrir WhatsApp
    window.open(url, '_blank');
    compartidoExitoso = true;
    setTimeout(() => {
      compartidoExitoso = false;
    }, 3000);
  }
  
  // Exponer función para actualizar teléfono (será implementada por el componente padre)
  export const actualizarTelefono = () => {
    // Esta función debe ser implementada por el componente padre
    // Emitimos un evento personalizado
    const evento = new CustomEvent('actualizarTelefono', { 
      detail: { 
        clienteCodigo: comprobante.clienteCodigo,
        nuevoTelefono: numeroTelefono
      } 
    });
    window.dispatchEvent(evento);
    
    // Actualizar el teléfono original para que no se muestre más el botón de actualizar
    telefonoOriginal = numeroTelefono;
    mostrarBotonActualizar = false;
    
    return true;
  };
  
  // Función para cerrar el modal
  function cerrarModal() {
    // Si estamos en Telegram y el botón principal está visible, ocultarlo
    if (esTelegram) {
      try {
        const telegram = (window as any).Telegram;
        if (telegram && telegram.WebApp && telegram.WebApp.MainButton) {
          telegram.WebApp.MainButton.hide();
        }
      } catch (error) {
        console.error('Error al ocultar MainButton:', error);
      }
    }
    
    // Llamar a la función de cierre proporcionada
    onClose();
  }
  
  // Manejar tecla Escape para cerrar el modal
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && mostrar) {
      cerrarModal();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if mostrar}
  <div 
    class="modal-overlay" 
    on:click|self={cerrarModal}
    on:keydown={(e) => e.key === 'Escape' && cerrarModal()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="comprobante-titulo"
    tabindex="0"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="comprobante-titulo">Detalle de Comprobante</h3>
        <button class="btn-close" on:click={cerrarModal} aria-label="Cerrar modal">×</button>
      </div>
      
      <div class="modal-body">
        <div class="comprobante-resumen">
          <div class="comprobante-tipo-numero">
            <span class="comprobante-tipo">{tipoComprobante}</span>
            <span class="comprobante-numero">{numeroFormateado}</span>
          </div>
          
          <div class="comprobante-info">
            <div class="info-grupo">
              <div class="info-label">Fecha:</div>
              <div class="info-valor">{comprobante.fecha || new Date().toLocaleDateString()}</div>
            </div>
            
            <div class="info-grupo">
              <div class="info-label">Cliente:</div>
              <div class="info-valor">{comprobante.clienteNombre || 'Consumidor Final'}</div>
            </div>
            
            {#if comprobante.vendedorNombre}
              <div class="info-grupo">
                <div class="info-label">Vendedor:</div>
                <div class="info-valor">{comprobante.vendedorNombre}</div>
              </div>
            {/if}
          </div>
          
          {#if comprobante.items && comprobante.items.length > 0}
            <div class="comprobante-items">
              <h4>Artículos</h4>
              <div class="items-tabla">
                <div class="items-header">
                  <div class="item-desc">Descripción</div>
                  <div class="item-cant">Cant.</div>
                  <div class="item-precio">Precio</div>
                  <div class="item-subtotal">Subtotal</div>
                </div>
                
                {#each comprobante.items as item}
                  <div class="item-row">
                    <div class="item-desc">{item.descripcion}</div>
                    <div class="item-cant">{item.cantidad}</div>
                    <div class="item-precio">${item.precioUnitario.toFixed(2)}</div>
                    <div class="item-subtotal">${item.subtotal.toFixed(2)}</div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
          
          <div class="comprobante-total">
            <div class="total-label">Total:</div>
            <div class="total-valor">${comprobante.total.toFixed(2)}</div>
          </div>
        </div>
        
        <div class="comprobante-whatsapp">
          <h4>Compartir Comprobante</h4>
          
          <div class="telefono-grupo">
            <label for="whatsapp-telefono">Número de teléfono:</label>
            {#if cargandoTelefono}
              <div class="cargando-texto">Cargando teléfono...</div>
            {:else}
              <input 
                type="tel" 
                id="whatsapp-telefono" 
                bind:value={numeroTelefono} 
                placeholder="Ej: 3492123456" 
                on:input={verificarCambioTelefono}
                class="input-telefono"
              />
              <small class="ayuda-texto">Ingrese el número sin 0 ni 15. Ej: 3492123456</small>
              
              {#if errorCargaTelefono}
                <small class="error-texto">{errorCargaTelefono}</small>
              {/if}
            {/if}
          </div>
          
          <div class="whatsapp-acciones">
            <button class="btn-whatsapp" on:click={compartirPorWhatsApp}>
              <span class="icono-whatsapp">📱</span>
              <span>Enviar por WhatsApp</span>
            </button>
            
            {#if mostrarBotonActualizar && comprobante.clienteCodigo}
              <button class="btn-actualizar" on:click={actualizarTelefono}>
                <span class="icono-actualizar">💾</span>
                <span>Actualizar Teléfono</span>
              </button>
            {/if}
          </div>
          
          {#if compartidoExitoso}
            <div class="mensaje-exito">
              ¡Comprobante compartido con éxito!
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 16px;
  }
  
  .modal-content {
    background-color: var(--tg-theme-bg-color, #fff);
    border-radius: 12px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--tg-theme-hint-color, #eee);
  }
  
  .modal-header h3 {
    margin: 0;
    font-size: 1.3rem;
    color: var(--tg-theme-text-color, #000);
  }
  
  .btn-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--tg-theme-hint-color, #777);
    cursor: pointer;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .comprobante-resumen {
    margin-bottom: 24px;
  }
  
  .comprobante-tipo-numero {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }
  
  .comprobante-tipo {
    font-weight: bold;
    font-size: 1.1rem;
    color: var(--tg-theme-text-color, #000);
  }
  
  .comprobante-numero {
    font-size: 1.1rem;
    color: var(--tg-theme-text-color, #000);
  }
  
  .comprobante-info {
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
  }
  
  .info-grupo {
    display: flex;
    margin-bottom: 8px;
  }
  
  .info-grupo:last-child {
    margin-bottom: 0;
  }
  
  .info-label {
    font-weight: 500;
    min-width: 80px;
    color: var(--tg-theme-hint-color, #777);
  }
  
  .info-valor {
    flex: 1;
    color: var(--tg-theme-text-color, #000);
  }
  
  .comprobante-items {
    margin-bottom: 16px;
  }
  
  .comprobante-items h4 {
    font-size: 1rem;
    margin: 0 0 8px 0;
    color: var(--tg-theme-text-color, #000);
  }
  
  .items-tabla {
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 8px;
    overflow: hidden;
  }
  
  .items-header {
    display: grid;
    grid-template-columns: 2fr 0.5fr 1fr 1fr;
    padding: 8px;
    background-color: rgba(0, 0, 0, 0.05);
    font-weight: 500;
    font-size: 0.85rem;
  }
  
  .item-row {
    display: grid;
    grid-template-columns: 2fr 0.5fr 1fr 1fr;
    padding: 8px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    font-size: 0.9rem;
  }
  
  .item-desc {
    padding-right: 8px;
  }
  
  .item-cant {
    text-align: center;
  }
  
  .item-precio, .item-subtotal {
    text-align: right;
  }
  
  .comprobante-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 8px;
    font-weight: bold;
  }
  
  .total-label {
    font-size: 1.1rem;
  }
  
  .total-valor {
    font-size: 1.2rem;
    color: var(--tg-theme-button-color, #2481cc);
  }
  
  .comprobante-whatsapp {
    margin-top: 20px;
    padding: 16px;
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 8px;
  }
  
  .comprobante-whatsapp h4 {
    font-size: 1rem;
    margin: 0 0 12px 0;
    color: var(--tg-theme-text-color, #000);
  }
  
  .telefono-grupo {
    margin-bottom: 16px;
  }
  
  .telefono-grupo label {
    display: block;
    margin-bottom: 6px;
    font-size: 0.9rem;
    color: var(--tg-theme-text-color, #000);
  }
  
  .input-telefono {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--tg-theme-hint-color, #ccc);
    border-radius: 6px;
    font-size: 1rem;
    background-color: var(--tg-theme-bg-color, #fff);
    color: var(--tg-theme-text-color, #000);
  }
  
  .ayuda-texto {
    display: block;
    font-size: 0.8rem;
    color: var(--tg-theme-hint-color, #999);
    margin-top: 4px;
  }
  
  .whatsapp-acciones {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .btn-whatsapp {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background-color: #25D366;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
  }
  
  .btn-actualizar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
  }
  
  .mensaje-exito {
    margin-top: 12px;
    color: #4caf50;
    font-size: 0.9rem;
    text-align: center;
  }
  
  .cargando-texto {
    font-size: 0.9em;
    color: var(--tg-theme-hint-color, #999);
    padding: 8px 0;
  }
  
  .error-texto {
    display: block;
    font-size: 0.8em;
    color: #d32f2f;
    margin-top: 4px;
  }
  
  @media (max-width: 480px) {
    .items-header, .item-row {
      font-size: 0.8rem;
    }
    
    .modal-header h3 {
      font-size: 1.1rem;
    }
  }
</style> 