<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  
  let rubro = {
    nombre: '',
    descripcion: ''
  };
  
  let loading = false;
  let error = null;
  let isEditing = $page.params.id !== 'nuevo';
  
  onMount(async () => {
    if (isEditing) {
      try {
        loading = true;
        const response = await fetch(`http://localhost:3000/api/rubros/${$page.params.id}`);
        if (!response.ok) throw new Error('Error al cargar el rubro');
        rubro = await response.json();
      } catch (err) {
        error = err.message;
      } finally {
        loading = false;
      }
    }
  });
  
  const handleSubmit = async () => {
    try {
      loading = true;
      
      const url = isEditing 
        ? `http://localhost:3000/api/rubros/${$page.params.id}`
        : 'http://localhost:3000/api/rubros';
        
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rubro)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al guardar el rubro');
      }
      
      goto('/rubros');
    } catch (err) {
      error = err.message;
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
        <label for="nombre" class="block text-sm font-medium text-gray-700 mb-1">
          Nombre *
        </label>
        <input
          type="text"
          id="nombre"
          bind:value={rubro.nombre}
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div class="mb-6">
        <label for="descripcion" class="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          id="descripcion"
          bind:value={rubro.descripcion}
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
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