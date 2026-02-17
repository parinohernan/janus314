<script lang="ts">
  import { fade } from 'svelte/transition';
  import { PackageX, AlertTriangle, Package } from 'lucide-svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { smartNavigate } from '$lib/utils/navigation';
  
  interface Producto {
    codigo: string;
    descripcion: string;
    existencia: number;
    stockMinimo: number;
  }
  
  interface Props {
    sinStock: Producto[];
    bajoMinimo: Producto[];
    loading?: boolean;
  }
  
  let { sinStock, bajoMinimo, loading = false }: Props = $props();
  
  const totalProductosCriticos = $derived(sinStock.length + bajoMinimo.length);
  
  function handleProductoClick(producto: Producto, event: MouseEvent) {
    smartNavigate(`/productos/${producto.codigo}`, event);
  }
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Icon icon={AlertTriangle} size={24} strokeWidth={2.5} glass={true} />
        <h2 class="text-lg font-semibold text-gray-900">Stock Crítico</h2>
      </div>
      {#if totalProductosCriticos > 0}
        <span class="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
          {totalProductosCriticos} alerta{totalProductosCriticos !== 1 ? 's' : ''}
        </span>
      {/if}
    </div>
  </div>

  <div class="max-h-96 overflow-y-auto">
    {#if loading}
      <div class="p-12 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <p class="mt-4 text-sm text-gray-600">Cargando stock...</p>
      </div>
    {:else if totalProductosCriticos === 0}
      <div class="p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="text-gray-900 font-medium mb-1">¡Todo en orden!</p>
        <p class="text-sm text-gray-600">No hay productos con stock crítico</p>
      </div>
    {:else}
      <!-- Productos sin stock -->
      {#if sinStock.length > 0}
        <div class="border-b border-gray-200">
          <div class="px-6 py-3 bg-red-50">
            <div class="flex items-center gap-2">
              <Icon icon={PackageX} size={18} strokeWidth={2.5} class="text-red-600" />
              <h3 class="font-semibold text-red-900 text-sm">Sin Stock ({sinStock.length})</h3>
            </div>
          </div>
          <div class="divide-y divide-gray-100">
            {#each sinStock as producto (producto.codigo)}
              <button
                class="w-full px-6 py-3 hover:bg-gray-50 transition-colors text-left"
                onclick={(e) => handleProductoClick(producto, e)}
                transition:fade={{ duration: 150 }}
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 truncate">{producto.descripcion}</p>
                    <p class="text-sm text-gray-500">Código: {producto.codigo}</p>
                  </div>
                  <div class="flex-shrink-0 text-right">
                    <div class="px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-semibold">
                      {producto.existencia}
                    </div>
                    <p class="text-xs text-gray-500 mt-1">Mín: {producto.stockMinimo}</p>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Productos bajo mínimo -->
      {#if bajoMinimo.length > 0}
        <div>
          <div class="px-6 py-3 bg-yellow-50">
            <div class="flex items-center gap-2">
              <Icon icon={Package} size={18} strokeWidth={2.5} class="text-yellow-600" />
              <h3 class="font-semibold text-yellow-900 text-sm">Bajo Mínimo ({bajoMinimo.length})</h3>
            </div>
          </div>
          <div class="divide-y divide-gray-100">
            {#each bajoMinimo as producto (producto.codigo)}
              <button
                class="w-full px-6 py-3 hover:bg-gray-50 transition-colors text-left"
                onclick={(e) => handleProductoClick(producto, e)}
                transition:fade={{ duration: 150 }}
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 truncate">{producto.descripcion}</p>
                    <p class="text-sm text-gray-500">Código: {producto.codigo}</p>
                  </div>
                  <div class="flex-shrink-0 text-right">
                    <div class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-semibold">
                      {producto.existencia}
                    </div>
                    <p class="text-xs text-gray-500 mt-1">Mín: {producto.stockMinimo}</p>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>
