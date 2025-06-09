<script lang="ts">
  import { onMount } from 'svelte';
  import { PUBLIC_API_URL } from '$env/static/public';
  import Button from '$lib/components/ui/Button.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import * as XLSX from 'xlsx';

  // Interfaces
  interface Proveedor {
    Codigo: string;
    Descripcion: string;
  }

  interface ArticuloActualizar {
    Codigo: string;
    Descripcion: string;
    PrecioCostoActual: number;
    PrecioCostoNuevo: number;
    Incluir: boolean;
  }

  // Estado
  let proveedores: Proveedor[] = [];
  let proveedorSeleccionado: string = '';
  let proveedoresOptions: { value: string; label: string }[] = [];
  let archivo: File | null = null;
  let columnaCodigoArticulo: string = '';
  let columnaPrecioCosto: string = '';
  let porcentajeAjuste: number = 0;
  let articulosParaActualizar: ArticuloActualizar[] = [];
  let columnasDisponibles: string[] = [];
  let loading = false;
  let error: string | null = null;
  let success: string | null = null;
  let paso = 1;

  // Cargar proveedores al inicio
  onMount(async () => {
    try {
      loading = true;
      const response = await fetchWithAuth(`${PUBLIC_API_URL}/proveedores?limit=500`);
      if (!response.ok) throw new Error('Error al cargar proveedores');
      const data = await response.json();
      proveedores = data.items;
      proveedoresOptions = proveedores.map(p => ({
        value: p.Codigo,
        label: p.Descripcion
      }));
    } catch (err) {
      console.error('Error:', err);
      error = 'Error al cargar los proveedores';
    } finally {
      loading = false;
    }
  });

  function handleProveedorChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    proveedorSeleccionado = select.value;
    console.log('Proveedor seleccionado:', proveedorSeleccionado);
  }

  // Procesar archivo Excel
  async function procesarArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    
    console.log('Procesando archivo, proveedor seleccionado:', proveedorSeleccionado);
    
    if (!proveedorSeleccionado) {
      error = 'Por favor seleccione un proveedor antes de cargar el archivo';
      return;
    }

    archivo = input.files[0];
    try {
      const data = await archivo.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
      columnasDisponibles = headers;
      error = null;
      paso = 2;
    } catch (err) {
      error = 'Error al procesar el archivo Excel';
      console.error(err);
    }
  }

  // Procesar datos
  async function procesarDatos() {
    console.log('Validando campos:', {
      proveedorSeleccionado,
      columnaCodigoArticulo,
      columnaPrecioCosto,
      porcentajeAjuste
    });

    if (!proveedorSeleccionado) {
      error = 'Por favor seleccione un proveedor';
      return;
    }

    if (!columnaCodigoArticulo) {
      error = 'Por favor seleccione la columna del código de artículo';
      return;
    }

    if (!columnaPrecioCosto) {
      error = 'Por favor seleccione la columna del precio de costo';
      return;
    }

    if (!archivo) {
      error = 'Por favor seleccione un archivo';
      return;
    }

    try {
      loading = true;
      error = null;
      
      // Obtener el token de autenticación con la clave correcta
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      // Crear FormData y agregar los datos
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('proveedorCodigo', proveedorSeleccionado);
      formData.append('columnaCodigoArticulo', columnaCodigoArticulo);
      formData.append('columnaPrecioCosto', columnaPrecioCosto);
      formData.append('porcentajeAjuste', porcentajeAjuste.toString());

      console.log('Enviando datos:', {
        proveedorCodigo: proveedorSeleccionado,
        columnaCodigoArticulo,
        columnaPrecioCosto,
        porcentajeAjuste
      });

      // Usar el token correcto en la petición
      const response = await fetch(`${PUBLIC_API_URL}/articulos/procesar-lista-precios`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formData
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Error de autenticación. Por favor, inicie sesión nuevamente.');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al procesar los datos');
      }

      const data = await response.json();
      articulosParaActualizar = data.articulos;
      
      if (articulosParaActualizar.length === 0) {
        error = 'No se encontraron artículos para actualizar';
        return;
      }
      
      paso = 3;
    } catch (err) {
      console.error('Error:', err);
      error = err instanceof Error ? err.message : 'Error al procesar los datos';
    } finally {
      loading = false;
    }
  }

  // Confirmar actualización
  async function confirmarActualizacion() {
    try {
      loading = true;
      error = null;

      const articulosAActualizar = articulosParaActualizar
        .filter(a => a.Incluir)
        .map(a => ({
          Codigo: a.Codigo,
          PrecioCostoNuevo: a.PrecioCostoNuevo
        }));

      const response = await fetchWithAuth(`${PUBLIC_API_URL}/articulos/actualizar-precios-lista`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          articulos: articulosAActualizar
        })
      });

      if (!response.ok) throw new Error('Error al actualizar los precios');

      success = 'Precios actualizados correctamente';
      paso = 4;
    } catch (err) {
      console.error('Error:', err);
      error = 'Error al actualizar los precios';
    } finally {
      loading = false;
    }
  }

  function toggleArticulo(codigo: string) {
    articulosParaActualizar = articulosParaActualizar.map(a => 
      a.Codigo === codigo ? {...a, Incluir: !a.Incluir} : a
    );
  }

  function actualizarPrecioManual(codigo: string, nuevoPrecio: number) {
    articulosParaActualizar = articulosParaActualizar.map(a => 
      a.Codigo === codigo ? {...a, PrecioCostoNuevo: nuevoPrecio} : a
    );
  }

  function salir() {
    window.history.back();
  }
