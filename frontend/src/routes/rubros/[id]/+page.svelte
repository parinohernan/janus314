<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { PUBLIC_API_URL } from '$env/static/public';
  import Button from '$lib/components/ui/Button.svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  
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
  let success: string | null = null;
  let isEditing = $page.params.id !== 'nuevo';
  
  onMount(async () => {
    if (isEditing) {
      try {
        loading = true;
        const response = await fetchWithAuth(`/rubros/${$page.params.id}`);
        if (!response.ok) throw new Error('Error al cargar el rubro');
        rubro = await response.json();
      } catch (err: unknown) {
        console.error('Error:', err);
        error = err instanceof Error ? err.message : 'Error al cargar el rubro';
      } finally {
        loading = false;
      }
    }
  });
  
  async function handleSubmit() {
    try {
      loading = true;
      error = null;
      success = null;
      
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `/rubros/${$page.params.id}` : '/rubros';
      
      const datos = isEditing 
        ? {
            Descripcion: rubro.Descripcion,
            RubroGrupoCodigo: rubro.RubroGrupoCodigo || null
          }
        : rubro;

      console.log('Enviando datos:', datos);
      console.log('URL:', url);
      console.log('Método:', method);
      
      const response = await fetchWithAuth(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      });
      
      console.log('Respuesta status:', response.status);
      const responseData = await response.json();
      console.log('Respuesta data:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Error al guardar el rubro');
      }
      
      success = 'Rubro guardado correctamente';
      setTimeout(() => {
        goto('/rubros');
      }, 1500);
    } catch (err: unknown) {
      console.error('Error:', err);
      error = err instanceof Error ? err.message : 'Error al guardar el rubro';
    } finally {
      loading = false;
    }
  }
  
  function handleCancel() {
    goto('/rubros');
  }
</script>

<svelte:head>
  <title>{isEditing ? 'Editar' : 'Nuevo'} Rubro</title>
</svelte:head>

<div class="container mx-auto p-4">
  <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
    <h1 class="text-2xl font-bold mb-6">{isEditing ? 'Editar' : 'Nuevo'} Rubro</h1>
    
    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    {/if}
    
    {#if success}
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        {success}
      </div>
    {/if}
    
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div>
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
      
      <div>
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
      
      <div class="flex gap-4 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button type="button" variant="secondary" on:click={handleCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  </div>
</div> 