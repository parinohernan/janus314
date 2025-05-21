<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import '../../../../../app.css';
  import { writable } from 'svelte/store';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { ProveedorService, type Proveedor } from '$lib/services/ProveedorService';
  import { RubroService, type Rubro } from '$lib/services/RubroService';

  // Paso actual del formulario
  let currentStep = 1;
  const totalSteps = 4;

  // Función para validar el formulario antes de cambiar de paso
  function validateStep(step: number): boolean {
    switch(step) {
      case 1:
        return !!producto.Descripcion; // Descripción es obligatoria
      case 2:
        return !!producto.Proveedor && !!producto.Rubro; // Proveedor y Rubro son obligatorios
      case 3:
        return true; // No hay campos obligatorios en este paso
      case 4:
        return !!producto.PorcentajeIva1; // Solo el IVA1 es obligatorio
      default:
        return true;
    }
  }

  // Avanzar al siguiente paso
  function nextStep() {
    if (currentStep < totalSteps && validateStep(currentStep)) {
      currentStep++;
    }
  }

  // Retroceder al paso anterior
  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
    }
  }

  // Datos del producto
  let producto = {
    Codigo: '',
    Descripcion: '',
    CodigoBarras: '',
    CodigoProveedor: '',
    Proveedor: '',
    Rubro: '',
    Familia: '',
    Subfamilia: '',
    ExistenciaActual: 0,
    ExistenciaMinima: 0,
    ExistenciaMaxima: 0,
    UbicacionDeposito: '',
    Peso: 0,
    UnidadVenta: 'u',
    PrecioCostoSinIva: 0,
    PrecioCostoConIva: 0,
    PorcentajeIva1: 21,
    PorcentajeIva2: 0,
    PrecioLista1: 0,
    PrecioLista2: 0,
    PrecioLista3: 0,
    PrecioLista4: 0,
    PrecioLista5: 0,
    PorcentajeVendedor: 0
  };

  // Listas de opciones para selects
  let proveedores: Proveedor[] = [];
  let rubros: Rubro[] = [];
  let familias = [];
  let subfamilias = [];

  // Estado del formulario
  let loading = false;
  let error = '';
  let success = false;

  // Calcular precio de costo sin IVA cuando cambia el precio con IVA
  $: if (producto.PrecioCostoConIva > 0) {
    producto.PrecioCostoSinIva = calcularPrecioSinIva(producto.PrecioCostoConIva, producto.PorcentajeIva1);
  }

  // Calcular precio de costo sin IVA
  function calcularPrecioSinIva(precioConIva: number, porcentajeIva: number): number {
    return precioConIva / (1 + (porcentajeIva / 100));
  }

  // Cargar datos para los selects
  async function cargarDatosSelects() {
    try {
      loading = true;
      error = '';
      
      // Cargar proveedores
      proveedores = await ProveedorService.obtenerProveedores();
      
      // Cargar rubros
      rubros = await RubroService.obtenerRubros();
      
      // Mostrar resultado en consola
      console.log('Proveedores cargados:', proveedores.length);
      console.log('Rubros cargados:', rubros.length);
      
      if (proveedores.length === 0) {
        console.warn('No se encontraron proveedores');
      }
      
      if (rubros.length === 0) {
        console.warn('No se encontraron rubros');
      }
    } catch (err) {
      console.error('Error al cargar datos para selects:', err);
      error = 'Error al cargar proveedores o rubros. Intente nuevamente.';
    } finally {
      loading = false;
    }
  }

  // Guardar producto
  async function guardarProducto() {
    if (!validateStep(currentStep)) {
      error = 'Por favor, complete todos los campos obligatorios.';
      return;
    }

    try {
      loading = true;
      error = '';

      // Asegurar que valores numéricos sean números y no strings
      const productoParaEnviar = {
        ...producto,
        ExistenciaActual: Number(producto.ExistenciaActual),
        ExistenciaMinima: Number(producto.ExistenciaMinima),
        ExistenciaMaxima: Number(producto.ExistenciaMaxima),
        Peso: Number(producto.Peso),
        PrecioCostoSinIva: Number(producto.PrecioCostoSinIva),
        PrecioCostoConIva: Number(producto.PrecioCostoConIva),
        PorcentajeIva1: Number(producto.PorcentajeIva1),
        PorcentajeIva2: Number(producto.PorcentajeIva2),
        PrecioLista1: Number(producto.PrecioLista1),
        PrecioLista2: Number(producto.PrecioLista2),
        PrecioLista3: Number(producto.PrecioLista3),
        PrecioLista4: Number(producto.PrecioLista4),
        PrecioLista5: Number(producto.PrecioLista5),
        PorcentajeVendedor: Number(producto.PorcentajeVendedor)
      };

      // Enviar datos al backend - Corregir URL duplicada
      const response = await fetchWithAuth('/telegram/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productoParaEnviar)
      });

      if (response.ok) {
        const data = await response.json();
        success = true;
        
        // Mostrar el código generado si corresponde
        if (data && data.data && data.data.Codigo) {
          producto.Codigo = data.data.Codigo;
        }
        
        setTimeout(() => {
          goto('/ventas/bot/productos');
        }, 1500);
      } else {
        const data = await response.json();
        error = data.message || 'Error al guardar el producto';
      }
    } catch (err) {
      console.error('Error al guardar producto:', err);
      error = 'Error de conexión al guardar el producto';
    } finally {
      loading = false;
    }
  }

  // Volver al listado de productos
  function volverListado() {
    goto('/ventas/bot/productos');
  }

  // Cargar datos iniciales
  onMount(() => {
    cargarDatosSelects();
  });
