<script lang="ts">
  import { fade } from 'svelte/transition';
  import { FileText, Clock } from 'lucide-svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { smartNavigate } from '$lib/utils/navigation';
  
  interface Factura {
    tipo: string;
    sucursal: number;
    numero: number;
    fecha: string;
    cliente: string;
    total: number;
  }
  
  interface Props {
    facturas: Factura[];
    loading?: boolean;
  }
  
  let { facturas, loading = false }: Props = $props();
  
  function formatearFecha(fecha: string) {
    const fechaObj = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    
    const esMismoDia = (d1: Date, d2: Date) => 
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
    
    if (esMismoDia(fechaObj, hoy)) {
      return `Hoy ${fechaObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (esMismoDia(fechaObj, ayer)) {
      return `Ayer ${fechaObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return fechaObj.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
  }
  
  function formatearMoneda(valor: number) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(valor);
  }
  
  function handleFacturaClick(factura: Factura, event: MouseEvent) {
    const url = `/ventas/facturas/${factura.tipo}/${String(factura.sucursal).padStart(4, '0')}/${String(factura.numero).padStart(8, '0')}`;
    smartNavigate(url, event);
  }
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
    <div class="flex items-center gap-2">
      <Icon icon={Clock} size={24} strokeWidth={2.5} glass={true} />
      <h2 class="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
    </div>
  </div>

  <div class="divide-y divide-gray-100 max-h-96 overflow-y-auto">
    {#if loading}
      <div class="p-12 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <p class="mt-4 text-sm text-gray-600">Cargando actividad...</p>
      </div>
    {:else if facturas.length === 0}
      <div class="p-12 text-center">
        <Icon icon={FileText} size={48} strokeWidth={2} class="mx-auto text-gray-400 mb-4" />
        <p class="text-gray-600">No hay actividad reciente</p>
      </div>
    {:else}
      {#each facturas as factura, index (index)}
        <button
          class="w-full px-6 py-3 hover:bg-gray-50 transition-colors text-left"
          onclick={(e) => handleFacturaClick(factura, e)}
          transition:fade={{ duration: 150 }}
        >
          <div class="flex items-center justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <Icon icon={FileText} size={16} strokeWidth={2} class="text-blue-600" />
                <span class="font-medium text-gray-900">
                  {factura.tipo}-{String(factura.sucursal).padStart(4, '0')}-{String(factura.numero).padStart(8, '0')}
                </span>
              </div>
              <p class="text-sm text-gray-600 truncate">{factura.cliente}</p>
              <p class="text-xs text-gray-500 mt-1">{formatearFecha(factura.fecha)}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="font-semibold text-gray-900">{formatearMoneda(factura.total)}</p>
            </div>
          </div>
        </button>
      {/each}
    {/if}
  </div>
</div>