</script>

<svelte:head>
  <title>Actualización de Precios con Lista</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="bg-white rounded-lg shadow-md p-6">
    <h1 class="text-2xl font-bold mb-6">Actualización de Precios con Lista</h1>

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

    <!-- Paso 1: Selección de proveedor y archivo -->
    {#if paso === 1}
      <div class="space-y-6">
        <div>
          <label for="proveedor" class="block text-sm font-medium text-gray-700 mb-2">
            Proveedor
          </label>
          <select
            id="proveedor"
            bind:value={proveedorSeleccionado}
            on:change={handleProveedorChange}
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">Seleccione un proveedor...</option>
            {#each proveedoresOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="archivo" class="block text-sm font-medium text-gray-700 mb-2">
            Archivo Excel
          </label>
          <input
            type="file"
            id="archivo"
            accept=".xlsx,.xls"
            on:change={procesarArchivo}
            class="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>
      </div>
    {/if}

    <!-- Paso 2: Configuración de columnas y porcentaje -->
    {#if paso === 2}
      <div class="space-y-6">
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-sm text-gray-600">
            Proveedor seleccionado: <span class="font-semibold">{proveedores.find(p => p.Codigo === proveedorSeleccionado)?.Descripcion}</span>
          </p>
        </div>

        <div>
          <label for="columna-codigo" class="block text-sm font-medium text-gray-700 mb-2">
            Columna Código Artículo
          </label>
          <select
            id="columna-codigo"
            bind:value={columnaCodigoArticulo}
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">Seleccione una columna...</option>
            {#each columnasDisponibles as columna}
              <option value={columna}>{columna}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="columna-precio" class="block text-sm font-medium text-gray-700 mb-2">
            Columna Precio Costo
          </label>
          <select
            id="columna-precio"
            bind:value={columnaPrecioCosto}
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">Seleccione una columna...</option>
            {#each columnasDisponibles as columna}
              <option value={columna}>{columna}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="porcentaje" class="block text-sm font-medium text-gray-700 mb-2">
            Porcentaje de Ajuste
          </label>
          <input
            type="number"
            id="porcentaje"
            bind:value={porcentajeAjuste}
            step="0.01"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            placeholder="Ingrese el porcentaje..."
          />
        </div>

        <div class="flex gap-4">
          <Button on:click={procesarDatos} disabled={loading}>
            {loading ? 'Procesando...' : 'Procesar'}
          </Button>
          <Button variant="secondary" on:click={salir}>
            Cancelar
          </Button>
        </div>
      </div>
    {/if}

    <!-- Paso 3: Revisión de artículos -->
    {#if paso === 3}
      <div class="space-y-6">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incluir
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio Actual
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio Nuevo
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each articulosParaActualizar as articulo}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={articulo.Incluir}
                      on:change={() => toggleArticulo(articulo.Codigo)}
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {articulo.Codigo}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {articulo.Descripcion}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${articulo.PrecioCostoActual.toFixed(2)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <input
                      type="number"
                      value={articulo.PrecioCostoNuevo}
                      on:input={(e: Event) => {
                        const target = e.target as HTMLInputElement;
                        actualizarPrecioManual(articulo.Codigo, parseFloat(target.value));
                      }}
                      class="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      step="0.01"
                    />
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div class="flex gap-4">
          <Button variant="success" on:click={confirmarActualizacion} disabled={loading}>
            {loading ? 'Actualizando...' : 'Confirmar Actualización'}
          </Button>
          <Button variant="secondary" on:click={salir}>
            Cancelar
          </Button>
        </div>
      </div>
    {/if}

    <!-- Paso 4: Confirmación -->
    {#if paso === 4}
      <div class="text-center space-y-6">
        <p class="text-lg text-gray-700">
          La actualización de precios se ha completado correctamente.
        </p>
        <Button variant="secondary" on:click={salir}>
          Volver
        </Button>
      </div>
    {/if}
  </div>
</div> 