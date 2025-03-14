<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { PUBLIC_API_URL } from '$env/static/public';
  
  interface Rubro {
    Codigo: string;
    Descripcion: string;
    RubroGrupoCodigo?: string;
  }
  
  let rubro: Rubro = {
    Codigo: '',
    Descripcion: '',
    RubroGrupoCodigo: ''
  };
  
  let loading = false;
  let error: string | null = null;
  let isEditing = $page.params.id !== 'nuevo';
  
  onMount(async () => {
    if (isEditing) {
      try {
        loading = true;
        const response = await fetch(`${PUBLIC_API_URL}/rubros/${$page.params.id}`);
        if (!response.ok) throw new Error('Error al cargar el rubro');
        rubro = await response.json();
      } catch (err: unknown) {
        if (err instanceof Error) {
          error = err.message;
        } else {
          error = 'Error desconocido';
        }
      } finally {
        loading = false;
      }
    }
  });
  
  const handleSubmit = async () => {
    try {
      loading = true;
      
      const url = isEditing 
        ? `${PUBLIC_API_URL}/rubros/${$page.params.id}`
        : `${PUBLIC_API_URL}/rubros`;
        
      const method = isEditing ? 'PUT' : 'POST';
      
      console.log('Enviando datos:', rubro);
      console.log('Método:', method);
      console.log('URL:', url);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rubro)
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.error('Error respuesta:', data);
        throw new Error(data.message || 'Error al guardar el rubro');
      }
      
      const resultado = await response.json();
      console.log('Respuesta exitosa:', resultado);
      
      goto('/rubros');
    } catch (err) {
      error = err.message;
      console.error('Error completo:', err);
    } finally {
      loading = false;
    }
  };
</script>

<svelte:head>
  <title>{isEditing ? 'Editar' : 'Nuevo'} Rubro</title>
</svelte:head>

<div class="container mx-auto p-4">
  <div class="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
    <h1 class="text-2xl font-bold mb-6">{isEditing ? 'Editar' : 'Nuevo'} Rubro</h1>
    
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
          bind:value={rubro.Codigo}
          required
          disabled={isEditing}
          maxlength="4"
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
          bind:value={rubro.Descripcion}
          required
          maxlength="50"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div class="mb-6">
        <label for="rubroGrupo" class="block text-sm font-medium text-gray-700 mb-1">
          Grupo de Rubro
        </label>
        <input
          type="text"
          id="rubroGrupo"
          bind:value={rubro.RubroGrupoCodigo}
          maxlength="4"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div class="flex justify-between">
        <Button
          variant="secondary"
          type="button"
          on:click={() => goto('/rubros')}
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