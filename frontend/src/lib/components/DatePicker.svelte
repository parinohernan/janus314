<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let value: Date = new Date();
  export let id: string = '';
  const dispatch = createEventDispatcher();

  function handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    value = new Date(input.value);
    dispatch('change', value);
  }
</script>

<input
  {id}
  type="date"
  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
  value={value.toISOString().split('T')[0]}
  on:input={handleInput}
/> 