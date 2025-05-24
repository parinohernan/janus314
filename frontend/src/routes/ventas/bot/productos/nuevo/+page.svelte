<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import '../../../../../app.css';
  import { writable } from 'svelte/store';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { ProveedorService, type Proveedor, type ProveedorCompleto } from '$lib/services/ProveedorService';
  import { RubroService, type Rubro, type RubroCompleto } from '$lib/services/RubroService';
  import { CodigoPostalService, type CodigoPostal } from '$lib/services/CodigoPostalService';
  import Breadcrumbs from '../../components/Breadcrumbs/index.svelte';

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
  let codigosPostales: CodigoPostal[] = [];

  // Estado del formulario
  let loading = false;
  let error = '';
  let success = false;

  // Modal de nuevo proveedor
  let mostrarModalProveedor = false;
  let nuevoProveedor: ProveedorCompleto = {
    Codigo: '',
    Descripcion: '',
    Cuit: '',
    Calle: '',
    Numero: '',
    Piso: '',
    Departamento: '',
    CodigoPostal: '',
    Telefono: '',
    Mail: ''
  };
  let loadingProveedor = false;
  let errorProveedor = '';
  let successProveedor = false;

  // Modal de nuevo rubro
  let mostrarModalRubro = false;
  let nuevoRubro: RubroCompleto = {
    Codigo: '',
    Descripcion: '',
    RubroGrupoCodigo: ''
  };
  let loadingRubro = false;
  let errorRubro = '';
  let successRubro = false;

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
      
      // Cargar códigos postales
      codigosPostales = await CodigoPostalService.obtenerCodigosPostales();
      
      // Mostrar resultado en consola
      console.log('Proveedores cargados:', proveedores.length);
      console.log('Rubros cargados:', rubros.length);
      console.log('Códigos postales cargados:', codigosPostales.length);
      
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
        ProveedorCodigo: producto.Proveedor,
        RubroCodigo: producto.Rubro,
        ExistenciaActual: Number(producto.ExistenciaActual),
        ExistenciaMinima: Number(producto.ExistenciaMinima),
        ExistenciaMaxima: Number(producto.ExistenciaMaxima),
        Peso: Number(producto.Peso),
        UnidadVenta: producto.UnidadVenta || 'u',
        PrecioCosto: Number(producto.PrecioCostoSinIva),
        PrecioCostoSinIva: Number(producto.PrecioCostoSinIva),
        PrecioCostoConIva: Number(producto.PrecioCostoConIva),
        PrecioCostoMasImp: Number(producto.PrecioCostoConIva),
        PorcentajeIVA1: Number(producto.PorcentajeIva1),
        PorcentajeIva1: Number(producto.PorcentajeIva1),
        PorcentajeIVA2: Number(producto.PorcentajeIva2 || 0),
        PorcentajeIva2: Number(producto.PorcentajeIva2 || 0),
        PrecioLista1: Number(producto.PrecioLista1),
        PrecioLista2: Number(producto.PrecioLista2),
        PrecioLista3: Number(producto.PrecioLista3),
        PrecioLista4: Number(producto.PrecioLista4),
        PrecioLista5: Number(producto.PrecioLista5),
        PorcentajeVendedor: Number(producto.PorcentajeVendedor)
      };

      // Agregar logs de depuración para ver los valores
      console.log("Producto original:", {
        ExistenciaMinima: producto.ExistenciaMinima,
        ExistenciaMaxima: producto.ExistenciaMaxima,
        UnidadVenta: producto.UnidadVenta,
        PrecioCostoSinIva: producto.PrecioCostoSinIva
      });
      console.log("Producto preparado para enviar:", {
        ExistenciaMinima: productoParaEnviar.ExistenciaMinima,
        ExistenciaMaxima: productoParaEnviar.ExistenciaMaxima,
        UnidadVenta: productoParaEnviar.UnidadVenta,
        PrecioCostoSinIva: productoParaEnviar.PrecioCostoSinIva,
        PrecioCosto: productoParaEnviar.PrecioCosto
      });

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

  // Funciones para el modal de nuevo proveedor
  function abrirModalProveedor() {
    nuevoProveedor = {
      Codigo: '',
      Descripcion: '',
      Cuit: '',
      Calle: '',
      Numero: '',
      Piso: '',
      Departamento: '',
      CodigoPostal: '',
      Telefono: '',
      Mail: ''
    };
    errorProveedor = '';
    successProveedor = false;
    mostrarModalProveedor = true;
  }

  function cerrarModalProveedor() {
    mostrarModalProveedor = false;
  }

  // Manejar tecla Escape para cerrar el modal de proveedor
  function handleKeydownProveedor(event: KeyboardEvent) {
    if (event.key === 'Escape' && mostrarModalProveedor) {
      cerrarModalProveedor();
    }
  }

  async function guardarProveedor() {
    // Validación básica
    if (!nuevoProveedor.Descripcion) {
      errorProveedor = 'La descripción del proveedor es obligatoria';
      return;
    }

    try {
      loadingProveedor = true;
      errorProveedor = '';

      // Generar código automáticamente si está vacío
      if (!nuevoProveedor.Codigo) {
        // Usar timestamp como código único
        nuevoProveedor.Codigo = Date.now().toString().substring(7, 13);
      }

      // Guardar nuevo proveedor
      const proveedorGuardado = await ProveedorService.crearProveedor(nuevoProveedor);
      
      // Actualizar la lista de proveedores
      proveedores = [...proveedores, {
        Codigo: proveedorGuardado.Codigo,
        Descripcion: proveedorGuardado.Descripcion
      }];
      
      // Seleccionar el nuevo proveedor en el formulario
      producto.Proveedor = proveedorGuardado.Codigo;
      
      // Mostrar mensaje de éxito
      successProveedor = true;
      
      // Cerrar el modal después de 2 segundos
      setTimeout(() => {
        cerrarModalProveedor();
      }, 2000);
      
    } catch (err) {
      console.error('Error al guardar proveedor:', err);
      if (err instanceof Error) {
        errorProveedor = err.message;
      } else {
        errorProveedor = 'Error al guardar el proveedor';
      }
    } finally {
      loadingProveedor = false;
    }
  }

  // Funciones para el modal de nuevo rubro
  function abrirModalRubro() {
    nuevoRubro = {
      Codigo: '',
      Descripcion: '',
      RubroGrupoCodigo: ''
    };
    errorRubro = '';
    successRubro = false;
    mostrarModalRubro = true;
  }

  function cerrarModalRubro() {
    mostrarModalRubro = false;
  }
  
  // Manejar tecla Escape para cerrar el modal de rubro
  function handleKeydownRubro(event: KeyboardEvent) {
    if (event.key === 'Escape' && mostrarModalRubro) {
      cerrarModalRubro();
    }
  }

  async function guardarRubro() {
    // Validación básica
    if (!nuevoRubro.Descripcion) {
      errorRubro = 'La descripción del rubro es obligatoria';
      return;
    }

    try {
      loadingRubro = true;
      errorRubro = '';

      // Generar código automáticamente si está vacío
      if (!nuevoRubro.Codigo) {
        // Usar timestamp como código único (máximo 4 caracteres)
        nuevoRubro.Codigo = Date.now().toString().substring(9, 13);
      }

      // Guardar nuevo rubro
      const rubroGuardado = await RubroService.crearRubro(nuevoRubro);
      
      // Actualizar la lista de rubros
      rubros = [...rubros, {
        Codigo: rubroGuardado.Codigo,
        Descripcion: rubroGuardado.Descripcion
      }];
      
      // Seleccionar el nuevo rubro en el formulario
      producto.Rubro = rubroGuardado.Codigo;
      
      // Mostrar mensaje de éxito
      successRubro = true;
      
      // Cerrar el modal después de 2 segundos
      setTimeout(() => {
        cerrarModalRubro();
      }, 2000);
      
    } catch (err) {
      console.error('Error al guardar rubro:', err);
      if (err instanceof Error) {
        errorRubro = err.message;
      } else {
        errorRubro = 'Error al guardar el rubro';
      }
    } finally {
      loadingRubro = false;
    }
  }

  // Cargar datos iniciales
  onMount(() => {
    cargarDatosSelects();
  });
