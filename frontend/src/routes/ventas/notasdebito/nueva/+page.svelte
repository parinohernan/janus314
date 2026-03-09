<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto, beforeNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import { navigationState } from '$lib/stores/navigationState';
  import Button from '$lib/components/ui/Button.svelte';
  import { EmpresaService } from '$lib/services/EmpresaService';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { auth } from '$lib/stores/authStore';
  import { get } from 'svelte/store';
  import { confirm } from '$lib/utils/toast';

  // Interfaces
  interface Cliente {
    Codigo: string;
    Descripcion: string;
    CategoriaIva: string;
  }

  interface NotaDebitoItem {
    Descripcion: string;
    Importe: number;
    enEdicion?: boolean;
  }

  const NOTA_DEBITO_NUEVA_PATH = '/ventas/notasdebito/nueva';
  let skipPersist = false;

  // Estado del formulario
  let loading = false;
  let error: string | null = null;
  let success = false;
  let successMessage = '';
  let codigoVendedor: string = '1';
  let codigoUsuario: string = '';

  // Suscripción al store de autenticación
  let unsubscribe = auth.subscribe((state) => {
    if (state.user) {
      codigoVendedor = state.user.usuario || '1';
      codigoUsuario = state.user.usuario || '';
    }
  });

  // Estado de clientes
  let clientesOptions: Cliente[] = [];
  let clientesLoading = false;
  let clienteSearch = '';
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let clienteSeleccionado: Cliente | null = null;

  // Configurar fecha actual
  const hoy = new Date();
  hoy.setHours(hoy.getHours() - 3);
  const fechaFormateada = hoy.toISOString().substring(0, 10);

  // Datos de la nota de débito
  let notaDebito = {
    DocumentoTipo: '',
    DocumentoSucursal: '',
    DocumentoNumero: '',
    Fecha: fechaFormateada,
    ClienteCodigo: '',
    VendedorCodigo: codigoVendedor,
    CodigoUsuario: codigoUsuario,
    ImporteNeto: 0,
    ImporteIva1: 0,
    ImporteTotal: 0,
    ImportePagado: 0
  };

  // Items de la nota de débito
  let items: NotaDebitoItem[] = [];

  // Tipos de documento disponibles
  let tiposDocumento: {value: string, label: string}[] = [];

  // Item en edición
  let nuevoItem: NotaDebitoItem = {
    Descripcion: '',
    Importe: 0
  };
  let editandoItem = false;

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
        const response = await fetchWithAuth('/clientes', {
          params: {
            search: busqueda,
            limit: 10
          }
        });
        
        if (!response.ok) {
          throw new Error('Error al buscar clientes');
        }
        
        const data = await response.json();
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
  function seleccionarCliente(cliente: Cliente) {
    console.log('Cliente seleccionado:', cliente);
    clienteSeleccionado = cliente;
    notaDebito.ClienteCodigo = cliente.Codigo;
    clienteSearch = cliente.Descripcion;
    clientesOptions = [];
    
    // Actualizar tipos de documento según categoría IVA
    actualizarTiposDocumento(cliente.CategoriaIva);
  }

  // Actualizar tipos de documento según categoría IVA del cliente
  const actualizarTiposDocumento = (categoriaIva: string) => {
    tiposDocumento = [];
    
    if (categoriaIva === 'I' || categoriaIva === 'M') {
      // Responsable Inscripto o Monotributista
      tiposDocumento.push({ value: 'NDA', label: 'Nota de Débito A' });
    } else if (categoriaIva === 'F' || categoriaIva === 'E') {
      // Consumidor Final o Exento
      tiposDocumento.push({ value: 'NDB', label: 'Nota de Débito B' });
    }
    
    // Siempre permitir NDF para casos especiales
    tiposDocumento.push({ value: 'NDF', label: 'Nota de Débito F' });
    
    // Limpiar selección de tipo
    notaDebito.DocumentoTipo = '';
  };

  // Obtener próximo número de control
  const obtenerProximoNumero = async () => {
    try {
      const response = await fetchWithAuth(`/numeros-control/${notaDebito.DocumentoTipo}/${notaDebito.DocumentoSucursal}`);
      if (response.ok) {
        const data = await response.json();
        notaDebito.DocumentoNumero = data.data.proximoNumero;
        return data.data.proximoNumero;
      }
    } catch (error) {
      console.error('Error obteniendo próximo número:', error);
      error = error instanceof Error ? error.message : 'Error desconocido';
    }
    return null;
  };

  // Agregar item
  function agregarItem() {
    if (!nuevoItem.Descripcion || nuevoItem.Importe <= 0) {
      error = 'Debe completar la descripción y el importe del item';
      return;
    }

    items = [...items, { ...nuevoItem }];
    
    // Limpiar formulario
    nuevoItem = {
      Descripcion: '',
      Importe: 0
    };
    editandoItem = false;
    
    // Recalcular totales
    recalcularTotales();
    
    error = null;
  }

  // Eliminar item
  function eliminarItem(index: number) {
    items = items.filter((_, i) => i !== index);
    recalcularTotales();
  }

  // Recalcular totales (los importes de los ítems ya tienen IVA incluido)
  function recalcularTotales() {
    const total = items.reduce((sum, item) => sum + (item.Importe || 0), 0);
    
    // Total = suma de ítems (sin sumar 21% extra). Neto e IVA son solo desglose.
    notaDebito.ImporteTotal = parseFloat(total.toFixed(2));
    notaDebito.ImporteNeto = parseFloat((total / 1.21).toFixed(2));
    notaDebito.ImporteIva1 = parseFloat((notaDebito.ImporteTotal - notaDebito.ImporteNeto).toFixed(2));
  }

  // Cancelar
  async function handleCancel() {
    const ok = await confirm('¿Está seguro que desea cancelar? Se perderán todos los datos ingresados.');
    if (ok) {
      skipPersist = true;
      if (browser) navigationState.clearState(NOTA_DEBITO_NUEVA_PATH);
      goto('/ventas/notasdebito');
    }
  }

  beforeNavigate(({ from }) => {
    if (skipPersist) {
      skipPersist = false;
      return;
    }
    if (from?.url.pathname === NOTA_DEBITO_NUEVA_PATH && browser) {
      const currentState = navigationState.getState(NOTA_DEBITO_NUEVA_PATH) || {};
      navigationState.saveState(NOTA_DEBITO_NUEVA_PATH, {
        ...currentState,
        scroll: typeof window !== 'undefined' ? window.scrollY : 0,
        filters: {
          notaDebito: { ...notaDebito },
          items: [...items],
          clienteSearch,
          clienteSeleccionado
        }
      });
    }
  });

  // Grabar nota de débito
  async function handleGrabar() {
    // Validaciones
    if (!clienteSeleccionado) {
      error = 'Debe seleccionar un cliente';
      return;
    }

    if (!notaDebito.DocumentoTipo) {
      error = 'Debe seleccionar un tipo de documento';
      return;
    }

    if (items.length === 0) {
      error = 'Debe agregar al menos un item';
      return;
    }

    loading = true;
    error = null;

    try {
      // Obtener número de control
      await obtenerProximoNumero();

      if (!notaDebito.DocumentoNumero) {
        throw new Error('No se pudo obtener el número de documento');
      }

      // Preparar datos para enviar
      const notaDebitoData = {
        cabeza: {
          DocumentoTipo: notaDebito.DocumentoTipo,
          DocumentoSucursal: notaDebito.DocumentoSucursal,
          DocumentoNumero: notaDebito.DocumentoNumero.toString().padStart(8, '0'),
          ClienteCodigo: notaDebito.ClienteCodigo,
          Fecha: notaDebito.Fecha,
          ImporteTotal: notaDebito.ImporteTotal,
          ImporteNeto: notaDebito.ImporteNeto,
          ImporteIva1: notaDebito.ImporteIva1,
          ImportePagado: 0,
          VendedorCodigo: codigoVendedor,
          CodigoUsuario: codigoUsuario
        },
        items: items.map(item => ({
          Descripcion: item.Descripcion,
          Importe: item.Importe
        }))
      };

      console.log('Enviando nota de débito:', notaDebitoData);

      // Enviar datos al servidor
      const response = await fetchWithAuth('/notasdebito', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notaDebitoData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al grabar la nota de débito');
      }

      // Mostrar mensaje de éxito
      success = true;
      successMessage = 'Nota de débito creada correctamente';
      
      skipPersist = true;
      if (browser) navigationState.clearState(NOTA_DEBITO_NUEVA_PATH);
      // Redirigir después de 2 segundos
      setTimeout(() => {
        goto('/ventas/notasdebito');
      }, 2000);
    } catch (err) {
      console.error('Error al grabar nota de débito:', err);
      error = err instanceof Error ? err.message : 'Error desconocido al grabar la nota de débito';
    } finally {
      loading = false;
    }
  }

  // Cargar datos iniciales
  onMount(async () => {
    try {
      const sucursal = await EmpresaService.obtenerSucursal();
      notaDebito.DocumentoSucursal = sucursal;
      notaDebito.VendedorCodigo = codigoVendedor;
      notaDebito.CodigoUsuario = codigoUsuario;

      // Restaurar estado persistido
      if (browser) {
        const savedState = navigationState.getState(NOTA_DEBITO_NUEVA_PATH);
        const filters = savedState?.filters as {
          notaDebito?: typeof notaDebito;
          items?: NotaDebitoItem[];
          clienteSearch?: string;
          clienteSeleccionado?: Cliente | null;
        } | undefined;
        if (filters?.notaDebito) {
          Object.assign(notaDebito, filters.notaDebito);
          notaDebito.DocumentoSucursal = sucursal; // Mantener sucursal actual
        }
        if (filters?.items && Array.isArray(filters.items) && filters.items.length > 0) {
          items = filters.items;
          recalcularTotales();
        }
        if (filters?.clienteSearch) clienteSearch = filters.clienteSearch;
        if (filters?.clienteSeleccionado) {
          clienteSeleccionado = filters.clienteSeleccionado;
          actualizarTiposDocumento(filters.clienteSeleccionado.CategoriaIva);
        }
        if (savedState?.scroll && typeof window !== 'undefined') {
          requestAnimationFrame(() => window.scrollTo(0, savedState.scroll));
        }
      }
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
      error = err instanceof Error ? err.message : 'Error desconocido';
    }
  });

  // Limpiar suscripción cuando el componente se destruye
  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
