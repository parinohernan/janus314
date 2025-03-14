<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  onMount(() => {
    // Redirigir a la ruta correcta
    goto(`/rubros/${$page.params.id}`);
  });
</script>

<div class="container mx-auto p-4 text-center">
  <p>Redirigiendo...</p>
</div> 