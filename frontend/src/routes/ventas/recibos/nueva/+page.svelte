<script lang="ts">
  import { onMount } from 'svelte';
  import { PUBLIC_API_URL } from '$env/static/public';
  import Button from '$lib/components/ui/Button.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { formatDate } from '$lib/utils/dateUtils';
  import { EmpresaService } from '$lib/services/EmpresaService';
  import FormasPago from '$lib/components/recibos/FormasPago.svelte';

  // Estado del formulario
  let loading = false;
  let error: string | null = null;
  let success = false;

  // Estado de clientes
  let loadingClientes = false;
  let clientesOptions: any[] = [];
  let clientesLoading = false;
  let clienteSearch = '';
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let clienteSeleccionado: any = null;

  // Estado de documentos de deuda
  let documentosDeuda: any[] = [];
  let loadingDocumentosDeuda = false;
  let errorDocumentosDeuda: string | null = null;
  let documentosSeleccionados: any[] = [];
  let importeTotalPagar = 0;

  // Función para verificar si un documento está seleccionado
  $: documentosSeleccionadosMap = new Map(
    documentosSeleccionados.map(doc => [
      `${doc.DocumentoTipo}-${doc.DocumentoSucursal}-${doc.DocumentoNumero}`,
      true
    ])
  );

  function isDocumentoSeleccionado(doc: any) {
    const key = `${doc.DocumentoTipo}-${doc.DocumentoSucursal}-${doc.DocumentoNumero}`;
    return documentosSeleccionadosMap.has(key);
  }

  // Seleccionar un documento de deuda
  function seleccionarDocumento(doc: any) {
    const key = `${doc.DocumentoTipo}-${doc.DocumentoSucursal}-${doc.DocumentoNumero}`;
    const index = documentosSeleccionados.findIndex(
      d => `${d.DocumentoTipo}-${d.DocumentoSucursal}-${d.DocumentoNumero}` === key
    );
    
    if (index === -1) {
      // Agregar documento a la selección
      documentosSeleccionados = [...documentosSeleccionados, doc];
    } else {
      // Remover documento de la selección
      documentosSeleccionados = documentosSeleccionados.filter((_, i) => i !== index);
    }
    
    // Calcular importe total a pagar
    importeTotalPagar = documentosSeleccionados.reduce((total, doc) => total + (doc.ImporteTotal || 0), 0);
  }

  // Estado de formas de pago
  let formasPago: any[] = [];
  let importeTotalFormasPago = 0;
  let saldoPendiente = 0;

  // Estado de documentos de crédito
  let documentosCredito: any[] = [];
  let loadingDocumentosCredito = false;
  let errorDocumentosCredito: string | null = null;
  let documentosCreditoSeleccionados: any[] = [];
  let importeTotalCredito = 0;

  // Función para verificar si un documento de crédito está seleccionado
  $: documentosCreditoSeleccionadosMap = new Map(
    documentosCreditoSeleccionados.map(doc => [doc.documento, true])
  );

  function isDocumentoCreditoSeleccionado(doc: any) {
    return documentosCreditoSeleccionadosMap.has(doc.documento);
  }

  // Seleccionar documento de crédito
  function seleccionarDocumentoCredito(doc: any) {
    const index = documentosCreditoSeleccionados.findIndex(
      d => d.documento === doc.documento
    );
    
    if (index === -1) {
      // Agregar documento a la selección
      documentosCreditoSeleccionados = [...documentosCreditoSeleccionados, doc];
    } else {
      // Remover documento de la selección
      documentosCreditoSeleccionados = documentosCreditoSeleccionados.filter((_, i) => i !== index);
    }
    
    // Calcular importe total de crédito
    importeTotalCredito = documentosCreditoSeleccionados.reduce((total, doc) => total + doc.saldo, 0);
  }

  // Cargar documentos de crédito de un cliente
  async function cargarDocumentosCredito(codigoCliente: string) {
    if (!codigoCliente) return;
    
    loadingDocumentosCredito = true;
    errorDocumentosCredito = null;
    
    try {
      console.log('Cargando documentos de crédito para cliente:', codigoCliente);
      const response = await fetch(`${PUBLIC_API_URL}/recibos/doccredito/${codigoCliente}`);
      
      if (!response.ok) {
        throw new Error(`Error al cargar documentos de crédito: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Respuesta de documentos de crédito:', data);
      
      if (data.success && Array.isArray(data.data)) {
        documentosCredito = data.data;
        console.log('Documentos de crédito cargados:', documentosCredito.length);
      } else {
        console.error('Formato de respuesta incorrecto:', data);
        documentosCredito = [];
        errorDocumentosCredito = 'Formato de respuesta incorrecto';
      }
    } catch (err) {
      console.error('Error cargando documentos de crédito:', err);
      errorDocumentosCredito = err instanceof Error ? err.message : 'Error desconocido';
      documentosCredito = [];
    } finally {
      loadingDocumentosCredito = false;
      console.log('Estado final de documentosCredito:', documentosCredito);
    }
  }

  // Datos del recibo
  let recibo = {
    DocumentoTipo: 'RCF',
    DocumentoSucursal: '',
    DocumentoNumero: '',
    Fecha: new Date().toISOString().split('T')[0],
    ClienteId: '',
    Observaciones: ''
  };

  // Buscar clientes
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
        console.log("data", data);
        clientesOptions = data.items;
      } catch (error) {
        console.error('Error buscando clientes:', error);
        clientesOptions = [];
      } finally {
        clientesLoading = false;
      }
    }, 300);
  };

  // Seleccionar un cliente
  function seleccionarCliente(cliente: any) {
    console.log('Cliente seleccionado:', cliente);
    clienteSeleccionado = cliente;
    recibo.ClienteId = cliente.Id;
    clienteSearch = cliente.Descripcion;
    clientesOptions = [];
    
    // Cargar documentos de deuda del cliente
    if (cliente.Codigo) {
      console.log('Llamando a cargarDocumentosDeuda con código:', cliente.Codigo);
      cargarDocumentosDeuda(cliente.Codigo);
      
      // Cargar documentos de crédito del cliente
      console.log('Llamando a cargarDocumentosCredito con código:', cliente.Codigo);
      cargarDocumentosCredito(cliente.Codigo);
    } else {
      console.error('El cliente seleccionado no tiene código:', cliente);
      errorDocumentosDeuda = 'El cliente seleccionado no tiene código';
    }
  }

  // Cargar documentos de deuda de un cliente
  async function cargarDocumentosDeuda(codigoCliente: string) {
    if (!codigoCliente) return;
    
    loadingDocumentosDeuda = true;
    errorDocumentosDeuda = null;
    
    try {
      console.log('Cargando documentos de deuda para cliente:', codigoCliente);
      const response = await fetch(`${PUBLIC_API_URL}/recibos/docdeuda/${codigoCliente}`);
      
      if (!response.ok) {
        throw new Error(`Error al cargar documentos de deuda: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Respuesta de documentos de deuda:', data);
      
      if (data.success && Array.isArray(data.data)) {
        documentosDeuda = data.data;
        console.log('Documentos de deuda cargados:', documentosDeuda.length);
        
        // Verificar cada documento para asegurarse de que tenga las propiedades necesarias
        documentosDeuda.forEach((doc, index) => {
          console.log(`Documento ${index}:`, doc);
          if (!doc.ImporteTotal) {
            console.warn(`Documento ${index} no tiene ImporteTotal:`, doc);
            doc.ImporteTotal = 0; // Asignar un valor por defecto
          }
        });
      } else {
        console.error('Formato de respuesta incorrecto:', data);
        documentosDeuda = [];
        errorDocumentosDeuda = 'Formato de respuesta incorrecto';
      }
    } catch (err) {
      console.error('Error cargando documentos de deuda:', err);
      errorDocumentosDeuda = err instanceof Error ? err.message : 'Error desconocido';
      documentosDeuda = [];
    } finally {
      loadingDocumentosDeuda = false;
      console.log('Estado final de documentosDeuda:', documentosDeuda);
    }
  }

  // Obtener próximo número de recibo
  const obtenerProximoNumero = async () => {
    // console.log('obtenerProximoNumero', recibo.DocumentoTipo);
    try {
      const response = await fetch(`${PUBLIC_API_URL}/numeros-control/${recibo.DocumentoTipo}/${recibo.DocumentoSucursal}`);
      if (response.ok) {
        const data = await response.json();
        recibo.DocumentoNumero = data.data.proximoNumero;
        return data.data.proximoNumero;
      }
    } catch (error) {
      console.error('Error obteniendo próximo número:', error);
      error = error instanceof Error ? error.message : 'Error desconocido';
    }
    return null;
  };

  // Cargar datos iniciales
  onMount(async () => {
    try {
      recibo.DocumentoSucursal = await EmpresaService.obtenerSucursal();
      await obtenerProximoNumero();
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    }
  });

  // Manejar cambio de cliente
  const handleClienteChange = (event: Event) => {
    const select = event.target as HTMLSelectElement;
    recibo.ClienteId = select.value;
  };

  // Calcular totales
  $: importeTotalRecibo = importeTotalPagar - importeTotalCredito;
</script>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">Nuevo Recibo</h1>

    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>{error}</p>
      </div>
    {/if}

    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Cliente (mitad izquierda) -->
        <div class="md:col-span-1">
          <label for="cliente" class="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <div class="relative">
            <input
              id="cliente-search"
              type="text"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm pr-10"
              placeholder="Buscar cliente..."
              bind:value={clienteSearch}
              on:input={() => buscarClientes(clienteSearch)}
              autocomplete="off"
            />
            {#if clientesLoading}
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            {/if}
          </div>
          
          <!-- Resultados de búsqueda de clientes -->
          {#if clientesOptions.length > 0}
            <div class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto">
              {#each clientesOptions as cliente}
                <button
                  type="button"
                  class="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  on:click={() => seleccionarCliente(cliente)}
                >
                  <div class="font-medium">{cliente.Descripcion}</div>
                  <div class="text-sm text-gray-500">
                    <span>Código: {cliente.Codigo}</span>
                    {#if cliente.ImporteDeuda !== undefined}
                      <span class="ml-2">Deuda: ${cliente.ImporteDeuda.toFixed(2)}</span>
                    {/if}
                    {#if cliente.ListaPrecio}
                      <span class="ml-2">Lista: {cliente.ListaPrecio}</span>
                    {/if}
                  </div>
                </button>
              {/each}
            </div>
          {/if}
          
          <!-- Cliente seleccionado -->
          {#if clienteSeleccionado}
            <div class="mt-2 p-2 bg-blue-50 rounded-md flex justify-between items-center">
              <div>
                <p class="font-medium">{clienteSeleccionado.Descripcion}</p>
                <p class="text-sm text-gray-600">
                  <span>Código: {clienteSeleccionado.Codigo}</span>
                  {#if clienteSeleccionado.ImporteDeuda !== undefined}
                    <span class="ml-2">Deuda: ${clienteSeleccionado.ImporteDeuda.toFixed(2)}</span>
                  {/if}
                  {#if clienteSeleccionado.ListaPrecio}
                    <span class="ml-2">Lista: {clienteSeleccionado.ListaPrecio}</span>
                  {/if}
                </p>
              </div>
              <button 
                type="button" 
                class="text-sm text-blue-600 hover:text-blue-800"
                on:click={() => { 
                  clienteSeleccionado = null; 
                  recibo.ClienteId = ''; 
                  clienteSearch = ''; 
                  documentosDeuda = [];
                }}
              >
                Cambiar
              </button>
            </div>
          {/if}
        </div>

        <!-- Datos del recibo (mitad derecha) -->
        <div class="md:col-span-1">
          <div class="grid grid-cols-3 gap-4">
            <!-- Tipo de Documento -->
            <div>
              <label for="tipo" class="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
              <Input 
                id="tipo" 
                value={recibo.DocumentoTipo} 
                disabled 
                className="bg-gray-100"
              />
            </div>

            <!-- Número de Documento -->
            <div>
              <label for="numero" class="block text-sm font-medium text-gray-700 mb-1">Número</label>
              <Input 
                id="numero" 
                value={recibo.DocumentoSucursal && recibo.DocumentoNumero ? `${recibo.DocumentoSucursal}-${recibo.DocumentoNumero}` : 'Cargando...'} 
                disabled 
                className="bg-gray-100"
              />
            </div>

            <!-- Fecha -->
            <div>
              <label for="fecha" class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <Input 
                id="fecha" 
                type="date" 
                value={recibo.Fecha} 
                on:input={(e: Event) => recibo.Fecha = (e.target as HTMLInputElement).value}
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Documentos de Deuda -->
      <div class="mt-6 border-t pt-6">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-lg font-medium text-gray-900">1. Documentos de Deuda</h3>
          {#if clienteSeleccionado}
            <button 
              type="button" 
              class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              on:click={() => cargarDocumentosDeuda(clienteSeleccionado.Codigo)}
              disabled={loadingDocumentosDeuda}
            >
              {loadingDocumentosDeuda ? 'Cargando...' : 'Recargar Documentos'}
            </button>
          {/if}
        </div>
        
        {#if !clienteSeleccionado}
          <div class="h-20 flex items-center justify-center bg-gray-100 rounded">
            <span class="text-gray-500">No hay documentos de deuda para este cliente</span>
          </div>
        {:else if loadingDocumentosDeuda}
          <div class="h-20 flex items-center justify-center bg-gray-100 rounded">
            <span class="text-gray-500">Cargando documentos de deuda...</span>
          </div>
        {:else if errorDocumentosDeuda}
          <div class="h-20 flex items-center justify-center bg-red-100 rounded">
            <span class="text-red-500">{errorDocumentosDeuda}</span>
          </div>
        {:else if !documentosDeuda || documentosDeuda.length === 0}
          <div class="h-20 flex items-center justify-center bg-gray-100 rounded">
            <span class="text-gray-500">No hay documentos de deuda para este cliente</span>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importe Total</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importe a Pagar</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each documentosDeuda as doc}
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.DocumentoTipo}-{doc.DocumentoSucursal}-{doc.DocumentoNumero}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(doc.Fecha)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${doc.ImporteTotal ? doc.ImporteTotal.toFixed(2) : '0.00'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      ${doc.ImporteTotal ? doc.ImporteTotal.toFixed(2) : '0.00'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button 
                        type="button" 
                        class={`px-3 py-1 rounded-md ${isDocumentoSeleccionado(doc) ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50'}`}
                        on:click={() => seleccionarDocumento(doc)}
                      >
                        {isDocumentoSeleccionado(doc) ? 'Quitar' : 'Seleccionar'}
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
              <tfoot class="bg-gray-50">
                <tr>
                  <td colspan="3" class="px-6 py-4 text-right text-sm font-medium text-gray-900">Total a Pagar:</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">${importeTotalPagar.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        {/if}
      </div>

      <!-- Formas de Pago -->

        <FormasPago 
          bind:formasPago
          bind:importeTotalFormasPago
          bind:saldoPendiente
          on:change={({ detail }) => {
            formasPago = detail.formasPago;
            importeTotalFormasPago = detail.importeTotalFormasPago;
            saldoPendiente = detail.saldoPendiente;
          }}
        />

      <!-- Documentos de Crédito -->
      <div class="mt-6 border-t pt-6">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-lg font-medium text-gray-900">3. Documentos de Crédito</h3>
          <button 
            type="button" 
            class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            on:click={() => cargarDocumentosCredito(clienteSeleccionado.Codigo)}
            disabled={loadingDocumentosCredito}
          >
            {loadingDocumentosCredito ? 'Cargando...' : 'Recargar Documentos'}
          </button>
        </div>
        
        {#if loadingDocumentosCredito}
          <div class="h-20 flex items-center justify-center bg-gray-100 rounded">
            <span class="text-gray-500">Cargando documentos de crédito...</span>
          </div>
        {:else if errorDocumentosCredito}
          <div class="h-20 flex items-center justify-center bg-red-100 rounded">
            <span class="text-red-500">{errorDocumentosCredito}</span>
          </div>
        {:else if !documentosCredito || documentosCredito.length === 0}
          <div class="h-20 flex items-center justify-center bg-gray-100 rounded">
            <span class="text-gray-500">No hay documentos de crédito para este cliente</span>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importe Utilizado</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each documentosCredito as doc}
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.documento}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(doc.fecha)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${doc.total.toFixed(2)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${doc.importeUtilizado.toFixed(2)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      ${doc.saldo.toFixed(2)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button 
                        type="button" 
                        class={`px-3 py-1 rounded-md ${isDocumentoCreditoSeleccionado(doc) ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50'}`}
                        on:click={() => seleccionarDocumentoCredito(doc)}
                      >
                        {isDocumentoCreditoSeleccionado(doc) ? 'Quitar' : 'Seleccionar'}
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
              <tfoot class="bg-gray-50">
                <tr>
                  <td colspan="4" class="px-6 py-4 text-right text-sm font-medium text-gray-900">Total Crédito:</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">${importeTotalCredito.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        {/if}
      </div>

      <!-- Resumen de Totales -->
      <div class="mt-6 border-t pt-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Resumen de Totales</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-gray-50 p-4 rounded-md">
            <div class="flex justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">Total Documentos de Deuda:</span>
              <span class="text-sm font-medium text-red-600">${importeTotalPagar.toFixed(2)}</span>
            </div>
            <div class="flex justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">Total Documentos de Crédito:</span>
              <span class="text-sm font-medium text-blue-600">-${importeTotalCredito.toFixed(2)}</span>
            </div>
            <div class="flex justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">Total Formas de Pago:</span>
              <span class="text-sm font-medium text-green-600">-${importeTotalFormasPago.toFixed(2)}</span>
            </div>
            <div class="flex justify-between pt-2 border-t">
              <span class="text-sm font-medium text-gray-700">Total a Pagar:</span>
              <span class="text-sm font-medium text-red-600">${importeTotalRecibo.toFixed(2)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm font-medium text-gray-900">Saldo Pendiente:</span>
              <span class="text-sm font-medium {saldoPendiente > 0 ? 'text-red-600' : 'text-green-600'}">
                ${saldoPendiente.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Observaciones -->
      <div class="mt-6">
        <label for="observaciones" class="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
        <textarea 
          id="observaciones" 
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
          rows="3"
          value={recibo.Observaciones}
          on:input={(e: Event) => recibo.Observaciones = (e.target as HTMLTextAreaElement).value}
        ></textarea>
      </div>

      <!-- Botones de acción -->
      <div class="mt-6 flex justify-end gap-3">
        <Button variant="secondary" href="/ventas/recibos">
          Cancelar
        </Button>
        <Button variant="primary">
          Continuar
        </Button>
      </div>
    </div>
  </div>
</div> 