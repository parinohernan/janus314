<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  onMount(() => {
    const { tipo, sucursal, numero } = $page.params;
    goto(`/compras/facturas/${tipo}/${sucursal}/${numero}`, { replaceState: true });
  });
</script>
<p class="p-4 text-gray-500">Redirigiendo al detalle de la factura...</p>
