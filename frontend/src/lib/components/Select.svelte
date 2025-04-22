<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { clickOutside } from '$lib/actions/clickOutside';

  export let options: { id: string; nombre: string }[] = [];
  export let selected: string[] = [];
  export let multiple = false;
  export let maxSelections = Infinity;
  export let placeholder = 'Seleccionar...';

  let isOpen = false;
  let searchTerm = '';
  const dispatch = createEventDispatcher();

  $: filteredOptions = options.filter(option => 
    option.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function toggleOption(optionId: string) {
    if (multiple) {
      if (selected.includes(optionId)) {
        selected = selected.filter(id => id !== optionId);
      } else if (selected.length < maxSelections) {
        selected = [...selected, optionId];
      }
    } else {
      selected = [optionId];
      isOpen = false;
    }
    dispatch('change', selected);
  }

  function handleSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    searchTerm = input.value;
  }

  function getSelectedLabels() {
    if (selected.length === 0) return placeholder;
    return selected
      .map(id => options.find(opt => opt.id === id)?.nombre)
      .filter(Boolean)
      .join(', ');
  }
</script>

<div class="select-container relative" use:clickOutside={() => isOpen = false}>
  <div
    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
    on:click={() => isOpen = !isOpen}
  >
    <div class="truncate">{getSelectedLabels()}</div>
  </div>

  {#if isOpen}
    <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
      <input
        type="text"
        class="w-full px-3 py-2 border-b border-gray-300 focus:outline-none"
        placeholder="Buscar..."
        on:input={handleSearch}
      />
      <div class="py-1">
        {#each filteredOptions as option}
          <div
            class="px-3 py-2 hover:bg-gray-100 cursor-pointer {selected.includes(option.id) ? 'bg-indigo-50' : ''}"
            on:click={() => toggleOption(option.id)}
          >
            {option.nombre}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .select-container {
    position: relative;
  }
</style> 