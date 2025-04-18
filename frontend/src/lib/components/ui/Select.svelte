<script lang="ts">
  interface Option {
    value: string;
    label: string;
  }

  export let value: string = '';
  export let options: Option[] = [];
  export let id: string = '';
  export let disabled: boolean = false;
  export let placeholder: string = 'Seleccionar...';
  export let className: string = '';
</script>

<select
  {id}
  {disabled}
  {value}
  on:change
  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 {className}"
  {...$$restProps}
>
  <option value="" disabled selected>{placeholder}</option>
  {#each options as option}
    <option value={option.value}>{option.label}</option>
  {/each}
</select> 