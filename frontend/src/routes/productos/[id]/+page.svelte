<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { PUBLIC_API_URL } from '$env/static/public';
  
  let isEditing = $page.params.id !== 'nuevo';
  
  interface Articulo {
    Codigo: string;
    Descripcion: string;
    Existencia: number;
    ExistenciaMinima: number;
    ExistenciaMaxima: number;
    PrecioCostoMasImp: number;
    PorcentajeIVA1: number;
    PorcentajeIVA2: number;
    PrecioCosto: number;
    UnidadVenta: string;
    Lista1: number;
    Lista2: number;
    Lista3: number;
    Lista4: number;
    Lista5: number;
    ProveedorCodigo: string;
    RubroCodigo: string;
    Peso: number;
    SiempreSeDescarga: number;
    Iva2SobreNeto: number;
    PorcentajeVendedor: number;
    DescuentoXCantidad: string;
    SeVende: number;
    Activo: number;
    EnviadoACentral: number;
    RequiereFrio: number;
    FamiliaCodigo: string;
    SubFamiliaCodigo: string;
    ProveedorArticuloCodigo: string;
    EsCompuesto: number;
    UV_OrdenDeEntrega: string;
    UbicacionDeposito: string;
    CodigoBarras: string;
    Proveedor?: {
      Descripcion: string;
    };
    Rubro?: {
      Descripcion: string;
    };
  }
  
  interface Proveedor {
    Codigo: string;
    Descripcion: string;
  }
  
  interface Rubro {
    Codigo: string;
    Descripcion: string;
  }
  
  let articulo: Articulo = {
    Codigo: '',
    Descripcion: '',
    Existencia: 0,
    ExistenciaMinima: 0,
    ExistenciaMaxima: 0,
    PrecioCostoMasImp: 0,
    PorcentajeIVA1: 21, // Valor predeterminado para Argentina
    PorcentajeIVA2: 0,
    PrecioCosto: 0,
    UnidadVenta: '',
    Lista1: 0,
    Lista2: 0,
    Lista3: 0,
    Lista4: 0,
    Lista5: 0,
    ProveedorCodigo: '',
    RubroCodigo: '',
    Peso: 0,
    SiempreSeDescarga: 0,
    Iva2SobreNeto: 0,
    PorcentajeVendedor: 0,
    DescuentoXCantidad: '',
    SeVende: 1,
    Activo: 1,
    EnviadoACentral: 0,
    RequiereFrio: 0,
    FamiliaCodigo: '',
    SubFamiliaCodigo: '',
    ProveedorArticuloCodigo: '',
    EsCompuesto: 0,
    UV_OrdenDeEntrega: '',
    UbicacionDeposito: '',
    CodigoBarras: ''
  };
  
  let proveedores: Proveedor[] = [];
  let rubros: Rubro[] = [];
  let loading = false;
  let error: string | null = null;
  let successMessage: string | null = null;
  
  // Cargar datos de proveedores y rubros para los selectores
  const loadProveedores = async (): Promise<void> => {
    try {
      const response = await fetch(`${PUBLIC_API_URL}/proveedores?limit=500`);
      if (!response.ok) throw new Error('Error al cargar los proveedores');
      
      const data = await response.json();
      proveedores = data.items;
    } catch (err: unknown) {
      console.error('Error cargando proveedores:', err);
      if (err instanceof Error) {
        error = 'Error al cargar los proveedores: ' + err.message;
      } else {
        error = 'Error desconocido al cargar los proveedores';
      }
    }
  };
  
  const loadRubros = async (): Promise<void> => {
    try {
      const response = await fetch(`${PUBLIC_API_URL}/rubros?limit=500`);
      if (!response.ok) throw new Error('Error al cargar los rubros');
      
      const data = await response.json();
      rubros = data.items;
    } catch (err: unknown) {
      console.error('Error cargando rubros:', err);
      if (err instanceof Error) {
        error = 'Error al cargar los rubros: ' + err.message;
      } else {
        error = 'Error desconocido al cargar los rubros';
      }
    }
  };
  
  onMount(async () => {
    try {
      loading = true;
      
      // Cargar selectores
      await Promise.all([loadProveedores(), loadRubros()]);
      
      // Si estamos editando, cargar datos del artículo
      if (isEditing) {
        const response = await fetch(`${PUBLIC_API_URL}/articulos/${$page.params.id}`);
        if (!response.ok) {
          throw new Error('Error al cargar el artículo');
        }
        
        articulo = await response.json();
      }
    } catch (err: unknown) {
      console.error('Error en carga inicial:', err);
      if (err instanceof Error) {
        error = err.message;
      } else {
        error = 'Error desconocido';
      }
    } finally {
      loading = false;
    }
  });
  
  // Calcular el precio costo a partir del precio con impuestos
  const calcularPrecioCosto = (): void => {
    if (articulo.PrecioCostoMasImp > 0 && articulo.PorcentajeIVA1 > 0) {
      const factor = 1 + (articulo.PorcentajeIVA1 / 100);
      articulo.PrecioCosto = Number((articulo.PrecioCostoMasImp / factor).toFixed(2));
    }
  };
  
  // Calcular el precio con impuestos a partir del precio costo
  const calcularPrecioCostoMasImp = (): void => {
    if (articulo.PrecioCosto > 0 && articulo.PorcentajeIVA1 > 0) {
      const factor = 1 + (articulo.PorcentajeIVA1 / 100);
      articulo.PrecioCostoMasImp = Number((articulo.PrecioCosto * factor).toFixed(2));
    }
  };
  
  // Actualizar listas de precios con márgenes predeterminados
  const actualizarListas = (): void => {
    if (articulo.PrecioCosto > 0) {
      // Ejemplo de márgenes: personalizar según necesidades
      articulo.Lista1 = Number((articulo.PrecioCosto * 1.3).toFixed(2)); // 30% margen
      articulo.Lista2 = Number((articulo.PrecioCosto * 1.4).toFixed(2)); // 40% margen
      articulo.Lista3 = Number((articulo.PrecioCosto * 1.5).toFixed(2)); // 50% margen
      articulo.Lista4 = Number((articulo.PrecioCosto * 1.6).toFixed(2)); // 60% margen
      articulo.Lista5 = Number((articulo.PrecioCosto * 1.7).toFixed(2)); // 70% margen
    }
  };
  
  // Manejar el envío del formulario
  const handleSubmit = async (event: Event): Promise<void> => {
    event.preventDefault();
    
    try {
      loading = true;
      error = null;
      successMessage = null;
      
      const url = isEditing 
        ? `${PUBLIC_API_URL}/articulos/${$page.params.id}` 
        : `${PUBLIC_API_URL}/articulos`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(articulo)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en la operación');
      }
      
      const data = await response.json();
      
      // Actualizar el artículo con los datos del servidor
      articulo = data;
      
      // Después de guardar exitosamente, mostrar mensaje y restablecer scroll
      successMessage = isEditing 
        ? `Producto "${articulo.Codigo}" actualizado correctamente` 
        : `Producto "${articulo.Codigo}" creado correctamente`;
      
      // Restablecer el scroll al inicio de la página
      window.scrollTo(0, 0);
      
      // Si es nuevo, redirigir y actualizar estado
      if (!isEditing) {
        goto(`/productos/${articulo.Codigo}`, { replaceState: true });
        isEditing = true;
      }
      
    } catch (err: unknown) {
      console.error('Error guardando artículo:', err);
      if (err instanceof Error) {
        error = err.message;
      } else {
        error = 'Error desconocido';
      }
    } finally {
      loading = false;
    }
  };
