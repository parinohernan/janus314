<script lang="ts">
  // Datos de ejemplo - estos vendrían de tu estado/store en una implementación real
  const appName = "janus314";
  const companyName = "Tu Empresa S.A.";
  const userName = "Usuario Demo";
  const isLoggedIn = true;
</script>

<div class="bg-gray-800 text-white px-4 py-3">
  <div class="container mx-auto flex items-center justify-between">
    <div class="flex items-center space-x-4">
      <div class="text-xl font-bold">{appName}</div>
      <div class="text-gray-300 hidden md:block">|</div>
      <div class="text-gray-300 hidden md:block">{companyName}</div>
    </div>
    
    <div class="flex items-center space-x-4">
      {#if isLoggedIn}
        <span class="hidden md:inline text-gray-300">Bienvenido, {userName}</span>
        <button class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
          Cerrar Sesión
        </button>
      {:else}
        <button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
          Iniciar Sesión
        </button>
      {/if}
    </div>
  </div>
</div> 