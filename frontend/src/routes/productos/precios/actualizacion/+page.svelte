<script lang="ts">
  import { onMount } from 'svelte';
  import { PUBLIC_API_URL } from '$env/static/public';
  import Button from '$lib/components/ui/Button.svelte';
  import MultiSelect from '$lib/components/ui/MultiSelect.svelte';

  // Interfaces
  interface Proveedor {
    Codigo: string;
    Descripcion: string;
  }

  interface Rubro {
    Codigo: string;
    Descripcion: string;
  }

  interface Articulo {
    Codigo: string;
    Descripcion: string;
    PrecioCosto: number;
    RubroCodigo: string;
    ProveedorCodigo: string;
    Rubro?: {
      Descripcion: string;
    };
    Proveedor?: {
      Descripcion: string;
    };
  }

  // Estado
  let proveedores: Proveedor[] = [];
  let rubros: Rubro[] = [];
  let articulos: Articulo[] = [];
  let proveedoresSeleccionados: string[] = [];
  let rubrosSeleccionados: string[] = [];
  let porcentajeIncremento: number = 0;
  let loading = false;
  let error: string | null = null;
  let success: string | null = null;

  // Cargar datos iniciales
  onMount(async () => {
    try {
      loading = true;
      const [proveedoresRes, rubrosRes] = await Promise.all([
        fetch(`${PUBLIC_API_URL}/proveedores?limit=500`),
        fetch(`${PUBLIC_API_URL}/rubros?limit=500`)
      ]);

      if (!proveedoresRes.ok || !rubrosRes.ok) {
        throw new Error('Error al cargar datos iniciales');
      }

      const proveedoresData = await proveedoresRes.json();
      const rubrosData = await rubrosRes.json();

      proveedores = proveedoresData.items;
      rubros = rubrosData.items;
    } catch (err) {
      console.error('Error:', err);
      error = 'Error al cargar los datos iniciales';
    } finally {
      loading = false;
    }
  });

  // Buscar artículos afectados
  async function buscarArticulos() {
    if (proveedoresSeleccionados.length === 0 && rubrosSeleccionados.length === 0) {
      error = 'Debe seleccionar al menos un proveedor o rubro';
      return;
    }

    try {
      loading = true;
      error = null;
      success = null;

      // Construir parámetros de búsqueda
      const params = new URLSearchParams();
      if (proveedoresSeleccionados.length > 0) {
        params.append('proveedores', proveedoresSeleccionados.join(','));
      }
      if (rubrosSeleccionados.length > 0) {
        params.append('rubros', rubrosSeleccionados.join(','));
      }

      const response = await fetch(`${PUBLIC_API_URL}/articulos?${params}&limit=1000`);
      if (!response.ok) throw new Error('Error al buscar artículos');

      const data = await response.json();
      articulos = data.items;
    } catch (err) {
      console.error('Error:', err);
      error = 'Error al buscar artículos';
    } finally {
      loading = false;
    }
  }

  // Actualizar precios
  async function actualizarPrecios() {
    if (!porcentajeIncremento || articulos.length === 0) {
      error = 'Debe especificar un porcentaje y tener artículos seleccionados';
      return;
    }

    try {
      loading = true;
      error = null;

      const response = await fetch(`${PUBLIC_API_URL}/articulos/actualizar-precios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articulos: articulos.map(a => a.Codigo),
          porcentaje: porcentajeIncremento
        })
      });

      if (!response.ok) throw new Error('Error al actualizar precios');

      success = 'Precios actualizados correctamente';
      // Limpiar la búsqueda después de actualizar
      articulos = [];
      porcentajeIncremento = 0;
    } catch (err) {
      console.error('Error:', err);
      error = 'Error al actualizar los precios';
    } finally {
      loading = false;
    }
  }

  function salir() {
    window.history.back();
  }
</script>

<svelte:head>
  <title>Actualización de Precios</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="bg-white rounded-lg shadow-md p-6">
    <h1 class="text-2xl font-bold mb-6">Actualización de Precios</h1>

    <!-- Formulario de filtros -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div>
        <label id="proveedores-label" for="proveedores-select" class="block text-sm font-medium text-gray-700 mb-2">
          Proveedores
        </label>
        <div 
          id="proveedores-select"
          role="group"
          aria-labelledby="proveedores-label"
        >
          <MultiSelect
            items={proveedores}
            bind:selectedValues={proveedoresSeleccionados}
            labelField="Descripcion"
            valueField="Codigo"
            placeholder="Seleccione proveedores..."
          />
        </div>
      </div>

      <div>
        <label id="rubros-label" for="rubros-select" class="block text-sm font-medium text-gray-700 mb-2">
          Rubros
        </label>
        <div 
          id="rubros-select"
          role="group"
          aria-labelledby="rubros-label"
        >
          <MultiSelect
            items={rubros}
            bind:selectedValues={rubrosSeleccionados}
            labelField="Descripcion"
            valueField="Codigo"
            placeholder="Seleccione rubros..."
          />
        </div>
      </div>

      <div>
        <label for="porcentaje-input" class="block text-sm font-medium text-gray-700 mb-2">
          Porcentaje de Incremento
        </label>
        <input
          id="porcentaje-input"
          type="number"
          bind:value={porcentajeIncremento}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ingrese porcentaje..."
          step="0.01"
        />
      </div>
    </div>

    <!-- Botones de acción -->
    <div class="flex gap-4 mb-6">
      <Button on:click={buscarArticulos} disabled={loading}>
        {loading ? 'Buscando...' : 'Buscar'}
      </Button>
      <Button 
        variant="success" 
        on:click={actualizarPrecios} 
        disabled={loading || articulos.length === 0}
      >
        {loading ? 'Actualizando...' : 'Actualizar Precios'}
      </Button>
      <Button variant="secondary" on:click={salir}>
        Salir
      </Button>
    </div>

    <!-- Mensajes de error/éxito -->
    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    {/if}

    {#if success}
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        {success}
      </div>
    {/if}

    <!-- Tabla de artículos -->
    {#if articulos.length > 0}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rubro
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proveedor
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio Actual
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nuevo Precio
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each articulos as articulo}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {articulo.Codigo}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {articulo.Descripcion}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {articulo.Rubro?.Descripcion || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {articulo.Proveedor?.Descripcion || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${articulo.PrecioCosto.toFixed(2)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${(articulo.PrecioCosto * (1 + porcentajeIncremento/100)).toFixed(2)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div> 