</script>

<div class="nuevo-producto-container">
  <!-- Breadcrumbs -->
  <Breadcrumbs 
    customPath={[
      { label: 'Home', path: '/ventas/bot' },
      { label: 'Productos', path: '/ventas/bot/productos' },
      { label: 'Nuevo Producto', path: '/ventas/bot/productos/nuevo' }
    ]}
  />

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
            <div class="field-with-action">
              <label for="proveedor">
                Proveedor <span class="required">*</span>
              </label>
              <div class="select-with-button">
                <select id="proveedor" bind:value={producto.Proveedor} required>
                  <option value="">Seleccione un proveedor</option>
                  {#each proveedores as proveedor}
                    <option value={proveedor.Codigo}>{proveedor.Descripcion}</option>
                  {/each}
                </select>
                <button 
                  class="btn-add" 
                  on:click={abrirModalProveedor} 
                  title="Agregar nuevo proveedor"
                  type="button"
                >
                  <span>+</span>
                </button>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <div class="field-with-action">
              <label for="rubro">
                Rubro <span class="required">*</span>
              </label>
              <div class="select-with-button">
                <select id="rubro" bind:value={producto.Rubro} required>
                  <option value="">Seleccione un rubro</option>
                  {#each rubros as rubro}
                    <option value={rubro.Codigo}>{rubro.Descripcion}</option>
                  {/each}
                </select>
                <button 
                  class="btn-add" 
                  on:click={abrirModalRubro} 
                  title="Agregar nuevo rubro"
                  type="button"
                >
                  <span>+</span>
                </button>
              </div>
            </div>
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
            <select 
              id="unidadVenta" 
              bind:value={producto.UnidadVenta}
            >
              <option value="u">Unidad (u)</option>
              <option value="kg">Kilogramo (kg)</option>
              <option value="lt">Litro (lt)</option>
              <option value="mt">Metro (mt)</option>
            </select>
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
  
  <!-- Modal para agregar nuevo proveedor -->
  {#if mostrarModalProveedor}
    <div 
      class="modal-overlay" 
      on:click|self={cerrarModalProveedor}
      on:keydown={handleKeydownProveedor}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo-proveedor"
      tabindex="-1"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="modal-titulo-proveedor">Nuevo Proveedor</h3>
          <button class="btn-close" on:click={cerrarModalProveedor} aria-label="Cerrar modal">×</button>
        </div>
        
        <div class="modal-body">
          {#if loadingProveedor}
            <div class="loading-state">
              <div class="spinner"></div>
              <span>Guardando proveedor...</span>
            </div>
          {:else if errorProveedor}
            <div class="error-state">
              <span>{errorProveedor}</span>
              <button on:click={() => errorProveedor = ''}>Aceptar</button>
            </div>
          {:else if successProveedor}
            <div class="success-state">
              <span>¡Proveedor creado correctamente!</span>
            </div>
          {:else}
            <form on:submit|preventDefault={guardarProveedor}>
              <div class="form-section">
                <h4>Datos principales</h4>
                
                <div class="form-group">
                  <label for="proveedorDescripcion">
                    Descripción <span class="required">*</span>
                  </label>
                  <input 
                    type="text" 
                    id="proveedorDescripcion" 
                    bind:value={nuevoProveedor.Descripcion} 
                    placeholder="Nombre del proveedor"
                    required
                  />
                </div>
                
                <div class="form-group">
                  <label for="proveedorCuit">CUIT</label>
                  <input 
                    type="text" 
                    id="proveedorCuit" 
                    bind:value={nuevoProveedor.Cuit} 
                    placeholder="CUIT sin guiones"
                  />
                </div>
              </div>
              
              <div class="form-section">
                <h4>Dirección</h4>
                
                <div class="form-group">
                  <label for="proveedorCalle">Calle</label>
                  <input 
                    type="text" 
                    id="proveedorCalle" 
                    bind:value={nuevoProveedor.Calle} 
                    placeholder="Nombre de la calle"
                  />
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="proveedorNumero">Número</label>
                    <input 
                      type="text" 
                      id="proveedorNumero" 
                      bind:value={nuevoProveedor.Numero} 
                      placeholder="Número"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label for="proveedorPiso">Piso</label>
                    <input 
                      type="text" 
                      id="proveedorPiso" 
                      bind:value={nuevoProveedor.Piso} 
                      placeholder="Piso"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label for="proveedorDepartamento">Departamento</label>
                    <input 
                      type="text" 
                      id="proveedorDepartamento" 
                      bind:value={nuevoProveedor.Departamento} 
                      placeholder="Depto."
                    />
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="proveedorCodigoPostal">Ciudad (Código Postal)</label>
                  <select 
                    id="proveedorCodigoPostal" 
                    bind:value={nuevoProveedor.CodigoPostal}
                  >
                    <option value="">Seleccione una localidad</option>
                    {#each codigosPostales as cp}
                      <option value={cp.Codigo}>
                        {cp.Descripcion} {cp.ProvinciaRelacion ? `(${cp.ProvinciaRelacion.Descripcion})` : ''}
                      </option>
                    {/each}
                  </select>
                </div>
              </div>
              
              <div class="form-section">
                <h4>Contacto</h4>
                
                <div class="form-group">
                  <label for="proveedorTelefono">Teléfono</label>
                  <input 
                    type="tel" 
                    id="proveedorTelefono" 
                    bind:value={nuevoProveedor.Telefono} 
                    placeholder="Número de teléfono"
                  />
                </div>
                
                <div class="form-group">
                  <label for="proveedorEmail">Email</label>
                  <input 
                    type="email" 
                    id="proveedorEmail" 
                    bind:value={nuevoProveedor.Mail} 
                    placeholder="Correo electrónico"
                  />
                </div>
              </div>
              
              <div class="modal-actions">
                <button type="button" class="btn-secondary" on:click={cerrarModalProveedor}>
                  Cancelar
                </button>
                <button type="submit" class="btn-primary">
                  Guardar Proveedor
                </button>
              </div>
            </form>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Modal para agregar nuevo rubro -->
  {#if mostrarModalRubro}
    <div 
      class="modal-overlay" 
      on:click|self={cerrarModalRubro}
      on:keydown={handleKeydownRubro}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo-rubro"
      tabindex="-1"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="modal-titulo-rubro">Nuevo Rubro</h3>
          <button class="btn-close" on:click={cerrarModalRubro} aria-label="Cerrar modal">×</button>
        </div>
        
        <div class="modal-body">
          {#if loadingRubro}
            <div class="loading-state">
              <div class="spinner"></div>
              <span>Guardando rubro...</span>
            </div>
          {:else if errorRubro}
            <div class="error-state">
              <span>{errorRubro}</span>
              <button on:click={() => errorRubro = ''}>Aceptar</button>
            </div>
          {:else if successRubro}
            <div class="success-state">
              <span>¡Rubro creado correctamente!</span>
            </div>
          {:else}
            <form on:submit|preventDefault={guardarRubro}>
              <div class="form-section">
                <h4>Datos del Rubro</h4>
                
                <div class="form-group">
                  <label for="rubroDescripcion">
                    Descripción <span class="required">*</span>
                  </label>
                  <input 
                    type="text" 
                    id="rubroDescripcion" 
                    bind:value={nuevoRubro.Descripcion} 
                    placeholder="Nombre del rubro"
                    required
                  />
                </div>
                
                <div class="form-group">
                  <label for="rubroGrupo">
                    Grupo de Rubro
                    <span class="disabled-field">(No disponible por el momento)</span>
                  </label>
                  <input 
                    type="text" 
                    id="rubroGrupo" 
                    bind:value={nuevoRubro.RubroGrupoCodigo} 
                    placeholder="Grupo"
                    disabled
                  />
                </div>
              </div>
              
              <div class="modal-actions">
                <button type="button" class="btn-secondary" on:click={cerrarModalRubro}>
                  Cancelar
                </button>
                <button type="submit" class="btn-primary">
                  Guardar Rubro
                </button>
              </div>
            </form>
          {/if}
        </div>
      </div>
    </div>
  {/if}
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
  
  /* Estilos para el select con botón */
  .field-with-action {
    width: 100%;
  }
  
  .select-with-button {
    display: flex;
    gap: 8px;
  }
  
  .select-with-button select {
    flex: 1;
  }
  
  .btn-add {
    width: 40px;
    height: 44px;
    border-radius: 6px;
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
    border: none;
    font-size: 1.5rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  
  /* Estilos para el modal */
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
  
  .form-section {
    margin-bottom: 24px;
  }
  
  .form-section h4 {
    font-size: 1.1rem;
    margin: 0 0 16px 0;
    color: var(--tg-theme-text-color, #000);
    padding-bottom: 8px;
    border-bottom: 1px solid var(--tg-theme-hint-color, #eee);
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
  }
  
  @media (max-width: 600px) {
    .form-row {
      grid-template-columns: 1fr 1fr;
    }
  }
  
  @media (max-width: 400px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
  }
</style> 