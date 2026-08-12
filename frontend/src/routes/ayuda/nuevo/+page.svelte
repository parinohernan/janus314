<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import Button from '$lib/components/ui/Button.svelte';
  import { auth } from '$lib/stores/authStore';

  let titulo = '';
  let categoria = 'General';
  let resumen = '';
  let contenido = '';
  let publicado = true;
  let slug = '';
  let saving = false;
  let error: string | null = null;

  $: esAdmin = $auth?.user?.usuario === 'admin';

  onMount(() => {
    if ($auth?.user && $auth.user.usuario !== 'admin') {
      goto('/ayuda');
    }
  });

  async function guardar() {
    try {
      saving = true;
      error = null;

      if (!titulo.trim() || !contenido.trim()) {
        throw new Error('Título y contenido son obligatorios');
      }

      const response = await fetchWithAuth('/wiki', {
        method: 'POST',
        body: JSON.stringify({
          titulo: titulo.trim(),
          categoria: categoria.trim() || 'General',
          resumen: resumen.trim() || null,
          contenido,
          publicado,
          slug: slug.trim() || undefined
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'No se pudo crear el artículo');
      }

      goto(`/ayuda/${result.data.slug}`);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al guardar';
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Nuevo artículo — Wiki</title>
</svelte:head>

{#if !esAdmin}
  <div class="container mx-auto p-6">
    <p class="text-gray-600">Solo el administrador puede crear artículos.</p>
  </div>
{:else}
  <div class="container mx-auto p-6 max-w-3xl space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Nuevo artículo</h1>
      <p class="text-gray-600 mt-1">Escribí la guía en Markdown. Se publica para todas las empresas.</p>
    </div>

    {#if error}
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
    {/if}

    <div class="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="titulo">Título</label>
        <input id="titulo" bind:value={titulo} class="w-full rounded-lg border border-gray-300 px-3 py-2" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="categoria">Categoría</label>
          <input id="categoria" bind:value={categoria} class="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Informes, Ventas, AFIP..." />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="slug">Slug (opcional)</label>
          <input id="slug" bind:value={slug} class="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="se-genera-del-titulo" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="resumen">Resumen</label>
        <input id="resumen" bind:value={resumen} class="w-full rounded-lg border border-gray-300 px-3 py-2" maxlength="500" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="contenido">Contenido (Markdown)</label>
        <textarea
          id="contenido"
          bind:value={contenido}
          rows="18"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
          placeholder="# Título&#10;&#10;1. Paso uno&#10;2. Paso dos"
        ></textarea>
      </div>

      <label class="inline-flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" bind:checked={publicado} />
        Publicado
      </label>

      <div class="flex gap-3 pt-2">
        <Button variant="primary" on:click={guardar} disabled={saving}>
          {saving ? 'Guardando...' : 'Crear artículo'}
        </Button>
        <Button variant="secondary" on:click={() => goto('/ayuda')} disabled={saving}>Cancelar</Button>
      </div>
    </div>
  </div>
{/if}
