<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { PUBLIC_API_URL } from '$env/static/public';
  import EntitySelector from '$lib/components/ui/EntitySelector.svelte';
  import type { Cliente } from '$lib/types/cliente';
  
  let isEditing = $page.params.id !== 'nuevo';
  
  interface CategoriaIva {
    Codigo: string;
    Descripcion: string;
  }
  
  interface Provincia {
    Codigo: string;
    Descripcion: string;
  }
  
  interface CodigoPostal {
    Codigo: string;
    Descripcion: string;
  }
  
  // Inicializar cliente vacío
  let cliente: Cliente = {
    Codigo: '',
    Descripcion: '',
    NombreFantasia: '',
    Cuit: '',
    Calle: '',
    Numero: '',
    Piso: '',
    Departamento: '',
    ProvinciaCodigo: '',
    CodigoPostal: '',
    Localidad: '',
    ContactoNombre: '',
    Mail: '',
    Telefono: '',
    TelefonoMovil: '',
    ContactoComercial: '',
    CategoriaIva: '',
    ListaPrecio: '',
    ImporteDeuda: 0,
    CodigoVendedor: '',
    Actualizado: 0,
    SaldoNTCNoAplicado: 0,
    Activo: 1,
    LimiteCredito: 0,
    CanalCodigo: '',
    FechaDeAlta: '',
    FechaDeBaja: '',
    TransporteCodigo: '',
    DirEntregaCalle: '',
    DirEntregaNumero: '',
    DirEntregaPiso: '',
    DirEntregaDpto: '',
    DirEntregaProvinciaCodigo: '',
    DirEntregaLocalidadCodigo: '',
    CondicionVentaCodigo: '',
    PorcentajeBonificacionGeneral: 0,
    GrupoPercepcionIIBBCodigo: '',
    PorcentajePercepcionIIBB: 0,
    GrupoCodigo: '',
    cant_facturas_impagas_max: 0,
    ZonaCodigo: '',
    InvCuentaVentas: null,
    CliCuentaCredito: null,
    TipoDocumento: '',
    CodigoLocalidad: ''
  };
  
  // Listas para selects
  let categoriasIva: CategoriaIva[] = [];
  let provincias: Provincia[] = [];
  let codigosPostales: CodigoPostal[] = [];
  let vendedoresOptions: { value: string, label: string }[] = [];
  let vendedoresLoading = false;
  
  let loading = true;
  let error: string | null = null;
  let successMessage: string | null = null;
  let formErrors: Record<string, string> = {};
  
  // Cargar datos
  onMount(async () => {
    try {
      loading = true;
      error = null;
      successMessage = null;
      
      // Si estamos en modo edición, cargar los datos del cliente
      if (isEditing) {
        const response = await fetch(`${PUBLIC_API_URL}/clientes/${$page.params.id}`);
        if (!response.ok) throw new Error('Error al cargar los datos del cliente');
        cliente = await response.json();
      } else {
        // Si es un nuevo cliente, establecer la fecha de alta al día actual
        cliente.FechaDeAlta = new Date().toISOString().split('T')[0];
      }
      
      // Cargar categorías IVA
      const responseCategorias = await fetch(`${PUBLIC_API_URL}/categoriasiva`);
      if (responseCategorias.ok) {
        const data = await responseCategorias.json();
        categoriasIva = data.items || [];
      }
      
      // Cargar provincias
      const responseProvincias = await fetch(`${PUBLIC_API_URL}/provincias`);
      if (responseProvincias.ok) {
        const data = await responseProvincias.json();
        provincias = data.items || [];
      }
      
      // Cargar códigos postales
      const responseCP = await fetch(`${PUBLIC_API_URL}/localidades`);
      if (responseCP.ok) {
        const data = await responseCP.json();
        codigosPostales = data.items || [];
      }

      // Cargar vendedores
      try {
        const responseVendedores = await fetch(`${PUBLIC_API_URL}/vendedores`);
        if (responseVendedores.ok) {
          const {data} = await responseVendedores.json();
          if (data && Array.isArray(data)) {
            vendedoresOptions = data
              .filter((item: { Codigo: string, Descripcion: string, Activo: number }) => item.Activo == 1)
              .map((item: { Codigo: string, Descripcion: string }) => ({
                value: item.Codigo || '',
                label: item.Descripcion || 'Sin nombre'
              }));
          }
        }
      } catch (error) {
        console.error('Error cargando vendedores:', error);
        vendedoresOptions = [];
      }
      
    } catch (err: unknown) {
      console.error('Error cargando datos:', err);
      if (err instanceof Error) {
        error = err.message;
      } else {
        error = 'Error desconocido';
      }
    } finally {
      loading = false;
    }
  });
  
  // Función para validar el formulario
  const validateForm = (): boolean => {
    formErrors = {};
    
    if (!cliente.Codigo) formErrors.Codigo = 'El código es obligatorio';
    if (!cliente.Descripcion) formErrors.Descripcion = 'La razón social es obligatoria';
    if (!cliente.CategoriaIva) formErrors.CategoriaIva = 'La categoría IVA es obligatoria';
    if (!cliente.Cuit) formErrors.Cuit = 'El CUIT es obligatorio';
    if (!cliente.Calle) formErrors.Calle = 'La calle es obligatoria';
    if (!cliente.Numero) formErrors.Numero = 'El número es obligatorio';
    if (!cliente.ProvinciaCodigo) formErrors.ProvinciaCodigo = 'La provincia es obligatoria';
    if (!cliente.CodigoPostal) formErrors.CodigoPostal = 'La localidad es obligatoria';
    if (!cliente.CodigoVendedor) formErrors.CodigoVendedor = 'El vendedor es obligatorio';
    if (!cliente.ListaPrecio) formErrors.ListaPrecio = 'La lista de precio es obligatoria';

    return Object.keys(formErrors).length === 0;
  };
  
  // Guardar cliente
  const handleSubmit = async (event: Event): Promise<void> => {
    event.preventDefault();
    
    if (!validateForm()) {
      error = 'Por favor complete todos los campos obligatorios';
      return;
    }
    
    try {
      loading = true;
      error = null;
      successMessage = null;
      
      const url = isEditing 
        ? `${PUBLIC_API_URL}/clientes/${$page.params.id}` 
        : `${PUBLIC_API_URL}/clientes`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cliente)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en la operación');
      }
      
      const data = await response.json();
      
      // Actualizar el cliente con los datos del servidor
      cliente = data;
      
      successMessage = isEditing 
        ? `Cliente "${cliente.Codigo}" actualizado correctamente` 
        : `Cliente "${cliente.Codigo}" creado correctamente`;
      
      // Si es nuevo, redirigir a la página de edición
      if (!isEditing) {
        goto(`/clientes/${cliente.Codigo}`, { replaceState: true });
        isEditing = true;
      }
      goto('/clientes', { replaceState: true });
    } catch (err: unknown) {
      console.error('Error guardando cliente:', err);
      if (err instanceof Error) {
        error = err.message;
      } else {
        error = 'Error desconocido';
      }
    } finally {
      loading = false;
    }
  };

  $: clienteActivo = cliente?.Activo === 1;
  $: if (cliente && typeof clienteActivo !== 'undefined') {
    cliente.Activo = clienteActivo ? 1 : 0;
  }
