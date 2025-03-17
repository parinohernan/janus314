<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { PUBLIC_API_URL } from '$env/static/public';
  import Button from '$lib/components/ui/Button.svelte';
  import { formatDateOnly } from '$lib/utils/dateUtils';
  
  // Interfaces
  interface Cliente {
    Codigo: string;
    Descripcion: string;
    CategoriaIva: string;
    ListaPrecio?: string;
  }
  
  interface Articulo {
    Codigo: string;
    Descripcion: string;
    PrecioCosto: number;
    PrecioVenta?: number;
    PorcentajeIva?: number;
    PorcentajeIva1?: number;
    Existencia: number;
    Activo: number;
    Lista1?: number;
    Lista2?: number;
    Lista3?: number;
    Lista4?: number;
    Lista5?: number;
  }
  
  interface ItemFactura {
    ArticuloCodigo: string;
    Descripcion: string;
    Cantidad: number;
    PrecioLista: number;           // Precio de lista sin IVA
    PorcentajeDescuento: number;   // Porcentaje de descuento
    PrecioUnitario: number;        // Precio lista con descuento aplicado (sin IVA)
    PorcentajeIva: number;         // Porcentaje de IVA
    PrecioUnitarioConIva: number;  // Precio unitario con IVA
    Total: number;                 // Total del ítem (precio unitario con IVA * cantidad)
    enEdicion?: boolean;
  }
  
  // Modelo de factura
  let factura = {
    DocumentoTipo: 'FCB',
    DocumentoSucursal: '0001',
    DocumentoNumero: '',
    Fecha: new Date().toISOString().substring(0, 10),
    ClienteCodigo: '',
    Cliente: null as Cliente | null,
    ListaPrecio: '1',
    ImporteBruto: 0,
    PorcentajeDescuento: 0,
    ImporteDescuento: 0,
    ImporteNeto: 0,
    ImporteIva1: 0,
    ImporteIva2: 0,
    PorcentajeIngresosBrutos: 0,
    ImporteIngresosBrutos: 0,
    ImporteIva: 0,
    ImporteTotal: 0,
    Observacion: '',
    Items: [] as ItemFactura[]
  };
  
  // Estados para selectores
  let tiposDocumento: {value: string, label: string}[] = [];
  
  let clientesBusqueda = '';
  let clientesOptions: Cliente[] = [];
  let clientesLoading = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  let articuloBusqueda = '';
  let articulosOptions: Articulo[] = [];
  let articulosLoading = false;
  let articuloTimeoutId: ReturnType<typeof setTimeout> | null = null;
  
  // Artículo seleccionado actualmente
  let articuloSeleccionado: Articulo | null = null;
  let cantidadArticulo = 1;
  
  // Estados
  let loading = false;
  let error: string | null = null;
  let guardadoExitoso = false;
  
  // Variable para mostrar sucursal y número
  let sucursalNumeroDisplay = '';
  
  // Actualizar la variable cuando cambian los valores
  $: sucursalNumeroDisplay = factura.DocumentoSucursal + " - " + (factura.DocumentoNumero ? factura.DocumentoNumero.toString().padStart(8, '0') : '00000000');
  
  // Cargar datos iniciales
  onMount(async () => {
     // Obtener datos de la empresa para la sucursal
     const response = await fetch(`${PUBLIC_API_URL}/datos-empresa`);
      
      if (!response.ok) {
        throw new Error('Error al cargar datos de la empresa');
      }
      
      const { data } = await response.json();
      
      if (!data || !data.Sucursal) {
        throw new Error('No se encontró configuración de sucursal');
      }
      // Establecer la sucursal automáticamente
      factura.DocumentoSucursal = data.Sucursal;
  });
  
  // Actualizar tipos de documento según categoría IVA del cliente
  const actualizarTiposDocumento = (categoriaIva: string) => {
    // Por defecto, solo PRF está disponible
    tiposDocumento = [
      { value: 'PRF', label: 'Prefactura' }
    ];
    
    // Según la categoría IVA, añadir opciones
    if (categoriaIva === 'I' || categoriaIva === 'M') {
      tiposDocumento.push({ value: 'FCA', label: 'Factura A' });
      factura.DocumentoTipo = 'FCA'; // Seleccionar FCA por defecto
    } else if (categoriaIva === 'F' || categoriaIva === 'E') {
      tiposDocumento.push({ value: 'FCB', label: 'Factura B' });
      factura.DocumentoTipo = 'FCB'; // Seleccionar FCB por defecto
    } else {
      factura.DocumentoTipo = 'PRF'; // Seleccionar PRF por defecto
    }
  };
  
  // Obtener próximo número de comprobante
  const obtenerProximoNumero = async () => {

    try {
      const response = await fetch(`${PUBLIC_API_URL}/numeros-Control/${factura.DocumentoTipo}/${factura.DocumentoSucursal}`);
      if (response.ok) {
        const data = await response.json();
        factura.DocumentoNumero = data.data.proximoNumero;
        return data.data.proximoNumero;
      }
    } catch (error) {
      console.error('Error obteniendo próximo número:', error);
    }
    return null;
  };
  
  // Funciones de búsqueda
  const buscarClientes = async (busqueda = '') => {
    if (timeoutId) clearTimeout(timeoutId);
    
    if (!busqueda || busqueda.length < 2) {
      clientesOptions = [];
      return;
    }
    
    clientesLoading = true;
    
    timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`${PUBLIC_API_URL}/clientes?search=${encodeURIComponent(busqueda)}&limit=10`);
        
        if (!response.ok) {
          throw new Error('Error al buscar clientes');
        }
        
        const data = await response.json();
        console.log("data",data);
        clientesOptions = data.items;
      } catch (error) {
        console.error('Error buscando clientes:', error);
        clientesOptions = [];
      } finally {
        clientesLoading = false;
      }
    }, 300);
  };
  
  const buscarArticulos = async (busqueda = '') => {
    if (articuloTimeoutId) clearTimeout(articuloTimeoutId);
    
    if (!busqueda || busqueda.length < 2) {
      articulosOptions = [];
      return;
    }
    
    articulosLoading = true;
    
    articuloTimeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`${PUBLIC_API_URL}/articulos?search=${encodeURIComponent(busqueda)}&limit=10`);
        
        if (!response.ok) {
          throw new Error('Error al buscar artículos');
        }
        
        const data = await response.json();
        articulosOptions = data.items;
      } catch (error) {
        console.error('Error buscando artículos:', error);
        articulosOptions = [];
      } finally {
        articulosLoading = false;
      }
    }, 300);
  };
  
  // Seleccionar cliente
  const seleccionarCliente = async (cliente: Cliente) => {
    factura.ClienteCodigo = cliente.Codigo;
    factura.Cliente = cliente;
    clientesBusqueda = `${cliente.Codigo} - ${cliente.Descripcion}`;
    clientesOptions = [];
    console.log("cliente",cliente);
    // Establecer la lista de precios del cliente
    if (cliente.ListaPrecio) {
      factura.ListaPrecio = cliente.ListaPrecio;
    } else {
      factura.ListaPrecio = '1'; // Valor por defecto como string
    }
    
    // Actualizar tipos de documento según categoría IVA
    actualizarTiposDocumento(cliente.CategoriaIva);
    
    // Si se cambió el tipo de documento, obtener próximo número
    if (factura.DocumentoTipo !== 'PRF') {
      const proximoNumero = await obtenerProximoNumero();
      console.log("proximoNumero",proximoNumero);
      if (proximoNumero) {
        // Aquí podrías mostrar el próximo número o guardarlo en el estado
        console.log(`Próximo número para ${factura.DocumentoTipo}: ${proximoNumero}`);
      }
    }
  };
  
  // Seleccionar artículo
  const seleccionarArticulo = (articulo: Articulo) => {
    articuloSeleccionado = articulo;
    articuloBusqueda = `${articulo.Codigo} - ${articulo.Descripcion}`;
    articulosOptions = [];
  };
  
  // Agregar artículo a la factura (actualizado)
  const agregarArticulo = () => {
    console.log("agregarArticulo", articuloSeleccionado);
    if (!articuloSeleccionado) return;
    
    // Obtener precio según la lista seleccionada
    const precioLista = obtenerPrecioSegunLista(articuloSeleccionado, factura.ListaPrecio);
    // Usar el PorcentajeIva del artículo o 21 como valor predeterminado
    const porcentajeIva = articuloSeleccionado.PorcentajeIva1 || 21;
    
    const nuevoItem: ItemFactura = {
      ArticuloCodigo: articuloSeleccionado.Codigo,
      Descripcion: articuloSeleccionado.Descripcion,
      Cantidad: cantidadArticulo,
      PrecioLista: precioLista,
      PorcentajeDescuento: 0,
      PrecioUnitario: precioLista, // Inicialmente igual al precio de lista (sin descuento)
      PorcentajeIva: porcentajeIva,
      PrecioUnitarioConIva: 0, // Se calculará en recalcularItem
      Total: 0, // Se calculará en recalcularItem
      enEdicion: false
    };
    
    // Calcular valores derivados
    recalcularItem(nuevoItem);
    
    factura.Items = [...factura.Items, nuevoItem];
    recalcularTotales();
    
    // Resetear selección
    articuloSeleccionado = null;
    articuloBusqueda = '';
    cantidadArticulo = 1;
  };
  
  // Obtener precio según la lista seleccionada
  const obtenerPrecioSegunLista = (articulo: Articulo, listaId: string): number => {
    // Aquí deberías implementar la lógica para obtener el precio según la lista
    // Por ahora, usamos una lógica simple basada en el PrecioCosto
    
    const precioCosto = articulo.PrecioCosto || 0;
    console.log("articulo", articulo);
    
    // Valores predeterminados en caso de que las propiedades no existan
    const lista1 = articulo.Lista1 || 30;
    const lista2 = articulo.Lista2 || 40;
    const lista3 = articulo.Lista3 || 50;
    const lista4 = articulo.Lista4 || 60;
    const lista5 = articulo.Lista5 || 70;
    
    switch(listaId) {
      case '1': return precioCosto * (1 + lista1/100);
      case '2': return precioCosto * (1 + lista2/100);
      case '3': return precioCosto * (1 + lista3/100);
      case '4': return precioCosto * (1 + lista4/100);
      case '5': return precioCosto * (1 + lista5/100);
      default: return precioCosto * (1 + lista1/100);
    }
  };
  
  // Función para recalcular un ítem individual (actualizada)
  const recalcularItem = (item: ItemFactura) => {
    // 1. Calcular precio unitario con descuento aplicado (sin IVA)
    item.PrecioUnitario = item.PrecioLista * (1 - (item.PorcentajeDescuento / 100));
    
    // 2. Calcular precio unitario con IVA
    item.PrecioUnitarioConIva = item.PrecioUnitario * (1 + (item.PorcentajeIva / 100));
    
    // 3. Calcular total del ítem (precio unitario con IVA * cantidad)
    item.Total = item.PrecioUnitarioConIva * item.Cantidad;
    
    // Redondear valores para evitar problemas de precisión
    item.PrecioUnitario = parseFloat(item.PrecioUnitario.toFixed(2));
    item.PrecioUnitarioConIva = parseFloat(item.PrecioUnitarioConIva.toFixed(2));
    item.Total = parseFloat(item.Total.toFixed(2));
  };
  
  // Activar/desactivar modo edición para un ítem
  const toggleEdicion = (index: number) => {
    factura.Items = factura.Items.map((item, i) => {
      if (i === index) {
        return { ...item, enEdicion: !item.enEdicion };
      }
      return { ...item, enEdicion: false }; // Desactivar edición en otros ítems
    });
  };
  
  // Actualizar un ítem después de edición
  const actualizarItem = (index: number) => {
    // Crear una copia del array para mantener reactividad
    const items = [...factura.Items];
    
    // Recalcular el ítem editado
    recalcularItem(items[index]);
    
    // Desactivar modo edición
    items[index].enEdicion = false;
    
    // Actualizar el array de ítems
    factura.Items = items;
    
    // Recalcular totales de la factura
    recalcularTotales();
  };
  
  // Eliminar artículo de la factura
  const eliminarItem = (index: number) => {
    factura.Items = factura.Items.filter((_, i) => i !== index);
    recalcularTotales();
  };
  
  // Recalcular totales (actualizado)
  const recalcularTotales = () => {
    // Inicializar valores
    let importeBruto = 0;
    let importeIva1 = 0; // IVA 21%
    let importeIva2 = 0; // IVA 10.5%
    
    factura.Items.forEach(item => {
      // Calcular importe bruto (suma de precios unitarios * cantidad)
      importeBruto += item.PrecioUnitario * item.Cantidad;
    });
    
    // Actualizar importe bruto
    factura.ImporteBruto = parseFloat(importeBruto.toFixed(2));
    
    // Calcular descuento general
    factura.ImporteDescuento = parseFloat((factura.ImporteBruto * (factura.PorcentajeDescuento / 100)).toFixed(2));
    
    // Calcular importe neto (después del descuento)
    factura.ImporteNeto = parseFloat((factura.ImporteBruto - factura.ImporteDescuento).toFixed(2));
    
    // Calcular IVA sobre el importe neto (después del descuento general)
    // Necesitamos calcular la proporción de cada alícuota de IVA en el total
    let baseIva21 = 0;
    let baseIva10_5 = 0;
    
    factura.Items.forEach(item => {
      const importeItem = item.PrecioUnitario * item.Cantidad;
      // Aplicar el mismo porcentaje de descuento general a cada ítem
      const importeItemConDescuento = importeItem * (1 - (factura.PorcentajeDescuento / 100));
      
      if (item.PorcentajeIva === 21) {
        baseIva21 += importeItemConDescuento;
      } else if (item.PorcentajeIva === 10.5) {
        baseIva10_5 += importeItemConDescuento;
      }
    });
    
    // Calcular IVA sobre las bases imponibles con descuento aplicado
    importeIva1 = baseIva21 * 0.21;
    importeIva2 = baseIva10_5 * 0.105;
    
    // Actualizar valores de IVA
    factura.ImporteIva1 = parseFloat(importeIva1.toFixed(2));
    factura.ImporteIva2 = parseFloat(importeIva2.toFixed(2));
    factura.ImporteIva = parseFloat((importeIva1 + importeIva2).toFixed(2));
    
    // Calcular Ingresos Brutos
    factura.ImporteIngresosBrutos = parseFloat((factura.ImporteNeto * (factura.PorcentajeIngresosBrutos / 100)).toFixed(2));
    
    // Calcular importe total
    factura.ImporteTotal = parseFloat((
      factura.ImporteNeto + 
      factura.ImporteIva1 + 
      factura.ImporteIva2 + 
      factura.ImporteIngresosBrutos
    ).toFixed(2));
  };
  
  // Actualizar descuento general
  const actualizarDescuentoGeneral = () => {
    recalcularTotales();
  };
  
  // Cambiar lista de precios (actualizado)
  const cambiarListaPrecio = () => {
    console.log("Lista de precios cambiada a:", factura.ListaPrecio);
    
    // Actualizar precios de todos los ítems según la nueva lista
    if (factura.Items.length > 0) {
      // Crear una copia del array para mantener reactividad
      const items = [...factura.Items];
      
      // Para cada ítem, buscar el artículo y actualizar su precio
      items.forEach(async (item) => {
        try {
          // Obtener datos actualizados del artículo
          const response = await fetch(`${PUBLIC_API_URL}/articulos/${item.ArticuloCodigo}`);
          if (response.ok) {
            const articulo = await response.json();
            
            // Actualizar precio de lista según la nueva lista
            item.PrecioLista = obtenerPrecioSegunLista(articulo, factura.ListaPrecio);
            
            // Recalcular valores derivados
            recalcularItem(item);
          }
        } catch (error) {
          console.error('Error actualizando precio del artículo:', error);
        }
      });
      
      // Actualizar el array de ítems
      factura.Items = items;
      
      // Recalcular totales de la factura
      recalcularTotales();
    }
  };
  
  // Guardar factura
  const guardarFactura = async () => {
    if (!factura.ClienteCodigo) {
      error = "Debe seleccionar un cliente";
      return;
    }
    
    if (factura.Items.length === 0) {
      error = "La factura debe tener al menos un artículo";
      return;
    }
    
    try {
      loading = true;
      error = null;
      
      const response = await fetch(`${PUBLIC_API_URL}/facturas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(factura)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar la factura');
      }
      
      const data = await response.json();
      guardadoExitoso = true;
      
      // Redirigir a la vista de detalle después de 2 segundos
      setTimeout(() => {
        goto(`/ventas/facturas/`);
        // ${factura.DocumentoTipo}/${factura.DocumentoSucursal}/${factura.DocumentoNumero}
      }, 2000);
      
    } catch (err) {
      console.error('Error guardando factura:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  };
  
  // Cancelar creación
  const cancelar = () => {
    if (confirm('¿Está seguro que desea cancelar? Perderá todos los datos ingresados.')) {
      goto('/ventas/facturas');
    }
  };

  // Opciones para listas de precios
  const listasPrecio = [
    { value: '1', label: 'Lista 1' },
    { value: '2', label: 'Lista 2' },
    { value: '3', label: 'Lista 3' },
    { value: '4', label: 'Lista 4' },
    { value: '5', label: 'Lista 5' }
  ];
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">Nueva Factura</h1>
    <div class="flex space-x-2">
      <Button variant="secondary" on:click={cancelar}>Cancelar</Button>
      <Button variant="primary" on:click={guardarFactura} disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar Factura'}
      </Button>
    </div>
  </div>
  
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p>{error}</p>
    </div>
  {/if}
  
  {#if guardadoExitoso}
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
      <p>Factura guardada correctamente. Redirigiendo...</p>
    </div>
  {/if}
  
  <!-- Datos de la factura (actualizado) -->
  <div class="bg-white p-6 rounded-lg shadow-md mb-6">
    <h2 class="text-xl font-semibold mb-4">Datos de la Factura</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Primera columna -->
      <div>
        <div class="mb-4">
          <label for="tipoDocumento" class="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
          <select 
            id="tipoDocumento" 
            bind:value={factura.DocumentoTipo}
            on:change={obtenerProximoNumero}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {#each tiposDocumento as tipo}
              <option value={tipo.value}>{tipo.label}</option>
            {/each}
          </select>
        </div>
        
        <div class="mb-4">
          <label for="sucursal" class="block text-sm font-medium text-gray-700 mb-1">Sucursal - Número</label>
          <input 
            id="sucursal" 
            type="text" 
            bind:value={sucursalNumeroDisplay}
            disabled
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <!-- Segunda columna -->
      <div>
        <div class="mb-4">
          <label for="fecha" class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <input 
            id="fecha" 
            type="date" 
            bind:value={factura.Fecha}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div class="mb-4">
          <label for="listaPrecio" class="block text-sm font-medium text-gray-700 mb-1">Lista de Precios</label>
          <select 
            id="listaPrecio" 
            bind:value={factura.ListaPrecio}
            on:change={cambiarListaPrecio}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {#each listasPrecio as lista}
              <option value={lista.value}>{lista.label}</option>
            {/each}
          </select>
        </div>
      </div>
      
      <!-- Tercera columna -->
      <div>
        <div class="mb-4 relative">
          <label for="cliente" class="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <input
            type="text"
            id="cliente"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            placeholder="Buscar cliente..."
            bind:value={clientesBusqueda}
            on:input={() => buscarClientes(clientesBusqueda)}
            autocomplete="off"
          />
          
          {#if clientesLoading}
            <div class="absolute right-3 top-1/2 -translate-y-1/2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          {/if}
          
          {#if clientesOptions.length > 0}
            <div class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
              <ul>
                {#each clientesOptions as cliente}
                  <li>
                    <button 
                      class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 w-full text-left"
                      on:click={() => seleccionarCliente(cliente)}
                    >
                      <div class="flex items-center">
                        <span class="font-normal block truncate">{cliente.Codigo} - {cliente.Descripcion}</span>
                      </div>
                    </button>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
        
        <div class="mb-4">
          <label for="observacion" class="block text-sm font-medium text-gray-700 mb-1">Observación</label>
          <textarea 
            id="observacion" 
            bind:value={factura.Observacion}
            rows="2"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Artículos de la factura -->
  <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
    <h2 class="text-lg font-semibold mb-4">Artículos</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
      <div class="md:col-span-2">
        <label for="articulo" class="block text-sm font-medium text-gray-700 mb-1">Artículo</label>
        <div class="relative">
          <input
            type="text"
            id="articulo"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            placeholder="Buscar artículo..."
            bind:value={articuloBusqueda}
            on:input={() => buscarArticulos(articuloBusqueda)}
            autocomplete="off"
          />
          
          {#if articulosLoading}
            <div class="absolute right-3 top-1/2 -translate-y-1/2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          {/if}
          
          {#if articulosOptions.length > 0}
            <div class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
              <ul>
                {#each articulosOptions as articulo}
                  <li>
                    <button 
                      class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 w-full text-left"
                      on:click={() => seleccionarArticulo(articulo)}
                    >
                      <div class="flex items-center">
                        <span class="font-normal block truncate">{articulo.Codigo} - {articulo.Descripcion}</span>
                      </div>
                    </button>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      </div>
      
      <div>
        <label for="cantidad" class="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
        <input 
          id="cantidad" 
          type="number" 
          min="1" 
          step="1"
          bind:value={cantidadArticulo}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label for="btnAgregar" class="invisible block text-sm font-medium text-gray-700 mb-1">Agregar</label>
        <Button 
          id="btnAgregar"
          variant="secondary" 
          on:click={agregarArticulo} 
          disabled={!articuloSeleccionado}
          class="w-full"
        >
          Agregar
        </Button>
      </div>
    </div>
    
    <!-- Tabla de artículos (actualizada) -->
    {#if factura.Items.length > 0}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Lista</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Desc.</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% IVA</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio C/IVA</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each factura.Items as item, i}
              <tr class={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td class="px-4 py-3 whitespace-nowrap text-sm">{item.ArticuloCodigo}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">{item.Descripcion}</td>
                
                <!-- Cantidad -->
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  {#if item.enEdicion}
                    <input 
                      type="number" 
                      bind:value={item.Cantidad} 
                      min="1" 
                      step="1"
                      class="w-16 px-2 py-1 text-right border border-gray-300 rounded"
                    />
                  {:else}
                    {item.Cantidad}
                  {/if}
                </td>
                
                <!-- Precio Lista -->
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  ${item.PrecioLista.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                
                <!-- % Descuento -->
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  {#if item.enEdicion}
                    <input 
                      type="number" 
                      bind:value={item.PorcentajeDescuento} 
                      min="0" 
                      max="100" 
                      step="0.1"
                      class="w-16 px-2 py-1 text-right border border-gray-300 rounded"
                    />
                  {:else}
                    {item.PorcentajeDescuento}%
                  {/if}
                </td>
                
                <!-- Precio Unitario (con descuento, sin IVA) -->
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  ${item.PrecioUnitario.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                
                <!-- % IVA (no editable) -->
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  {item.PorcentajeIva}%
                </td>
                
                <!-- Precio con IVA -->
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  ${item.PrecioUnitarioConIva.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                
                <!-- Total -->
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  ${item.Total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                
                <td class="px-4 py-3 whitespace-nowrap text-center">
                  {#if item.enEdicion}
                    <button 
                      class="text-green-600 hover:text-green-900 mr-2"
                      on:click={() => actualizarItem(i)}
                      aria-label="Guardar cambios"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  {:else}
                    <button 
                      class="text-blue-600 hover:text-blue-900 mr-2"
                      on:click={() => toggleEdicion(i)}
                      aria-label="Editar ítem"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  {/if}
                  
                  <button 
                    class="text-red-600 hover:text-red-900"
                    on:click={() => eliminarItem(i)}
                    aria-label="Eliminar ítem"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      <!-- Totales -->
      <div class="mt-6 flex justify-end">
        <div class="w-80 space-y-2">
          <div class="flex justify-between">
            <span class="font-medium">Importe Bruto:</span>
            <span>${factura.ImporteBruto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="font-medium">Descuento (%):</span>
            <div class="flex items-center">
              <input 
                type="number" 
                bind:value={factura.PorcentajeDescuento} 
                on:change={actualizarDescuentoGeneral}
                min="0" 
                max="100" 
                step="0.1"
                class="w-16 px-2 py-1 text-right border border-gray-300 rounded mr-2"
              />
              <span>${factura.ImporteDescuento.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
          
          <div class="flex justify-between">
            <span class="font-medium">Importe Neto:</span>
            <span>${factura.ImporteNeto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          
          <div class="flex justify-between">
            <span class="font-medium">IVA 21%:</span>
            <span>${factura.ImporteIva1.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          
          <div class="flex justify-between">
            <span class="font-medium">IVA 10.5%:</span>
            <span>${factura.ImporteIva2.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="font-medium">Ingresos Brutos (%):</span>
            <div class="flex items-center">
              <input 
                type="number" 
                bind:value={factura.PorcentajeIngresosBrutos} 
                on:change={actualizarDescuentoGeneral}
                min="0" 
                max="100" 
                step="0.1"
                class="w-16 px-2 py-1 text-right border border-gray-300 rounded mr-2"
              />
              <span>${factura.ImporteIngresosBrutos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
          
          <div class="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
            <span>Total:</span>
            <span>${factura.ImporteTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    {:else}
      <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
        <p>No hay artículos agregados a la factura.</p>
      </div>
    {/if}
  </div>
</div> 