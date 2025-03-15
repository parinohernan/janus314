<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  onMount(() => {
    // Redirigir a la ruta de clientes
    goto('/clientes', { replaceState: true });
  });
</script>

<div class="flex items-center justify-center h-screen">
  <p class="text-gray-500">Redirigiendo...</p>
</div> 