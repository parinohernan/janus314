<script>
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  
  if (browser) {
    // Redirigir a la página principal de ventas
    goto('/ventas/facturas');
  }
</script>

<div>
  Redirigiendo...
</div> 