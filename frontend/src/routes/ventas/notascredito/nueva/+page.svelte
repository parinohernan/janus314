<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { NotaCreditoService } from '$lib/services/NotaCreditoService';
  import { EmpresaService } from '$lib/services/EmpresaService';
  import type { NotaCredito, ItemNotaCredito, ClienteNotaCredito } from '$lib/types';
  import Button from '$lib/components/ui/Button.svelte';
  import { formatCurrency } from '$lib/utils/formatters';
  import { PUBLIC_API_URL } from '$env/static/public';

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

  // Tipos de documento disponibles
  const tiposDocumento = [
    { value: 'NCA', label: 'Nota de Crédito A' },
    { value: 'NCB', label: 'Nota de Crédito B' },
    { value: 'NCC', label: 'Nota de Crédito C' }
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

  // Seleccionar factura de referencia
  async function seleccionarFactura(factura: any) {
    try {
      // Obtener detalle completo de la factura
      const response = await fetch(
        `${PUBLIC_API_URL}/facturas/${factura.tipo}/${factura.sucursal}/${factura.numero}`
      );
      
      if (!response.ok) throw new Error('Error al obtener detalle de factura');
      
      const { data } = await response.json();
      
      // Actualizar datos de la nota de crédito
      notaCredito.CodigoCliente = data.encabezado.ClienteCodigo;
      notaCredito.Cliente = data.encabezado.Cliente;
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
        PrecioUnitario: item.PrecioUnitario,
        PorcentajeIva: item.PorcentajeIva,
        PrecioUnitarioConIva: item.PrecioUnitarioConIva,
        Total: item.Total
      }));
      
      // Limpiar búsqueda y opciones
      facturaReferenciaBusqueda = factura.label;
      facturasOptions = [];
      
      // Recalcular totales
      calcularTotales();
    } catch (error) {
      console.error('Error al cargar detalle de factura:', error);
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

  // Seleccionar cliente
  function seleccionarCliente(cliente: any) {
    notaCredito.CodigoCliente = cliente.codigo;
    const clienteNC: ClienteNotaCredito = {
      Codigo: cliente.codigo,
      Descripcion: cliente.descripcion,
      CategoriaIva: cliente.categoriaIva
    };
    notaCredito.Cliente = clienteNC;
    clienteBusqueda = cliente.label;
    clientesOptions = [];
    
    // Actualizar tipo de documento según categoría IVA
    actualizarTipoDocumento(cliente.categoriaIva);
  }

  // Actualizar tipo de documento según IVA
  function actualizarTipoDocumento(categoriaIva: string) {
    switch (categoriaIva) {
      case 'RI':
        notaCredito.DocumentoTipo = 'NCA';
        break;
      case 'CF':
      case 'EX':
      case 'NI':
        notaCredito.DocumentoTipo = 'NCB';
        break;
      case 'MT':
        notaCredito.DocumentoTipo = 'NCC';
        break;
      default:
        notaCredito.DocumentoTipo = 'NCB';
    }
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
    if (itemEnEdicion) {
      itemEnEdicion.CodigoArticulo = articulo.codigo;
      itemEnEdicion.Descripcion = articulo.descripcion;
      itemEnEdicion.PrecioUnitario = articulo.precio;
      itemEnEdicion.PorcentajeIva = articulo.iva;
      calcularTotalItem(itemEnEdicion);
    } else {
      const nuevoItem: ItemNotaCredito = {
        CodigoArticulo: articulo.codigo,
        Descripcion: articulo.descripcion,
        Cantidad: 1,
        PrecioUnitario: articulo.precio,
        PorcentajeIva: articulo.iva,
        PrecioUnitarioConIva: articulo.precio * (1 + articulo.iva / 100),
        Total: articulo.precio * (1 + articulo.iva / 100),
        enEdicion: true
      };
      notaCredito.Items = [...notaCredito.Items, nuevoItem];
    }
    articuloBusqueda = '';
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
  </div>

  <!-- Items -->
  <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
    <h2 class="text-lg font-semibold text-gray-800 mb-4">Items</h2>
    
    {#if notaCredito?.Items}
      <!-- Tabla de items -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">IVA %</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each notaCredito.Items as item, i}
              <tr>
                <td class="px-4 py-3 whitespace-nowrap">{item.CodigoArticulo}</td>
                <td class="px-4 py-3">{item.Descripcion}</td>
                <td class="px-4 py-3 text-right">
                  <input
                    type="number"
                    bind:value={item.Cantidad}
                    on:change={() => calcularTotalItem(item)}
                    class="w-20 px-2 py-1 text-right border border-gray-300 rounded-md"
                    min="0"
                    step="1"
                  />
                </td>
                <td class="px-4 py-3 text-right">{formatCurrency(item.PrecioUnitario)}</td>
                <td class="px-4 py-3 text-right">{item.PorcentajeIva}%</td>
                <td class="px-4 py-3 text-right">{formatCurrency(item.Total)}</td>
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
            
            <!-- Fila para agregar nuevo item -->
            <tr class="bg-gray-50">
              <td colspan="7" class="px-4 py-3">
                <div class="relative">
                  <input
                    type="text"
                    bind:value={articuloBusqueda}
                    on:input={() => buscarArticulos(articuloBusqueda)}
                    placeholder="Buscar artículo para agregar..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {#if articulosLoading}
                    <div class="absolute right-3 top-2">
                      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  {/if}
                  {#if articulosOptions.length > 0}
                    <div class="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md overflow-auto">
                      {#each articulosOptions as articulo}
                        <button
                          class="w-full text-left px-4 py-2 hover:bg-gray-100"
                          on:click={() => seleccionarArticulo(articulo)}
                        >
                          {articulo.label}
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <!-- Totales -->
  <div class="bg-white rounded-lg shadow-sm p-6">
    <div class="flex flex-col items-end space-y-2">
      <div class="text-sm">
        <span class="font-medium">Subtotal:</span>
        <span class="ml-4">{formatCurrency(notaCredito?.ImporteBruto || 0)}</span>
      </div>
      <div class="text-sm">
        <span class="font-medium">IVA 21%:</span>
        <span class="ml-4">{formatCurrency(notaCredito?.ImporteIva1 || 0)}</span>
      </div>
      <div class="text-sm">
        <span class="font-medium">IVA 10.5%:</span>
        <span class="ml-4">{formatCurrency(notaCredito?.ImporteIva2 || 0)}</span>
      </div>
      <div class="text-lg font-bold">
        <span>Total:</span>
        <span class="ml-4">{formatCurrency(notaCredito?.ImporteTotal || 0)}</span>
      </div>
    </div>
  </div>
</div> 