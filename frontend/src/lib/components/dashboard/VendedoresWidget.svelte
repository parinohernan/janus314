<script lang="ts">
  import { fade } from 'svelte/transition';
  import { UserCircle, Clock, FileText, AlertCircle } from 'lucide-svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { goto } from '$app/navigation';
  import { smartNavigate } from '$lib/utils/navigation';
  
  interface Vendedor {
    codigo: string;
    nombre: string;
    activo: boolean;
    ultimoPedido: {
      fecha: string;
      numero: string;
      cliente: string;
    } | null;
    pedidosSinFacturar: number;
    pedidosPendientes: any[];
  }
  
  interface Props {
    vendedores: Vendedor[];
    loading?: boolean;
  }
  
  let { vendedores, loading = false }: Props = $props();
  
  function getEstadoColor(vendedor: Vendedor) {
    if (vendedor.pedidosSinFacturar > 5) return 'text-red-500';
    if (vendedor.pedidosSinFacturar > 0) return 'text-yellow-500';
    return 'text-green-500';
  }
  
  function getEstadoBadge(vendedor: Vendedor) {
    if (vendedor.activo) return { text: 'Activo hoy', class: 'bg-green-100 text-green-700' };
    if (vendedor.pedidosSinFacturar > 0) return { text: 'Con pendientes', class: 'bg-yellow-100 text-yellow-700' };
    return { text: 'Sin actividad', class: 'bg-gray-100 text-gray-600' };
  }
  
  function formatearFecha(fecha: string | null) {
    if (!fecha) return 'Sin pedidos';
    
    const fechaPedido = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    
    const esMismoDia = (d1: Date, d2: Date) => 
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
    
    if (esMismoDia(fechaPedido, hoy)) {
      return `Hoy ${fechaPedido.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (esMismoDia(fechaPedido, ayer)) {
      return `Ayer ${fechaPedido.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      const diasAtras = Math.floor((hoy.getTime() - fechaPedido.getTime()) / (1000 * 60 * 60 * 24));
      return `Hace ${diasAtras} día${diasAtras !== 1 ? 's' : ''}`;
    }
  }
  
  function handleVendedorClick(vendedor: Vendedor, event: MouseEvent) {
    // Navegar a la página de pedidos del vendedor
    smartNavigate(`/ventas/pedidos?vendedor=${vendedor.codigo}`, event);
  }
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Icon icon={UserCircle} size={24} strokeWidth={2.5} glass={true} />
        <h2 class="text-lg font-semibold text-gray-900">Estado de Vendedores</h2>
      </div>
      <span class="text-sm text-gray-600">{vendedores.length} vendedores</span>
    </div>
  </div>

  <div class="divide-y divide-gray-100">
    {#if loading}
      <div class="p-12 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-sm text-gray-600">Cargando vendedores...</p>
      </div>
    {:else if vendedores.length === 0}
      <div class="p-12 text-center">
        <Icon icon={AlertCircle} size={48} strokeWidth={2} class="mx-auto text-gray-400 mb-4" />
        <p class="text-gray-600">No hay vendedores activos</p>
      </div>
    {:else}
      {#each vendedores as vendedor (vendedor.codigo)}
        <button
          class="w-full px-6 py-4 hover:bg-gray-50 transition-colors text-left"
          onclick={(e) => handleVendedorClick(vendedor, e)}
          transition:fade={{ duration: 150 }}
        >
          <div class="flex items-start justify-between gap-4">
            <!-- Información del vendedor -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-2 h-2 rounded-full {getEstadoColor(vendedor)}"></div>
                <h3 class="font-semibold text-gray-900 truncate">{vendedor.nombre}</h3>
                <span class="px-2 py-1 rounded-full text-xs font-medium {getEstadoBadge(vendedor).class}">
                  {getEstadoBadge(vendedor).text}
                </span>
              </div>
              
              <div class="flex items-center gap-4 text-sm text-gray-600">
                <div class="flex items-center gap-1">
                  <Icon icon={Clock} size={14} strokeWidth={2} />
                  <span>{formatearFecha(vendedor.ultimoPedido?.fecha || null)}</span>
                </div>
                
                {#if vendedor.pedidosSinFacturar > 0}
                  <div class="flex items-center gap-1 text-orange-600 font-medium">
                    <Icon icon={FileText} size={14} strokeWidth={2.5} />
                    <span>{vendedor.pedidosSinFacturar} pedido{vendedor.pedidosSinFacturar !== 1 ? 's' : ''} sin facturar</span>
                  </div>
                {:else}
                  <div class="flex items-center gap-1 text-green-600">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-sm">Sin pedidos pendientes</span>
                  </div>
                {/if}
              </div>
              
              {#if vendedor.ultimoPedido}
                <div class="mt-1 text-xs text-gray-500">
                  Último: {vendedor.ultimoPedido.numero} - {vendedor.ultimoPedido.cliente}
                </div>
              {/if}
            </div>
            
            <!-- Indicador visual de pedidos pendientes -->
            {#if vendedor.pedidosSinFacturar > 0}
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span class="text-white font-bold text-lg">{vendedor.pedidosSinFacturar}</span>
                </div>
              </div>
            {/if}
          </div>
        </button>
      {/each}
    {/if}
  </div>
</div>
