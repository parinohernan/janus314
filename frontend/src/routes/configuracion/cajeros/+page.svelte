<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { auth } from '$lib/stores/authStore';
  import { esAdminOSuperadm } from '$lib/utils/permisos';
  import Button from '$lib/components/ui/Button.svelte';

  type Tipo = 'cajero' | 'vendor';

  interface Fila {
    Codigo: string;
    Descripcion: string;
    Activo: number | boolean;
    Permisos: string;
  }

  let filas = $state<Fila[]>([]);
  let cargando = $state(true);
  let guardando = $state(false);
  let error = $state('');
  let mensaje = $state('');
  let editando = $state<string | null>(null);
  let codigo = $state('');
  let nombre = $state('');
  let clave = $state('');
  let activo = $state(true);
  let tipo = $state<Tipo>('cajero');

  const puede = $derived(esAdminOSuperadm($auth?.user));

  function limpiar() {
    editando = null;
    codigo = '';
    nombre = '';
    clave = '';
    activo = true;
    tipo = 'cajero';
    error = '';
  }

  async function cargar() {
    cargando = true;
    error = '';
    try {
      const response = await fetchWithAuth('/vendedores');
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo cargar el listado');
      }
      filas = (data.data || [])
        .map((fila: Fila) => ({
          ...fila,
          Permisos: String(fila.Permisos || '').trim().toLowerCase()
        }))
        .filter((fila: Fila) => fila.Permisos === 'cajero' || fila.Permisos === 'vendor');
    } catch (err) {
      error = err instanceof Error ? err.message : 'No se pudo cargar el listado';
    } finally {
      cargando = false;
    }
  }

  function editar(fila: Fila) {
    editando = fila.Codigo;
    codigo = fila.Codigo;
    nombre = fila.Descripcion;
    clave = '';
    activo = Number(fila.Activo) === 1 || fila.Activo === true;
    tipo = fila.Permisos === 'vendor' ? 'vendor' : 'cajero';
    error = '';
    mensaje = '';
  }

  async function guardar(e: Event) {
    e.preventDefault();
    error = '';
    mensaje = '';
    guardando = true;
    try {
      const cuerpo: Record<string, unknown> = {
        Descripcion: nombre.trim(),
        Activo: activo ? 1 : 0,
        Permisos: tipo
      };
      if (clave.trim()) cuerpo.Clave = clave;
      const response = editando
        ? await fetchWithAuth(`/vendedores/${encodeURIComponent(editando)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cuerpo)
          })
        : await fetchWithAuth('/vendedores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...cuerpo, Codigo: codigo.trim(), Clave: clave })
          });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'No se pudo guardar');
      }
      mensaje = editando ? 'Usuario actualizado' : 'Usuario creado';
      limpiar();
      await cargar();
    } catch (err) {
      error = err instanceof Error ? err.message : 'No se pudo guardar';
    } finally {
      guardando = false;
    }
  }

  async function eliminar(fila: Fila) {
    if (!confirm(`¿Eliminar a ${fila.Descripcion}?`)) return;
    error = '';
    try {
      const response = await fetchWithAuth(`/vendedores/${encodeURIComponent(fila.Codigo)}`, {
        method: 'DELETE'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'No se pudo eliminar');
      }
      if (editando === fila.Codigo) limpiar();
      mensaje = 'Usuario eliminado';
      await cargar();
    } catch (err) {
      error = err instanceof Error ? err.message : 'No se pudo eliminar';
    }
  }

  onMount(() => {
    if (!puede) {
      goto('/');
      return;
    }
    cargar();
  });
</script>

<div>
  <h1 class="text-2xl font-bold text-gray-800 mb-6">Cajeros y vendedores</h1>

  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
  {/if}
  {#if mensaje}
    <div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">{mensaje}</div>
  {/if}

  <form onsubmit={guardar} class="bg-white rounded-lg shadow-sm p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label for="codigo" class="block text-sm font-medium text-gray-700 mb-1">Código</label>
      <input
        id="codigo"
        bind:value={codigo}
        disabled={!!editando}
        required
        maxlength="20"
        class="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
      />
    </div>
    <div>
      <label for="nombre" class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
      <input
        id="nombre"
        bind:value={nombre}
        required
        maxlength="50"
        class="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
    </div>
    <div>
      <label for="clave" class="block text-sm font-medium text-gray-700 mb-1">
        Clave {editando ? '(vacía para no cambiarla)' : ''}
      </label>
      <input
        id="clave"
        type="password"
        bind:value={clave}
        required={!editando && tipo === 'cajero'}
        minlength={tipo === 'cajero' && clave ? 8 : undefined}
        autocomplete="new-password"
        class="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
    </div>
    <div>
      <label for="tipo" class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
      <select id="tipo" bind:value={tipo} class="w-full px-3 py-2 border border-gray-300 rounded-md">
        <option value="cajero">Cajero</option>
        <option value="vendor">Vendedor</option>
      </select>
    </div>
    <label class="flex items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" bind:checked={activo} />
      Activo
    </label>
    <div class="flex items-end gap-2">
      <Button type="submit" variant="primary" disabled={guardando}>
        {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear'}
      </Button>
      {#if editando}
        <Button type="button" variant="secondary" on:click={limpiar}>Cancelar</Button>
      {/if}
    </div>
    <p class="md:col-span-2 text-sm text-gray-500">
      El cajero entra al punto de venta con su código y esta clave. El vendedor queda en los comprobantes y no entra al sistema.
    </p>
  </form>

  {#if cargando}
    <div class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  {:else if filas.length === 0}
    <p class="text-gray-500">Todavía no hay cajeros ni vendedores.</p>
  {:else}
    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-left text-gray-600">
          <tr>
            <th class="px-4 py-3">Código</th>
            <th class="px-4 py-3">Nombre</th>
            <th class="px-4 py-3">Tipo</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {#each filas as fila}
            <tr class="border-t border-gray-100">
              <td class="px-4 py-3 font-medium">{fila.Codigo}</td>
              <td class="px-4 py-3">{fila.Descripcion}</td>
              <td class="px-4 py-3">{fila.Permisos === 'cajero' ? 'Cajero' : 'Vendedor'}</td>
              <td class="px-4 py-3">{Number(fila.Activo) === 1 ? 'Activo' : 'Inactivo'}</td>
              <td class="px-4 py-3 text-right space-x-2">
                <button type="button" class="text-blue-600" onclick={() => editar(fila)}>Editar</button>
                <button type="button" class="text-red-600" onclick={() => eliminar(fila)}>Eliminar</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
