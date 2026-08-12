<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { renderMarkdown } from '$lib/utils/markdown';
  import Button from '$lib/components/ui/Button.svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { ArrowLeft, Pencil, BookOpen } from 'lucide-svelte';
  import { auth } from '$lib/stores/authStore';

  let loading = true;
  let error: string | null = null;
  let articulo: any = null;
  let puedeEditar = false;
  let htmlContenido = '';

  $: esAdmin = $auth?.user?.usuario === 'admin';
  $: slug = $page.params.slug;

  onMount(() => {
    if (slug === 'nuevo') {
      goto('/ayuda/nuevo');
      return;
    }
    cargar(slug);
  });

  // Recargar si cambia el slug por navegación interna
  $: if (slug && slug !== 'nuevo' && articulo?.slug && articulo.slug !== slug) {
    cargar(slug);
  }

  async function cargar(currentSlug: string) {
    if (!currentSlug) return;
    try {
      loading = true;
      error = null;
      const response = await fetchWithAuth(`/wiki/${currentSlug}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Artículo no encontrado');
        throw new Error('No se pudo cargar el artículo');
      }
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Error del servidor');
      articulo = result.data.articulo;
      puedeEditar = !!result.data.puedeEditar;
      htmlContenido = renderMarkdown(articulo.contenido || '');
    } catch (err) {
      console.error(err);
      error = err instanceof Error ? err.message : 'Error desconocido';
      articulo = null;
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>{articulo?.titulo || 'Ayuda'} — Wiki</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6 max-w-4xl">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <Button variant="secondary" on:click={() => goto('/ayuda')}>
      <span class="inline-flex items-center gap-2">
        <Icon icon={ArrowLeft} size={16} />
        Volver al listado
      </span>
    </Button>

    {#if (esAdmin || puedeEditar) && articulo}
      <Button variant="primary" on:click={() => goto(`/ayuda/${articulo.slug}/editar`)}>
        <span class="inline-flex items-center gap-2">
          <Icon icon={Pencil} size={16} />
          Editar
        </span>
      </Button>
    {/if}
  </div>

  {#if loading}
    <div class="flex justify-center py-16">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
  {:else if articulo}
    <article class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <header class="bg-slate-900 text-white p-6">
        <div class="flex items-center gap-2 text-slate-300 text-sm mb-2">
          <Icon icon={BookOpen} size={16} />
          <span>{articulo.categoria}</span>
          {#if !articulo.publicado}
            <span class="ml-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 text-xs">Borrador</span>
          {/if}
        </div>
        <h1 class="text-2xl md:text-3xl font-bold">{articulo.titulo}</h1>
        {#if articulo.resumen}
          <p class="text-slate-300 mt-3">{articulo.resumen}</p>
        {/if}
      </header>

      <div class="wiki-content p-6 md:p-8">
        {@html htmlContenido}
      </div>
    </article>
  {/if}
</div>

<style>
  :global(.wiki-content h1) {
    font-size: 1.6rem;
    font-weight: 700;
    margin: 1.4rem 0 0.7rem;
    color: #0f172a;
  }
  :global(.wiki-content h2) {
    font-size: 1.3rem;
    font-weight: 700;
    margin: 1.3rem 0 0.55rem;
    color: #1e293b;
  }
  :global(.wiki-content h3) {
    font-size: 1.1rem;
    font-weight: 650;
    margin: 1.1rem 0 0.45rem;
    color: #334155;
  }
  :global(.wiki-content p) {
    margin: 0.7rem 0;
    line-height: 1.65;
    color: #334155;
  }
  :global(.wiki-content ul),
  :global(.wiki-content ol) {
    margin: 0.7rem 0 0.7rem 1.3rem;
    color: #334155;
    line-height: 1.6;
  }
  :global(.wiki-content li) {
    margin: 0.25rem 0;
  }
  :global(.wiki-content code) {
    background: #f1f5f9;
    border-radius: 0.3rem;
    padding: 0.1rem 0.35rem;
    font-size: 0.9em;
  }
  :global(.wiki-content pre) {
    background: #0f172a;
    color: #e2e8f0;
    border-radius: 0.6rem;
    padding: 0.9rem 1rem;
    overflow-x: auto;
    margin: 1rem 0;
  }
  :global(.wiki-content pre code) {
    background: transparent;
    color: inherit;
    padding: 0;
  }
  :global(.wiki-content hr) {
    border: 0;
    border-top: 1px solid #e2e8f0;
    margin: 1.4rem 0;
  }
  :global(.wiki-content a.wiki-link) {
    color: #2563eb;
    text-decoration: underline;
  }
  :global(.wiki-content strong) {
    color: #0f172a;
  }
</style>
