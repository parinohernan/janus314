<script>
  // Layout específico para la sección de clientes
  import { onMount } from 'svelte';
  console.log('Layout de clientes cargado');
</script>

<div class="clientes-layout">
  <slot />
</div>

<style>
  .clientes-layout {
    width: 100%;
    height: 100%;
  }
</style> 