</script>

<svelte:head>
  <title>{isEditing ? 'Editar' : 'Nuevo'} Cliente</title>
</svelte:head>

<div class="container mx-auto p-4">
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h1 class="text-2xl font-bold mb-6">{isEditing ? 'Editar' : 'Nuevo'} Cliente</h1>
    
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
    
    {#if loading}
      <div class="flex justify-center items-center h-40">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    {:else}
      <form on:submit={handleSubmit}>
        <div class="space-y-6">
          <!-- Datos principales - Sección 1 -->
          <div>
            <h2 class="text-lg font-medium mb-3 text-gray-800 border-b pb-2">Datos principales</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label for="codigo" class="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  id="codigo"
                  bind:value={cliente.Codigo}
                  required
                  disabled={isEditing}
                  maxlength="8"
                  class="w-full px-3 py-2 border {formErrors.Codigo ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                {#if formErrors.Codigo}
                  <p class="mt-1 text-sm text-red-600">{formErrors.Codigo}</p>
                {/if}
              </div>
              
              <div>
                <label for="descripcion" class="block text-sm font-medium text-gray-700 mb-1">
                  Razón Social *
                </label>
                <input
                  type="text"
                  id="descripcion"
                  bind:value={cliente.Descripcion}
                  required
                  maxlength="50"
                  class="w-full px-3 py-2 border {formErrors.Descripcion ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {#if formErrors.Descripcion}
                  <p class="mt-1 text-sm text-red-600">{formErrors.Descripcion}</p>
                {/if}
              </div>
              
              <div>
                <label for="nombreFantasia" class="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Fantasía
                </label>
                <input
                  type="text"
                  id="nombreFantasia"
                  bind:value={cliente.NombreFantasia}
                  maxlength="80"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label for="categoriaIva" class="block text-sm font-medium text-gray-700 mb-1">
                  Categoría IVA *
                </label>
                <select
                  id="categoriaIva"
                  bind:value={cliente.CategoriaIva}
                  required
                  class="w-full px-3 py-2 border {formErrors.CategoriaIva ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione...</option>
                  {#each categoriasIva as categoria}
                    <option value={categoria.Codigo}>{categoria.Descripcion}</option>
                  {/each}
                </select>
                {#if formErrors.CategoriaIva}
                  <p class="mt-1 text-sm text-red-600">{formErrors.CategoriaIva}</p>
                {/if}
              </div>
              
              <div>
                <label for="cuit" class="block text-sm font-medium text-gray-700 mb-1">
                  CUIT *
                </label>
                <input
                  type="text"
                  id="cuit"
                  bind:value={cliente.Cuit}
                  required
                  maxlength="11"
                  class="w-full px-3 py-2 border {formErrors.Cuit ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {#if formErrors.Cuit}
                  <p class="mt-1 text-sm text-red-600">{formErrors.Cuit}</p>
                {/if}
              </div>
              
              <div>
                <label class="flex items-center cursor-pointer">
                  <div class="relative">
                    <input
                      type="checkbox"
                      checked={cliente.Activo === 1}
                      on:change={(e) => {
                        const target = e.target as HTMLInputElement;
                        cliente.Activo = target.checked ? 1 : 0;
                      }}
                      class="sr-only"
                    />
                    <div class="block bg-gray-200 w-14 h-8 rounded-full"></div>
                    <div class="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform {cliente.Activo === 1 ? 'translate-x-6 bg-blue-500' : ''}"></div>
                  </div>
                  <div class="ml-3 text-sm font-medium text-gray-700">
                    {cliente.Activo === 1 ? 'Activo' : 'Inactivo'}
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          <!-- Dirección -->
          <div>
            <h2 class="text-lg font-medium mb-3 text-gray-800 border-b pb-2">Dirección</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label for="calle" class="block text-sm font-medium text-gray-700 mb-1">
                  Calle *
                </label>
                <input
                  type="text"
                  id="calle"
                  bind:value={cliente.Calle}
                  required
                  maxlength="50"
                  class="w-full px-3 py-2 border {formErrors.Calle ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {#if formErrors.Calle}
                  <p class="mt-1 text-sm text-red-600">{formErrors.Calle}</p>
                {/if}
              </div>
              
              <div>
                <label for="numero" class="block text-sm font-medium text-gray-700 mb-1">
                  Número *
                </label>
                <input
                  type="text"
                  id="numero"
                  bind:value={cliente.Numero}
                  required
                  maxlength="15"
                  class="w-full px-3 py-2 border {formErrors.Numero ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {#if formErrors.Numero}
                  <p class="mt-1 text-sm text-red-600">{formErrors.Numero}</p>
                {/if}
              </div>
              
              <div>
                <label for="piso" class="block text-sm font-medium text-gray-700 mb-1">
                  Piso
                </label>
                <input
                  type="text"
                  id="piso"
                  bind:value={cliente.Piso}
                  maxlength="10"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label for="departamento" class="block text-sm font-medium text-gray-700 mb-1">
                  Departamento
                </label>
                <input
                  type="text"
                  id="departamento"
                  bind:value={cliente.Departamento}
                  maxlength="10"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label for="provinciaCodigo" class="block text-sm font-medium text-gray-700 mb-1">
                  Provincia *
                </label>
                <select
                  id="provinciaCodigo"
                  bind:value={cliente.ProvinciaCodigo}
                  required
                  class="w-full px-3 py-2 border {formErrors.ProvinciaCodigo ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione...</option>
                  {#each provincias as provincia}
                    <option value={provincia.Codigo}>{provincia.Descripcion}</option>
                  {/each}
                </select>
                {#if formErrors.ProvinciaCodigo}
                  <p class="mt-1 text-sm text-red-600">{formErrors.ProvinciaCodigo}</p>
                {/if}
              </div>
              
              <div>
                <label for="codigoPostal" class="block text-sm font-medium text-gray-700 mb-1">
                  C.P. Localidad *
                </label>
                <select
                  id="codigoPostal"
                  bind:value={cliente.CodigoPostal}
                  required
                  class="w-full px-3 py-2 border {formErrors.CodigoPostal ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione...</option>
                  {#each codigosPostales as cp}
                    <option value={cp.Codigo}>{cp.Codigo} - {cp.Descripcion}</option>
                  {/each}
                </select>
                {#if formErrors.CodigoPostal}
                  <p class="mt-1 text-sm text-red-600">{formErrors.CodigoPostal}</p>
                {/if}
              </div>
            </div>
          </div>
          
          <!-- Contacto -->
          <div>
            <h2 class="text-lg font-medium mb-3 text-gray-800 border-b pb-2">Contacto</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label for="contactoNombre" class="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Contacto
                </label>
                <input
                  type="text"
                  id="contactoNombre"
                  bind:value={cliente.ContactoNombre}
                  maxlength="100"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label for="mail" class="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="mail"
                  bind:value={cliente.Mail}
                  maxlength="50"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label for="telefono" class="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  id="telefono"
                  bind:value={cliente.Telefono}
                  maxlength="50"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label for="telefonoMovil" class="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono Móvil
                </label>
                <input
                  type="text"
                  id="telefonoMovil"
                  bind:value={cliente.TelefonoMovil}
                  maxlength="50"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div class="col-span-full">
                <label for="contactoComercial" class="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  id="contactoComercial"
                  bind:value={cliente.ContactoComercial}
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
            </div>
          </div>
          
          <!-- Datos comerciales -->
          <div>
            <h2 class="text-lg font-medium mb-3 text-gray-800 border-b pb-2">Datos comerciales</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label for="vendedor" class="block text-sm font-medium text-gray-700 mb-1">
                  Vendedor *
                </label>
                <select
                  id="vendedor"
                  bind:value={cliente.CodigoVendedor}
                  required
                  class="w-full px-3 py-2 border {formErrors.CodigoVendedor ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione...</option>
                  {#each vendedoresOptions as vendedor}
                    <option value={vendedor.value}>{vendedor.label}</option>
                  {/each}
                </select>
                {#if formErrors.CodigoVendedor}
                  <p class="mt-1 text-sm text-red-600">{formErrors.CodigoVendedor}</p>
                {/if}
              </div>
              
              <div>
                <label for="listaPrecio" class="block text-sm font-medium text-gray-700 mb-1">
                  Lista de Precio *
                </label>
                <select
                  id="listaPrecio"
                  bind:value={cliente.ListaPrecio}
                  required
                  class="w-full px-3 py-2 border {formErrors.ListaPrecio ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione...</option>
                  <option value="1">Lista 1</option>
                  <option value="2">Lista 2</option>
                  <option value="3">Lista 3</option>
                  <option value="4">Lista 4</option>
                  <option value="5">Lista 5</option>
                </select>
                {#if formErrors.ListaPrecio}
                  <p class="mt-1 text-sm text-red-600">{formErrors.ListaPrecio}</p>
                {/if}
              </div>
              
              <div>
                <label for="limiteCredito" class="block text-sm font-medium text-gray-700 mb-1">
                  Límite de Crédito
                </label>
                <input
                  type="number"
                  id="limiteCredito"
                  bind:value={cliente.LimiteCredito}
                  step="0.01"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label for="condicionVentaCodigo" class="block text-sm font-medium text-gray-700 mb-1">
                  Condición de Venta
                </label>
                <input
                  type="text"
                  id="condicionVentaCodigo"
                  bind:value={cliente.CondicionVentaCodigo}
                  maxlength="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label for="porcentajeBonificacionGeneral" class="block text-sm font-medium text-gray-700 mb-1">
                  % Bonificación General
                </label>
                <input
                  type="number"
                  id="porcentajeBonificacionGeneral"
                  bind:value={cliente.PorcentajeBonificacionGeneral}
                  step="0.01"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label for="fechaDeAlta" class="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Alta
                </label>
                <input
                  type="date"
                  id="fechaDeAlta"
                  bind:value={cliente.FechaDeAlta}
                  disabled={isEditing}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label for="fechaDeBaja" class="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Baja
                </label>
                <input
                  type="date"
                  id="fechaDeBaja"
                  bind:value={cliente.FechaDeBaja}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex justify-between pt-6">
          <Button
            variant="secondary"
            type="button"
            on:click={() => goto('/clientes')}
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
    {/if}
  </div>
</div> 