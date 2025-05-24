<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import '../../../../../../app.css';
  import { ArticuloService } from '$lib/services/ArticuloService';
  import { ProveedorService, type Proveedor } from '$lib/services/ProveedorService';
  import { RubroService, type Rubro } from '$lib/services/RubroService';
  import type { Articulo } from '$lib/types';
  
  // Exportar las propiedades del componente
  export let data;

  // Datos del producto a editar
  let producto: any = data.articulo || {};
  let codigoProducto = producto.Codigo || '';

  // Paso actual del formulario
  let currentStep = 1;
  const totalSteps = 4;

  // Función para validar el formulario antes de cambiar de paso
  function validateStep(step: number): boolean {
    switch(step) {
      case 1:
        return !!producto.Descripcion; // Descripción es obligatoria
      case 2:
        return true; // No hay campos obligatorios en este paso
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

  // Listas de opciones para selects
  let proveedores: Proveedor[] = [];
  let rubros: Rubro[] = [];
  let familias = [];
  let subfamilias = [];

  // Estado del formulario
  let loading = false;
  let error = '';
  let success = false;

  // Asegurarse de que los campos necesarios para cálculos existen
  $: producto.PrecioCostoConIva = producto.PrecioCostoConIva || (producto.PrecioCosto ? producto.PrecioCosto * (1 + (producto.PorcentajeIva1 || 21) / 100) : 0);
  $: producto.PrecioCostoSinIva = producto.PrecioCostoSinIva || producto.PrecioCosto || 0;

  // Calcular precio de costo sin IVA cuando cambia el precio con IVA
  $: if (producto.PrecioCostoConIva > 0 && producto.PorcentajeIva1) {
    producto.PrecioCostoSinIva = calcularPrecioSinIva(producto.PrecioCostoConIva, producto.PorcentajeIva1);
    producto.PrecioCosto = producto.PrecioCostoSinIva;
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
      
    } catch (err) {
      console.error('Error al cargar datos para selects:', err);
      error = 'Error al cargar proveedores o rubros. Intente nuevamente.';
    } finally {
      loading = false;
    }
  }

  // Actualizar producto
  async function actualizarProducto() {
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
        PrecioCosto: Number(producto.PrecioCosto),
        PrecioCostoSinIva: Number(producto.PrecioCostoSinIva),
        PrecioCostoConIva: Number(producto.PrecioCostoConIva),
        Existencia: Number(producto.Existencia || 0),
        ExistenciaMinima: Number(producto.ExistenciaMinima || 0),
        ExistenciaMaxima: Number(producto.ExistenciaMaxima || 0),
        PorcentajeIva1: Number(producto.PorcentajeIva1),
        Lista1: Number(producto.Lista1 || 0),
        Lista2: Number(producto.Lista2 || 0),
        Lista3: Number(producto.Lista3 || 0),
        Lista4: Number(producto.Lista4 || 0),
        Lista5: Number(producto.Lista5 || 0),
        Activo: Number(producto.Activo || 1)
      };

      // Usar el servicio para actualizar el producto
      await ArticuloService.actualizarArticulo(codigoProducto, productoParaEnviar);
      
      success = true;
      
      // Redireccionar al listado después de 1.5 segundos
      setTimeout(() => {
        goto('/ventas/bot/productos');
      }, 1500);
      
    } catch (err) {
      console.error('Error al actualizar producto:', err);
      error = 'Error al actualizar el producto. Intente nuevamente.';
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

<div class="editar-producto-container">
  <!-- Header con título y botón de volver -->
  <header class="header">
    <div class="header-title">
      <h1>Editar Producto</h1>
      <div class="product-code">Código: {producto.Codigo}</div>
    </div>
    <div class="header-actions">
      <button class="btn-back" on:click={volverListado} aria-label="Volver al listado">
        <span class="icon">←</span> <span class="label">Volver</span>
      </button>
    </div>
  </header>
  
  <!-- Mensaje de éxito -->
  {#if success}
    <div class="success-message">
      <p>¡Producto actualizado con éxito!</p>
      <p>Redireccionando al listado...</p>
    </div>
  {:else}
    {#if loading && !error}
      <!-- Estado de carga -->
      <div class="loading-state">
        <div class="spinner"></div>
        <span>Procesando solicitud...</span>
      </div>
    {:else if error}
      <!-- Mensaje de error -->
      <div class="error-state">
        <span>{error}</span>
        <button on:click={() => error = ''}>Cerrar</button>
      </div>
    {/if}
    
    <!-- Indicador de pasos -->
    <div class="steps-indicator">
      <div class="steps-track">
        {#each Array(totalSteps) as _, i}
          <div class="step-dot {i + 1 <= currentStep ? 'active' : ''}"></div>
        {/each}
      </div>
      <div class="step-label">Paso {currentStep} de {totalSteps}</div>
    </div>
    
    <!-- Formulario de edición por pasos -->
    <div class="form-container">
      {#if currentStep === 1}
        <!-- Paso 1: Datos Básicos -->
        <div class="form-section">
          <h2>Datos Básicos</h2>
          
          <div class="form-group">
            <label for="descripcion">Descripción <span class="required">*</span></label>
            <input 
              type="text" 
              id="descripcion" 
              placeholder="Nombre del producto" 
              bind:value={producto.Descripcion}
              required
            />
          </div>
          
          <div class="form-group">
            <label for="codigo-barras">Código de Barras</label>
            <input 
              type="text" 
              id="codigo-barras" 
              placeholder="Código de barras" 
              bind:value={producto.CodigoBarras}
            />
          </div>
          
          <div class="form-group">
            <label for="activo">Estado</label>
            <select id="activo" bind:value={producto.Activo}>
              <option value={1}>Activo</option>
              <option value={0}>Inactivo</option>
            </select>
          </div>
        </div>
      {:else if currentStep === 2}
        <!-- Paso 2: Clasificación -->
        <div class="form-section">
          <h2>Clasificación</h2>
          
          <div class="form-group">
            <label for="proveedor">Proveedor</label>
            <select id="proveedor" bind:value={producto.ProveedorCodigo}>
              <option value="">Seleccionar proveedor</option>
              {#each proveedores as proveedor}
                <option value={proveedor.Codigo}>{proveedor.Descripcion}</option>
              {/each}
            </select>
          </div>
          
          <div class="form-group">
            <label for="rubro">Rubro</label>
            <select id="rubro" bind:value={producto.RubroCodigo}>
              <option value="">Seleccionar rubro</option>
              {#each rubros as rubro}
                <option value={rubro.Codigo}>{rubro.Descripcion}</option>
              {/each}
            </select>
          </div>
          
          <div class="form-group">
            <label for="ubicacion">Ubicación en depósito</label>
            <input 
              type="text" 
              id="ubicacion" 
              placeholder="Ubicación" 
              bind:value={producto.UbicacionDeposito}
            />
          </div>
        </div>
      {:else if currentStep === 3}
        <!-- Paso 3: Stock -->
        <div class="form-section">
          <h2>Existencias</h2>
          
          <div class="form-group">
            <label for="existencia">Existencia Actual</label>
            <input 
              type="number" 
              id="existencia" 
              bind:value={producto.Existencia}
              min="0"
              step="0.01"
            />
          </div>
          
          <div class="form-group">
            <label for="existencia-minima">Existencia Mínima</label>
            <input 
              type="number" 
              id="existencia-minima" 
              bind:value={producto.ExistenciaMinima}
              min="0"
              step="0.01"
            />
          </div>
          
          <div class="form-group">
            <label for="existencia-maxima">Existencia Máxima</label>
            <input 
              type="number" 
              id="existencia-maxima" 
              bind:value={producto.ExistenciaMaxima}
              min="0"
              step="0.01"
            />
          </div>
          
          <div class="form-group">
            <label for="unidad-venta">Unidad de Venta</label>
            <select id="unidad-venta" bind:value={producto.UnidadVenta}>
              <option value="u">Unidad</option>
              <option value="kg">Kilogramo</option>
              <option value="lt">Litro</option>
              <option value="mt">Metro</option>
            </select>
          </div>
        </div>
      {:else if currentStep === 4}
        <!-- Paso 4: Precios -->
        <div class="form-section">
          <h2>Precios</h2>
          
          <div class="form-group">
            <label for="precio-costo">Precio de Costo (con IVA)</label>
            <input 
              type="number" 
              id="precio-costo" 
              bind:value={producto.PrecioCostoConIva}
              min="0"
              step="0.01"
            />
          </div>
          
          <div class="form-group">
            <label for="porcentaje-iva">Porcentaje IVA <span class="required">*</span></label>
            <select id="porcentaje-iva" bind:value={producto.PorcentajeIva1} required>
              <option value="21">21%</option>
              <option value="10.5">10.5%</option>
              <option value="27">27%</option>
              <option value="0">0% (Exento)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="precio-sin-iva">Precio de Costo (sin IVA)</label>
            <input 
              type="number" 
              id="precio-sin-iva" 
              bind:value={producto.PrecioCostoSinIva}
              min="0"
              step="0.01"
              readonly
            />
          </div>
          
          <div class="form-group">
            <label for="lista1">Lista 1 (%)</label>
            <input 
              type="number" 
              id="lista1" 
              bind:value={producto.Lista1}
              min="0"
              step="0.01"
            />
          </div>
          
          <div class="form-group">
            <label for="lista2">Lista 2 (%)</label>
            <input 
              type="number" 
              id="lista2" 
              bind:value={producto.Lista2}
              min="0"
              step="0.01"
            />
          </div>
          
          <div class="form-group">
            <label for="lista3">Lista 3 (%)</label>
            <input 
              type="number" 
              id="lista3" 
              bind:value={producto.Lista3}
              min="0"
              step="0.01"
            />
          </div>
          
          <div class="form-group">
            <label for="lista4">Lista 4 (%)</label>
            <input 
              type="number" 
              id="lista4" 
              bind:value={producto.Lista4}
              min="0"
              step="0.01"
            />
          </div>
          
          <div class="form-group">
            <label for="lista5">Lista 5 (%)</label>
            <input 
              type="number" 
              id="lista5" 
              bind:value={producto.Lista5}
              min="0"
              step="0.01"
            />
          </div>
        </div>
      {/if}
      
      <!-- Botones de navegación -->
      <div class="form-buttons">
        {#if currentStep > 1}
          <button type="button" class="btn-prev" on:click={prevStep}>Anterior</button>
        {/if}
        
        {#if currentStep < totalSteps}
          <button type="button" class="btn-next" on:click={nextStep}>Siguiente</button>
        {:else}
          <button type="button" class="btn-submit" on:click={actualizarProducto}>Actualizar</button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .editar-producto-container {
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
  
  .header-title {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .header-title h1 {
    font-size: 1.8rem;
    margin: 0;
    color: var(--tg-theme-text-color, #000);
  }
  
  .product-code {
    font-size: 0.9rem;
    color: var(--tg-theme-hint-color, #777);
  }
  
  .header-actions {
    display: flex;
    gap: 10px;
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
  
  .loading-state, .error-state, .success-message {
    padding: 24px;
    text-align: center;
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 8px;
    margin-bottom: 16px;
  }
  
  .success-message {
    background-color: #dff2bf;
    color: #4F8A10;
  }
  
  .error-state {
    background-color: #ffdddd;
    color: #d8000c;
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
  
  .steps-indicator {
    margin-bottom: 24px;
  }
  
  .steps-track {
    display: flex;
    justify-content: space-between;
    position: relative;
    margin: 0 auto 12px;
    width: 80%;
    max-width: 300px;
  }
  
  .steps-track:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background-color: var(--tg-theme-hint-color, #ccc);
    z-index: 1;
    transform: translateY(-50%);
  }
  
  .step-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: var(--tg-theme-hint-color, #ccc);
    z-index: 2;
  }
  
  .step-dot.active {
    background-color: var(--tg-theme-button-color, #2481cc);
  }
  
  .step-label {
    text-align: center;
    font-size: 0.9rem;
    color: var(--tg-theme-hint-color, #777);
  }
  
  .form-container {
    margin-bottom: 24px;
  }
  
  .form-section {
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
  }
  
  .form-section h2 {
    font-size: 1.2rem;
    margin: 0 0 16px;
    color: var(--tg-theme-text-color, #000);
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  label {
    display: block;
    margin-bottom: 6px;
    font-size: 0.9rem;
    color: var(--tg-theme-text-color, #000);
  }
  
  .required {
    color: #d8000c;
  }
  
  input, select {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--tg-theme-hint-color, #ccc);
    background-color: var(--tg-theme-bg-color, #fff);
    color: var(--tg-theme-text-color, #000);
    font-size: 1rem;
  }
  
  input:focus, select:focus {
    outline: 2px solid var(--tg-theme-button-color, #2481cc);
    border-color: transparent;
  }
  
  .form-buttons {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }
  
  .btn-prev, .btn-next, .btn-submit {
    padding: 12px 16px;
    border-radius: 8px;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    flex: 1;
  }
  
  .btn-prev {
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    color: var(--tg-theme-text-color, #000);
  }
  
  .btn-next, .btn-submit {
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
  }
  
  /* Estilos para dispositivos pequeños */
  @media (max-width: 480px) {
    .form-buttons {
      flex-direction: column;
    }
    
    .btn-prev, .btn-next, .btn-submit {
      width: 100%;
    }
  }
</style> 