<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { PUBLIC_API_URL } from '$env/static/public';
  
  interface Localidad {
    Codigo: string;
    Descripcion: string;
    Provincia: string;
    ProvinciaRelacion?: {
      Descripcion: string;
    };
  }
  
  interface Provincia {
    Codigo: string;
    Descripcion: string;
  }
  
  let localidad: Localidad = {
    Codigo: '',
    Descripcion: '',
    Provincia: ''
  };
  
  let provincias: Provincia[] = [];
  let loading = false;
  let error: string | null = null;
  let isEditing = $page.params.id !== 'nuevo';
  
  // Cargar provincias para el selector
  const loadProvincias = async (): Promise<void> => {
    try {
      const response = await fetch(`${PUBLIC_API_URL}/provincias?limit=100`);
      if (!response.ok) throw new Error('Error al cargar las provincias');
      
      const data = await response.json();
      provincias = data.items;
    } catch (err: unknown) {
      console.error('Error cargando provincias:', err);
      if (err instanceof Error) {
        error = 'Error al cargar las provincias: ' + err.message;
      } else {
        error = 'Error desconocido al cargar las provincias';
      }
    }
  };
  
  onMount(async () => {
    try {
      loading = true;
      
      // Cargar las provincias
      await loadProvincias();
      
      // Si estamos editando, cargar los datos de la localidad
      if (isEditing) {
        const response = await fetch(`${PUBLIC_API_URL}/localidades/${$page.params.id}`);
        if (!response.ok) throw new Error('Error al cargar la localidad');
        localidad = await response.json();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        error = err.message;
      } else {
        error = 'Error desconocido';
      }
    } finally {
      loading = false;
    }
  });
  
  const handleSubmit = async (): Promise<void> => {
    try {
      loading = true;
      
      const url = isEditing 
        ? `${PUBLIC_API_URL}/localidades/${$page.params.id}`
        : `${PUBLIC_API_URL}/localidades`;
        
      const method = isEditing ? 'PUT' : 'POST';
      
      console.log('Enviando datos:', localidad);
      console.log('Método:', method);
      console.log('URL:', url);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(localidad)
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.error('Error respuesta:', data);
        throw new Error(data.message || 'Error al guardar la localidad');
      }
      
      const resultado = await response.json();
      console.log('Respuesta exitosa:', resultado);
      
      goto('/localidades');
    } catch (err: unknown) {
      if (err instanceof Error) {
        error = err.message;
      } else {
        error = 'Error desconocido';
      }
      console.error('Error completo:', err);
    } finally {
      loading = false;
    }
  };
</script>

<svelte:head>
  <title>{isEditing ? 'Editar' : 'Nueva'} Localidad</title>
</svelte:head>

<div class="container mx-auto p-4">
  <div class="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
    <h1 class="text-2xl font-bold mb-6">{isEditing ? 'Editar' : 'Nueva'} Localidad</h1>
    
    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>{error}</p>
      </div>
    {/if}
    
    <form on:submit|preventDefault={handleSubmit}>
      <div class="mb-4">
        <label for="codigo" class="block text-sm font-medium text-gray-700 mb-1">
          Código *
        </label>
        <input
          type="text"
          id="codigo"
          bind:value={localidad.Codigo}
          required
          disabled={isEditing}
          maxlength="8"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>
      
      <div class="mb-4">
        <label for="descripcion" class="block text-sm font-medium text-gray-700 mb-1">
          Descripción *
        </label>
        <input
          type="text"
          id="descripcion"
          bind:value={localidad.Descripcion}
          required
          maxlength="50"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div class="mb-6">
        <label for="provincia" class="block text-sm font-medium text-gray-700 mb-1">
          Provincia *
        </label>
        <select
          id="provincia"
          bind:value={localidad.Provincia}
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Seleccione una provincia</option>
          {#each provincias as provincia}
            <option value={provincia.Codigo}>
              {provincia.Codigo} - {provincia.Descripcion}
            </option>
          {/each}
        </select>
      </div>
      
      <div class="flex justify-between">
        <Button
          variant="secondary"
          type="button"
          on:click={() => goto('/localidades')}
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
