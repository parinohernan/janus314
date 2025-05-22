<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import '../../../../../app.css';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { ClienteService } from '$lib/services/ClienteService';
  import { CategoriaIvaService, type CategoriaIva } from '$lib/services/CategoriaIvaService';

  // Estado para el paso actual
  let currentStep = 1;
  const totalSteps = 3;

  // Estado para los datos del cliente
  let cliente = {
    Codigo: '',
    Descripcion: '', // Razón Social
    NombreFantasia: '',
    CategoriaIva: '',
    Cuit: '',
    
    // Dirección
    Calle: '',
    Numero: '',
    Piso: '',
    Departamento: '',
    ProvinciaCodigo: '',
    Localidad: '',
    CodigoPostal: '',
    
    // Contacto
    ContactoNombre: '',
    Mail: '',
    Telefono: '',
    TelefonoMovil: '',
    
    // Otros campos requeridos con valores por defecto
    Activo: 1,
    ImporteDeuda: 0,
    SaldoNTCNoAplicado: 0,
    LimiteCredito: 0,
    Actualizado: 0
  };

  // Estado para controlar mensajes
  let loading = false;
  let error = '';
  let successMessage = '';

  // Estado para opciones de selección
  let categoriasIva: CategoriaIva[] = [];

  // Cargar opciones para selects
  async function cargarOpciones() {
    try {
      categoriasIva = await CategoriaIvaService.obtenerCategorias();
    } catch (err) {
      console.error('Error al cargar opciones:', err);
      error = 'Error al cargar datos. Intente nuevamente.';
    }
  }

  // Validar formulario según el paso actual
  function validarPasoActual(): boolean {
    error = '';
    
    if (currentStep === 1) {
      // Validar datos principales
      if (!cliente.Codigo) {
        error = 'El código del cliente es obligatorio';
        return false;
      }
      if (!cliente.Descripcion) {
        error = 'La razón social es obligatoria';
        return false;
      }
      if (!cliente.CategoriaIva) {
        error = 'La categoría de IVA es obligatoria';
        return false;
      }
      if (!cliente.Cuit) {
        error = 'El CUIT es obligatorio';
        return false;
      }
      if (cliente.Cuit && cliente.Cuit.length !== 11) {
        error = 'El CUIT debe tener 11 dígitos';
        return false;
      }
    }
    
    // La validación para los pasos 2 y 3 es opcional ya que no son campos obligatorios
    return true;
  }

  // Ir al siguiente paso
  function siguientePaso() {
    if (!validarPasoActual()) return;
    
    if (currentStep < totalSteps) {
      currentStep++;
    } else {
      guardarCliente();
    }
  }

  // Ir al paso anterior
  function pasoAnterior() {
    if (currentStep > 1) {
      currentStep--;
    }
  }

  // Guardar cliente
  async function guardarCliente() {
    if (!validarPasoActual()) return;
    
    try {
      loading = true;
      error = '';
      
      const response = await fetchWithAuth('/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cliente),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el cliente');
      }
      
      successMessage = 'Cliente creado correctamente';
      
      // Esperar un momento y redirigir a la lista de clientes
      setTimeout(() => {
        goto('/ventas/bot/clientes');
      }, 1500);
      
    } catch (err: any) {
      console.error('Error al guardar cliente:', err);
      error = err.message || 'Error al crear el cliente. Intente nuevamente.';
    } finally {
      loading = false;
    }
  }

  // Volver a la lista de clientes
  function cancelar() {
    goto('/ventas/bot/clientes');
  }

  // Formatear el CUIT mientras se escribe
  function formatearCuit(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 11) {
      value = value.slice(0, 11);
    }
    
    cliente.Cuit = value;
  }

  // Cargar datos al montar el componente
  onMount(() => {
    cargarOpciones();
  });
</script>