</script>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-6xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">Nueva Nota de Débito</h1>

    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>{error}</p>
      </div>
    {/if}

    <div class="bg-white rounded-lg shadow-sm p-6">
      <!-- Encabezado -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <!-- Cliente (mitad izquierda) -->
        <div class="md:col-span-1">
          <label for="cliente" class="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
          <div class="relative">
            <input
              id="cliente-search"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm pr-10"
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
            <div class="absolute z-10 mt-1 w-full bg-white border border-gray-300 shadow-lg rounded-md max-h-60 overflow-auto">
              {#each clientesOptions as cliente}
                <button
                  type="button"
                  class="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  on:click={() => seleccionarCliente(cliente)}
                >
                  <div class="font-medium">{cliente.Descripcion}</div>
                  <div class="text-sm text-gray-500">Código: {cliente.Codigo}</div>
                </button>
              {/each}
            </div>
          {/if}
          
          <!-- Cliente seleccionado -->
          {#if clienteSeleccionado}
            <div class="mt-2 p-2 bg-blue-50 rounded-md flex justify-between items-center">
              <div>
                <p class="font-medium">{clienteSeleccionado.Descripcion}</p>
                <p class="text-sm text-gray-600">Código: {clienteSeleccionado.Codigo}</p>
              </div>
              <button 
                type="button" 
                class="text-sm text-blue-600 hover:text-blue-800"
                on:click={() => { 
                  clienteSeleccionado = null; 
                  notaDebito.ClienteCodigo = ''; 
                  clienteSearch = ''; 
                  tiposDocumento = [];
                  notaDebito.DocumentoTipo = '';
                }}
              >
                Cambiar
              </button>
            </div>
          {/if}
        </div>

        <!-- Datos del documento (mitad derecha) -->
        <div class="md:col-span-1">
          <div class="grid grid-cols-3 gap-4">
            <!-- Tipo de Documento -->
            <div class="col-span-3">
              <label for="tipo" class="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento *</label>
              <select
                id="tipo"
                bind:value={notaDebito.DocumentoTipo}
                disabled={!clienteSeleccionado}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Seleccione un tipo</option>
                {#each tiposDocumento as tipo}
                  <option value={tipo.value}>{tipo.label}</option>
                {/each}
              </select>
            </div>

            <!-- Sucursal -->
            <div>
              <label for="sucursal" class="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
              <input
                id="sucursal"
                type="text"
                value={notaDebito.DocumentoSucursal}
                disabled
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>

            <!-- Fecha -->
            <div class="col-span-2">
              <label for="fecha" class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                id="fecha"
                type="date"
                bind:value={notaDebito.Fecha}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Items -->
      <div class="mt-6 border-t pt-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Items</h3>
        
        <!-- Formulario para agregar item -->
        <div class="bg-gray-50 p-4 rounded-md mb-4">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div class="md:col-span-8">
              <label for="descripcion" class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input
                id="descripcion"
                type="text"
                bind:value={nuevoItem.Descripcion}
                placeholder="Ingrese la descripción del concepto"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div class="md:col-span-3">
              <label for="importe" class="block text-sm font-medium text-gray-700 mb-1">Importe</label>
              <input
                id="importe"
                type="number"
                step="0.01"
                min="0"
                bind:value={nuevoItem.Importe}
                placeholder="0.00"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div class="md:col-span-1 flex items-end">
              <Button variant="primary" on:click={agregarItem} className="w-full">
                Agregar
              </Button>
            </div>
          </div>
        </div>

        <!-- Tabla de items -->
        {#if items.length > 0}
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Importe</th>
                  <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each items as item, index}
                  <tr>
                    <td class="px-6 py-4 text-sm text-gray-900">{item.Descripcion}</td>
                    <td class="px-6 py-4 text-sm text-gray-900 text-right">${item.Importe.toFixed(2)}</td>
                    <td class="px-6 py-4 text-center">
                      <button
                        type="button"
                        on:click={() => eliminarItem(index)}
                        class="text-red-600 hover:text-red-900"
                        aria-label="Eliminar item"
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
        {:else}
          <div class="text-center py-8 bg-gray-50 rounded-md">
            <p class="text-gray-500">No hay items agregados</p>
          </div>
        {/if}
      </div>

      <!-- Totales -->
      <div class="mt-6 border-t pt-6">
        <div class="flex justify-end">
          <div class="w-full md:w-1/2 lg:w-1/3">
            <div class="bg-gray-50 p-4 rounded-md space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Subtotal:</span>
                <span class="font-medium">${notaDebito.ImporteNeto.toFixed(2)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">IVA (21%):</span>
                <span class="font-medium">${notaDebito.ImporteIva1.toFixed(2)}</span>
              </div>
              <div class="flex justify-between text-base font-bold border-t pt-2">
                <span>Total:</span>
                <span>${notaDebito.ImporteTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Botones de acción -->
      <div class="mt-6 flex justify-end gap-3">
        <Button variant="secondary" on:click={handleCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" on:click={handleGrabar} disabled={loading}>
          {loading ? 'Grabando...' : 'Grabar'}
        </Button>
      </div>
    </div>

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
          <p class="text-sm text-gray-500">Redirigiendo al listado...</p>
        </div>
      </div>
    {/if}
  </div>
</div>
