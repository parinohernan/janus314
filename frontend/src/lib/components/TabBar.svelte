<script lang="ts">
  import { tabsStore } from '$lib/stores/tabsStore';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { 
    X, 
    Pin, 
    PinOff,
    FileText,
    Users,
    Package,
    ShoppingCart,
    CreditCard,
    Receipt,
    ClipboardList,
    BarChart3,
    Building,
    Factory,
    Boxes,
    DollarSign,
    MapPin,
    Settings,
    RefreshCw,
    Wallet,
    Map,
    File,
    Circle
  } from 'lucide-svelte';
  import Icon from '$lib/components/ui/Icon.svelte';

  let contextMenuOpen = $state(false);
  let contextMenuX = $state(0);
  let contextMenuY = $state(0);
  let contextMenuTabId = $state<string | null>(null);
  let tabsContainer = $state<HTMLDivElement>();

  // Reactive derived states
  let tabs = $derived($tabsStore.tabs);
  let activeTabId = $derived($tabsStore.activeTabId);
  let contextMenuTab = $derived(tabs.find(t => t.id === contextMenuTabId));

  // Mapeo de emojis a iconos de Lucide
  const emojiToIconMap: Record<string, any> = {
    '📄': FileText,
    '👥': Users,
    '👤': Users,
    '📦': Package,
    '🛒': ShoppingCart,
    '💵': CreditCard,
    '💰': Wallet,
    '🧾': Receipt,
    '📝': ClipboardList,
    '📊': BarChart3,
    '🏢': Building,
    '🏭': Factory,
    '📋': File,
    '💲': DollarSign,
    '📍': MapPin,
    '⚙️': Settings,
    '🔄': RefreshCw,
    '🗺️': Map,
    '🏛️': Building,
    '👔': Users,
    '⚡': Settings,
    '🔢': BarChart3
  };

  // Función para obtener el componente de icono desde emoji o devolver el icono por defecto
  function getIconComponent(icon?: string): any {
    if (!icon) return File;
    return emojiToIconMap[icon] || File;
  }

  onMount(() => {
    // Cargar tabs guardados
    tabsStore.loadTabs();
  });

  // Observar cambios en la URL para sincronizar con el tab activo
  $effect(() => {
    const currentUrl = $page.url.pathname;
    const activeTab = tabs.find(t => t.id === activeTabId);
    
    // Si la URL cambió y no coincide con el tab activo, actualizar el tab activo
    if (activeTab && activeTab.url !== currentUrl) {
      const matchingTab = tabs.find(t => t.url === currentUrl);
      if (matchingTab) {
        tabsStore.setActiveTab(matchingTab.id);
      }
    }
  });

  function handleTabClick(tabId: string, url: string) {
    tabsStore.setActiveTab(tabId);
    goto(url);
  }

  function handleCloseTab(event: MouseEvent, tabId: string) {
    event.stopPropagation();
    tabsStore.closeTab(tabId);
  }

  function handleContextMenu(event: MouseEvent, tabId: string) {
    event.preventDefault();
    contextMenuTabId = tabId;
    contextMenuX = event.clientX;
    contextMenuY = event.clientY;
    contextMenuOpen = true;
  }

  function closeContextMenu() {
    contextMenuOpen = false;
    contextMenuTabId = null;
  }

  function handleContextMenuAction(action: string) {
    if (!contextMenuTabId) return;

    switch (action) {
      case 'close':
        tabsStore.closeTab(contextMenuTabId, true);
        break;
      case 'close-others':
        tabsStore.closeOtherTabs(contextMenuTabId);
        break;
      case 'close-all':
        tabsStore.closeAllTabs();
        break;
      case 'close-right':
        tabsStore.closeTabsToRight(contextMenuTabId);
        break;
      case 'pin':
        tabsStore.togglePinTab(contextMenuTabId);
        break;
    }

    closeContextMenu();
  }

  // Cerrar menú contextual al hacer click fuera
  function handleClickOutside() {
    if (contextMenuOpen) {
      closeContextMenu();
    }
  }

  function scrollToActiveTab() {
    if (!tabsContainer || !activeTabId) return;
    
    const activeTabElement = tabsContainer.querySelector(`[data-tab-id="${activeTabId}"]`);
    if (activeTabElement) {
      activeTabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  // Scroll al tab activo cuando cambia
  $effect(() => {
    if (activeTabId) {
      setTimeout(scrollToActiveTab, 100);
    }
  });

  // Cuando se cierran todas las pestañas, mostrar la página home
  $effect(() => {
    if (tabs.length === 0 && $page.url.pathname !== '/' && $page.url.pathname !== '/login' && !$page.url.pathname.includes('/ventas/bot/')) {
      goto('/');
    }
  });
</script>

<svelte:window onclick={handleClickOutside} />

{#if tabs.length > 0}
<div class="tab-bar bg-gray-100 border-b border-gray-300 overflow-hidden relative z-30">
  <div 
    bind:this={tabsContainer}
    class="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
  >
    {#each tabs as tab (tab.id)}
      <div
        data-tab-id={tab.id}
        role="tab"
        tabindex="0"
        aria-selected={tab.id === activeTabId}
        class="tab group relative flex items-center gap-2 px-4 py-2 cursor-pointer border-r border-gray-300 min-w-[150px] max-w-[250px] transition-all duration-200
          {tab.id === activeTabId ? 'bg-white border-b-2 border-b-blue-500' : 'bg-gray-200 hover:bg-gray-300'}"
        onclick={() => handleTabClick(tab.id, tab.url)}
        onkeydown={(e) => e.key === 'Enter' && handleTabClick(tab.id, tab.url)}
        oncontextmenu={(e) => handleContextMenu(e, tab.id)}
      >
        <!-- Indicador de tab anclado -->
        {#if tab.pinned}
          <div class="flex-shrink-0 text-blue-600" title="Anclado">
            <Icon icon={Pin} size={12} strokeWidth={2.5} />
          </div>
        {/if}

        <!-- Icono del tab -->
        <div class="flex-shrink-0 {tab.id === activeTabId ? 'text-blue-600' : 'text-gray-600'}">
          <Icon icon={getIconComponent(tab.icon)} size={16} strokeWidth={2.5} />
        </div>

        <!-- Label del tab -->
        <span class="flex-1 truncate text-sm font-medium select-none">
          {tab.label}
        </span>

        <!-- Indicador de modificado -->
        {#if tab.modified}
          <div class="flex-shrink-0 text-orange-500 animate-pulse" title="Sin guardar">
            <Icon icon={Circle} size={8} strokeWidth={4} class="fill-current" />
          </div>
        {/if}

        <!-- Botón cerrar -->
        {#if !tab.pinned}
          <button
            class="close-btn opacity-0 group-hover:opacity-100 hover:bg-gray-400 rounded transition-all duration-200"
            onclick={(e) => handleCloseTab(e, tab.id)}
            aria-label="Cerrar tab"
            title="Cerrar"
          >
            <Icon icon={X} size={14} strokeWidth={3} />
          </button>
        {/if}
      </div>
    {/each}
  </div>
</div>
{/if}

<!-- Menú contextual -->
{#if contextMenuOpen && contextMenuTabId && contextMenuTab}
  <div
    class="fixed bg-white shadow-lg rounded-md border border-gray-300 py-1 z-50 min-w-[180px]"
    style="left: {contextMenuX}px; top: {contextMenuY}px;"
  >
    <button
      class="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
      onclick={() => handleContextMenuAction('close')}
    >
      Cerrar
    </button>

    <button
      class="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
      onclick={() => handleContextMenuAction('close-others')}
    >
      Cerrar otros
    </button>

    <button
      class="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
      onclick={() => handleContextMenuAction('close-right')}
    >
      Cerrar a la derecha
    </button>

    <hr class="my-1 border-gray-200">

    <button
      class="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
      onclick={() => handleContextMenuAction('close-all')}
    >
      Cerrar todos
    </button>

    <hr class="my-1 border-gray-200">

    <button
      class="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
      onclick={() => handleContextMenuAction('pin')}
    >
      {contextMenuTab.pinned ? 'Desanclar' : 'Anclar'}
    </button>
  </div>
{/if}

<style>
  .tab-bar {
    height: 40px;
  }

  .scrollbar-thin::-webkit-scrollbar {
    height: 6px;
  }

  .scrollbar-thin::-webkit-scrollbar-track {
    background: #e5e7eb;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: #9ca3af;
    border-radius: 3px;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
</style>
