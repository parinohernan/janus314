<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { goto } from '$app/navigation';
  
  let rubros = [];
  let loading = true;
  let error = null;
  
  onMount(async () => {
    try {
      // Comentamos temporalmente la llamada al API hasta que esté funcionando el backend
      // const response = await fetch('http://localhost:3030/api/rubros');
      // if (!response.ok) throw new Error('Error al cargar los rubros');
      // rubros = await response.json();
      
      // Datos de prueba temporales
      rubros = [
        { Codigo: '001', Descripcion: 'Rubro de prueba 1', RubroGrupoCodigo: 'G01' },
        { Codigo: '002', Descripcion: 'Rubro de prueba 2', RubroGrupoCodigo: 'G02' }
      ];
      
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  });
  
  const handleEdit = (id) => {
    goto(`/rubros/${id}/editar`);
  };
  
  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro que desea eliminar este rubro?')) return;
    
    try {
      const response = await fetch(`http://localhost:3030/api/rubros/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Error al eliminar el rubro');
      
      // Actualizar la lista después de eliminar
      rubros = rubros.filter(rubro => rubro.Codigo !== id);
    } catch (err) {
      alert(err.message);
    }
  };
</script>

<svelte:head>
  <title>Gestión de Rubros</title>
</svelte:head>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Gestión de Rubros</h1>
    <Button variant="primary" on:click={() => goto('/rubros/nuevo')}>
      Nuevo Rubro
    </Button>
  </div>
  
  {#if loading}
    <p class="text-center py-4">Cargando rubros...</p>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <p>{error}</p>
    </div>
  {:else if rubros.length === 0}
    <p class="text-center py-4">No hay rubros disponibles</p>
  {:else}
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre
            </th>
            <th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Descripción
            </th>
            <th class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {#each rubros as rubro (rubro.Codigo)}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                {rubro.Descripcion}
              </td>
              <td class="px-6 py-4 border-b border-gray-200">
                {rubro.RubroGrupoCodigo || '-'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right border-b border-gray-200">
                <Button variant="secondary" size="sm" on:click={() => handleEdit(rubro.Codigo)}>
                  Editar
                </Button>
                <Button variant="danger" size="sm" on:click={() => handleDelete(rubro.Codigo)}>
                  Eliminar
                </Button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div> 