<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto, invalidate } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { ConfiguracionService } from '$lib/services/ConfiguracionService';
  import {
    MODO_LISTA_POR_DEFECTO,
    NUMEROS_LISTA,
    descripcionModoLista,
    listasDesactualizadasPorCosto,
    porcentajeDesdePrecio,
    porcentajesParaMantenerPrecios,
    textoListasDesactualizadas,
    valorVisibleLista,
    type CampoListaPrecio,
    type ModoIngresoLista,
    type NumeroLista,
    type PreciosArticulo
  } from '$lib/utils/modoListaPrecios';
  
  let isEditing = $page.params.id !== 'nuevo';
  let historialCosto: { Fecha: string; PrecioCosto: number }[] = [];

  function formatearFechaCosto(valor: string | null | undefined): string {
    if (!valor) return '—';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '—';
    return fecha.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
  }

  async function cargarHistorialCosto(codigo: string) {
    try {
      const response = await fetchWithAuth(`/articulos/${codigo}/costo-historico`);
      if (!response.ok) {
        historialCosto = [];
        return;
      }
      const data = await response.json();
      historialCosto = data.historial || [];
    } catch (err) {
      console.error('Error cargando historial de costo:', err);
      historialCosto = [];
    }
  }
  
  // Recargar datos cuando cambia el ID
  $: if ($page.params.id) {
    isEditing = $page.params.id !== 'nuevo';
    if (isEditing) {
      (async () => {
        try {
          loading = true;
          const response = await fetchWithAuth(`/articulos/${$page.params.id}`);
          if (!response.ok) {
            throw new Error('Error al cargar el artículo');
          }
          articulo = await response.json();
          tomarPreciosGuardados(articulo);
          await cargarHistorialCosto($page.params.id);
        } catch (err: unknown) {
          console.error('Error cargando artículo:', err);
          if (err instanceof Error) {
            error = err.message;
          } else {
            error = 'Error desconocido';
          }
        } finally {
          loading = false;
        }
      })();
    }
  }
  
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
  
  let modoLista: ModoIngresoLista = MODO_LISTA_POR_DEFECTO;

  type ClaveLista = CampoListaPrecio;
  const numerosLista = NUMEROS_LISTA;
  const camposLista: { modo: ModoIngresoLista; sufijo: string; etiqueta: (n: NumeroLista) => string }[] = [
    { modo: 'PorcentajeDeGanancia', sufijo: '', etiqueta: (n) => `% Lista ${n}` },
    { modo: 'PrecioSinIva', sufijo: 'SinIva', etiqueta: (n) => `Precio Lista ${n} sin IVA` },
    { modo: 'PrecioConIva', sufijo: 'ConIva', etiqueta: (n) => `Precio Lista ${n} con IVA` }
  ];

  $: sinCosto = !(Number(articulo.PrecioCosto) > 0);

  // Precios tal como están guardados, para avisar si el costo cambia los precios finales
  let preciosGuardados: PreciosArticulo | null = null;

  const tomarPreciosGuardados = (a: Articulo): void => {
    preciosGuardados = {
      PrecioCosto: a.PrecioCosto,
      PorcentajeIVA1: a.PorcentajeIVA1,
      Lista1: a.Lista1,
      Lista2: a.Lista2,
      Lista3: a.Lista3,
      Lista4: a.Lista4,
      Lista5: a.Lista5
    };
  };

  $: listasDesactualizadas = isEditing
    ? listasDesactualizadasPorCosto(preciosGuardados, articulo, modoLista)
    : [];

  const mantenerPreciosAnteriores = (): void => {
    const porcentajes = porcentajesParaMantenerPrecios(articulo, listasDesactualizadas, modoLista);
    articulo = { ...articulo, ...porcentajes };
  };

  const valorCampoLista = (articuloActual: Articulo, n: NumeroLista, modo: ModoIngresoLista): string =>
    valorVisibleLista(
      articuloActual.PrecioCosto,
      articuloActual.PorcentajeIVA1,
      articuloActual[`Lista${n}` as ClaveLista],
      modo
    ).toFixed(2);

  const actualizarListaDesdeInput = (n: NumeroLista, input: HTMLInputElement): void => {
    const porcentaje = porcentajeDesdePrecio(
      articulo.PrecioCosto,
      articulo.PorcentajeIVA1,
      parseFloat(input.value),
      modoLista
    );
    if (porcentaje !== null) {
      articulo[`Lista${n}` as ClaveLista] = porcentaje;
    }
    input.value = valorCampoLista(articulo, n, modoLista);
  };
  
  // Cargar datos de proveedores y rubros para los selectores
  const loadProveedores = async (): Promise<void> => {
    try {
      const response = await fetchWithAuth('/proveedores?limit=500');
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
      const response = await fetchWithAuth('/rubros?limit=500');
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
      const [modo] = await Promise.all([
        ConfiguracionService.obtenerModoIngresoLista(),
        loadProveedores(),
        loadRubros()
      ]);
      modoLista = modo;
      
      // Si estamos editando, cargar datos del artículo
      if (isEditing) {
        const response = await fetchWithAuth(`/articulos/${$page.params.id}`);
        if (!response.ok) {
          throw new Error('Error al cargar el artículo');
        }
        
        articulo = await response.json();
        tomarPreciosGuardados(articulo);
        await cargarHistorialCosto($page.params.id);
        await invalidate(`/articulos/${$page.params.id}`);
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
  
  // Formatear un valor numérico a 2 decimales
  const formatearADosDecimales = (valor: number): number => {
    if (valor === null || valor === undefined || isNaN(valor)) {
      return 0;
    }
    return Number(Number(valor).toFixed(2));
  };
  
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
  
  // Formatear precio costo a 2 decimales
  const formatearPrecioCosto = (): void => {
    articulo.PrecioCosto = formatearADosDecimales(articulo.PrecioCosto);
  };
  
  // Formatear precio costo con IVA a 2 decimales
  const formatearPrecioCostoMasImp = (): void => {
    articulo.PrecioCostoMasImp = formatearADosDecimales(articulo.PrecioCostoMasImp);
  };
  
  // Listas guardan % de ganancia: márgenes predeterminados
  const actualizarListas = (): void => {
    articulo.Lista1 = 30;
    articulo.Lista2 = 40;
    articulo.Lista3 = 50;
    articulo.Lista4 = 60;
    articulo.Lista5 = 70;
  };
  
  // Validar que el porcentaje de IVA 1 sea uno de los valores permitidos
  const validarPorcentajeIVA1 = (): boolean => {
    const valoresPermitidos = [0, 10.5, 21];
    if (!valoresPermitidos.includes(articulo.PorcentajeIVA1)) {
      error = 'El porcentaje de IVA 1 debe ser 0, 10.5 o 21';
      return false;
    }
    return true;
  };
  
  // Prevenir el envío del formulario al presionar Enter en campos de precio
  const prevenirSubmitEnEnter = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      // Quitar el foco del campo actual
      (event.target as HTMLInputElement)?.blur();
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = async (event: Event): Promise<void> => {
    event.preventDefault();
    
    // Validar el porcentaje de IVA 1 antes de enviar
    if (!validarPorcentajeIVA1()) {
      return;
    }

    if (
      listasDesactualizadas.length > 0 &&
      !confirm(
        `Cambió el precio de costo pero no actualizó los precios de lista. ` +
          `Los precios finales van a cambiar:\n\n${textoListasDesactualizadas(listasDesactualizadas)}\n\n¿Guardar igual?`
      )
    ) {
      return;
    }
    
    try {
      loading = true;
      error = null;
      successMessage = null;
      
      const url = isEditing 
        ? `/articulos/${$page.params.id}` 
        : `/articulos`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      console.log('Enviando datos:', articulo);
      
      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(articulo)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al guardar el producto');
      }
      
      const data = await response.json();
      
      // Actualizar el artículo con los datos del servidor
      articulo = data;
      tomarPreciosGuardados(articulo);
      if (isEditing) {
        await cargarHistorialCosto(articulo.Codigo);
      }
      
      // Después de guardar exitosamente, mostrar mensaje y restablecer scroll
      successMessage = isEditing 
        ? `Producto "${articulo.Codigo}" actualizado correctamente` 
        : `Producto "${articulo.Codigo}" creado correctamente`;
      
      // Restablecer el scroll al inicio de la página
      window.scrollTo(0, 0);
      
      // Si es nuevo, redirigir y actualizar estado
      if (!isEditing) {
        goto('/productos', { replaceState: true });
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
      <div class="space-y-6">
        <!-- Datos principales - Obligatorios -->
        <div>
          <h2 class="text-lg font-medium mb-3 text-gray-800 border-b pb-2">Datos principales</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="mb-1 flex items-baseline justify-between gap-3">
                <label for="codigo" class="block text-sm font-medium text-gray-700">
                  Código *
                </label>
                {#if !isEditing}
                  <a href="/ayuda/codigos-de-articulo" class="text-xs font-medium text-blue-600 hover:text-blue-800">
                    Cómo armar el código
                  </a>
                {/if}
              </div>
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
            
            <!-- Familia - Campo comentado por el momento no se usa -->
            <!--
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
            -->
            
            <!-- Subfamilia - Campo comentado por el momento no se usa -->
            <!--
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
            -->
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
                on:keydown={prevenirSubmitEnEnter}
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
                on:keydown={prevenirSubmitEnEnter}
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
                on:keydown={prevenirSubmitEnEnter}
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
                on:keydown={prevenirSubmitEnEnter}
                on:blur={() => {
                  formatearPrecioCosto();
                  calcularPrecioCostoMasImp();
                }}
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
                on:blur={() => {
                  formatearPrecioCostoMasImp();
                  calcularPrecioCosto();
                }}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {#if isEditing}
              <div class="md:col-span-2">
                <p class="block text-sm font-medium text-gray-700 mb-1">Últimas actualizaciones de costo</p>
                {#if historialCosto.length === 0}
                  <p class="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">Sin actualizaciones de costo</p>
                {:else}
                  <ul class="bg-gray-50 border border-gray-200 rounded-md divide-y divide-gray-200">
                    {#each historialCosto as item}
                      <li class="px-3 py-2 text-sm text-gray-700 flex justify-between gap-4">
                        <span>{formatearFechaCosto(item.Fecha)}</span>
                        <span>${Number(item.PrecioCosto).toFixed(2)}</span>
                      </li>
                    {/each}
                  </ul>
                {/if}
              </div>
            {/if}
            
            <div>
              <label for="porcentajeIVA1" class="block text-sm font-medium text-gray-700 mb-1">
                Porcentaje IVA 1
              </label>
              <select
                id="porcentajeIVA1"
                bind:value={articulo.PorcentajeIVA1}
                on:change={() => {
                  // Resetear ambos campos de precio cuando cambia el porcentaje de IVA
                  articulo.PrecioCosto = 0;
                  articulo.PrecioCostoMasImp = 0;
                }}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>0%</option>
                <option value={10.5}>10.5%</option>
                <option value={21}>21%</option>
              </select>
            </div>
            
            <!-- Campo Porcentaje IVA 2 oculto - no se muestra al crear nuevo producto o editar -->
            {#if false}
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
            {/if}
          </div>
          
          <Button 
            type="button" 
            variant="secondary"
            on:click={actualizarListas}
            class="mb-4"
          >
            Actualizar Listas de Precios
          </Button>
          
          <!-- Listas de Precios: Diseño compacto en una sola línea -->
          <div class="mb-4 border border-gray-200 rounded-md p-3">
            <h3 class="text-sm font-medium text-gray-700 mb-1">Listas de Precios</h3>
            <p class="text-xs text-gray-500 mb-3">
              Se ingresa por {descripcionModoLista(modoLista)}.
              {#if sinCosto && modoLista !== 'PorcentajeDeGanancia'}
                <span class="text-amber-700">Cargue el precio de costo para poder ingresar los precios de lista.</span>
              {/if}
            </p>
            {#if listasDesactualizadas.length > 0}
              <div class="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <div>
                  <p class="font-medium">Cambió el precio de costo pero no actualizó los precios de lista.</p>
                  <p class="text-xs">Los precios finales van a cambiar: {textoListasDesactualizadas(listasDesactualizadas)}</p>
                </div>
                <Button type="button" variant="secondary" on:click={mantenerPreciosAnteriores}>
                  Mantener precios anteriores
                </Button>
              </div>
            {/if}
            <div class="grid grid-cols-5 gap-3">
              {#each numerosLista as n}
                <div>
                  <div class="block text-xs font-medium text-gray-600 mb-1 text-center">Lista {n}</div>
                  <div class="space-y-2">
                    {#each camposLista as campo}
                      {@const editable = campo.modo === modoLista}
                      {@const idCampo = campo.sufijo ? `precioLista${n}${campo.sufijo}` : `lista${n}`}
                      <div>
                        <label for={idCampo} class="block text-xs font-medium text-gray-500 mb-1 text-center">{campo.etiqueta(n)}</label>
                        {#if editable}
                          <input
                            type="number"
                            id={idCampo}
                            value={valorCampoLista(articulo, n, campo.modo)}
                            step="0.01"
                            disabled={sinCosto && campo.modo !== 'PorcentajeDeGanancia'}
                            on:keydown={prevenirSubmitEnEnter}
                            on:change={(e) => actualizarListaDesdeInput(n, e.currentTarget)}
                            class="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                        {:else}
                          <input
                            type="text"
                            id={idCampo}
                            readonly
                            value={valorCampoLista(articulo, n, campo.modo)}
                            class="w-full px-2 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed text-center"
                          />
                        {/if}
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- Porcentaje Vendedor - Campo comentado por el momento no se usa -->
          <!--
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div>
              <label for="porcentajeVendedor" class="block text-sm font-medium text-gray-700 mb-1">
                Porcentaje Vendedor
              </label>
              <input
                type="number"
                id="porcentajeVendedor"
                bind:value={articulo.PorcentajeVendedor}
                step="0.01"
                on:blur={() => {
                  articulo.PorcentajeVendedor = formatearADosDecimales(articulo.PorcentajeVendedor);
                }}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          -->
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
            
            <!-- Requiere Frío - Campo comentado -->
            <!--
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
            -->
            
            <!-- Siempre Se Descarga - Campo comentado -->
            <!--
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
            -->
            
            <!-- IVA 2 Sobre Neto - Campo comentado -->
            <!--
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
            -->
            
            <!-- Es Compuesto - Campo comentado -->
            <!--
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
            -->
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
