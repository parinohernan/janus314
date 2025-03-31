<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { NotaCreditoService } from '$lib/services/NotaCreditoService';
  import { EmpresaService } from '$lib/services/EmpresaService';
  import type { NotaCredito, ItemNotaCredito, ClienteNotaCredito } from '$lib/types';
  import Button from '$lib/components/ui/Button.svelte';
  import { formatCurrency } from '$lib/utils/formatters';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { FacturaService } from '$lib/services/FacturaService';

  // Inicializar notaCredito con valores por defecto
  let notaCredito: NotaCredito = {
    DocumentoTipo: 'NCA',
    DocumentoSucursal: '0001',
    DocumentoNumero: '',
    Fecha: new Date().toISOString().substring(0, 10),
    CodigoCliente: '',
    Cliente: null,
    ListaNumero: '1',
    ImporteBruto: 0,
    ImporteBonificado: 0,
    ImporteNeto: 0,
    ImporteIva1: 0,
    ImporteIva2: 0,
    BaseImponible1: 0,
    BaseImponible2: 0,
    PorcentajeIva1: 21,
    PorcentajeIva2: 10.5,
    ImporteTotal: 0,
    ImporteUtilizado: 0,
    Observacion: '',
    PorStock: true,
    Items: [] // Inicializar el array vacío
  };

  let loading = false;
  let error: string | null = null;
  let clienteBusqueda = '';
  let clientesOptions: any[] = [];
  let clientesLoading = false;
  let timeoutId: ReturnType<typeof setTimeout>;
  let articuloBusqueda = '';
  let articulosOptions: any[] = [];
  let articulosLoading = false;
  let itemEnEdicion: ItemNotaCredito | null = null;
  let facturaReferenciaBusqueda = '';
  let facturasOptions: any[] = [];
  let facturasLoading = false;
  let articuloSeleccionado: any = null;
  let cantidadArticulo = 1;

  // Tipos de documento disponibles
  const tiposDocumento = [
    { value: 'NCA', label: 'Nota de Crédito A' },
    { value: 'NCB', label: 'Nota de Crédito B' },
    { value: 'NCF', label: 'Nota de Crédito F' }
  ];

  onMount(async () => {
    try {
      // Obtener sucursal
      notaCredito.DocumentoSucursal = await EmpresaService.obtenerSucursal();
      
      // Obtener próximo número
      notaCredito.DocumentoNumero = await NotaCreditoService.obtenerProximoNumero(
        notaCredito.DocumentoTipo,
        notaCredito.DocumentoSucursal
      );
    } catch (err) {
      console.error('Error en inicialización:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    }
  });

  // Búsqueda de facturas para referencia
  async function buscarFacturas(busqueda: string) {
    if (timeoutId) clearTimeout(timeoutId);
    if (!busqueda || busqueda.length < 3) {
      facturasOptions = [];
      return;
    }

    facturasLoading = true;
    timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `${PUBLIC_API_URL}/facturas?search=${encodeURIComponent(busqueda)}&limit=10`
        );
        if (!response.ok) throw new Error('Error al buscar facturas');
        
        const data = await response.json();
        facturasOptions = data.items.map((factura: any) => ({
          tipo: factura.DocumentoTipo,
          sucursal: factura.DocumentoSucursal,
          numero: factura.DocumentoNumero,
          fecha: factura.Fecha,
          cliente: factura.Cliente?.Descripcion,
          total: factura.ImporteTotal,
          label: `${factura.DocumentoTipo}-${factura.DocumentoSucursal}-${factura.DocumentoNumero} (${factura.Cliente?.Descripcion})`
        }));
      } catch (error) {
        console.error('Error buscando facturas:', error);
        facturasOptions = [];
      } finally {
        facturasLoading = false;
      }
    }, 300);
  }

  // Seleccionar cliente
  async function seleccionarCliente(cliente: any) {
    notaCredito.CodigoCliente = cliente.codigo;
    const clienteNC: ClienteNotaCredito = {
      Codigo: cliente.codigo,
      Descripcion: cliente.descripcion,
      CategoriaIva: cliente.categoriaIva
    };
    notaCredito.Cliente = clienteNC;
    clienteBusqueda = cliente.label;
    clientesOptions = [];
    
    // Buscar últimas facturas del cliente inmediatamente
    await buscarFacturasCliente(cliente.codigo);
  }

  // Actualizar buscarFacturasCliente para mostrar las facturas en la lista
  async function buscarFacturasCliente(codigoCliente: string) {
    try {
      facturasLoading = true;
      const resultado = await FacturaService.obtenerUltimasFacturasCliente(codigoCliente);
      
      if (resultado.success && resultado.data) {
        facturasOptions = resultado.data.map((factura: any) => ({
          tipo: factura.tipo,
          sucursal: factura.sucursal,
          numero: factura.numero,
          fecha: factura.fecha,
          cliente: factura.cliente,
          total: factura.total,
          label: `${factura.tipo}-${factura.sucursal}-${factura.numero} (${new Date(factura.fecha).toLocaleDateString()})`
        }));
      } else {
        error = resultado.error || 'Error al buscar facturas del cliente';
      }
    } catch (err) {
      console.error('Error buscando facturas:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      facturasLoading = false;
    }
  }

  // Actualizar seleccionarFactura para manejar el tipo de documento y cargar items
  async function seleccionarFactura(factura: any) {
    try {
      // 1. Determinar el tipo de nota de crédito según la factura
      const tipoMap: Record<string, string> = {
        'FCA': 'NCA',
        'FCB': 'NCB',
        'FCC': 'NCC',
        'PRF': 'NCF'
      };
      const tipoNotaCredito = tipoMap[factura.tipo];

      if (!tipoNotaCredito) {
        throw new Error('Tipo de factura no válido para nota de crédito');
      }

      // Actualizar tipo de documento
      notaCredito.DocumentoTipo = tipoNotaCredito;

      // Obtener nuevo número de comprobante
      notaCredito.DocumentoNumero = await NotaCreditoService.obtenerProximoNumero(
        tipoNotaCredito,
        notaCredito.DocumentoSucursal
      );

      // 2. Obtener detalle de la factura y cargar items
      const resultado = await FacturaService.obtenerDetalleFactura(
        factura.tipo,
        factura.sucursal,
        factura.numero
      );
      
      if (resultado.success && resultado.data) {
        const { data } = resultado;
        
        // Actualizar referencia de factura
        notaCredito.FacturaReferencia = {
          tipo: factura.tipo,
          sucursal: factura.sucursal,
          numero: factura.numero
        };
        
        // Copiar items de la factura
        notaCredito.Items = data.items.map((item: any) => ({
          CodigoArticulo: item.CodigoArticulo,
          Descripcion: item.Articulo?.Descripcion || '',
          Cantidad: item.Cantidad,
          PrecioUnitario: item.PrecioUnitario / (1 + item.PorcentajeIVA1 / 100),
          PorcentajeIva: item.PorcentajeIVA1,

          PrecioUnitarioConIva: item.PrecioUnitario,
          Total: item.Cantidad * item.PrecioUnitario
        }));
        console.log("notaCredito.Items", notaCredito.Items);
        
        // Actualizar búsqueda y limpiar opciones
        facturaReferenciaBusqueda = factura.label;
        facturasOptions = [];
        
        // Recalcular totales
        calcularTotales();
      } else {
        throw new Error(resultado.error || 'Error al obtener detalle de factura');
      }
    } catch (err) {
      console.error('Error al cargar detalle de factura:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    }
  }

  // Búsqueda de clientes
  async function buscarClientes(busqueda: string) {
    if (timeoutId) clearTimeout(timeoutId);
    if (!busqueda || busqueda.length < 2) {
      clientesOptions = [];
      return;
    }

    clientesLoading = true;
    timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `${PUBLIC_API_URL}/clientes?search=${encodeURIComponent(busqueda)}&limit=10`
        );
        if (!response.ok) throw new Error('Error al buscar clientes');
        
        const data = await response.json();
        clientesOptions = data.items.map((cliente: any) => ({
          codigo: cliente.Codigo,
          descripcion: cliente.Descripcion,
          categoriaIva: cliente.CategoriaIva,
          label: `${cliente.Codigo} - ${cliente.Descripcion}`
        }));
      } catch (error) {
        console.error('Error buscando clientes:', error);
        clientesOptions = [];
      } finally {
        clientesLoading = false;
      }
    }, 300);
  }

  // Búsqueda de artículos
  async function buscarArticulos(busqueda: string) {
    if (!busqueda || busqueda.length < 2) {
      articulosOptions = [];
      return;
    }

    articulosLoading = true;
    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `${PUBLIC_API_URL}/articulos?search=${encodeURIComponent(busqueda)}&limit=10`
        );
        if (!response.ok) throw new Error('Error al buscar artículos');
        
        const data = await response.json();
        articulosOptions = data.items.map((articulo: any) => ({
          codigo: articulo.Codigo,
          descripcion: articulo.Descripcion,
          precio: articulo.Precio,
          iva: articulo.PorcentajeIva,
          label: `${articulo.Codigo} - ${articulo.Descripcion}`
        }));
      } catch (error) {
        console.error('Error buscando artículos:', error);
        articulosOptions = [];
      } finally {
        articulosLoading = false;
      }
    }, 300);
  }

  // Seleccionar artículo
  function seleccionarArticulo(articulo: any) {
    articuloSeleccionado = articulo;
    articuloBusqueda = `${articulo.codigo} - ${articulo.descripcion}`;
    articulosOptions = [];
  }

  // Calcular total de un item
  function calcularTotalItem(item: ItemNotaCredito) {
    item.PrecioUnitarioConIva = item.PrecioUnitario * (1 + item.PorcentajeIva / 100);
    item.Total = item.Cantidad * item.PrecioUnitarioConIva;
    calcularTotales();
  }

  // Calcular totales de la nota de crédito
  function calcularTotales() {
    if (!notaCredito?.Items) return; // Agregar verificación

    let importeBruto = 0;
    let baseImponible1 = 0;
    let baseImponible2 = 0;
    let importeIva1 = 0;
    let importeIva2 = 0;
    
    notaCredito.Items.forEach(item => {
      if (!item) return; // Verificar que el item existe
      
      importeBruto += item.Cantidad * item.PrecioUnitario;
      
      if (item.PorcentajeIva === 21) {
        baseImponible1 += item.Cantidad * item.PrecioUnitario;
        importeIva1 += item.Cantidad * item.PrecioUnitario * 0.21;
      } else if (item.PorcentajeIva === 10.5) {
        baseImponible2 += item.Cantidad * item.PrecioUnitario;
        importeIva2 += item.Cantidad * item.PrecioUnitario * 0.105;
      }
    });
    
    notaCredito.ImporteBruto = importeBruto;
    notaCredito.BaseImponible1 = baseImponible1;
    notaCredito.BaseImponible2 = baseImponible2;
    notaCredito.ImporteIva1 = importeIva1;
    notaCredito.ImporteIva2 = importeIva2;
    notaCredito.ImporteNeto = importeBruto;
    notaCredito.ImporteTotal = importeBruto + importeIva1 + importeIva2;
  }

  // Eliminar item
  function eliminarItem(index: number) {
    notaCredito.Items = notaCredito.Items.filter((_, i) => i !== index);
    calcularTotales();
  }

  // Guardar nota de crédito
  async function guardarNotaCredito() {
    if (!notaCredito.CodigoCliente) {
      error = 'Debe seleccionar un cliente';
      return;
    }

    if (notaCredito.Items.length === 0) {
      error = 'Debe agregar al menos un ítem';
      return;
    }

    try {
      loading = true;
      error = null;
      
      const resultado = await NotaCreditoService.crearNotaCredito(notaCredito);
      
      if (resultado.success) {
        alert('Nota de crédito creada correctamente');
        goto('/ventas/notascredito');
      } else {
        throw new Error(resultado.error || 'Error al crear la nota de crédito');
      }
    } catch (err) {
      console.error('Error al guardar nota de crédito:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  }

  // Función para agregar artículo
  const agregarArticulo = () => {
    if (!articuloSeleccionado) return;
    
    // Validar que los valores necesarios existan
    if (!articuloSeleccionado.codigo || !articuloSeleccionado.precio || !cantidadArticulo) {
      error = 'Faltan datos del artículo o la cantidad';
      return;
    }

    // Validar que la cantidad sea mayor a 0
    if (cantidadArticulo <= 0) {
      error = 'La cantidad debe ser mayor a 0';
      return;
    }

    const nuevoItem: ItemNotaCredito = {
      CodigoArticulo: articuloSeleccionado.codigo,
      Descripcion: articuloSeleccionado.descripcion,
      Cantidad: cantidadArticulo,
      PrecioUnitario: articuloSeleccionado.precio,
      PorcentajeIva: articuloSeleccionado.iva,
      PrecioUnitarioConIva: 0,
      Total: 0
    };

    try {
      // Calcular valores con IVA y total
      calcularTotalItem(nuevoItem);
      
      // Agregar el nuevo item a la lista
    notaCredito.Items = [...notaCredito.Items, nuevoItem];
      error = null; // Limpiar cualquier error previo

    // Resetear selección
    articuloSeleccionado = null;
    articuloBusqueda = '';
    cantidadArticulo = 1;
    } catch (err) {
      console.error('Error al agregar artículo:', err);
      error = 'Error al agregar el artículo';
    }
  };
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">Nueva Nota de Crédito</h1>
    <div class="space-x-2">
      <Button variant="secondary" on:click={() => goto('/ventas/notascredito')}>Cancelar</Button>
      <Button variant="primary" on:click={guardarNotaCredito} disabled={loading}>
        {#if loading}
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        {:else}
          Guardar
        {/if}
      </Button>
    </div>
  </div>

  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {/if}

  <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Tipo de documento -->
      <div>
        <label for="tipoDocumento" class="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Documento
        </label>
        <select
          id="tipoDocumento"
          bind:value={notaCredito.DocumentoTipo}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {#each tiposDocumento as tipo}
            <option value={tipo.value}>{tipo.label}</option>
          {/each}
        </select>
      </div>

      <!-- Número -->
      <div>
        <label for="numeroDocumento" class="block text-sm font-medium text-gray-700 mb-1">
          Número
        </label>
        <input
          id="numeroDocumento"
          type="text"
          readonly
          value={`${notaCredito.DocumentoSucursal}-${notaCredito.DocumentoNumero}`}
          class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
        />
      </div>

      <!-- Fecha -->
      <div>
        <label for="fecha" class="block text-sm font-medium text-gray-700 mb-1">
          Fecha
        </label>
        <input
          id="fecha"
          type="date"
          bind:value={notaCredito.Fecha}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Factura de referencia -->
      <div class="relative">
        <label for="facturaRef" class="block text-sm font-medium text-gray-700 mb-1">
          Factura de Referencia
        </label>
        <input
          id="facturaRef"
          type="text"
          bind:value={facturaReferenciaBusqueda}
          on:input={() => buscarFacturas(facturaReferenciaBusqueda)}
          placeholder="Buscar factura..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {#if facturasLoading}
          <div class="absolute right-3 top-9">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        {/if}
        {#if facturasOptions.length > 0}
          <div class="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md overflow-auto">
            {#each facturasOptions as factura}
              <button
                class="w-full text-left px-4 py-2 hover:bg-gray-100"
                on:click={() => seleccionarFactura(factura)}
              >
                {factura.label}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Cliente -->
      <div class="relative md:col-span-2">  
        <label for="cliente" class="block text-sm font-medium text-gray-700 mb-1">
          Cliente
        </label>
        <input
          id="cliente"
          type="text"
          bind:value={clienteBusqueda}
          on:input={() => buscarClientes(clienteBusqueda)}
          placeholder="Buscar cliente..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {#if clientesLoading}
          <div class="absolute right-3 top-9">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        {/if}
        {#if clientesOptions.length > 0}
          <div class="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md overflow-auto">
            {#each clientesOptions as cliente}
              <button
                class="w-full text-left px-4 py-2 hover:bg-gray-100"
                on:click={() => seleccionarCliente(cliente)}
              >
                {cliente.label}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Items -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 class="text-lg font-bold text-gray-800 mb-4">Ítems</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Artículo
              </th>
              <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cantidad
              </th>
              <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio Unitario
              </th>
              <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Porcentaje Iva
              </th>
              <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio Unitario Con Iva
              </th>
              <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each notaCredito.Items as item, i}
              <tr class={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td class="px-4 py-3 whitespace-nowrap text-sm">{item.CodigoArticulo}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">{item.Descripcion}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  <input
                    type="number"
                    bind:value={item.Cantidad}
                    on:change={() => calcularTotalItem(item)}
                    class="w-20 px-2 py-1 text-right border border-gray-300 rounded-md"
                    min="0"
                    step="1"
                  />
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">${item.PrecioUnitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">{item.PorcentajeIva}%</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">${item.PrecioUnitarioConIva.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">${item.Total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                <td class="px-4 py-3 text-center">
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
    </div>
  </div>
</div>