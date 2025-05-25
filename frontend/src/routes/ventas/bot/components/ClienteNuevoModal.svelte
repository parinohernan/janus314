<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { CategoriaIvaService, type CategoriaIva } from '$lib/services/CategoriaIvaService';

  export let mostrar = false;
  export let onClose: () => void = () => {};

  const dispatch = createEventDispatcher();

  let categoriasIva: CategoriaIva[] = [];
  let loading = false;
  let error = '';
  let success = '';

  let cliente = {
    Codigo: '',
    Descripcion: '',
    NombreFantasia: '',
    CategoriaIva: '',
    Cuit: '',
    Calle: '',
    Numero: '',
    Localidad: '',
    Mail: '',
    Telefono: '',
    Activo: 1
  };

  function resetForm() {
    cliente = {
      Codigo: '',
      Descripcion: '',
      NombreFantasia: '',
      CategoriaIva: '',
      Cuit: '',
      Calle: '',
      Numero: '',
      Localidad: '',
      Mail: '',
      Telefono: '',
      Activo: 1
    };
    error = '';
    success = '';
  }

  async function cargarOpciones() {
    try {
      categoriasIva = await CategoriaIvaService.obtenerCategorias();
    } catch (err) {
      error = 'Error al cargar categorías de IVA';
    }
  }

  function validar() {
    error = '';
    if (!cliente.Descripcion) {
      error = 'La razón social es obligatoria';
      return false;
    }
    if (!cliente.CategoriaIva) {
      error = 'La categoría de IVA es obligatoria';
      return false;
    }
    if (!cliente.Cuit) {
      error = 'El CUIT es obligatorio';
      return false;
    }
    if (cliente.Cuit.length !== 11) {
      error = 'El CUIT debe tener 11 dígitos';
      return false;
    }
    return true;
  }

  async function guardarCliente() {
    if (!validar()) return;
    loading = true;
    error = '';
    try {
      // Generar código basado en el CUIT
      cliente.Codigo = cliente.Cuit.substring(0, 8);
      
      const response = await fetchWithAuth('/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cliente)
      });
      
      if (!response.ok) {
        const data = await response.json();
        // Si el código ya existe, intentar con una variante
        if (data.message === 'Ya existe un cliente con ese código') {
          let suffix = 1;
          let found = false;
          while (!found && suffix < 100) {
            const newCodigo = cliente.Cuit.substring(0, 7) + suffix.toString().padStart(1, '0');
            cliente.Codigo = newCodigo;
            try {
              const retryResponse = await fetchWithAuth('/clientes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cliente)
              });
              if (retryResponse.ok) {
                found = true;
                const data = await retryResponse.json();
                success = 'Cliente creado correctamente';
                dispatch('clienteCreado', { cliente: data.data || cliente });
                setTimeout(() => {
                  resetForm();
                  onClose();
                }, 800);
              }
            } catch (retryErr) {
              suffix++;
            }
          }
          if (!found) {
            throw new Error('No se pudo generar un código único para el cliente');
          }
        } else {
          throw new Error(data.message || 'Error al crear el cliente');
        }
      } else {
        const data = await response.json();
        success = 'Cliente creado correctamente';
        dispatch('clienteCreado', { cliente: data.data || cliente });
        setTimeout(() => {
          resetForm();
          onClose();
        }, 800);
      }
    } catch (err: any) {
      error = err.message || 'Error al crear el cliente';
    } finally {
      loading = false;
    }
  }

  function formatearCuit(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    cliente.Cuit = value;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

  onMount(() => {
    cargarOpciones();
  });

  $: if (!mostrar) resetForm();
</script>

{#if mostrar}
  <div class="modal-backdrop" tabindex="-1" on:keydown={handleKeydown} role="dialog" aria-modal="true" aria-label="Nuevo Cliente">
    <div class="modal" role="dialog" aria-modal="true" aria-label="Nuevo Cliente">
      <header>
        <h2>Nuevo Cliente</h2>
        <button class="close" on:click={onClose} aria-label="Cerrar">×</button>
      </header>
      <form on:submit|preventDefault={guardarCliente}>
        <div class="form-group">
          <label for="razonSocial">Razón Social *</label>
          <input id="razonSocial" type="text" bind:value={cliente.Descripcion} maxlength="50" required />
        </div>
        <div class="form-group">
          <label for="cuit">CUIT *</label>
          <input id="cuit" type="text" bind:value={cliente.Cuit} maxlength="11" on:input={formatearCuit} required />
        </div>
        <div class="form-group">
          <label for="categoriaIva">Categoría IVA *</label>
          <select id="categoriaIva" bind:value={cliente.CategoriaIva} required>
            <option value="">Seleccione una categoría</option>
            {#each categoriasIva as categoria}
              <option value={categoria.Codigo}>{categoria.Descripcion}</option>
            {/each}
          </select>
        </div>
        <div class="form-group">
          <label for="nombreFantasia">Nombre Fantasía</label>
          <input id="nombreFantasia" type="text" bind:value={cliente.NombreFantasia} maxlength="80" />
        </div>
        <div class="form-group">
          <label for="telefono">Teléfono</label>
          <input id="telefono" type="tel" bind:value={cliente.Telefono} maxlength="50" />
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" type="email" bind:value={cliente.Mail} maxlength="50" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="calle">Calle</label>
            <input id="calle" type="text" bind:value={cliente.Calle} maxlength="50" />
          </div>
          <div class="form-group">
            <label for="numero">Número</label>
            <input id="numero" type="text" bind:value={cliente.Numero} maxlength="15" />
          </div>
        </div>
        <div class="form-group">
          <label for="localidad">Localidad</label>
          <input id="localidad" type="text" bind:value={cliente.Localidad} maxlength="50" />
        </div>
        {#if error}
          <div class="error">{error}</div>
        {/if}
        {#if success}
          <div class="success">{success}</div>
        {/if}
        <div class="modal-actions">
          <button type="button" class="btn-secondary" on:click={onClose} disabled={loading}>Cancelar</button>
          <button type="submit" class="btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.25);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal {
    background: #fff;
    border-radius: 10px;
    max-width: 400px;
    width: 100%;
    padding: 1.5rem;
    box-shadow: 0 2px 16px rgba(0,0,0,0.18);
    position: relative;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  .close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #888;
  }
  .form-group {
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
  }
  .form-row {
    display: flex;
    gap: 1rem;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1rem;
  }
  .btn-primary {
    background: #2481cc;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1.2rem;
    font-size: 1rem;
    cursor: pointer;
  }
  .btn-secondary {
    background: #eee;
    color: #333;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1.2rem;
    font-size: 1rem;
    cursor: pointer;
  }
  .error {
    color: #d32f2f;
    background: #ffebee;
    border-radius: 4px;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .success {
    color: #388e3c;
    background: #e8f5e9;
    border-radius: 4px;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
  }
</style> 