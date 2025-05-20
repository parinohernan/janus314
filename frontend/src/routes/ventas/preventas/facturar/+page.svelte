<script lang="ts">
  // Importar fetchWithAuth y otros componentes necesarios
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  // ... existing imports ...

  // Inicializar el tipo de factura como vacío
  let tipoFactura = '';
  let siguienteNumero = '';
  let sucursal = '';

  // Tipos de factura disponibles
  const tiposFactura = [
    { value: '', label: 'Seleccione tipo de factura' },
    { value: 'FCA', label: 'Factura A' },
    { value: 'FCB', label: 'Factura B' },
    // ... otros tipos si existen
  ];

  // Función para obtener el siguiente número
  async function obtenerSiguienteNumero() {
    if (!tipoFactura || !sucursal) return;

    try {
      const response = await fetchWithAuth(
        `/numeroscontrol/${tipoFactura}/${sucursal}`
      );
      
      if (!response.ok) throw new Error('Error al obtener número');
      
      const data = await response.json();
      siguienteNumero = data.siguienteNumero.toString().padStart(8, '0');
    } catch (error) {
      console.error('Error:', error);
      // Manejar el error apropiadamente
    }
  }

  // Observar cambios en tipo de factura y sucursal
  $: if (tipoFactura && sucursal) {
    obtenerSiguienteNumero();
  }
</script>

<!-- Template -->
<div>
  <!-- ... otros elementos ... -->

  <div class="form-group">
    <label for="tipoFactura" class="block text-sm font-medium text-gray-700">
      Tipo de Factura *
    </label>
    <select
      id="tipoFactura"
      bind:value={tipoFactura}
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      required
    >
      {#each tiposFactura as tipo}
        <option value={tipo.value}>{tipo.label}</option>
      {/each}
    </select>
  </div>

  <!-- Mostrar el siguiente número solo cuando se ha seleccionado un tipo -->
  {#if tipoFactura && siguienteNumero}
    <div class="mt-4">
      <p class="text-sm text-gray-600">
        Siguiente número: {sucursal}-{siguienteNumero}
      </p>
    </div>
  {/if}

  <!-- ... resto del formulario ... -->
</div> 