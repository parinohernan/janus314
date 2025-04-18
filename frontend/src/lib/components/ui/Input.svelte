<script lang="ts">
  export let value: string = '';
  export let type: string = 'text';
  export let id: string = '';
  export let disabled: boolean = false;
  export let className: string = '';
</script>

<input
  {type}
  {id}
  {disabled}
  {value}
  on:input
  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 {className}"
  {...$$restProps}
/> 