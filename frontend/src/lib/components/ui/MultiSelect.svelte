<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { clickOutside } from '$lib/actions/clickOutside';

  export let items: any[] = [];
  export let selectedValues: string[] = [];
  export let labelField = 'label';
  export let valueField = 'value';
  export let placeholder = 'Seleccione...';
  export let disabled = false;

  let isOpen = false;
  let searchText = '';
  let filteredItems = items;
  let comboboxId = `multiselect-${Math.random().toString(36).substr(2, 9)}`;

  const dispatch = createEventDispatcher();

  $: {
    if (searchText) {
      filteredItems = items.filter(item => 
        item[labelField].toLowerCase().includes(searchText.toLowerCase())
      );
    } else {
      filteredItems = items;
    }
  }

  function toggleItem(value: string) {
    const index = selectedValues.indexOf(value);
    if (index === -1) {
      selectedValues = [...selectedValues, value];
    } else {
      selectedValues = selectedValues.filter(v => v !== value);
    }
    dispatch('change', selectedValues);
  }

  function removeItem(value: string) {
    selectedValues = selectedValues.filter(v => v !== value);
    dispatch('change', selectedValues);
  }

  function handleClickOutside() {
    isOpen = false;
    searchText = '';
  }

  function getSelectedLabels() {
    return selectedValues
      .map(value => items.find(item => item[valueField] === value)?.[labelField])
      .filter(Boolean);
  }

  function handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!disabled) {
          isOpen = !isOpen;
        }
        break;
      case 'Escape':
        event.preventDefault();
        isOpen = false;
        break;
    }
  }

  function handleItemKeydown(event: KeyboardEvent, value: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleItem(value);
    }
  }
</script>

<div 
  class="relative" 
  use:clickOutside
  on:clickoutside={handleClickOutside}
>
  <!-- Combobox container -->
  <div
    role="combobox"
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-controls={comboboxId}
    aria-label={placeholder}
    tabindex="0"
    class="min-h-[42px] p-1 border border-gray-300 rounded-md bg-white cursor-pointer flex flex-wrap gap-1 items-center"
    class:cursor-not-allowed={disabled}
    on:click={() => {
      if (!disabled) {
        isOpen = !isOpen;
      }
    }}
    on:keydown={handleKeydown}
  >
    {#if selectedValues.length > 0}
      {#each getSelectedLabels() as label}
        <span class="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-md flex items-center">
          {label}
          <button
            type="button"
            class="ml-1 text-blue-600 hover:text-blue-800"
            on:click|stopPropagation={() => removeItem(selectedValues[getSelectedLabels().indexOf(label)])}
            aria-label={`Eliminar ${label}`}
          >
            ×
          </button>
        </span>
      {/each}
    {:else}
      <span class="text-gray-400 px-2">{placeholder}</span>
    {/if}
  </div>

  <!-- Dropdown -->
  {#if isOpen}
    <div 
      class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
      role="listbox"
      id={comboboxId}
      aria-multiselectable="true"
    >
      <input
        type="text"
        bind:value={searchText}
        placeholder="Buscar..."
        class="w-full p-2 border-b border-gray-300 focus:outline-none"
        aria-label="Buscar opciones"
      />
      
      {#if filteredItems.length === 0}
        <div class="p-2 text-gray-500" role="alert">No hay resultados</div>
      {:else}
        {#each filteredItems as item}
          <div
            role="option"
            aria-selected={selectedValues.includes(item[valueField])}
            tabindex="0"
            class="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
            on:click={() => toggleItem(item[valueField])}
            on:keydown={(e) => handleItemKeydown(e, item[valueField])}
          >
            <input
              type="checkbox"
              checked={selectedValues.includes(item[valueField])}
              class="mr-2"
              tabindex="-1"
              aria-hidden="true"
            />
            <span>{item[labelField]}</span>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div> 