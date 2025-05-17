<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/authStore';
  import { EmpresaService } from '$lib/services/EmpresaService';
  import { goto } from '$app/navigation';

  let appName = "janus314";
  let logo = "/janus314.png";
  let logoEmpresa = "";
  let companyName = "";
  let userName = "";
  let isLoggedIn = false;
  let unsubscribe: () => void;

  onMount(() => {
    // Obtener datos de la empresa
    // EmpresaService.obtenerDatos()
    //   .then(datosEmpresa => {
    //     companyName = datosEmpresa.RazonSocial || "Empresa no configurada";
    //     logoEmpresa = datosEmpresa.LogoURL || "";
    //   })
    //   .catch(error => {
    //     console.error('Error al cargar datos de la empresa:', error);
    //     companyName = "Error al cargar datos";
    //   });

    // Suscribirse a cambios en el estado de autenticación
    unsubscribe = auth.subscribe(state => {
      isLoggedIn = state.isAuthenticated;
      if (state.user) {
        userName = `${state.user.nombre} ${state.user.apellido}`;
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  });

  async function handleLogout() {
    try {
      await auth.logout();
      goto('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
</script>

<div class="bg-gray-800 text-white px-4 py-3">
  <div class="container mx-auto flex items-center justify-between">
    <div class="flex items-center space-x-4">
      <div class="text-xl font-bold flex items-center">
        <a href="/" class="relative w-30 h-30 pl-2 pr-2 pt-2 pb-2 group cursor-pointer">
          <img src={logo} alt={appName} class="w-full h-full rounded-full transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-6" style="mask-image: radial-gradient(circle, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 90%);">
          <div class="absolute inset-0 bg-blue-500 rounded-full opacity-0 group-hover:opacity-25 transition-opacity duration-300" style="mask-image: radial-gradient(circle, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 90%);"></div>
        </a>
        <a href="/" class="cursor-pointer">
          <h1 class="text-xl font-bold pl-6 pr-6 scale-150">{appName}</h1>
        </a>
      </div>
      <div class="text-xl font-bold flex ">
        <a href="/" class="cursor-pointer">
          <h1 class="text-x font-bold pl-6 pr-6 scale-100 text-center">{companyName}</h1>
        </a>
      </div>
      <a href="/" class="relative w-30 h-30 pl-2 pr-2 pt-2 pb-2 group cursor-pointer">
        <img src={logoEmpresa} alt={companyName} class="w-full h-full rounded-full transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-6" style="mask-image: radial-gradient(circle, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 90%);">
        <div class="absolute inset-0 bg-blue-500 rounded-full opacity-0 group-hover:opacity-25 transition-opacity duration-300" style="mask-image: radial-gradient(circle, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 90%);"></div>
      </a>
    </div> 
    
    <div class="flex items-center space-x-4">
      {#if isLoggedIn}
        <span class="hidden md:inline text-gray-300">Bienvenido, {userName}</span>
        <button 
          class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
          on:click={handleLogout}
        >
          Cerrar Sesión
        </button>
      {:else}
        <button 
          class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
          on:click={() => goto('/login')}
        >
          Iniciar Sesión
        </button>
      {/if}
    </div>
  </div>
</div> 