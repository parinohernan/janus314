<script lang="ts">
  import { onMount } from 'svelte';
  import { EmpresaService, type DatosEmpresa } from '$lib/services/EmpresaService';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { fade } from 'svelte/transition';

  let datosEmpresa: DatosEmpresa = {
    RazonSocial: '',
    Domicilio: '',
    Telefono: '',
    EMail: '',
    Cuit: '',
    Localidad: '',
    Sucursal: '',
    LogoURL: '',
    IngresosBrutos: '',
    InicioActividades: ''
  };

  let loading = true;
  let saving = false;
  let error: string | null = null;
  let successMessage: string | null = null;

  onMount(async () => {
    try {
      datosEmpresa = await EmpresaService.obtenerDatos();
      console.log(datosEmpresa);
      loading = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al cargar los datos';
      loading = false;
    }
  });

  async function handleSubmit() {
    saving = true;
    error = null;
    successMessage = null;

    try {
      const response = await fetch(`${PUBLIC_API_URL}/datos-empresa`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosEmpresa)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar los datos');
      }

      successMessage = 'Datos actualizados correctamente';
      EmpresaService.limpiarCache(); // Limpiar caché para próximas consultas
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al guardar los datos';
    } finally {
      saving = false;
    }
  }
</script>

<div class="container mx-auto px-4 py-8" in:fade>
  <div class="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
    <h1 class="text-3xl font-bold text-gray-800 mb-8">Datos de la Empresa</h1>

    {#if loading}
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    {:else}
      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="form-group">
            <label for="nombre" class="block text-sm font-medium text-gray-700 mb-1">Nombre/Razón Social</label>
            <input
              type="text"
              id="nombre"
              bind:value={datosEmpresa.RazonSocial}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div class="form-group">
            <label for="cuit" class="block text-sm font-medium text-gray-700 mb-1">CUIT</label>
            <input
              type="text"
              id="cuit"
              bind:value={datosEmpresa.Cuit}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="ciudad" class="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <input
              type="text"
              id="ciudad"
              bind:value={datosEmpresa.Localidad}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div class="form-group">
            <label for="direccion" class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              id="direccion"
              bind:value={datosEmpresa.Domicilio}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="form-group">
            <label for="telefono" class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              id="telefono"
              bind:value={datosEmpresa.Telefono}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              
              on:input={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^0-9]/g, '');
              }}
              on:blur={(e) => {
                const target = e.target as HTMLInputElement;
                const phoneLength = target.value.length;
                if (phoneLength < 8 || phoneLength > 13) {
                  target.setCustomValidity('El teléfono debe tener entre 8 y 13 dígitos');
                  target.reportValidity();
                } else {
                  target.setCustomValidity('');
                }
              }}
            />
          </div>

          <div class="form-group">
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              bind:value={datosEmpresa.EMail}
              on:input={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^a-zA-Z0-9._%+-@]/g, '');
              }}
              on:blur={(e) => {
                const target = e.target as HTMLInputElement;
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(target.value)) {
                  target.setCustomValidity('Por favor ingrese un email válido');
                  target.reportValidity();
                } else {
                  target.setCustomValidity('');
                }
              }}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="form-group">
            <label for="sucursal" class="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
            <input
              type="text"
              id="sucursal"
              bind:value={datosEmpresa.Sucursal}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              
              maxlength="4"
              on:input={(e) => {
                const target = e.target as HTMLInputElement;
                // Solo permitir números
                target.value = target.value.replace(/[^0-9]/g, '');
                
              }}
              on:blur={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^0-9]/g, '');
                datosEmpresa.Sucursal = target.value.padStart(4, '0');
              }}
              placeholder="0000"
            />
          </div>

          <div class="form-group">
            <label for="ingresosBrutos" class="block text-sm font-medium text-gray-700 mb-1">Ingresos Brutos</label>
            <input
              type="text"
              id="ingresosBrutos"
              bind:value={datosEmpresa.IngresosBrutos}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="form-group">
            <label for="inicioActividades" class="block text-sm font-medium text-gray-700 mb-1">Inicio de Actividades</label>
            <input
              type="date"
              id="inicioActividades"
              bind:value={datosEmpresa.InicioActividades}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="form-group">
            <label for="logoURL" class="block text-sm font-medium text-gray-700 mb-1">URL del Logo</label>
            <input
              type="url"
              id="logoURL"
              bind:value={datosEmpresa.LogoURL}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {#if error}
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span class="block sm:inline">{error}</span>
          </div>
        {/if}

        {#if successMessage}
          <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span class="block sm:inline">{successMessage}</span>
          </div>
        {/if}

        <div class="flex justify-end mt-6">
          <button
            type="submit"
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {#if saving}
              <span class="flex items-center">
                <span class="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                Guardando...
              </span>
            {:else}
              Guardar Cambios
            {/if}
          </button>
        </div>
      </form>
    {/if}
  </div>
</div>

<style>
  .form-group {
    position: relative;
  }

  input:focus {
    border-color: rgb(59, 130, 246);
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
</style>
