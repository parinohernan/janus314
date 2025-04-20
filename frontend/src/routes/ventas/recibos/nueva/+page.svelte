<script lang="ts">
  import { onMount } from 'svelte';
  import { PUBLIC_API_URL } from '$env/static/public';
  import Button from '$lib/components/ui/Button.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { formatDate } from '$lib/utils/dateUtils';
  import { EmpresaService } from '$lib/services/EmpresaService';
  import FormasPago from '$lib/components/recibos/FormasPago.svelte';
  import { goto } from '$app/navigation';

  // Estado del formulario
  let loading = false;
  let error: string | null = null;
  let success = false;
  let successMessage = '';
  let showCancelConfirm = false;

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
  let importesEditados: Record<string, number> = {};
  let erroresImportes: Record<string, boolean> = {};

  // Función para verificar si un documento está seleccionado
  $: documentosSeleccionadosMap = new Map(
    documentosSeleccionados.map(doc => [
      `${doc.DocumentoTipo}-${doc.DocumentoSucursal}-${doc.DocumentoNumero}`,
      true
    ])
  );

  function isDocumentoSeleccionado(doc: any) {
    const key = getDocumentoKey(doc);
    return documentosSeleccionadosMap.has(key);
  }

  // Función para obtener la clave única de un documento
  function getDocumentoKey(doc: any) {
    return `${doc.DocumentoTipo}-${doc.DocumentoSucursal}-${doc.DocumentoNumero}`;
  }

  // Función para obtener el importe a pagar de un documento
  function getImportePagar(doc: any) {
    const key = getDocumentoKey(doc);
    return importesEditados[key] !== undefined ? importesEditados[key] : (doc.ImporteTotal - (doc.ImportePagado || 0));
  }

  // Función para verificar si hay error en el importe a pagar
  function hayErrorImportePagar(doc: any) {
    const key = getDocumentoKey(doc);
    return erroresImportes[key] === true;
  }

  // Función para actualizar el importe a pagar
  function updateImportePagar(doc: any, nuevoImporte: number) {
    const key = getDocumentoKey(doc);
    let saldoPendiente = doc.ImporteTotal - (doc.ImportePagado || 0);
    
    // Validar que el importe no sea mayor al saldo pendiente
    if (nuevoImporte > saldoPendiente) {
      erroresImportes[key] = true;
      nuevoImporte = saldoPendiente;
    } else {
      erroresImportes[key] = false;
    }
    
    importesEditados[key] = nuevoImporte;
    
    // Recalcular el total a pagar
    importeTotalPagar = documentosSeleccionados.reduce((total, doc) => {
      const key = getDocumentoKey(doc);
      return total + (importesEditados[key] !== undefined ? importesEditados[key] : (doc.ImporteTotal - (doc.ImportePagado || 0)));
    }, 0);
    
    // Actualizar saldo pendiente
    saldoPendiente = importeTotalPagar - importeTotalCredito - importeTotalFormasPago;
  }

  // Seleccionar un documento de deuda
  function seleccionarDocumento(doc: any) {
    const key = getDocumentoKey(doc);
    const index = documentosSeleccionados.findIndex(
      d => getDocumentoKey(d) === key
    );
    
    if (index === -1) {
      // Agregar documento a la selección
      documentosSeleccionados = [...documentosSeleccionados, doc];
      
      // Inicializar el importe editado con el saldo pendiente
      importesEditados[key] = doc.ImporteTotal - (doc.ImportePagado || 0);
      erroresImportes[key] = false;
    } else {
      // Remover documento de la selección
      documentosSeleccionados = documentosSeleccionados.filter((_, i) => i !== index);
      
      // Eliminar el importe editado
      delete importesEditados[key];
      delete erroresImportes[key];
    }
    
    // Calcular importe total a pagar
    importeTotalPagar = documentosSeleccionados.reduce((total, doc) => {
      const key = getDocumentoKey(doc);
      return total + (importesEditados[key] !== undefined ? importesEditados[key] : (doc.ImporteTotal - (doc.ImportePagado || 0)));
    }, 0);
    
    // Actualizar saldo pendiente
    saldoPendiente = importeTotalPagar - importeTotalCredito - importeTotalFormasPago;
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
  let importesCreditoEditados: Record<string, number> = {};
  let erroresImportesCredito: Record<string, boolean> = {};

  // Función para verificar si un documento de crédito está seleccionado
  $: documentosCreditoSeleccionadosMap = new Map(
    documentosCreditoSeleccionados.map(doc => [doc.documento, true])
  );

  function isDocumentoCreditoSeleccionado(doc: any) {
    return documentosCreditoSeleccionadosMap.has(doc.documento);
  }

  // Función para obtener el importe a usar de un documento de crédito
  function getImporteCreditoUsar(doc: any) {
    return importesCreditoEditados[doc.documento] !== undefined ? importesCreditoEditados[doc.documento] : doc.saldo;
  }

  // Función para verificar si hay error en el importe a usar de crédito
  function hayErrorImporteCreditoUsar(doc: any) {
    return erroresImportesCredito[doc.documento] === true;
  }

  // Función para actualizar el importe a usar de un documento de crédito
  function updateImporteCreditoUsar(doc: any, nuevoImporte: number) {
    // Validar que el importe no sea mayor al saldo
    if (nuevoImporte > doc.saldo) {
      erroresImportesCredito[doc.documento] = true;
      nuevoImporte = doc.saldo;
    } else {
      erroresImportesCredito[doc.documento] = false;
    }
    
    importesCreditoEditados[doc.documento] = nuevoImporte;
    
    // Recalcular el total de crédito
    importeTotalCredito = documentosCreditoSeleccionados.reduce((total, doc) => {
      return total + (importesCreditoEditados[doc.documento] !== undefined ? importesCreditoEditados[doc.documento] : doc.saldo);
    }, 0);
    
    // Actualizar saldo pendiente
    saldoPendiente = importeTotalPagar - importeTotalCredito - importeTotalFormasPago;
  }

  // Seleccionar documento de crédito
  function seleccionarDocumentoCredito(doc: any) {
    const index = documentosCreditoSeleccionados.findIndex(
      d => d.documento === doc.documento
    );
    
    if (index === -1) {
      // Agregar documento a la selección
      documentosCreditoSeleccionados = [...documentosCreditoSeleccionados, doc];
      
      // Inicializar el importe editado con el saldo
      importesCreditoEditados[doc.documento] = doc.saldo;
      erroresImportesCredito[doc.documento] = false;
    } else {
      // Remover documento de la selección
      documentosCreditoSeleccionados = documentosCreditoSeleccionados.filter((_, i) => i !== index);
      
      // Eliminar el importe editado
      delete importesCreditoEditados[doc.documento];
      delete erroresImportesCredito[doc.documento];
    }
    
    // Calcular importe total de crédito
    importeTotalCredito = documentosCreditoSeleccionados.reduce((total, doc) => {
      return total + (importesCreditoEditados[doc.documento] !== undefined ? importesCreditoEditados[doc.documento] : doc.saldo);
    }, 0);
    
    // Actualizar saldo pendiente
    saldoPendiente = importeTotalPagar - importeTotalCredito - importeTotalFormasPago;
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
  $: saldoPendiente = importeTotalPagar - importeTotalCredito - importeTotalFormasPago;

  // Función para cancelar
  function handleCancel() {
    showCancelConfirm = true;
  }

  // Función para confirmar cancelación
  function confirmCancel() {
    showCancelConfirm = false;
    goto('/ventas/recibos');
  }

  // Función para grabar recibo
  async function handleGrabar() {
    if (!clienteSeleccionado) {
      error = 'Debe seleccionar un cliente';
      return;
    }

    if (documentosSeleccionados.length === 0) {
      error = 'Debe seleccionar al menos un documento de deuda';
      return;
    }

    if (formasPago.length === 0) {
      error = 'Debe agregar al menos una forma de pago';
      return;
    }

    // Verificar si hay errores en los importes
    const hayErroresImportes = Object.values(erroresImportes).some(valor => valor === true);
    const hayErroresImportesCredito = Object.values(erroresImportesCredito).some(valor => valor === true);
    
    if (hayErroresImportes || hayErroresImportesCredito) {
      error = 'Hay importes que exceden los límites permitidos';
      return;
    }

    if (saldoPendiente > 0) {
      error = 'El saldo pendiente debe ser cero';
      return;
    }

    loading = true;
    error = null;

    try {
      // Preparar datos del recibo
      //recibo.DocumentoNumero = recibo.DocumentoNumero.toString().padStart(8, '0');
      const reciboData = {
        ...recibo,
        DocumentoNumero : recibo.DocumentoNumero.toString().padStart(8, '0'),
        CodigoCliente: clienteSeleccionado.Codigo,
        DocumentosDeuda: documentosSeleccionados.map(doc => {
          const key = getDocumentoKey(doc);
          return {
            DocumentoTipo: doc.DocumentoTipo,
            DocumentoSucursal: doc.DocumentoSucursal,
            DocumentoNumero: doc.DocumentoNumero.toString().padStart(8, '0'),
            Importe: importesEditados[key] !== undefined ? importesEditados[key] : doc.ImporteTotal
          };
        }),
        DocumentosCredito: documentosCreditoSeleccionados.map(doc => ({
          Documento: doc.documento,
          Importe: importesCreditoEditados[doc.documento] !== undefined ? importesCreditoEditados[doc.documento] : doc.saldo
        })),
        FormasPago: formasPago.map(fp => ({
          Codigo: fp.codigo,
          Descripcion: fp.descripcion,
          Banco: fp.banco,
          Numero: fp.numero,
          Fecha: fp.fecha,
          Importe: fp.importe
        })),
        ImporteTotal: importeTotalPagar
      };
      console.log('reciboData', reciboData);
      // Enviar datos al servidor
      const response = await fetch(`${PUBLIC_API_URL}/recibos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reciboData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al grabar el recibo');
      }

      // Mostrar mensaje de éxito
      success = true;
      successMessage = 'Recibo grabado correctamente';
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        goto('/ventas/recibos');
      }, 2000);
    } catch (err) {
      console.error('Error al grabar recibo:', err);
      error = err instanceof Error ? err.message : 'Error desconocido al grabar el recibo';
    } finally {
      loading = false;
    }
  }
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
          <h3 class="text-lg font-medium text-gray-900">Documentos de Deuda</h3>
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
                      {#if isDocumentoSeleccionado(doc)}
                        <div class="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={doc.ImporteTotal - (doc.ImportePagado || 0)}
                            class={`w-24 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm ${hayErrorImportePagar(doc) ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                            value={getImportePagar(doc).toFixed(2)}
                            on:input={(e) => updateImportePagar(doc, parseFloat((e.target as HTMLInputElement).value) || 0)}
                          />
                          {#if hayErrorImportePagar(doc)}
                            <div class="absolute z-10 mt-1 w-48 bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded text-xs">
                              El importe no puede exceder ${(doc.ImporteTotal - (doc.ImportePagado || 0)).toFixed(2)}
                            </div>
                          {/if}
                        </div>
                      {:else}
                        ${(doc.ImporteTotal - (doc.ImportePagado || 0)).toFixed(2)}
                      {/if}
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

      <!-- Documentos de Crédito -->
      <div class="mt-6 border-t pt-6">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-lg font-medium text-gray-900">Documentos de Crédito</h3>
          {#if clienteSeleccionado}
            <button 
              type="button" 
              class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              on:click={() => cargarDocumentosCredito(clienteSeleccionado.Codigo)}
              disabled={loadingDocumentosCredito}
            >
              {loadingDocumentosCredito ? 'Cargando...' : 'Recargar Documentos'}
            </button>
          {/if}
        </div>
        
        {#if !clienteSeleccionado}
          <div class="h-20 flex items-center justify-center bg-gray-100 rounded">
            <span class="text-gray-500">No hay documentos de crédito para este cliente</span>
          </div>
        {:else if loadingDocumentosCredito}
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
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importe a Usar</th>
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
                      ${doc.saldo.toFixed(2)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {#if isDocumentoCreditoSeleccionado(doc)}
                        <div class="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={doc.saldo}
                            class={`w-24 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm ${hayErrorImporteCreditoUsar(doc) ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                            value={getImporteCreditoUsar(doc).toFixed(2)}
                            on:input={(e) => updateImporteCreditoUsar(doc, parseFloat((e.target as HTMLInputElement).value) || 0)}
                          />
                          {#if hayErrorImporteCreditoUsar(doc)}
                            <div class="absolute z-10 mt-1 w-48 bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded text-xs">
                              El importe no puede exceder ${doc.saldo.toFixed(2)}
                            </div>
                          {/if}
                        </div>
                      {:else}
                        ${doc.saldo.toFixed(2)}
                      {/if}
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

      <!-- Formas de Pago -->
      <!-- <div class="mt-6 border-t pt-6">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-lg font-medium text-gray-900">3. Formas de Pago</h3>
        </div> -->

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
      <!-- </div> -->

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

      <!-- Observaciones
      <div class="mt-6">
        <label for="observaciones" class="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
        <textarea 
          id="observaciones" 
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
          rows="3"
          value={recibo.Observaciones}
          on:input={(e: Event) => recibo.Observaciones = (e.target as HTMLTextAreaElement).value}
        ></textarea>
      </div> -->

      <!-- Botones de acción -->
      <div class="mt-6 flex justify-end gap-3">
        <Button variant="secondary" on:click={handleCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" on:click={handleGrabar} disabled={loading}>
          {loading ? 'Grabando...' : 'Grabar'}
        </Button>
      </div>

      <!-- Modal de confirmación de cancelación -->
      {#if showCancelConfirm}
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 class="text-lg font-medium text-gray-900 mb-4">¿Está seguro que desea cancelar?</h3>
            <p class="text-sm text-gray-500 mb-6">Se perderán todos los datos ingresados.</p>
            <div class="flex justify-end gap-3">
              <Button variant="secondary" on:click={() => showCancelConfirm = false}>
                No, continuar editando
              </Button>
              <Button variant="primary" on:click={confirmCancel}>
                Sí, cancelar
              </Button>
            </div>
          </div>
        </div>
      {/if}

      <!-- Mensaje de éxito -->
      {#if success}
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full text-center">
            <div class="text-green-500 mb-4">
              <svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">{successMessage}</h3>
            <p class="text-sm text-gray-500">Redirigiendo a la lista de recibos...</p>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div> 