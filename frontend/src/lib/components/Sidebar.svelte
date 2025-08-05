<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { favoritesStore, availableFeatures, type FavoriteItem } from '$lib/stores/favoritesStore';

  // El sidebar se cerrará automáticamente cuando se navegue desde dentro

  let isOpen = $state(false);
  let showAddModal = $state(false);

  // Cargar favoritos desde localStorage
  onMount(() => {
    if (browser) {
      favoritesStore.loadFavorites();
    }
  });

  function addFavorite(favorite: FavoriteItem) {
    favoritesStore.addFavorite(favorite);
    showAddModal = false;
  }

  function removeFavorite(id: string) {
    favoritesStore.removeFavorite(id);
  }

  function navigateTo(url: string) {
    isOpen = false;
    goto(url);
  }

  function toggleSidebar() {
    isOpen = !isOpen;
  }

  function openAddModal() {
    showAddModal = true;
  }

  function closeAddModal() {
    showAddModal = false;
  }

  // Agrupar favoritos por categoría
  let favoritesByCategory = $derived(favoritesStore.groupByCategory($favoritesStore));

  // Obtener funcionalidades disponibles que no están en favoritos
  let availableToAdd = $derived(favoritesStore.getAvailableFeatures($favoritesStore));

  // Agrupar funcionalidades disponibles por categoría
  let availableByCategory = $derived(availableToAdd.reduce((acc: Record<string, FavoriteItem[]>, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, FavoriteItem[]>));
</script>

<!-- Botón para abrir/cerrar sidebar -->
<button
  on:click={toggleSidebar}
  class="fixed top-20 left-4 z-30 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
  title="Favoritos"
>
  ⭐
</button>

<!-- Overlay para cerrar sidebar -->
{#if isOpen}
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 z-40"
    on:click={toggleSidebar}
  ></div>
{/if}

<!-- Sidebar -->
{#if isOpen}
<div class="fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 translate-x-0">
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="bg-blue-600 text-white p-4 flex justify-between items-center">
      <h2 class="text-lg font-semibold">⭐ Favoritos</h2>
      <button
        on:click={toggleSidebar}
        class="text-white hover:text-gray-200"
      >
        ✕
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      {#if $favoritesStore.length === 0}
        <div class="text-center text-gray-500 py-8">
          <div class="text-4xl mb-2">⭐</div>
          <p>No tienes favoritos aún</p>
          <button
            on:click={openAddModal}
            class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Agregar Favorito
          </button>
        </div>
      {:else}
        <!-- Botón para agregar más favoritos -->
        <div class="mb-4">
          <button
            on:click={openAddModal}
            class="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2"
          >
            ➕ Agregar Favorito
          </button>
        </div>

        <!-- Lista de favoritos por categoría -->
        {#each Object.entries(favoritesByCategory) as [category, items]}
          <div class="mb-6">
            <h3 class="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
              {category}
            </h3>
            <div class="space-y-2">
              {#each items as favorite}
                <div class="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                  <button
                    on:click={() => navigateTo(favorite.url)}
                    class="flex items-center gap-3 flex-1 text-left"
                  >
                    <span class="text-xl">{favorite.icon}</span>
                    <span class="font-medium">{favorite.label}</span>
                  </button>
                  <button
                    on:click={() => removeFavorite(favorite.id)}
                    class="text-red-500 hover:text-red-700 p-1"
                    title="Eliminar de favoritos"
                  >
                    🗑️
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>
{/if}

<!-- Modal para agregar favoritos -->
{#if showAddModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
      <div class="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h3 class="text-lg font-semibold">Agregar a Favoritos</h3>
        <button
          on:click={closeAddModal}
          class="text-white hover:text-gray-200"
        >
          ✕
        </button>
      </div>
      
      <div class="p-4 max-h-[60vh] overflow-y-auto">
        {#if availableToAdd.length === 0}
          <p class="text-center text-gray-500 py-4">
            Ya tienes todas las funcionalidades en favoritos
          </p>
        {:else}
          {#each Object.entries(availableByCategory) as [category, items]}
            <div class="mb-4">
              <h4 class="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                {category}
              </h4>
              <div class="space-y-2">
                {#each items as feature}
                  <button
                    on:click={() => addFavorite(feature)}
                    class="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span class="text-xl">{feature.icon}</span>
                    <span>{feature.label}</span>
                  </button>
                {/each}
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  /* Estilos adicionales si son necesarios */
</style> 