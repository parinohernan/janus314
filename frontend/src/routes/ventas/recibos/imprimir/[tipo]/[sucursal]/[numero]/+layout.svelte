<script lang="ts">
  import { page } from '$app/stores';
  import { beforeNavigate, afterNavigate } from '$app/navigation';
  import { navigationState } from '$lib/stores/navigationState';
  
  let { children } = $props();
  
  beforeNavigate(({ from, to, cancel }) => {
    if (from) {
      navigationState.saveState(from.url.pathname, {
        scroll: window.scrollY
      });
    }
  });
  
  afterNavigate(({ from, to }) => {
    if (to) {
      const savedState = navigationState.getState(to.url.pathname);
      
      if (savedState?.scroll !== undefined) {
        setTimeout(() => {
          window.scrollTo(0, savedState.scroll);
        }, 0);
      } else {
        window.scrollTo(0, 0);
      }
    }
  });
</script>

<svelte:head>
  <title>Imprimir Recibo | Gestión Comercial</title>
</svelte:head>

<div class="min-h-screen print:p-0">
  {@render children()}
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style> 