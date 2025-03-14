<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { PUBLIC_API_URL } from '$env/static/public';
  
  let isEditing = $page.params.id !== 'nuevo';
  
  interface Proveedor {
    Codigo: string;
    Descripcion: string;
    Cuit: string;
    Calle: string;
    Numero: string;
    Piso: string;
    Departamento: string;
    CodigoPostal: string;
    Telefono: string;
    Mail: string;
    ContactoComercial: string;
    ImporteDeuda: number;
    Enviado: number;
    SaldoNTCNoAplicado: number;
    retenciones_generales_codigo: string;
    CondicionVentaCodigo: string;
    ProveedorTipoCodigo: string;
    InvCuentaCompras: number | null;
    CodigoPostalRelacion?: {
      Descripcion: string;
      Provincia: string;
    };
  }
  
  interface CodigoPostal {
    Codigo: string;
    Descripcion: string;
    Provincia: string;
  }
  
  let proveedor: Proveedor = {
    Codigo: '',
    Descripcion: '',
    Cuit: '',
    Calle: '',
    Numero: '',
    Piso: '',
    Departamento: '',
    CodigoPostal: '',
    Telefono: '',
    Mail: '',
    ContactoComercial: '',
    ImporteDeuda: 0,
    Enviado: 0,
    SaldoNTCNoAplicado: 0,
    retenciones_generales_codigo: '',
    CondicionVentaCodigo: '',
    ProveedorTipoCodigo: '',
    InvCuentaCompras: null
  };
  
  let codigosPostales: CodigoPostal[] = [];
  let loading = false;
  let error: string | null = null;
  let successMessage: string | null = null;
  
  // Cargar códigos postales para el selector
  const loadCodigosPostales = async (): Promise<void> => {
    try {
      const response = await fetch(`${PUBLIC_API_URL}/localidades?limit=500`);
      if (!response.ok) throw new Error('Error al cargar los códigos postales');
      
      const data = await response.json();
      codigosPostales = data.items;
    } catch (err: unknown) {
      console.error('Error cargando códigos postales:', err);
      if (err instanceof Error) {
        error = 'Error al cargar los códigos postales: ' + err.message;
      } else {
        error = 'Error desconocido al cargar los códigos postales';
      }
    }
  };
  
  onMount(async () => {
    try {
      loading = true;
      
      // Cargar los códigos postales
      await loadCodigosPostales();
      
      // Si estamos editando, cargar los datos del proveedor
      if (isEditing) {
        const response = await fetch(`${PUBLIC_API_URL}/proveedores/${$page.params.id}`);
        if (!response.ok) throw new Error('Error al cargar el proveedor');
        proveedor = await response.json();
      }
      
      error = null; // Limpiar errores anteriores
    } catch (err: unknown) {
      if (isEditing) { // Solo mostrar error si estamos editando
        console.error('Error cargando proveedor:', err);
        if (err instanceof Error) {
          error = 'Error al cargar el proveedor: ' + err.message;
        } else {
          error = 'Error desconocido al cargar el proveedor';
        }
      }
    } finally {
      loading = false;
    }
  });
  
  const handleSubmit = async (event: Event): Promise<void> => {
    event.preventDefault();
    
    try {
      loading = true;
      error = null;
      successMessage = null;
      
      const response = await fetch(
        isEditing 
          ? `${PUBLIC_API_URL}/proveedores/${$page.params.id}` 
          : `${PUBLIC_API_URL}/proveedores`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(proveedor),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar el proveedor');
      }
      
      successMessage = `Proveedor ${isEditing ? 'actualizado' : 'creado'} correctamente`;
      setTimeout(() => goto('/compras/proveedores'), 1500);
    } catch (err: unknown) {
      console.error('Error guardando proveedor:', err);
      if (err instanceof Error) {
        error = err.message;
      } else {
        error = 'Error desconocido al guardar';
      }
    } finally {
      loading = false;
    }
  };
</script>

<svelte:head>
  <title>{isEditing ? 'Editar' : 'Nuevo'} Proveedor</title>
</svelte:head>

