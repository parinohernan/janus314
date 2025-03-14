<script lang="ts">
  let activeMenu: string | null = null;

  // Estructura del menú
  const menuItems = [
    {
      id: 'general',
      label: 'General',
      submenus: [
        { label: 'Usuarios', url: '/usuarios' },
        { label: 'Localidades', url: '/localidades' },
        { label: 'Provincias', url: '/provincias' },
        { label: 'Rutas', url: '/rutas' }
      ]
    },
    {
      id: 'caja',
      label: 'Caja',
      submenus: [
        { label: 'Apertura', url: '/caja/apertura' },
        { label: 'Cierre', url: '/caja/cierre' },
        { label: 'Movimientos', url: '/caja/movimientos' }
      ]
    },
    {
      id: 'ventas',
      label: 'Ventas',
      submenus: [
        { label: 'Pedidos', url: '/ventas/pedidos' },
        { label: 'Facturas', url: '/ventas/facturas' },
        { label: 'Notas de Crédito', url: '/ventas/notascredito' },
        { label: 'Recibos', url: '/ventas/recibos' },
        { label: 'Informes', url: '/ventas/informes' },
        { label: 'Clientes', url: '/ventas/clientes' },
        { label: 'Vendedores', url: '/ventas/vendedores' }
      ]
    },
    {
      id: 'compras',
      label: 'Compras',
      submenus: [
        { label: 'Órdenes', url: '/compras/ordenes' },
        { label: 'Facturas', url: '/compras/facturas' },
        { label: 'Notas de Crédito', url: '/compras/notascredito' },
        { label: 'Pagos', url: '/compras/pagos' },
        { label: 'Informes', url: '/compras/informes' },
        { label: 'Proveedores', url: '/compras/proveedores' }
      ]
    },
    {
      id: 'productos',
      label: 'Productos',
      submenus: [
        { label: 'Listado', url: '/productos' },
        { label: 'Stock', url: '/productos/stock' },
        { label: 'Rubros', url: '/rubros' },
        { label: 'Actualización de Precios', url: '/productos/precios' }
      ]
    }
  ];

  // Al inicio del script
  console.log('Renderizando Navbar con submenús:');
  menuItems.forEach(item => {
    if (item.id === 'productos') {
      console.log('Submenús de productos:', item.submenus);
    }
  });

  const toggleMenu = (menuId: string) => {
    if (activeMenu === menuId) {
      activeMenu = null;
    } else {
      activeMenu = menuId;
    }
  };

  // Cerrar el menú al hacer clic fuera de él
  const handleClickOutside = () => {
    activeMenu = null;
  };
</script>

<nav class="bg-white border-b border-gray-200">
  <div class="container mx-auto px-4">
    <div class="flex">
      {#each menuItems as item}
        <div class="relative">
          <button 
            class="px-4 py-3 hover:bg-gray-100 font-medium flex items-center space-x-1 {activeMenu === item.id ? 'bg-gray-100' : ''}"
            on:click|stopPropagation={() => toggleMenu(item.id)}
          >
            <span>{item.label}</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {#if activeMenu === item.id}
            <div 
              class="absolute left-0 mt-0 w-48 bg-gray-800 shadow-lg z-10 py-1 rounded-b-md border border-gray-200"
            >
              {#each item.submenus as submenu}
                <a 
                  href={submenu.url} 
                  class="block px-4 py-2 text-white hover:bg-gray-600"
                  on:click|stopPropagation={() => activeMenu = null}
                >
                  {submenu.label}
                </a>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</nav>

<svelte:window on:click={handleClickOutside} />

<style>
  .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #333;
    color: white;
    padding: 1rem;
  }
  
  .nav-links {
    display: flex;
    list-style: none;
    gap: 1rem;
  }
  
  a {
    color: white;
    text-decoration: none;
  }
</style> 