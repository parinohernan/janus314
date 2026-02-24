<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  onMount(() => goto('/compras/facturas', { replaceState: true }));
</script>
<p class="p-4 text-gray-500">Redirigiendo a Facturas de compra...</p>