<div class="nuevo-cliente-container">
  <!-- Header con título y botones de navegación -->
  <header class="header">
    <div class="header-title">
      <h1>Nuevo Cliente</h1>
    </div>
    <div class="header-actions">
      <button class="btn-back" on:click={cancelar} aria-label="Volver a clientes">
        <span class="icon">←</span> <span class="label">Volver</span>
      </button>
    </div>
  </header>
  
  <!-- Indicador de pasos -->
  <div class="stepper">
    <div class="step-dots">
      {#each Array(totalSteps) as _, i}
        <div 
          class="step-dot" 
          class:active={currentStep === i + 1}
          class:completed={currentStep > i + 1}
        >
          {i + 1}
        </div>
        {#if i < totalSteps - 1}
          <div 
            class="step-line"
            class:completed={currentStep > i + 1}
          ></div>
        {/if}
      {/each}
    </div>
    <div class="step-labels">
      <div class="step-label" class:active={currentStep === 1}>Datos Principales</div>
      <div class="step-label" class:active={currentStep === 2}>Dirección</div>
      <div class="step-label" class:active={currentStep === 3}>Contacto</div>
    </div>
  </div>
  
  <!-- Mensajes de estado -->
  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}
  
  {#if successMessage}
    <div class="success-message">
      {successMessage}
    </div>
  {/if}
  
  <!-- Formulario de cliente paso a paso -->
  <div class="cliente-form">
    <!-- Paso 1: Datos Principales -->
    {#if currentStep === 1}
      <div class="form-step">
        <div class="form-group">
          <label for="codigo">Código <span class="required">*</span></label>
          <input 
            type="text" 
            id="codigo" 
            bind:value={cliente.Codigo} 
            placeholder="Ingrese el código del cliente"
            maxlength="8"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="razonSocial">Razón Social <span class="required">*</span></label>
          <input 
            type="text" 
            id="razonSocial" 
            bind:value={cliente.Descripcion} 
            placeholder="Ingrese la razón social"
            maxlength="50"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="nombreFantasia">Nombre Fantasía</label>
          <input 
            type="text" 
            id="nombreFantasia" 
            bind:value={cliente.NombreFantasia} 
            placeholder="Ingrese el nombre de fantasía"
            maxlength="80"
          />
        </div>
        
        <div class="form-group">
          <label for="categoriaIva">Categoría IVA <span class="required">*</span></label>
          <select 
            id="categoriaIva" 
            bind:value={cliente.CategoriaIva}
            required
          >
            <option value="">Seleccione una categoría</option>
            {#each categoriasIva as categoria}
              <option value={categoria.Codigo}>{categoria.Descripcion}</option>
            {/each}
          </select>
        </div>
        
        <div class="form-group">
          <label for="cuit">CUIT <span class="required">*</span></label>
          <input 
            type="text" 
            id="cuit" 
            bind:value={cliente.Cuit} 
            placeholder="Ingrese el CUIT (11 dígitos)"
            maxlength="11"
            on:input={formatearCuit}
            required
          />
        </div>
      </div>
    {/if}
    
    <!-- Paso 2: Dirección -->
    {#if currentStep === 2}
      <div class="form-step">
        <div class="form-group">
          <label for="calle">Calle</label>
          <input 
            type="text" 
            id="calle" 
            bind:value={cliente.Calle} 
            placeholder="Ingrese la calle"
            maxlength="50"
          />
        </div>
        
        <div class="form-group">
          <label for="numero">Número</label>
          <input 
            type="text" 
            id="numero" 
            bind:value={cliente.Numero} 
            placeholder="Ingrese el número"
            maxlength="15"
          />
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="piso">Piso</label>
            <input 
              type="text" 
              id="piso" 
              bind:value={cliente.Piso} 
              placeholder="Piso"
              maxlength="10"
            />
          </div>
          
          <div class="form-group">
            <label for="departamento">Departamento</label>
            <input 
              type="text" 
              id="departamento" 
              bind:value={cliente.Departamento} 
              placeholder="Depto."
              maxlength="10"
            />
          </div>
        </div>
        
        <div class="form-group">
          <label for="provincia">Provincia</label>
          <input 
            type="text" 
            id="provincia" 
            bind:value={cliente.ProvinciaCodigo} 
            placeholder="Ingrese la provincia"
            maxlength="3"
          />
        </div>
        
        <div class="form-group">
          <label for="localidad">Localidad</label>
          <input 
            type="text" 
            id="localidad" 
            bind:value={cliente.Localidad} 
            placeholder="Ingrese la localidad"
            maxlength="50"
          />
        </div>
        
        <div class="form-group">
          <label for="codigoPostal">Código Postal</label>
          <input 
            type="text" 
            id="codigoPostal" 
            bind:value={cliente.CodigoPostal} 
            placeholder="Ingrese el código postal"
            maxlength="10"
          />
        </div>
      </div>
    {/if}
    
    <!-- Paso 3: Contacto -->
    {#if currentStep === 3}
      <div class="form-step">
        <div class="form-group">
          <label for="contactoNombre">Nombre de Contacto</label>
          <input 
            type="text" 
            id="contactoNombre" 
            bind:value={cliente.ContactoNombre} 
            placeholder="Ingrese el nombre de contacto"
            maxlength="100"
          />
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            bind:value={cliente.Mail} 
            placeholder="Ingrese el email"
            maxlength="50"
          />
        </div>
        
        <div class="form-group">
          <label for="telefono">Teléfono</label>
          <input 
            type="tel" 
            id="telefono" 
            bind:value={cliente.Telefono} 
            placeholder="Ingrese el teléfono"
            maxlength="50"
          />
        </div>
        
        <div class="form-group">
          <label for="telefonoMovil">Teléfono Móvil</label>
          <input 
            type="tel" 
            id="telefonoMovil" 
            bind:value={cliente.TelefonoMovil} 
            placeholder="Ingrese el teléfono móvil"
            maxlength="50"
          />
        </div>
      </div>
    {/if}
    
    <!-- Botones de navegación -->
    <div class="form-buttons">
      {#if currentStep > 1}
        <button 
          type="button" 
          class="btn-secondary" 
          on:click={pasoAnterior}
          disabled={loading}
        >
          Anterior
        </button>
      {/if}
      
      <button 
        type="button" 
        class="btn-primary" 
        on:click={siguientePaso}
        disabled={loading}
      >
        {currentStep < totalSteps ? 'Siguiente' : 'Guardar'}
        {#if loading}
          <span class="spinner"></span>
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .nuevo-cliente-container {
    padding: 16px;
    max-width: 100%;
    color: var(--tg-theme-text-color, #000);
    background: var(--tg-theme-bg-color, #fff);
    min-height: 100vh;
  }
  
  .header {
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .header-title h1 {
    font-size: 1.8rem;
    margin: 0;
    color: var(--tg-theme-text-color, #000);
  }
  
  .btn-back {
    padding: 8px 16px;
    border-radius: 8px;
    border: none;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    color: var(--tg-theme-text-color, #000);
  }
  
  .icon {
    font-size: 1.1rem;
  }
  
  .stepper {
    margin-bottom: 24px;
  }
  
  .step-dots {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .step-dot {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    color: var(--tg-theme-hint-color, #777);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    position: relative;
    z-index: 2;
  }
  
  .step-dot.active {
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
  }
  
  .step-dot.completed {
    background-color: #4caf50;
    color: white;
  }
  
  .step-line {
    flex: 1;
    height: 2px;
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    max-width: 50px;
  }
  
  .step-line.completed {
    background-color: #4caf50;
  }
  
  .step-labels {
    display: flex;
    justify-content: space-between;
    padding: 0 10px;
  }
  
  .step-label {
    font-size: 0.8rem;
    color: var(--tg-theme-hint-color, #777);
    text-align: center;
    max-width: 100px;
  }
  
  .step-label.active {
    color: var(--tg-theme-button-color, #2481cc);
    font-weight: bold;
  }
  
  .error-message {
    background-color: #ffebee;
    color: #f44336;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
  }
  
  .success-message {
    background-color: #e8f5e9;
    color: #4caf50;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
  }
  
  .cliente-form {
    margin-bottom: 20px;
  }
  
  .form-step {
    margin-bottom: 24px;
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  .form-row {
    display: flex;
    gap: 16px;
  }
  
  .form-row .form-group {
    flex: 1;
  }
  
  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: var(--tg-theme-text-color, #000);
  }
  
  .required {
    color: #f44336;
  }
  
  input, select {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--tg-theme-hint-color, #ccc);
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    color: var(--tg-theme-text-color, #000);
    font-size: 1rem;
  }
  
  input:focus, select:focus {
    border-color: var(--tg-theme-button-color, #2481cc);
    outline: none;
  }
  
  .form-buttons {
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }
  
  .btn-secondary, .btn-primary {
    flex: 1;
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
  }
  
  .btn-secondary {
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    color: var(--tg-theme-text-color, #000);
  }
  
  .btn-primary {
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
  }
  
  .btn-primary:disabled, .btn-secondary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .spinner {
    width: 16px;
    height: 16px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @media (max-width: 480px) {
    .form-row {
      flex-direction: column;
      gap: 16px;
    }
    
    .step-labels {
      font-size: 0.75rem;
    }
  }
</style> 