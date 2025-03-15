<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { debounce } from 'lodash-es';
  
  // Tipo de movimiento (ingreso o egreso)
  const tipoMovimiento = $page.params.tipo === 'ingreso' ? 'ING' : 'EGR';
  
  // Interfaces
  interface Articulo {
    Codigo: string;
    Descripcion: string;
    PrecioCosto: number;
    Existencia: number;
  }
  
  interface MovimientoItem {
    CodigoArticulo: string;
    Descripcion: string;
    Cantidad: number;
    PrecioCosto: number;
    Existencia: number;
  }
  
  // Estado local
  let documento = {
    DocumentoTipo: 'MOV',
    DocumentoSucursal: '0001',
    DocumentoNumero: '',
    Fecha: new Date().toISOString().split('T')[0],
    MovimientoTipo: tipoMovimiento,
    Observacion: ''
  };
  
  let items: MovimientoItem[] = [];
  let loading = false;
  let error: string | null = null;
  let successMessage: string | null = null;
  
  // Estado para búsqueda de artículo
  let searchText = '';
  let searchResults: Articulo[] = [];
  let searchLoading = false;
  let searchError: string | null = null;
  
  // Campos temporales para nuevo artículo
  let nuevoArticulo = {
    codigo: '',
    cantidad: 1
  };
  
  // Buscar artículos por código o descripción
  const searchArticulos = async () => {
    if (!searchText.trim()) {
      searchResults = [];
      return;
    }
    
    try {
      searchLoading = true;
      searchError = null;
      
      const response = await fetch(`${PUBLIC_API_URL}/articulos?search=${encodeURIComponent(searchText)}&limit=10`);
      
      if (!response.ok) throw new Error('Error al buscar artículos');
      
      const data = await response.json();
      searchResults = data.items;
      
    } catch (err: unknown) {
      console.error('Error buscando artículos:', err);
      searchError = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      searchLoading = false;
    }
  };
  
  // Debounce para la búsqueda de artículos
  const debouncedSearch = debounce(searchArticulos, 300);
  
  // Seleccionar un artículo de los resultados de búsqueda
  const selectArticulo = (articulo: Articulo) => {
    // Verificar si ya existe en la lista
    const existeItem = items.find(item => item.CodigoArticulo === articulo.Codigo);
    
    if (existeItem) {
      error = `El artículo "${articulo.Descripcion}" ya está en la lista`;
      return;
    }
    
    // Agregar a la lista de items
    items = [...items, {
      CodigoArticulo: articulo.Codigo,
      Descripcion: articulo.Descripcion,
      Cantidad: 1,
      PrecioCosto: articulo.PrecioCosto,
      Existencia: articulo.Existencia
    }];
    
    // Limpiar búsqueda
    searchText = '';
    searchResults = [];
    
    // Limpiar mensaje de error si existe
    error = null;
  };
  
  // Agregar artículo por código
  const addArticulo = async () => {
    if (!nuevoArticulo.codigo) {
      error = 'Debe ingresar un código de artículo';
      return;
    }
    
    // Verificar si ya existe en la lista
    const existeItem = items.find(item => item.CodigoArticulo === nuevoArticulo.codigo);
    
    if (existeItem) {
      error = `El artículo con código "${nuevoArticulo.codigo}" ya está en la lista`;
      return;
    }
    
    try {
      loading = true;
      error = null;
      
      // Buscar el artículo por código
      const response = await fetch(`${PUBLIC_API_URL}/articulos/${nuevoArticulo.codigo}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`No se encontró un artículo con el código "${nuevoArticulo.codigo}"`);
        }
        throw new Error('Error al buscar el artículo');
      }
      
      const articulo = await response.json();
      
      // Agregar a la lista de items
      items = [...items, {
        CodigoArticulo: articulo.Codigo,
        Descripcion: articulo.Descripcion,
        Cantidad: nuevoArticulo.cantidad,
        PrecioCosto: articulo.PrecioCosto,
        Existencia: articulo.Existencia
      }];
      
      // Limpiar campos
      nuevoArticulo.codigo = '';
      nuevoArticulo.cantidad = 1;
      
    } catch (err: unknown) {
      console.error('Error agregando artículo:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };
  
  // Actualizar cantidad de un item
  const updateCantidad = (index: number, cantidad: number) => {
    if (cantidad <= 0) {
      error = 'La cantidad debe ser mayor a 0';
      return;
    }
    
    const updatedItems = [...items];
    updatedItems[index].Cantidad = cantidad;
    items = updatedItems;
    error = null;
  };
  
  // Eliminar un item
  const removeItem = (index: number) => {
    items = items.filter((_, i) => i !== index);
  };
  
  // Validaciones para egreso
  const validarEgreso = () => {
    for (const item of items) {
      if (item.Cantidad > item.Existencia) {
        error = `No hay suficiente stock del artículo "${item.Descripcion}". Disponible: ${item.Existencia}`;
        return false;
      }
    }
    return true;
  };
  
  // Validar el formulario completo
  const validarFormulario = () => {
    if (!documento.DocumentoNumero) {
      error = 'Debe ingresar un número de documento';
      return false;
    }
    
    if (items.length === 0) {
      error = 'Debe agregar al menos un artículo';
      return false;
    }
    
    if (tipoMovimiento === 'EGR' && !validarEgreso()) {
      return false;
    }
    
    return true;
  };
  
  // Guardar el movimiento
  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }
    
    try {
      loading = true;
      error = null;
      
      // Preparar datos para enviar
      const movimientoData = {
        encabezado: {
          DocumentoTipo: documento.DocumentoTipo,
          DocumentoSucursal: documento.DocumentoSucursal,
          DocumentoNumero: documento.DocumentoNumero,
          Fecha: documento.Fecha,
          MovimientoTipo: documento.MovimientoTipo,
          Observacion: documento.Observacion
        },
        items: items.map(item => ({
          CodigoArticulo: item.CodigoArticulo,
          Cantidad: item.Cantidad
        }))
      };
      
      // Enviar al servidor
      const response = await fetch(`${PUBLIC_API_URL}/movimientos-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(movimientoData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar el movimiento');
      }
      
      const result = await response.json();
      
      // Mostrar mensaje de éxito
      successMessage = `Movimiento creado correctamente. Documento: ${documento.DocumentoTipo}-${documento.DocumentoSucursal}-${documento.DocumentoNumero}`;
      
      // Reiniciar formulario
      items = [];
      documento.DocumentoNumero = '';
      documento.Observacion = '';
      documento.Fecha = new Date().toISOString().split('T')[0];
      nuevoArticulo.codigo = '';
      nuevoArticulo.cantidad = 1;
      
      // Redirigir después de un breve retraso
      setTimeout(() => {
        goto('/productos/stock');
      }, 2000);
      
    } catch (err: unknown) {
      console.error('Error guardando movimiento:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };
  
  // Al cargar, si estamos en un movimiento de tipo inválido, redirigir
  onMount(() => {
    if ($page.params.tipo !== 'ingreso' && $page.params.tipo !== 'egreso') {
      goto('/productos/stock');
    }
  });
  
  // Formatear el tipo de movimiento para mostrar
  const formatMovimientoTipo = (tipo: string | null): string => {
    if (!tipo) return 'Desconocido';
    return tipo === 'ING' ? 'Ingreso' : 'Egreso';
  };
</script>

<svelte:head>
  <title>Nuevo {tipoMovimiento === 'ING' ? 'Ingreso' : 'Egreso'} de Stock</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="bg-white p-6 rounded-lg shadow-md">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">
        Nuevo {tipoMovimiento === 'ING' ? 'Ingreso' : 'Egreso'} de Stock
      </h1>
      <Button 
        variant="secondary" 
        on:click={() => goto('/productos/stock')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        Volver
      </Button>
    </div>
    
    {#if error}
      <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
        {error}
      </div>
    {/if}
    
    {#if successMessage}
      <div class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
        {successMessage}
      </div>
    {/if}
    
    <form on:submit={handleSubmit}>
      <!-- Datos del encabezado -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <!-- Tipo de documento -->
        <div>
          <label for="documentoTipo" class="block text-sm font-medium text-gray-700 mb-1">Tipo de documento</label>
          <input 
            id="documentoTipo"
            type="text" 
            bind:value={documento.DocumentoTipo}
            readonly
            class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
          />
        </div>
        
        <!-- Sucursal -->
        <div>
          <label for="documentoSucursal" class="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
          <input 
            id="documentoSucursal"
            type="text" 
            bind:value={documento.DocumentoSucursal}
            readonly
            class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
          />
        </div>
        
        <!-- Número de documento -->
        <div>
          <label for="documentoNumero" class="block text-sm font-medium text-gray-700 mb-1">Número de documento</label>
          <input 
            id="documentoNumero"
            type="text" 
            bind:value={documento.DocumentoNumero}
            placeholder="Ingrese número de documento"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <!-- Fecha -->
        <div>
          <label for="fecha" class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <input 
            id="fecha"
            type="date" 
            bind:value={documento.Fecha}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <!-- Tipo de movimiento -->
        <div>
          <label for="movimientoTipo" class="block text-sm font-medium text-gray-700 mb-1">Tipo de movimiento</label>
          <input 
            id="movimientoTipo"
            type="text" 
            value={tipoMovimiento === 'ING' ? 'Ingreso' : 'Egreso'}
            readonly
            class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
          />
        </div>
        
        <!-- Observación -->
        <div class="md:col-span-2">
          <label for="observacion" class="block text-sm font-medium text-gray-700 mb-1">Observación</label>
          <textarea 
            id="observacion"
            bind:value={documento.Observacion}
            placeholder="Ingrese una observación o descripción general"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
          ></textarea>
        </div>
      </div>
      
      <!-- Agregar artículos -->
      <div class="border-t border-b border-gray-200 py-4 mb-6">
        <h2 class="text-lg font-semibold mb-4">Artículos</h2>
        
        <!-- Buscar artículos -->
        <div class="mb-4">
          <label for="searchText" class="block text-sm font-medium text-gray-700 mb-1">Buscar artículo</label>
          <div class="flex space-x-2">
            <div class="flex-grow">
              <input 
                id="searchText"
                type="text" 
                bind:value={searchText}
                on:input={() => debouncedSearch()}
                placeholder="Ingrese código o descripción (mínimo 3 caracteres)"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button 
              type="button"
              variant="primary"
              on:click={searchArticulos}
              disabled={searchText.length < 3 || searchLoading}
            >
              Buscar
            </Button>
          </div>
          
          {#if searchLoading}
            <div class="text-center py-2">
              <div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span class="ml-2 text-sm text-gray-500">Buscando...</span>
            </div>
          {/if}
          
          {#if searchError}
            <div class="text-sm text-red-600 mt-1">{searchError}</div>
          {/if}
          
          {#if searchResults.length > 0}
            <div class="mt-2 border border-gray-200 rounded-md overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each searchResults as articulo (articulo.Codigo)}
                    <tr class="hover:bg-gray-50">
                      <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{articulo.Codigo}</td>
                      <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{articulo.Descripcion}</td>
                      <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{articulo.Existencia}</td>
                      <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${articulo.PrecioCosto.toFixed(2)}</td>
                      <td class="px-3 py-2 whitespace-nowrap text-center">
                        <button 
                          type="button"
                          class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                          on:click={() => selectArticulo(articulo)}
                        >
                          Agregar
                        </button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
        
        <!-- Agregar artículo por código -->
        <div class="mb-4">
          <label for="nuevoCodigo" class="block text-sm font-medium text-gray-700 mb-1">Agregar artículo por código</label>
          <div class="flex space-x-2">
            <div class="flex-grow md:w-2/3">
              <input 
                id="nuevoCodigo"
                type="text" 
                bind:value={nuevoArticulo.codigo}
                placeholder="Código del artículo"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="w-24">
              <label for="nuevaCantidad" class="sr-only">Cantidad</label>
              <input 
                id="nuevaCantidad"
                type="number" 
                bind:value={nuevoArticulo.cantidad}
                min="1"
                step="any"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button 
              type="button"
              variant="primary"
              on:click={addArticulo}
              disabled={!nuevoArticulo.codigo || loading}
            >
              Agregar
            </Button>
          </div>
        </div>
        
        <!-- Lista de artículos seleccionados -->
        {#if items.length > 0}
          <div class="mt-4 border border-gray-200 rounded-md overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each items as item, index (item.CodigoArticulo)}
                  <tr class="hover:bg-gray-50">
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.CodigoArticulo}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.Descripcion}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {item.Existencia}
                      {#if tipoMovimiento === 'EGR' && item.Cantidad > item.Existencia}
                        <span class="text-red-600 text-xs ml-1">(Insuficiente)</span>
                      {/if}
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      <input 
                        type="number" 
                        value={item.Cantidad}
                        on:change={(e) => updateCantidad(index, parseFloat(e.currentTarget.value))}
                        min="0.01"
                        step="any"
                        class="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap text-center">
                      <button 
                        type="button"
                        class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                        on:click={() => removeItem(index)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <div class="bg-gray-50 border border-gray-200 rounded-md p-4 text-center text-gray-500">
            No hay artículos agregados
          </div>
        {/if}
      </div>
      
      <!-- Botones -->
      <div class="flex justify-end space-x-2">
        <Button 
          type="button"
          variant="secondary"
          on:click={() => goto('/productos/stock')}
        >
          Cancelar
        </Button>
        
        <Button 
          type="submit"
          variant="primary"
          disabled={loading}
        >
          {#if loading}
            <div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {/if}
          Guardar
        </Button>
      </div>
    </form>
  </div>
</div> 