</script>

<div class="nuevo-producto-container">
  <!-- Header con título y botón de volver -->
  <header class="header">
    <div class="header-title">
      <h1>Nuevo Producto</h1>
    </div>
    <div class="header-actions">
      <button class="btn-back" on:click={volverListado} aria-label="Volver al listado">
        <span class="icon">←</span> <span class="label">Volver</span>
      </button>
    </div>
  </header>
  
  <!-- Indicador de progreso -->
  <div class="progress-bar">
    <div class="progress-steps">
      {#each Array(totalSteps) as _, i}
        <button 
          class="step-indicator {currentStep === i+1 ? 'active' : ''} {currentStep > i+1 ? 'completed' : ''}"
          on:click={() => currentStep = i+1}
          disabled={currentStep < i+1 && !validateStep(currentStep)}
        >
          {i+1}
        </button>
        {#if i < totalSteps - 1}
          <div class="step-line {currentStep > i+1 ? 'completed' : ''}"></div>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Formulario paso a paso -->
  <div class="form-container">
    {#if loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <span>{currentStep === totalSteps ? 'Guardando producto...' : 'Cargando datos...'}</span>
      </div>
    {:else if error}
      <div class="error-state">
        <span>{error}</span>
        <button on:click={() => error = ''}>Aceptar</button>
      </div>
    {:else if success}
      <div class="success-state">
        <span>¡Producto guardado correctamente!</span>
        <p>Código: {producto.Codigo}</p>
        <p>Redirigiendo al listado...</p>
      </div>
    {:else}
      <!-- Paso 1: Datos principales -->
      {#if currentStep === 1}
        <div class="form-step">
          <h2>Datos Principales</h2>
          
          <div class="form-group">
            <label for="descripcion">
              Descripción <span class="required">*</span>
            </label>
            <input 
              type="text" 
              id="descripcion" 
              bind:value={producto.Descripcion} 
              placeholder="Nombre del producto"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="codigoBarras">Código de Barras</label>
            <input 
              type="text" 
              id="codigoBarras" 
              bind:value={producto.CodigoBarras} 
              placeholder="Código de barras (opcional)"
            />
          </div>
          
          <div class="form-group">
            <label for="codigoProveedor">Código de Proveedor</label>
            <input 
              type="text" 
              id="codigoProveedor" 
              bind:value={producto.CodigoProveedor} 
              placeholder="Código del proveedor (opcional)"
            />
          </div>
        </div>
      {/if}
      
      <!-- Paso 2: Clasificación -->
      {#if currentStep === 2}
        <div class="form-step">
          <h2>Clasificación</h2>
          
          <div class="form-group">
            <label for="proveedor">
              Proveedor <span class="required">*</span>
            </label>
            <select id="proveedor" bind:value={producto.Proveedor} required>
              <option value="">Seleccione un proveedor</option>
              {#each proveedores as proveedor}
                <option value={proveedor.Codigo}>{proveedor.Descripcion}</option>
              {/each}
            </select>
          </div>
          
          <div class="form-group">
            <label for="rubro">
              Rubro <span class="required">*</span>
            </label>
            <select id="rubro" bind:value={producto.Rubro} required>
              <option value="">Seleccione un rubro</option>
              {#each rubros as rubro}
                <option value={rubro.Codigo}>{rubro.Descripcion}</option>
              {/each}
            </select>
          </div>
          
          <div class="form-group">
            <label for="familia">
              Familia
              <span class="disabled-field">(Se genera automáticamente)</span>
            </label>
            <input 
              type="text" 
              id="familia" 
              bind:value={producto.Familia} 
              disabled
            />
          </div>
          
          <div class="form-group">
            <label for="subfamilia">
              Subfamilia
              <span class="disabled-field">(Se genera automáticamente)</span>
            </label>
            <input 
              type="text" 
              id="subfamilia" 
              bind:value={producto.Subfamilia} 
              disabled
            />
          </div>
        </div>
      {/if}
      
      <!-- Paso 3: Existencias -->
      {#if currentStep === 3}
        <div class="form-step">
          <h2>Existencias</h2>
          
          <div class="form-group">
            <label for="existenciaActual">Existencia Actual</label>
            <input 
              type="number" 
              id="existenciaActual" 
              bind:value={producto.ExistenciaActual} 
              placeholder="0"
              min="0"
            />
          </div>
          
          <div class="form-group">
            <label for="existenciaMinima">Existencia Mínima</label>
            <input 
              type="number" 
              id="existenciaMinima" 
              bind:value={producto.ExistenciaMinima} 
              placeholder="0"
              min="0"
            />
          </div>
          
          <div class="form-group">
            <label for="existenciaMaxima">Existencia Máxima</label>
            <input 
              type="number" 
              id="existenciaMaxima" 
              bind:value={producto.ExistenciaMaxima} 
              placeholder="0"
              min="0"
            />
          </div>
          
          <div class="form-group">
            <label for="ubicacionDeposito">Ubicación en Depósito</label>
            <input 
              type="text" 
              id="ubicacionDeposito" 
              bind:value={producto.UbicacionDeposito} 
              placeholder="Ubicación (opcional)"
            />
          </div>
          
          <div class="form-group">
            <label for="peso">
              Peso
              <span class="disabled-field">(Se genera automáticamente)</span>
            </label>
            <input 
              type="number" 
              id="peso" 
              bind:value={producto.Peso} 
              disabled
            />
          </div>
          
          <div class="form-group">
            <label for="unidadVenta">Unidad de Venta</label>
            <input 
              type="text" 
              id="unidadVenta" 
              bind:value={producto.UnidadVenta} 
              placeholder="u"
            />
          </div>
        </div>
      {/if}
      
      <!-- Paso 4: Precios y Costos -->
      {#if currentStep === 4}
        <div class="form-step">
          <h2>Precios y Costos</h2>
          
          <div class="form-group">
            <label for="precioCostoConIva">Precio Costo (con IVA)</label>
            <input 
              type="number" 
              id="precioCostoConIva" 
              bind:value={producto.PrecioCostoConIva} 
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          
          <div class="form-group">
            <label for="precioCostoSinIva">
              Precio Costo (sin IVA)
              <span class="disabled-field">(Se calcula automáticamente)</span>
            </label>
            <input 
              type="number" 
              id="precioCostoSinIva" 
              bind:value={producto.PrecioCostoSinIva} 
              disabled
            />
          </div>
          
          <div class="form-group">
            <label for="porcentajeIva1">
              Porcentaje IVA 1 <span class="required">*</span>
            </label>
            <input 
              type="number" 
              id="porcentajeIva1" 
              bind:value={producto.PorcentajeIva1} 
              placeholder="21"
              min="0"
              max="100"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="porcentajeIva2">
              Porcentaje IVA 2
              <span class="disabled-field">(Se genera automáticamente)</span>
            </label>
            <input 
              type="number" 
              id="porcentajeIva2" 
              bind:value={producto.PorcentajeIva2} 
              disabled
            />
          </div>
          
          <div class="form-group">
            <label for="precioLista1">
              Porcentaje Lista 1
            </label>
            <input 
              type="number" 
              id="precioLista1" 
              bind:value={producto.PrecioLista1} 
              placeholder="0"
              min="0"
              step="1"
            />
          </div>
          
          <div class="form-group">
            <label for="precioLista2">
              Porcentaje Lista 2
            </label>
            <input 
              type="number" 
              id="precioLista2" 
              bind:value={producto.PrecioLista2} 
              placeholder="0"
              min="0"
              step="1"
            />
          </div>
          
          <div class="form-group">
            <label for="precioLista3">
              Porcentaje Lista 3
            </label>
            <input 
              type="number" 
              id="precioLista3" 
              bind:value={producto.PrecioLista3} 
              placeholder="0"
              min="0"
              step="1"
            />
          </div>
          
          <div class="form-group">
            <label for="precioLista4">
              Porcentaje Lista 4
            </label>
            <input 
              type="number" 
              id="precioLista4" 
              bind:value={producto.PrecioLista4} 
              placeholder="0"
              min="0"
              step="1"
            />
          </div>
          
          <div class="form-group">
            <label for="precioLista5">
              Porcentaje Lista 5
            </label>
            <input 
              type="number" 
              id="precioLista5" 
              bind:value={producto.PrecioLista5} 
              placeholder="0"
              min="0"
              step="1"
            />
          </div>
          
          <div class="form-group">
            <label for="porcentajeVendedor">
              Porcentaje Vendedor
              <span class="disabled-field">(Se genera automáticamente)</span>
            </label>
            <input 
              type="number" 
              id="porcentajeVendedor" 
              bind:value={producto.PorcentajeVendedor} 
              disabled
            />
          </div>
        </div>
      {/if}
      
      <!-- Botones de navegación -->
      <div class="form-navigation">
        {#if currentStep > 1}
          <button class="btn-secondary" on:click={prevStep}>Anterior</button>
        {:else}
          <button class="btn-secondary" on:click={volverListado}>Cancelar</button>
        {/if}
        
        {#if currentStep < totalSteps}
          <button 
            class="btn-primary" 
            on:click={nextStep}
            disabled={!validateStep(currentStep)}
          >
            Siguiente
          </button>
        {:else}
          <button 
            class="btn-primary" 
            on:click={guardarProducto}
            disabled={!validateStep(currentStep)}
          >
            Guardar
          </button>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .nuevo-producto-container {
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
  
  .progress-bar {
    margin-bottom: 24px;
  }
  
  .progress-steps {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .step-indicator {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    color: var(--tg-theme-hint-color, #777);
    font-weight: 500;
    border: none;
    cursor: pointer;
  }
  
  .step-indicator.active {
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
  }
  
  .step-indicator.completed {
    background-color: #4caf50;
    color: white;
  }
  
  .step-line {
    flex: 1;
    height: 2px;
    background-color: var(--tg-theme-hint-color, #ccc);
    margin: 0 8px;
  }
  
  .step-line.completed {
    background-color: #4caf50;
  }
  
  .form-container {
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .form-step h2 {
    font-size: 1.4rem;
    margin-top: 0;
    margin-bottom: 20px;
    color: var(--tg-theme-text-color, #000);
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    font-size: 0.9rem;
    color: var(--tg-theme-text-color, #000);
  }
  
  .required {
    color: #f44336;
  }
  
  .disabled-field {
    font-size: 0.8rem;
    color: var(--tg-theme-hint-color, #777);
    font-weight: normal;
    margin-left: 6px;
  }
  
  .form-group input, .form-group select {
    width: 100%;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid var(--tg-theme-hint-color, #ccc);
    background-color: var(--tg-theme-bg-color, #fff);
    color: var(--tg-theme-text-color, #000);
    font-size: 1rem;
  }
  
  .form-group input:disabled, .form-group select:disabled {
    background-color: #f0f0f0;
    color: var(--tg-theme-hint-color, #777);
    cursor: not-allowed;
  }
  
  .form-navigation {
    display: flex;
    justify-content: space-between;
    margin-top: 24px;
  }
  
  .btn-primary, .btn-secondary {
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
  }
  
  .btn-primary {
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
  }
  
  .btn-secondary {
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    color: var(--tg-theme-text-color, #000);
    border: 1px solid var(--tg-theme-hint-color, #ccc);
  }
  
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .loading-state, .error-state, .success-state {
    padding: 24px;
    text-align: center;
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
  
  .error-state {
    color: #f44336;
  }
  
  .success-state {
    color: #4caf50;
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
</style> 