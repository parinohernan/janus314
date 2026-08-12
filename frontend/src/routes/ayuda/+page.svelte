<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import Button from '$lib/components/ui/Button.svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { BookOpen, Search, Plus } from 'lucide-svelte';
  import { auth } from '$lib/stores/authStore';

  interface WikiArticuloListItem {
    id: number;
    slug: string;
    titulo: string;
    categoria: string;
    resumen?: string | null;
    publicado: boolean;
    updatedAt?: string;
  }

  let loading = true;
  let error: string | null = null;
  let articulos: WikiArticuloListItem[] = [];
  let categorias: string[] = [];
  let puedeEditar = false;
  let busqueda = '';
  let categoria = '';

  $: esAdmin = $auth?.user?.usuario === 'admin';

  onMount(() => {
    cargar();
  });

  async function cargar() {
    try {
      loading = true;
      error = null;
      const params = new URLSearchParams();
      if (busqueda.trim()) params.set('q', busqueda.trim());
      if (categoria) params.set('categoria', categoria);

      const qs = params.toString();
      const response = await fetchWithAuth(qs ? `/wiki?${qs}` : '/wiki');
      if (!response.ok) throw new Error('No se pudo cargar la ayuda');

      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Error del servidor');

      articulos = result.data.articulos || [];
      categorias = result.data.categorias || [];
      puedeEditar = !!result.data.puedeEditar;
    } catch (err) {
      console.error(err);
      error = err instanceof Error ? err.message : 'Error desconocido';
      articulos = [];
    } finally {
      loading = false;
    }
  }

  function buscar() {
    cargar();
  }

  function abrir(slug: string) {
    goto(`/ayuda/${slug}`);
  }
</script>

<svelte:head>
  <title>Ayuda / Wiki</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
        <Icon icon={BookOpen} size={32} strokeWidth={2.5} glass={true} />
        Ayuda / Wiki
      </h1>
      <p class="text-gray-600 mt-2">
        Guías del ERP para resolver consultas frecuentes de clientes y usuarios.
      </p>
    </div>

    {#if esAdmin || puedeEditar}
      <Button variant="primary" on:click={() => goto('/ayuda/nuevo')}>
        <span class="inline-flex items-center gap-2">
          <Icon icon={Plus} size={16} />
          Nuevo artículo
        </span>
      </Button>
    {/if}
  </div>

  <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1" for="wiki-search">Buscar</label>
        <div class="relative">
          <input
            id="wiki-search"
            bind:value={busqueda}
            on:keydown={(e) => e.key === 'Enter' && buscar()}
            placeholder="Ej: exportar PDF, clientes, facturas..."
            class="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span class="absolute right-3 top-2.5 text-gray-400">
            <Icon icon={Search} size={18} />
          </span>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="wiki-cat">Categoría</label>
        <select
          id="wiki-cat"
          bind:value={categoria}
          on:change={buscar}
          class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Todas</option>
          {#each categorias as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>
      </div>
    </div>
    <div class="mt-3">
      <Button variant="secondary" on:click={buscar} disabled={loading}>Buscar</Button>
    </div>
  </div>

  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
  {/if}

  {#if loading}
    <div class="flex justify-center py-16">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  {:else if articulos.length === 0}
    <div class="text-center py-16 bg-white rounded-xl border border-gray-200">
      <p class="text-xl font-semibold text-gray-900 mb-2">Sin artículos</p>
      <p class="text-gray-600">No hay guías con esos filtros.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each articulos as articulo}
        <button
          type="button"
          class="text-left bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition"
          on:click={() => abrir(articulo.slug)}
        >
          <div class="flex items-start justify-between gap-3 mb-2">
            <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              {articulo.categoria}
            </span>
            {#if !articulo.publicado}
              <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                Borrador
              </span>
            {/if}
          </div>
          <h2 class="text-lg font-semibold text-gray-900 mb-1">{articulo.titulo}</h2>
          <p class="text-sm text-gray-600 line-clamp-2">
            {articulo.resumen || 'Sin resumen'}
          </p>
        </button>
      {/each}
    </div>
  {/if}
</div>
