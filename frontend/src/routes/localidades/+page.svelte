<script lang="ts">
  // Módulos para la página principal
  const modules = [
    { name: 'Ventas', icon: 'cash-register', url: '/ventas/facturas', description: 'Gestión de facturas y pedidos' },
    { name: 'Compras', icon: 'truck', url: '/compras/ordenes', description: 'Órdenes de compra y proveedores' },
    { name: 'Productos', icon: 'box', url: '/productos', description: 'Catálogo y stock de productos' },
    { name: 'Clientes', icon: 'users', url: '/ventas/clientes', description: 'Gestión de clientes y cuentas corrientes' },
    { name: 'Reportes', icon: 'chart-bar', url: '/reportes', description: 'Informes y estadísticas' },
    { name: 'Caja', icon: 'cash', url: '/caja/apertura', description: 'Control de ingresos y egresos' }
  ];
</script>

<div class="space-y-6">
  <h1 class="text-3xl font-bold">Panel de Control</h1>
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each modules as module}
      <a href={module.url} class="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
        <h2 class="text-xl font-bold text-gray-800 mb-2">{module.name}</h2>
        <p class="text-gray-600">{module.description}</p>
      </a>
    {/each}
  </div>
</div>