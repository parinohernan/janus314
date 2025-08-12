<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from './Button.svelte';

  export let currentPage: number = 1;
  export let totalPages: number = 1;
  export let totalItems: number = 0;
  export let itemsPerPage: number = 10;
  export let showItemsInfo: boolean = true;

  const dispatch = createEventDispatcher<{
    pageChange: { page: number };
  }>();

  $: startItem = (currentPage - 1) * itemsPerPage + 1;
  $: endItem = Math.min(currentPage * itemsPerPage, totalItems);

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      dispatch('pageChange', { page });
    }
  }

  function getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Mostrar todas las páginas si hay pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar páginas alrededor de la página actual
      let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages, start + maxVisible - 1);
      
      // Ajustar si estamos cerca del final
      if (end === totalPages) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }
</script>

{#if totalPages > 1}
  <div class="flex flex-col sm:flex-row justify-between items-center gap-4 py-4">
    {#if showItemsInfo}
      <div class="text-sm text-gray-700">
        Mostrando {startItem} a {endItem} de {totalItems} resultados
      </div>
    {/if}
    
    <div class="flex items-center gap-2">
      <!-- Botón Anterior -->
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage === 1}
        on:click={() => goToPage(currentPage - 1)}
      >
        Anterior
      </Button>

      <!-- Números de página -->
      <div class="flex items-center gap-1">
        {#each getVisiblePages() as page}
          <Button
            variant={page === currentPage ? "default" : "secondary"}
            size="sm"
            on:click={() => goToPage(page)}
            class="min-w-[2.5rem]"
          >
            {page}
          </Button>
        {/each}
      </div>

      <!-- Botón Siguiente -->
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage === totalPages}
        on:click={() => goToPage(currentPage + 1)}
      >
        Siguiente
      </Button>
    </div>
  </div>
{/if}
