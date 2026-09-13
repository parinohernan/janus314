<script lang="ts">
  import { fade } from 'svelte/transition';
  import { FileWarning, FileText, FileMinus } from 'lucide-svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { smartNavigate } from '$lib/utils/navigation';

  interface Comprobante {
    clase: 'factura' | 'notaCredito';
    tipo: string;
    sucursal: string;
    numero: string;
    fecha: string;
    importe: number;
    cliente: string;
  }

  interface Props {
    comprobantes: Comprobante[];
    cantidad?: number;
    cantidadFacturas?: number;
    cantidadNotas?: number;
    loading?: boolean;
  }

  let {
    comprobantes,
    cantidad = 0,
    cantidadFacturas = 0,
    cantidadNotas = 0,
    loading = false
  }: Props = $props();

  const total = $derived(cantidad || comprobantes.length);

  function formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(valor);
  }

  function formatearFecha(fecha: string): string {
    const ymd = String(fecha || '').slice(0, 10);
    const [anio, mes, dia] = ymd.split('-');
    if (!anio || !mes || !dia) return '';
    return `${dia}/${mes}/${anio}`;
  }

  function urlComprobante(item: Comprobante): string {
    const base = item.clase === 'notaCredito' ? '/ventas/notascredito' : '/ventas/facturas';
    return `${base}/imprimir/${item.tipo}/${item.sucursal}/${item.numero}`;
  }

  function handleClick(item: Comprobante, event: MouseEvent) {
    smartNavigate(urlComprobante(item), event);
  }
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Icon icon={FileWarning} size={24} strokeWidth={2.5} glass={true} />
        <h2 class="text-lg font-semibold text-gray-900">Sin autorizar</h2>
      </div>
      <div class="flex items-center gap-3">
        {#if total > 0}
          <span class="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold">
            {total} comprobante{total !== 1 ? 's' : ''}
          </span>
        {/if}
        <button
          class="text-sm font-medium text-amber-800 hover:underline"
          onclick={(e) => smartNavigate('/arca/facturas-sin-cae', e)}
        >
          Ver todos
        </button>
      </div>
    </div>
    <p class="text-sm text-gray-600 mt-1">Facturas A/B/C y notas de crédito A/B sin CAE</p>
  </div>

  <div class="max-h-96 overflow-y-auto">
    {#if loading}
      <div class="p-12 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <p class="mt-4 text-sm text-gray-600">Cargando comprobantes...</p>
      </div>
    {:else if total === 0}
      <div class="p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="text-gray-900 font-medium mb-1">Todo autorizado</p>
        <p class="text-sm text-gray-600">No hay facturas ni NC A/B pendientes de CAE</p>
      </div>
    {:else}
      <div class="px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs text-gray-600 flex gap-4">
        <span class="flex items-center gap-1">
          <Icon icon={FileText} size={14} strokeWidth={2.5} />
          {cantidadFacturas} factura{cantidadFacturas !== 1 ? 's' : ''}
        </span>
        <span class="flex items-center gap-1">
          <Icon icon={FileMinus} size={14} strokeWidth={2.5} />
          {cantidadNotas} nota{cantidadNotas !== 1 ? 's' : ''}
        </span>
      </div>
      <div class="divide-y divide-gray-100">
        {#each comprobantes as item (`${item.tipo}-${item.sucursal}-${item.numero}`)}
          <button
            class="w-full px-6 py-3 hover:bg-gray-50 transition-colors text-left"
            onclick={(e) => handleClick(item, e)}
            transition:fade={{ duration: 150 }}
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 truncate">{item.cliente}</p>
                <p class="text-sm text-gray-500">
                  {item.tipo} {item.sucursal}-{item.numero}
                  {#if item.fecha}
                    · {formatearFecha(item.fecha)}
                  {/if}
                </p>
              </div>
              <div class="flex-shrink-0 text-right">
                <div class="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-semibold">
                  {item.clase === 'notaCredito' ? 'NC' : 'FC'}
                </div>
                <p class="text-sm font-semibold text-gray-900 mt-1">{formatearMoneda(item.importe)}</p>
              </div>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
