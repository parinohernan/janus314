<script lang="ts">
  // Datos de ejemplo - estos vendrían de tu estado/store en una implementación real
  const appName = "janus314";
  const logo = "./../../../static/janus314.png";
  const companyName = "Tu Empresa S.A.";
  const userName = "Usuario Demo";
  const isLoggedIn = true;
</script>

<div class="bg-gray-800 text-white px-4 py-3">
  <div class="container mx-auto flex items-center justify-between">
    <div class="flex items-center space-x-4">
      <div class="text-xl font-bold flex items-center">
        <a href="/" class="relative w-30 h-30 pl-2 pr-2 pt-2 pb-2 group cursor-pointer">
          <img src="/janus314.png" alt="janus314" class="w-full h-full rounded-full transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-6" style="mask-image: radial-gradient(circle, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 90%);">
          <div class="absolute inset-0 bg-blue-500 rounded-full opacity-0 group-hover:opacity-25 transition-opacity duration-300" style="mask-image: radial-gradient(circle, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 90%);"></div>
        </a>
        <a href="/" class="cursor-pointer">
          <h1 class="text-xl font-bold pl-6 pr-6 scale-150">{appName}</h1>
        </a>
      </div>
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