<div class="container mx-auto p-4">
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h1 class="text-2xl font-bold mb-6">{isEditing ? 'Editar' : 'Nuevo'} Proveedor</h1>
    
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
              <label for="codigo" class="block text-sm font-medium text-gray-700 mb-1">
                Código *
              </label>
              <input
                type="text"
                id="codigo"
                bind:value={proveedor.Codigo}
                required
                disabled={isEditing}
                maxlength="8"
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
                bind:value={proveedor.Descripcion}
                required
                maxlength="50"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="cuit" class="block text-sm font-medium text-gray-700 mb-1">
                CUIT
              </label>
              <input
                type="text"
                id="cuit"
                bind:value={proveedor.Cuit}
                maxlength="11"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <!-- Dirección - Opcional -->
        <div>
          <h2 class="text-lg font-medium mb-3 text-gray-800 border-b pb-2">Dirección</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="calle" class="block text-sm font-medium text-gray-700 mb-1">
                Calle
              </label>
              <input
                type="text"
                id="calle"
                bind:value={proveedor.Calle}
                maxlength="50"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="numero" class="block text-sm font-medium text-gray-700 mb-1">
                Número
              </label>
              <input
                type="text"
                id="numero"
                bind:value={proveedor.Numero}
                maxlength="15"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="piso" class="block text-sm font-medium text-gray-700 mb-1">
                Piso
              </label>
              <input
                type="text"
                id="piso"
                bind:value={proveedor.Piso}
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
                bind:value={proveedor.Departamento}
                maxlength="10"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="codigoPostal" class="block text-sm font-medium text-gray-700 mb-1">
                Código Postal
              </label>
              <select
                id="codigoPostal"
                bind:value={proveedor.CodigoPostal}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione localidad</option>
                {#each codigosPostales as cp}
                  <option value={cp.Codigo}>{cp.Descripcion} ({cp.Codigo})</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
        
        <!-- Contacto - Opcional -->
        <div>
          <h2 class="text-lg font-medium mb-3 text-gray-800 border-b pb-2">Contacto</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="telefono" class="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="text"
                id="telefono"
                bind:value={proveedor.Telefono}
                maxlength="50"
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
                bind:value={proveedor.Mail}
                maxlength="50"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="contactoComercial" class="block text-sm font-medium text-gray-700 mb-1">
                Contacto Comercial
              </label>
              <input
                type="text"
                id="contactoComercial"
                bind:value={proveedor.ContactoComercial}
                maxlength="50"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <!-- Datos comerciales -->
        <div class="space-y-4">
          <h2 class="text-lg font-semibold border-b pb-2">Datos comerciales</h2>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="importeDeuda" class="block text-sm font-medium text-gray-700 mb-1">
                Importe Deuda
              </label>
              <input
                type="number"
                id="importeDeuda"
                bind:value={proveedor.ImporteDeuda}
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="saldoNTC" class="block text-sm font-medium text-gray-700 mb-1">
                Saldo NTC No Aplicado
              </label>
              <input
                type="number"
                id="saldoNTC"
                bind:value={proveedor.SaldoNTCNoAplicado}
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="retencionesGenerales" class="block text-sm font-medium text-gray-700 mb-1">
                Código Retención General
              </label>
              <input
                type="text"
                id="retencionesGenerales"
                bind:value={proveedor.retenciones_generales_codigo}
                maxlength="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="condicionVenta" class="block text-sm font-medium text-gray-700 mb-1">
                Condición Venta Código
              </label>
              <input
                type="text"
                id="condicionVenta"
                bind:value={proveedor.CondicionVentaCodigo}
                maxlength="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="proveedorTipo" class="block text-sm font-medium text-gray-700 mb-1">
                Proveedor Tipo Código
              </label>
              <input
                type="text"
                id="proveedorTipo"
                bind:value={proveedor.ProveedorTipoCodigo}
                maxlength="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label for="cuentaCompras" class="block text-sm font-medium text-gray-700 mb-1">
                Cuenta Compras
              </label>
              <input
                type="number"
                id="cuentaCompras"
                bind:value={proveedor.InvCuentaCompras}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label for="enviado" class="block text-sm font-medium text-gray-700 mb-1">
              Enviado
            </label>
            <select
              id="enviado"
              bind:value={proveedor.Enviado}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>No</option>
              <option value={1}>Sí</option>
            </select>
          </div>
        </div>
      </div>
      
      <div class="flex justify-between pt-4">
        <Button
          variant="secondary"
          type="button"
          on:click={() => goto('/compras/proveedores')}
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