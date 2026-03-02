<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/authStore';
  import { EmpresaService } from '$lib/services/EmpresaService';
  import { goto } from '$app/navigation';
  import { Search, User, LogOut, X } from 'lucide-svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { toast } from '$lib/utils/toast';

  let logo = "/janus314.png";
  let logoEmpresa = $state("");
  let companyName = $state("");
  let userName = $state("");
  let isLoggedIn = $state(false);
  let unsubscribe: () => void;
  let searchQuery = $state('');
  let showSearch = $state(false);

  onMount(() => {
    // Suscribirse a cambios en el estado de autenticación
    unsubscribe = auth.subscribe(state => {
      isLoggedIn = state.isAuthenticated;
      if (state.user) {
        EmpresaService.obtenerDatos()
          .then(datosEmpresa => {
            companyName = datosEmpresa.RazonSocial || "Empresa no configurada";
            logoEmpresa = datosEmpresa.LogoURL || "";
          })
          .catch(error => {
            console.error('Error al cargar datos de la empresa:', error);
            companyName = "Sin datos";
          });
        userName = `${state.user.nombre}`;
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

  function toggleSearch() {
    showSearch = !showSearch;
    if (showSearch) {
      setTimeout(() => {
        document.getElementById('universal-search')?.focus();
      }, 100);
    }
  }

  function handleSearch() {
    if (searchQuery.trim()) {
      console.log('Buscando:', searchQuery);
      // TODO: Implementar búsqueda universal
      toast.info('Búsqueda universal en desarrollo: ' + searchQuery);
    }
  }
</script>

<div class="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white shadow-lg">
  <div class="container mx-auto px-4 py-2 flex items-center justify-between">
    <!-- Logo y nombre del sistema -->
    <div class="flex items-center gap-3">
      <a href="/" class="flex items-center gap-2 group">
        <div class="relative w-10 h-10">
          <img 
            src={logo} 
            alt="janus314" 
            class="w-full h-full rounded-full transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-12 animate-pulse-slow"
          >
          <div class="absolute inset-0 bg-blue-500 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-sm"></div>
        </div>
        <h1 class="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
          janus314
        </h1>
      </a>
      
      <!-- Empresa -->
      {#if isLoggedIn && companyName}
        <div class="flex items-center gap-2 ml-4 pl-4 border-l border-gray-600">
          {#if logoEmpresa}
            <img 
              src={logoEmpresa} 
              alt={companyName} 
              class="w-8 h-8 rounded-full object-cover bg-gray-700"
            >
          {/if}
          <span class="text-sm text-gray-300 hidden md:inline">
            {companyName}
          </span>
        </div>
      {/if}
    </div>
    
    <!-- Barra de búsqueda y acciones -->
    <div class="flex items-center gap-3">
      <!-- Búsqueda universal -->
      {#if isLoggedIn}
        <div class="relative">
          {#if showSearch}
            <div class="flex items-center gap-2 animate-slide-in">
              <input
                id="universal-search"
                type="text"
                bind:value={searchQuery}
                placeholder="Buscar en todo el sistema..."
                class="bg-gray-700 text-white px-3 py-1 rounded text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onkeydown={(e) => e.key === 'Enter' && handleSearch()}
              >
              <button
                class="text-gray-400 hover:text-white"
                onclick={toggleSearch}
                aria-label="Cerrar búsqueda"
              >
                ✕
              </button>
            </div>
          {:else}
            <button
              class="transition-all duration-200"
              onclick={toggleSearch}
              aria-label="Abrir búsqueda universal"
              title="Búsqueda universal (próximamente)"
            >
              <Icon icon={Search} size={20} strokeWidth={2.5} glass={true} />
            </button>
          {/if}
        </div>
        
        <!-- Usuario -->
        <div class="flex items-center gap-2 text-sm">
          <div class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm bg-white/5 border border-white/10">
            <Icon icon={User} size={16} strokeWidth={2.5} />
            <span class="text-gray-300 font-medium">{userName}</span>
          </div>
          
          <!-- Botón logout -->
          <button 
            class="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition-all transform hover:scale-105 shadow-lg hover:shadow-red-900/50"
            onclick={handleLogout}
            title="Cerrar sesión"
          >
            <Icon icon={LogOut} size={16} strokeWidth={2.5} />
            <span class="hidden sm:inline font-medium">Salir</span>
          </button>
        </div>
      {:else}
        <button 
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-full text-sm transition-all transform hover:scale-105"
          onclick={() => goto('/login')}
        >
          Iniciar Sesión
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  @keyframes pulse-slow {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient 3s ease infinite;
  }

  .animate-pulse-slow {
    animation: pulse-slow 3s ease-in-out infinite;
  }

  .animate-slide-in {
    animation: slide-in 0.2s ease-out;
  }
</style>
