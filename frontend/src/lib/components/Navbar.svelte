<script lang="ts">
  import { auth } from '$lib/stores/authStore';

  interface SubmenuItem {
    label: string;
    url: string;
    submenus?: SubmenuItem[];
  }

  let activeMenu = $state<string | null>(null);
  let activeSubmenu = $state<string | null>(null);

  const VENDEDOR_ADMIN = 'admin';
  const esAdmin = $derived($auth?.user?.usuario === VENDEDOR_ADMIN);
  const configuracionItems: SubmenuItem[] = $derived(
    esAdmin
      ? [
          { label: 'General', url: '/configuracion' },
          { label: 'Optimización', url: '/configuracion/optimizacion' }
        ]
      : [{ label: 'General', url: '/configuracion' }]
  );

  interface MenuItem {
    id: string;
    label: string;
    submenus?: SubmenuItem[];
    items?: SubmenuItem[];
  }

  // Estructura del menú
  const menuItems: MenuItem[] = [
    {
      id: 'general',
      label: 'General',
      submenus: [
        { label: 'Mi Empresa', url: '/empresa' },
        { label: 'Estado ARCA', url: '/arca' },
        { label: 'Localidades', url: '/localidades' },
        { label: 'Provincias', url: '/provincias' },
        // { label: 'Rutas', url: '/rutas' },
        // { label: 'Tipos de Pago', url: '/tablas/tipos-de-pago' }
      ]
    },
    {
      id: 'caja',
      label: 'Caja',
      submenus: [
        { label: 'Administración', url: '/caja' },
        { label: 'Cajas Cerradas', url: '/caja/cerradas' },
        { label: 'Arqueo', url: '/caja/arqueo' },
        { label: 'Ingresos', url: '/caja/ingreso' },
        { label: 'Egresos', url: '/caja/egreso' }
      ]
    },
    // {
    //   id: 'miniweb',
    //   label: 'Miniweb',
    //   items: [
    //     { label: 'Nueva Venta', url: '/ventas/bot/nueva' }
    //   ]
    // },
    {
      id: 'ventas',
      label: 'Ventas',
      items: [
        { label: 'Preventas', url: '/ventas/preventas' },
        { label: 'Facturas', url: '/ventas/facturas' },
        { label: 'Notas de Crédito', url: '/ventas/notascredito' },
        { label: 'Notas de Débito', url: '/ventas/notasdebito' },
        { label: 'Recibos', url: '/ventas/recibos' },
        { label: 'Informes', url: '/ventas/informes' ,submenus: [
        { label: 'Facturación', url: '/ventas/informes/facturacion' },
        { label: 'Productos', url: '/ventas/informes/productos' },
        { label: 'Clientes', url: '/ventas/informes/clientes' },
        { label: 'Vendedores', url: '/ventas/informes/vendedores' },
        { label: 'Rubros', url: '/ventas/informes/rubros' },
        { label: 'Marcas', url: '/ventas/informes/marcas' },
        { label: 'Proveedores', url: '/ventas/informes/proveedores' },
        { label: 'Fechas', url: '/ventas/informes/fechas' }
      ]},
        { label: 'Presupuestos', url: '/ventas/presupuestos' }
      ]
    },
    {
      id: 'compras',
      label: 'Compras',
      submenus: [
        { label: 'Proveedores', url: '/compras/proveedores' }
      ]
    },
    {
      id: 'productos',
      label: 'Productos',
      submenus: [
        { label: 'Productos', url: '/productos' },
        { label: 'Stock', url: '/productos/stock' },
        { label: 'Rubros', url: '/rubros' },
        { label: 'Listado de Precios', url: '/productos/precios/listado' },
        { label: 'Actualización de Precios', url: '/productos/precios/actualizacion' },
        { label: 'Actualización de Precios desde listas', url: '/productos/precios/actualizarconlista' }
      ]
    },
    {
      id: 'clientes',
      label: 'Clientes',
      items: [
        { label: 'Listado', url: '/clientes' },
        { label: 'Cuentas Corrientes', url: '/clientes/cuentascorrientes' }
      ]
    },
    {
      id: 'sincronizacion',
      label: 'Sincronizar Móviles',
      items: [
        { label: 'Descargar Preventas', url: '/sincronizacion/preventas' },
        { label: 'Actualizar Datos', url: '/sincronizacion/actualizar-datos' },
        { label: 'Configuración', url: '/sincronizacion/configuracion' }
      ]
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      items: [
        { label: 'General', url: '/configuracion' }
      ]
    }
  ];

  // Al inicio del script
  // console.log('Renderizando Navbar con submenús:');
  menuItems.forEach(item => {
    if (item.id === 'productos') {
      console.log('Submenús de productos:', item.submenus);
    }
  });

  const toggleMenu = (menuId: string) => {
    if (activeMenu === menuId) {
      activeMenu = null;
      activeSubmenu = null;
    } else {
      activeMenu = menuId;
      activeSubmenu = null;
    }
  };

  const toggleSubmenu = (menuId: string, event: MouseEvent) => {
    event.stopPropagation();
    if (activeSubmenu === menuId) {
      activeSubmenu = null;
    } else {
      activeSubmenu = menuId;
    }
  };

  // Cerrar el menú al hacer clic fuera de él
  const handleClickOutside = () => {
    activeMenu = null;
    activeSubmenu = null;
  };
</script>

<nav class="navbar bg-gray-800 text-white shadow-md">  
  <div class="container mx-auto px-4">
    <div class="flex">
      {#each menuItems as item}
        <div class="relative">
          <button 
            class="px-4 py-3 hover:bg-gray-600 font-medium flex items-center space-x-1 {activeMenu === item.id ? 'bg-gray-500' : ''}"
            onclick={(e) => { e.stopPropagation(); toggleMenu(item.id); }}
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
              {#each (item.id === 'configuracion' ? configuracionItems : (item.submenus || item.items || [])) as submenu}
                {#if submenu.submenus}
                  <div class="relative">
                    <button
                      class="w-full text-left px-4 py-2 text-white hover:bg-gray-600 flex items-center justify-between"
                      onclick={(e) => { e.stopPropagation(); toggleSubmenu(submenu.label, e); }}
                    >
                      <span>{submenu.label}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    {#if activeSubmenu === submenu.label}
                      <div class="absolute left-full top-0 w-48 bg-gray-800 shadow-lg z-20 py-1 rounded-b-md border border-gray-200">
                        {#each submenu.submenus as subsubmenu}
                          <a 
                            href={subsubmenu.url} 
                            class="block px-4 py-2 text-white hover:bg-gray-600"
                            onclick={(e) => {
                              e.stopPropagation();
                              activeMenu = null;
                              activeSubmenu = null;
                            }}
                          >
                            {subsubmenu.label}
                          </a>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {:else}
                  <a 
                    href={submenu.url} 
                    class="block px-4 py-2 text-white hover:bg-gray-600"
                    onclick={(e) => { e.stopPropagation(); activeMenu = null; }}
                  >
                    {submenu.label}
                  </a>
                {/if}
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</nav>

<svelte:window onclick={handleClickOutside} />

<style>
  /* Mantener solo los selectores que sí están siendo utilizados */
</style> 