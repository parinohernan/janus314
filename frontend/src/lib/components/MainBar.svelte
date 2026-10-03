<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/authStore';
  import { EmpresaService } from '$lib/services/EmpresaService';
  import { goto } from '$app/navigation';
  import { Bug, Search, User, LogOut } from 'lucide-svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { toast } from '$lib/utils/toast';
  import { devOptions } from '$lib/stores/devOptionsStore';

  let logo = "/janus314.png";
  let logoEmpresa = $state("");
  let companyName = $state("");
  let userName = $state("");
  let isLoggedIn = $state(false);
  let unsubscribe: () => void;
  let searchQuery = $state('');
  let showSearch = $state(false);
  let devUnlocked = $state(false);
  let showDevGate = $state(false);
  let showDevMenu = $state(false);
  let devPassword = $state('');
  let devPasswordError = $state('');

  onMount(() => {
    devOptions.hydrate();
    const unsubscribeDev = devOptions.subscribe((unlocked) => {
      devUnlocked = unlocked;
      if (!unlocked) showDevMenu = false;
    });

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
      unsubscribeDev();
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
    } else {
      showDevGate = false;
    }
  }

  function handleSearch() {
    const query = searchQuery.trim();
    if (!query) return;

    if (query.toLowerCase() === 'janus') {
      searchQuery = '';
      if (devUnlocked) {
        showDevGate = false;
        showDevMenu = true;
        return;
      }
      devPassword = '';
      devPasswordError = '';
      showDevGate = true;
      setTimeout(() => {
        document.getElementById('dev-options-password')?.focus();
      }, 50);
      return;
    }

    showDevGate = false;
    console.log('Buscando:', query);
    toast.info('Búsqueda universal en desarrollo: ' + query);
  }

  function submitDevPassword() {
    if (devOptions.unlock(devPassword)) {
      showDevGate = false;
      devPassword = '';
      devPasswordError = '';
      showDevMenu = true;
      toast.success('Opciones de desarrollador activadas');
      return;
    }
    devPasswordError = 'Contraseña incorrecta';
  }

  function deactivateDevOptions() {
    devOptions.lock();
    showDevMenu = false;
    toast.info('Opciones de desarrollador desactivadas');
  }
</script>

<div class="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white shadow-lg">
  <div class="flex w-full min-w-0 max-w-none items-center justify-between px-4 py-2 sm:px-5 lg:px-6">
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
            {#if showDevGate}
              <button
                class="fixed inset-0 z-40 cursor-default"
                aria-label="Cerrar"
                onclick={() => (showDevGate = false)}
              ></button>
              <form
                class="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-gray-600 bg-gray-800 p-3 shadow-xl"
                onsubmit={(e) => {
                  e.preventDefault();
                  submitDevPassword();
                }}
              >
                <p class="mb-2 text-sm text-gray-200">
                  Ingrese contraseña para activar opciones de desarrollador
                </p>
                <input
                  id="dev-options-password"
                  type="password"
                  bind:value={devPassword}
                  placeholder="Contraseña"
                  class="w-full rounded bg-gray-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onkeydown={(e) => {
                    if (e.key === 'Escape') showDevGate = false;
                  }}
                />
                {#if devPasswordError}
                  <p class="mt-1 text-xs text-red-400">{devPasswordError}</p>
                {/if}
                <button
                  type="submit"
                  class="mt-2 w-full rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Activar
                </button>
              </form>
            {/if}
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

        {#if devUnlocked}
          <div class="relative">
            <button
              class="transition-all duration-200"
              onclick={() => (showDevMenu = !showDevMenu)}
              aria-label="Opciones de desarrollador"
              title="Opciones de desarrollador"
            >
              <Icon icon={Bug} size={20} strokeWidth={2.5} glass={true} />
            </button>
            {#if showDevMenu}
              <button
                class="fixed inset-0 z-40 cursor-default"
                aria-label="Cerrar menú"
                onclick={() => (showDevMenu = false)}
              ></button>
              <div class="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-amber-700/60 bg-gray-900 p-3 shadow-xl">
                <p class="text-sm font-semibold text-amber-300">Opciones de desarrollador</p>
                <p class="mt-1 text-xs text-gray-400">
                  Funciones para implementadores y depuración.
                </p>
                <button
                  class="mt-3 w-full rounded border border-gray-600 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-800"
                  onclick={deactivateDevOptions}
                >
                  Desactivar
                </button>
              </div>
            {/if}
          </div>
        {/if}
        
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
