<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import '../../../../../../app.css';
  import Breadcrumbs from '../../../components/Breadcrumbs/index.svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

  // Exportar las propiedades del componente
  export let data: { cliente: any };

  // Estado del formulario
  let cliente = {
    Codigo: data.cliente.Codigo || '',
    Descripcion: data.cliente.Descripcion || '',
    NombreFantasia: data.cliente.NombreFantasia || '',
    Cuit: data.cliente.Cuit || '',
    Telefono: data.cliente.Telefono || '',
    Email: data.cliente.Email || '',
    Domicilio: data.cliente.Domicilio || '',
    CodigoPostal: data.cliente.CodigoPostal || '',
    Localidad: data.cliente.Localidad || '',
    Provincia: data.cliente.Provincia || '',
    CategoriaIva: data.cliente.CategoriaIva || '',
    ListaPrecio: data.cliente.ListaPrecio || 1,
    LimiteCredito: data.cliente.LimiteCredito || 0,
    Activo: data.cliente.Activo || true
  };

  let loading = false;
  let error = '';
  let success = '';
  let categoriasIva = [];

  // Cargar datos necesarios
  async function cargarDatos() {
    try {
      loading = true;
      // Cargar categorías de IVA
      const responseIva = await fetchWithAuth('/categorias-iva');
      if (responseIva.ok) {
        const data = await responseIva.json();
        categoriasIva = data.items || [];
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      error = 'Error al cargar datos necesarios';
    } finally {
      loading = false;
    }
  }

  // Guardar cambios
  async function guardarCambios() {
    try {
      loading = true;
      error = '';
      success = '';

      const response = await fetchWithAuth(`/clientes/${cliente.Codigo}`, {
        method: 'PUT',
        body: JSON.stringify(cliente),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        success = 'Cliente actualizado correctamente';
        setTimeout(() => {
          goto(`/ventas/bot/clientes/detalles/${cliente.Codigo}`);
        }, 1500);
      } else {
        const data = await response.json();
        error = data.message || 'Error al actualizar el cliente';
      }
    } catch (err) {
      console.error('Error al guardar cambios:', err);
      error = 'Error al guardar los cambios';
    } finally {
      loading = false;
    }
  }

  // Cancelar edición
  function cancelar() {
    goto(`/ventas/bot/clientes/detalles/${cliente.Codigo}`);
  }

  onMount(() => {
    cargarDatos();
  });
</script>

<div class="editar-cliente-container">
  <Breadcrumbs />

  <header class="header">
    <div class="header-title">
      <h1>Editar Cliente</h1>
      <div class="cliente-code">Código: {cliente.Codigo}</div>
    </div>
  </header>

  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <span>Cargando...</span>
    </div>
  {/if}

  {#if error}
    <div class="error-message">
      {error}
      <button on:click={() => error = ''}>×</button>
    </div>
  {/if}

  {#if success}
    <div class="success-message">
      {success}
    </div>
  {/if}

  <form on:submit|preventDefault={guardarCambios} class="edit-form">
    <div class="form-grid">
      <div class="form-group">
        <label for="descripcion">Nombre/Razón Social *</label>
        <input
          type="text"
          id="descripcion"
          bind:value={cliente.Descripcion}
          required
          maxlength="100"
        />
      </div>

      <div class="form-group">
        <label for="nombreFantasia">Nombre Fantasía</label>
        <input
          type="text"
          id="nombreFantasia"
          bind:value={cliente.NombreFantasia}
          maxlength="100"
        />
      </div>

      <div class="form-group">
        <label for="cuit">CUIT/DNI</label>
        <input
          type="text"
          id="cuit"
          bind:value={cliente.Cuit}
          maxlength="13"
        />
      </div>

      <div class="form-group">
        <label for="telefono">Teléfono</label>
        <input
          type="text"
          id="telefono"
          bind:value={cliente.Telefono}
          maxlength="50"
        />
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <input
          type="email"
          id="email"
          bind:value={cliente.Email}
          maxlength="100"
        />
      </div>

      <div class="form-group">
        <label for="domicilio">Domicilio</label>
        <input
          type="text"
          id="domicilio"
          bind:value={cliente.Domicilio}
          maxlength="100"
        />
      </div>

      <div class="form-group">
        <label for="codigoPostal">Código Postal</label>
        <input
          type="text"
          id="codigoPostal"
          bind:value={cliente.CodigoPostal}
          maxlength="10"
        />
      </div>

      <div class="form-group">
        <label for="localidad">Localidad</label>
        <input
          type="text"
          id="localidad"
          bind:value={cliente.Localidad}
          maxlength="100"
        />
      </div>

      <div class="form-group">
        <label for="provincia">Provincia</label>
        <input
          type="text"
          id="provincia"
          bind:value={cliente.Provincia}
          maxlength="100"
        />
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
        <label for="listaPrecio">Lista de Precios</label>
        <input
          type="number"
          id="listaPrecio"
          bind:value={cliente.ListaPrecio}
          min="1"
          max="9"
        />
      </div>

      <div class="form-group">
        <label for="limiteCredito">Límite de Crédito</label>
        <input
          type="number"
          id="limiteCredito"
          bind:value={cliente.LimiteCredito}
          step="0.01"
          min="0"
        />
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            bind:checked={cliente.Activo}
          />
          Cliente Activo
        </label>
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn-cancel" on:click={cancelar}>
        Cancelar
      </button>
      <button type="submit" class="btn-save" disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </div>
  </form>
</div>

<style>
  .editar-cliente-container {
    padding: 16px;
    max-width: 100%;
    color: var(--tg-theme-text-color, #000);
    background: var(--tg-theme-bg-color, #fff);
    min-height: 100vh;
  }

  .header {
    margin-bottom: 24px;
  }

  .header-title h1 {
    font-size: 1.8rem;
    margin: 0 0 4px 0;
  }

  .cliente-code {
    font-size: 1rem;
    color: var(--tg-theme-hint-color, #777);
  }

  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 20px;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--tg-theme-button-color, #2481cc);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-message, .success-message {
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .error-message {
    background-color: #ffebee;
    color: #c62828;
  }

  .success-message {
    background-color: #e8f5e9;
    color: #2e7d32;
  }

  .edit-form {
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    padding: 20px;
    border-radius: 8px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  label {
    font-size: 0.9rem;
    color: var(--tg-theme-hint-color, #777);
  }

  input, select {
    padding: 8px 12px;
    border: 1px solid var(--tg-theme-hint-color, #ccc);
    border-radius: 4px;
    font-size: 1rem;
    background-color: var(--tg-theme-bg-color, #fff);
    color: var(--tg-theme-text-color, #000);
  }

  input:focus, select:focus {
    outline: none;
    border-color: var(--tg-theme-button-color, #2481cc);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .form-actions {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .btn-cancel {
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
    color: var(--tg-theme-text-color, #000);
  }

  .btn-save {
    background-color: var(--tg-theme-button-color, #2481cc);
    color: var(--tg-theme-button-text-color, #fff);
  }

  @media (max-width: 600px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 