<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { PUBLIC_API_URL } from '$env/static/public';

  // Props
  export let label = '';
  export let placeholder = 'Buscar...';
  export let apiEndpoint = '';
  export let valueField = 'Codigo';
  export let labelField = 'Descripcion';
  export let initialValue = '';
  export let required = false;
  export let disabled = false;
  export let minSearchLength = 0;
  export let searchParam = 'search';
  export let showClearButton = true;
  export let className = '';
  export let errorMessage = '';
  export let id = `entity-selector-${Math.random().toString(36).substring(2, 9)}`;
  
  // Estado interno
  let searchTerm = '';
  let options: any[] = [];
  let selectedItem: any = null;
  let loading = false;
  let isOpen = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let inputElement: HTMLInputElement;
  
  const dispatch = createEventDispatcher();
  
  // Cargar datos iniciales si hay un valor inicial
  onMount(async () => {
    if (initialValue) {
      await loadItemById(initialValue);
    }
  });
  
  // Cargar item por ID
  async function loadItemById(id: string) {
    if (!id) return;
    
    try {
      loading = true;
      const url = `${PUBLIC_API_URL}${apiEndpoint}/${id}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al cargar el elemento');
      }
      
      const data = await response.json();
      const item = data.data || data;
      
      if (item) {
        selectedItem = item;
        searchTerm = item[labelField];
        dispatch('select', { value: item[valueField], item });
      }
    } catch (error) {
      console.error('Error cargando elemento por ID:', error);
    } finally {
      loading = false;
    }
  }
  
  // Búsqueda
  async function searchItems() {
    if (timeoutId) clearTimeout(timeoutId);
    
    if (searchTerm.length < minSearchLength) {
      options = [];
      return;
    }
    
    timeoutId = setTimeout(async () => {
      try {
        loading = true;
        const params = new URLSearchParams();
        params.append(searchParam, searchTerm);
        
        const url = `${PUBLIC_API_URL}${apiEndpoint}?${params}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Error al buscar elementos');
        }
        
        const data = await response.json();
        options = data.items || data.data || data;
        isOpen = options.length > 0;
      } catch (error) {
        console.error('Error en búsqueda:', error);
        options = [];
      } finally {
        loading = false;
      }
    }, 300);
  }
  
  // Seleccionar un elemento
  function selectItem(item: any) {
    selectedItem = item;
    searchTerm = item[labelField];
    isOpen = false;
    dispatch('select', { value: item[valueField], item });
    
    // Enfoque el input después de seleccionar
    if (inputElement) {
      inputElement.focus();
    }
  }
  
  // Limpiar selección
  function clearSelection() {
    selectedItem = null;
    searchTerm = '';
    dispatch('select', { value: '', item: null });
    
    // Enfoque el input después de limpiar
    if (inputElement) {
      inputElement.focus();
    }
  }
  
  // Manejar clic fuera del componente para cerrar el menú
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Node;
    
    if (inputElement && !inputElement.contains(target)) {
      isOpen = false;
      
      // Si se cerró sin seleccionar y hay un valor anterior, restaurar
      if (selectedItem) {
        searchTerm = selectedItem[labelField];
      } else if (searchTerm.trim() !== '') {
        searchTerm = '';
      }
    }
  }
  
  // Manejar eventos de teclado para navegación accesible
  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        event.preventDefault();
        isOpen = true;
      }
      return;
    }
    
    if (event.key === 'Escape') {
      event.preventDefault();
      isOpen = false;
      inputElement.focus();
    }
  }
  
  // Manejar eventos de teclado para los elementos de la lista
  function handleOptionKeydown(event: KeyboardEvent, item: any) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectItem(item);
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="relative {className}">
  {#if label}
    <label for={id} class="block text-sm font-medium text-gray-700 mb-1">
      {label}{required ? ' *' : ''}
    </label>
  {/if}
  
  <div class="relative">
    <input
      id={id}
      type="text"
      bind:value={searchTerm}
      on:input={searchItems}
      on:focus={() => searchTerm && options.length > 0 && (isOpen = true)}
      on:keydown={handleKeydown}
      bind:this={inputElement}
      placeholder={placeholder}
      disabled={disabled}
      class="w-full p-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm {errorMessage ? 'border-red-500' : ''}"
      autocomplete="off"
      aria-controls="opciones-id"
      aria-expanded={isOpen}
      aria-autocomplete="list"
      role="combobox"
    />
    
    {#if loading}
      <div class="absolute inset-y-0 right-0 flex items-center pr-3">
        <svg class="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    {:else if showClearButton && selectedItem}
      <button 
        type="button"
        class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-800"
        on:click={clearSelection}
        aria-label="Limpiar selección"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    {/if}
  </div>
  
  {#if errorMessage}
    <p class="mt-1 text-xs text-red-600" id={`${id}-error`}>{errorMessage}</p>
  {/if}
  
  {#if isOpen}
    <div class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-auto border border-gray-300" role="listbox" id="opciones-id">
      <ul class="py-1">
        {#each options as item}
          <button 
            type="button"
            class="w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm {selectedItem && selectedItem[valueField] === item[valueField] ? 'bg-blue-50 text-blue-700' : ''}"
            on:click={() => selectItem(item)}
            on:keydown={(e) => handleOptionKeydown(e, item)}
            role="option"
            aria-selected={selectedItem && selectedItem[valueField] === item[valueField]}
          >
            {item[labelField]}
          </button>
        {/each}
      </ul>
    </div>
  {/if}
</div> 