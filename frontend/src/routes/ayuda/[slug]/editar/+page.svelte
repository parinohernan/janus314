<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import Button from '$lib/components/ui/Button.svelte';
  import { auth } from '$lib/stores/authStore';

  let titulo = '';
  let categoria = 'General';
  let resumen = '';
  let contenido = '';
  let publicado = true;
  let slugEdit = '';
  let slugOriginal = '';
  let loading = true;
  let saving = false;
  let deleting = false;
  let error: string | null = null;

  $: esAdmin = $auth?.user?.usuario === 'admin';

  onMount(async () => {
    if ($auth?.user && $auth.user.usuario !== 'admin') {
      goto('/ayuda');
      return;
    }
    slugOriginal = $page.params.slug;
    await cargar();
  });

  async function cargar() {
    try {
      loading = true;
      error = null;
      const response = await fetchWithAuth(`/wiki/${slugOriginal}`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'No se pudo cargar el artículo');
      }
      const a = result.data.articulo;
      titulo = a.titulo || '';
      categoria = a.categoria || 'General';
      resumen = a.resumen || '';
      contenido = a.contenido || '';
      publicado = a.publicado !== false;
      slugEdit = a.slug || '';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al cargar';
    } finally {
      loading = false;
    }
  }

  async function guardar() {
    try {
      saving = true;
      error = null;
      if (!titulo.trim() || !contenido.trim()) {
        throw new Error('Título y contenido son obligatorios');
      }

      const response = await fetchWithAuth(`/wiki/${slugOriginal}`, {
        method: 'PUT',
        body: JSON.stringify({
          titulo: titulo.trim(),
          categoria: categoria.trim() || 'General',
          resumen: resumen.trim() || null,
          contenido,
          publicado,
          slug: slugEdit.trim() || slugOriginal
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'No se pudo actualizar');
      }
      goto(`/ayuda/${result.data.slug}`);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al guardar';
    } finally {
      saving = false;
    }
  }

  async function eliminar() {
    if (!confirm('¿Eliminar este artículo? Esta acción no se puede deshacer.')) return;
    try {
      deleting = true;
      error = null;
      const response = await fetchWithAuth(`/wiki/${slugOriginal}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'No se pudo eliminar');
      }
      goto('/ayuda');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al eliminar';
    } finally {
      deleting = false;
    }
  }
</script>

<svelte:head>
  <title>Editar artículo — Wiki</title>
</svelte:head>

{#if !esAdmin}
  <div class="container mx-auto p-6">
    <p class="text-gray-600">Solo el administrador puede editar artículos.</p>
  </div>
{:else}
  <div class="container mx-auto p-6 max-w-3xl space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Editar artículo</h1>
      <p class="text-gray-600 mt-1">Los cambios impactan en todas las empresas.</p>
    </div>

    {#if error}
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
    {/if}

    {#if loading}
      <div class="flex justify-center py-16">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    {:else}
      <div class="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="titulo">Título</label>
          <input id="titulo" bind:value={titulo} class="w-full rounded-lg border border-gray-300 px-3 py-2" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1" for="categoria">Categoría</label>
            <input id="categoria" bind:value={categoria} class="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1" for="slug">Slug</label>
            <input id="slug" bind:value={slugEdit} class="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="resumen">Resumen</label>
          <input id="resumen" bind:value={resumen} class="w-full rounded-lg border border-gray-300 px-3 py-2" maxlength="500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="contenido">Contenido (Markdown)</label>
          <textarea id="contenido" bind:value={contenido} rows="18" class="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"></textarea>
        </div>

        <label class="inline-flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" bind:checked={publicado} />
          Publicado
        </label>

        <div class="flex flex-wrap gap-3 pt-2">
          <Button variant="primary" on:click={guardar} disabled={saving || deleting}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          <Button variant="secondary" on:click={() => goto(`/ayuda/${slugOriginal}`)} disabled={saving || deleting}>
            Cancelar
          </Button>
          <Button variant="danger" on:click={eliminar} disabled={saving || deleting}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </div>
    {/if}
  </div>
{/if}
