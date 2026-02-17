<script lang="ts">
  import { Zap, FileText, UserPlus, Package, DollarSign, RefreshCw } from 'lucide-svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { goto } from '$app/navigation';
  
  const acciones = [
    {
      label: 'Nueva Factura',
      icon: FileText,
      url: '/ventas/facturas/nueva',
      color: 'from-blue-500 to-blue-600',
      description: 'Emitir una nueva factura'
    },
    {
      label: 'Nuevo Cliente',
      icon: UserPlus,
      url: '/clientes',
      color: 'from-purple-500 to-purple-600',
      description: 'Registrar un cliente'
    },
    {
      label: 'Consultar Stock',
      icon: Package,
      url: '/productos',
      color: 'from-green-500 to-green-600',
      description: 'Ver inventario'
    },
    {
      label: 'Cuentas Corrientes',
      icon: DollarSign,
      url: '/clientes/cuentascorrientes',
      color: 'from-orange-500 to-orange-600',
      description: 'Gestionar cobros'
    },
    {
      label: 'Sincronizar',
      icon: RefreshCw,
      url: '/sincronizacion/actualizar-datos',
      color: 'from-indigo-500 to-indigo-600',
      description: 'Actualizar datos'
    }
  ];
  
  function handleAccionClick(url: string) {
    goto(url);
  }
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-50">
    <div class="flex items-center gap-2">
      <Icon icon={Zap} size={24} strokeWidth={2.5} glass={true} />
      <h2 class="text-lg font-semibold text-gray-900">Accesos Rápidos</h2>
    </div>
  </div>

  <div class="p-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {#each acciones as accion (accion.url)}
        <button
          class="group relative p-4 rounded-xl border-2 border-gray-200 hover:border-transparent hover:shadow-lg transition-all duration-300 overflow-hidden"
          onclick={() => handleAccionClick(accion.url)}
        >
          <!-- Gradient background on hover -->
          <div class="absolute inset-0 bg-gradient-to-br {accion.color} opacity-0 group-hover:opacity-10 transition-opacity"></div>
          
          <div class="relative z-10">
            <div class="w-12 h-12 bg-gradient-to-br {accion.color} rounded-lg flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform">
              <Icon icon={accion.icon} size={24} strokeWidth={2.5} class="text-white" />
            </div>
            <h3 class="font-semibold text-gray-900 mb-1 text-left">{accion.label}</h3>
            <p class="text-sm text-gray-600 text-left">{accion.description}</p>
          </div>
        </button>
      {/each}
    </div>
  </div>
</div>
