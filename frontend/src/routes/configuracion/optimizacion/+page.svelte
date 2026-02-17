<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/authStore';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import Button from '$lib/components/ui/Button.svelte';

  const VENDEDOR_ADMIN = 'admin';

  let mensaje = $state('');
  let mensajeTipo = $state<'success' | 'error'>('success');
  let ejecutando = $state<string | null>(null);
  let exportacion = $state<Record<string, unknown> | null>(null);

  const esAdmin = $derived($auth?.user?.usuario === VENDEDOR_ADMIN);

  onMount(() => {
    if (!$auth?.user || $auth.user.usuario !== VENDEDOR_ADMIN) {
      goto('/configuracion');
    }
  });

  function mostrarMensaje(msg: string, tipo: 'success' | 'error') {
    mensaje = msg;
    mensajeTipo = tipo;
    setTimeout(() => { mensaje = ''; }, 5000);
  }

  async function eliminarPreventasAntiguas() {
    if (!confirm('¿Eliminar preventas con más de 1 año de antigüedad? Esta acción no se puede deshacer.')) return;
    try {
      ejecutando = 'preventas';
      const res = await fetchWithAuth('/optimizacion/preventas-antiguas', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Error');
      mostrarMensaje(`Listo: ${data.data?.cabezasEliminadas ?? 0} preventas y ${data.data?.itemsEliminados ?? 0} ítems eliminados (anteriores a ${data.data?.fechaLimite ?? '1 año'}).`, 'success');
    } catch (e) {
      mostrarMensaje(e instanceof Error ? e.message : 'Error al eliminar preventas antiguas', 'error');
    } finally {
      ejecutando = null;
    }
  }

  async function generarBackup() {
    try {
      ejecutando = 'backup';
      const res = await fetchWithAuth('/optimizacion/backup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Error');
      mostrarMensaje(data.message || 'Backup solicitado correctamente', 'success');
    } catch (e) {
      mostrarMensaje(e instanceof Error ? e.message : 'Error al generar backup', 'error');
    } finally {
      ejecutando = null;
    }
  }

  async function exportarTablas() {
    try {
      ejecutando = 'exportar';
      const res = await fetchWithAuth('/optimizacion/exportar-tablas');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Error');
      exportacion = data.data ?? null;
      mostrarMensaje('Exportación completada. Puede copiar o guardar los datos mostrados.', 'success');
    } catch (e) {
      mostrarMensaje(e instanceof Error ? e.message : 'Error al exportar tablas', 'error');
    } finally {
      ejecutando = null;
    }
  }
</script>

<svelte:head>
  <title>Optimización | Configuración</title>
</svelte:head>

{#if !esAdmin}
  <div class="container mx-auto px-4 py-8">
    <p class="text-gray-600">Redirigiendo...</p>
  </div>
{:else}
  <div class="container mx-auto px-4 py-8">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Optimización</h1>
      <p class="text-gray-600 mt-2">Tareas avanzadas. Solo visible para el vendedor administrador (Codigo=admin).</p>
    </div>

    {#if mensaje}
      <div
        class="mb-4 p-4 rounded-lg {mensajeTipo === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}"
      >
        {mensaje}
      </div>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 class="text-lg font-semibold text-gray-800 mb-2">Eliminar preventas antiguas</h2>
        <p class="text-sm text-gray-600 mb-4">
          Elimina preventas con fecha anterior a 1 año. Se borran cabezas e ítems. No se puede deshacer.
        </p>
        <Button
          variant="secondary"
          on:click={eliminarPreventasAntiguas}
          disabled={ejecutando !== null}
        >
          {ejecutando === 'preventas' ? 'Ejecutando...' : 'Eliminar preventas antiguas'}
        </Button>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 class="text-lg font-semibold text-gray-800 mb-2">Backup</h2>
        <p class="text-sm text-gray-600 mb-4">
          Solicita un respaldo de la base de datos. La exportación completa se configura en el servidor.
        </p>
        <Button
          variant="secondary"
          on:click={generarBackup}
          disabled={ejecutando !== null}
        >
          {ejecutando === 'backup' ? 'Ejecutando...' : 'Generar backup'}
        </Button>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 class="text-lg font-semibold text-gray-800 mb-2">Exportar tablas</h2>
        <p class="text-sm text-gray-600 mb-4">
          Exporta tablas de configuración (configuración, números de control, vendedores, tipos de pago, datos empresa) en JSON.
        </p>
        <Button
          variant="secondary"
          on:click={exportarTablas}
          disabled={ejecutando !== null}
        >
          {ejecutando === 'exportar' ? 'Exportando...' : 'Exportar tablas'}
        </Button>
      </div>
    </div>

    {#if exportacion}
      <div class="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-800 mb-2">Datos exportados</h3>
        <pre class="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">{JSON.stringify(exportacion, null, 2)}</pre>
      </div>
    {/if}

    <div class="mt-6">
      <a href="/configuracion" class="text-blue-600 hover:underline">← Volver a Configuración</a>
    </div>
  </div>
{/if}