</script>

<svelte:head>
  <title>{isEditing ? 'Editar' : 'Nuevo'} Producto</title>
</svelte:head>

<div class="container mx-auto p-4">
  <div class="bg-white p-6 rounded-lg shadow-md">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">{isEditing ? 'Editar' : 'Nuevo'} Producto</h1>
      <Button 
        variant="secondary" 
        on:click={() => {
          goto('/productos', { 
            replaceState: false 
          });
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        Volver a productos
      </Button>
    </div>
    
    {#if error && isEditing}
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
      <div class="space-y-6">
        <!-- Datos principales - Obligatorios -->
        <div>
          <h2 class="text-lg font-medium mb-3 text-gray-800 border-b pb-2">Datos principales</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="codigo" class="block text-sm font-medium text-gray-700 mb-1">
                Código *
              </label>
              <input
                type="text"
                id="codigo"
                bind:value={articulo.Codigo}
                required
                disabled={isEditing}
                maxlength="13"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label for="descripcion" class="block text-sm font-medium text-gray-700 mb-1">
                Descripción *
              </label>
              <input
                type="text"
                id="descripcion"
                bind:value={articulo.Descripcion}
                required
                maxlength="200"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="codigoBarras" class="block text-sm font-medium text-gray-700 mb-1">
                Código de Barras
              </label>
              <input
                type="text"
                id="codigoBarras"
                bind:value={articulo.CodigoBarras}
                maxlength="20"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="proveedorArticuloCodigo" class="block text-sm font-medium text-gray-700 mb-1">
                Código Artículo Proveedor
              </label>
              <input
                type="text"
                id="proveedorArticuloCodigo"
                bind:value={articulo.ProveedorArticuloCodigo}
                maxlength="20"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <!-- Clasificación y relaciones -->
        <div>
          <h2 class="text-lg font-medium mb-3 text-gray-800 border-b pb-2">Clasificación</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="proveedor" class="block text-sm font-medium text-gray-700 mb-1">
                Proveedor
              </label>
              <select
                id="proveedor"
                bind:value={articulo.ProveedorCodigo}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione proveedor</option>
                {#each proveedores as proveedor}
                  <option value={proveedor.Codigo}>{proveedor.Descripcion} ({proveedor.Codigo})</option>
                {/each}
              </select>
            </div>
            
            <div>
              <label for="rubro" class="block text-sm font-medium text-gray-700 mb-1">
                Rubro
              </label>
              <select
                id="rubro"
                bind:value={articulo.RubroCodigo}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione rubro</option>
                {#each rubros as rubro}
                  <option value={rubro.Codigo}>{rubro.Descripcion} ({rubro.Codigo})</option>
                {/each}
              </select>
            </div>
            
            <div>
              <label for="familia" class="block text-sm font-medium text-gray-700 mb-1">
                Familia
              </label>
              <input
                type="text"
                id="familia"
                bind:value={articulo.FamiliaCodigo}
                maxlength="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="subfamilia" class="block text-sm font-medium text-gray-700 mb-1">
                Subfamilia
              </label>
              <input
                type="text"
                id="subfamilia"
                bind:value={articulo.SubFamiliaCodigo}
                maxlength="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <!-- Existencias -->
        <div>
          <h2 class="text-lg font-medium mb-3 text-gray-800 border-b pb-2">Existencias</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label for="existencia" class="block text-sm font-medium text-gray-700 mb-1">
                Existencia Actual
              </label>
              <input
                type="number"
                id="existencia"
                bind:value={articulo.Existencia}
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="existenciaMinima" class="block text-sm font-medium text-gray-700 mb-1">
                Existencia Mínima
              </label>
              <input
                type="number"
                id="existenciaMinima"
                bind:value={articulo.ExistenciaMinima}
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="existenciaMaxima" class="block text-sm font-medium text-gray-700 mb-1">
                Existencia Máxima
              </label>
              <input
                type="number"
                id="existenciaMaxima"
                bind:value={articulo.ExistenciaMaxima}
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="ubicacionDeposito" class="block text-sm font-medium text-gray-700 mb-1">
                Ubicación en Depósito
              </label>
              <input
                type="text"
                id="ubicacionDeposito"
                bind:value={articulo.UbicacionDeposito}
                maxlength="100"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="peso" class="block text-sm font-medium text-gray-700 mb-1">
                Peso
              </label>
              <input
                type="number"
                id="peso"
                bind:value={articulo.Peso}
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="unidadVenta" class="block text-sm font-medium text-gray-700 mb-1">
                Unidad de Venta
              </label>
              <input
                type="text"
                id="unidadVenta"
                bind:value={articulo.UnidadVenta}
                maxlength="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <!-- Precios y costos -->
        <div>
          <h2 class="text-lg font-medium mb-3 text-gray-800 border-b pb-2">Precios y Costos</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label for="precioCosto" class="block text-sm font-medium text-gray-700 mb-1">
                Precio Costo (sin IVA)
              </label>
              <input
                type="number"
                id="precioCosto"
                bind:value={articulo.PrecioCosto}
                step="0.01"
                on:change={calcularPrecioCostoMasImp}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="precioCostoMasImp" class="block text-sm font-medium text-gray-700 mb-1">
                Precio Costo (con IVA)
              </label>
              <input
                type="number"
                id="precioCostoMasImp"
                bind:value={articulo.PrecioCostoMasImp}
                step="0.01"
                on:change={calcularPrecioCosto}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="porcentajeIVA1" class="block text-sm font-medium text-gray-700 mb-1">
                Porcentaje IVA 1
              </label>
              <input
                type="number"
                id="porcentajeIVA1"
                bind:value={articulo.PorcentajeIVA1}
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="porcentajeIVA2" class="block text-sm font-medium text-gray-700 mb-1">
                Porcentaje IVA 2
              </label>
              <input
                type="number"
                id="porcentajeIVA2"
                bind:value={articulo.PorcentajeIVA2}
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <Button 
            type="button" 
            variant="secondary"
            on:click={actualizarListas}
            class="mb-4"
          >
            Actualizar Listas de Precios
          </Button>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label for="lista1" class="block text-sm font-medium text-gray-700 mb-1">
                Precio Lista 1
              </label>
              <input
                type="number"
                id="lista1"
                bind:value={articulo.Lista1}
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="lista2" class="block text-sm font-medium text-gray-700 mb-1">
                Precio Lista 2
              </label>
              <input
                type="number"
                id="lista2"
                bind:value={articulo.Lista2}
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="lista3" class="block text-sm font-medium text-gray-700 mb-1">
                Precio Lista 3
              </label>
              <input
                type="number"
                id="lista3"
                bind:value={articulo.Lista3}
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="lista4" class="block text-sm font-medium text-gray-700 mb-1">
                Precio Lista 4
              </label>
              <input
                type="number"
                id="lista4"
                bind:value={articulo.Lista4}
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="lista5" class="block text-sm font-medium text-gray-700 mb-1">
                Precio Lista 5
              </label>
              <input
                type="number"
                id="lista5"
                bind:value={articulo.Lista5}
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="porcentajeVendedor" class="block text-sm font-medium text-gray-700 mb-1">
                Porcentaje Vendedor
              </label>
              <input
                type="number"
                id="porcentajeVendedor"
                bind:value={articulo.PorcentajeVendedor}
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <!-- Configuración -->
        <div>
          <h2 class="text-lg font-medium mb-3 text-gray-800 border-b pb-2">Configuración</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label for="activo" class="block text-sm font-medium text-gray-700 mb-1">
                Activo
              </label>
              <select
                id="activo"
                bind:value={articulo.Activo}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Sí</option>
                <option value={0}>No</option>
              </select>
            </div>
            
            <div>
              <label for="seVende" class="block text-sm font-medium text-gray-700 mb-1">
                Se Vende
              </label>
              <select
                id="seVende"
                bind:value={articulo.SeVende}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Sí</option>
                <option value={0}>No</option>
              </select>
            </div>
            
            <div>
              <label for="requiereFrio" class="block text-sm font-medium text-gray-700 mb-1">
                Requiere Frío
              </label>
              <select
                id="requiereFrio"
                bind:value={articulo.RequiereFrio}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>No</option>
                <option value={1}>Sí</option>
              </select>
            </div>
            
            <div>
              <label for="siempreSeDescarga" class="block text-sm font-medium text-gray-700 mb-1">
                Siempre Se Descarga
              </label>
              <select
                id="siempreSeDescarga"
                bind:value={articulo.SiempreSeDescarga}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>No</option>
                <option value={1}>Sí</option>
              </select>
            </div>
            
            <div>
              <label for="iva2SobreNeto" class="block text-sm font-medium text-gray-700 mb-1">
                IVA 2 Sobre Neto
              </label>
              <select
                id="iva2SobreNeto"
                bind:value={articulo.Iva2SobreNeto}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>No</option>
                <option value={1}>Sí</option>
              </select>
            </div>
            
            <div>
              <label for="esCompuesto" class="block text-sm font-medium text-gray-700 mb-1">
                Es Compuesto
              </label>
              <select
                id="esCompuesto"
                bind:value={articulo.EsCompuesto}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>No</option>
                <option value={1}>Sí</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex justify-between pt-4">
        <Button
          variant="secondary"
          type="button"
          on:click={() => goto('/productos')}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  </div>
</div>
