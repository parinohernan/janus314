<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { smartNavigate } from '$lib/utils/navigation';
  import { auth } from '$lib/stores/authStore';
  import { sidebarCollapsed } from '$lib/stores/sidebarStore';
  import { 
    Building2, 
    Wallet, 
    ShoppingCart, 
    Package, 
    Users, 
    RefreshCw, 
    Settings,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    // Iconos para submenús
    Building,
    Landmark,
    MapPin,
    Map,
    LayoutDashboard,
    LockKeyhole,
    Calculator,
    Plus,
    Minus,
    FileText,
    Receipt,
    ClipboardList,
    CreditCard,
    BarChart3,
    ShoppingBag,
    Factory,
    Box,
    Boxes,
    Tag,
    DollarSign,
    TrendingUp,
    UserCircle,
    Download,
    Upload,
    Sliders,
    Zap
  } from 'lucide-svelte';
  import Icon from '$lib/components/ui/Icon.svelte';

  interface SubmenuItem {
    label: string;
    url: string;
    icon?: string;
    submenus?: SubmenuItem[];
  }

  interface MenuItem {
    id: string;
    label: string;
    icon: string;
    submenus?: SubmenuItem[];
    items?: SubmenuItem[];
  }

  const VENDEDOR_ADMIN = 'admin';

  let isCollapsed = $derived($sidebarCollapsed);
  let expandedMenu = $state<string | null>(null);
  let expandedSubmenu = $state<string | null>(null);

  const esAdmin = $derived($auth?.user?.usuario === VENDEDOR_ADMIN);
  const configuracionItems: SubmenuItem[] = $derived(
    esAdmin
      ? [
          { label: 'General', url: '/configuracion', icon: 'general-config' },
          { label: 'Optimización', url: '/configuracion/optimizacion', icon: 'optimizacion' }
        ]
      : [{ label: 'General', url: '/configuracion', icon: 'general-config' }]
  );

  // Mapeo de iconos de Lucide (menú principal y submenús)
  const iconMap: Record<string, any> = {
    // Menú principal
    'general': Building2,
    'caja': Wallet,
    'ventas': ShoppingCart,
    'compras': Package,
    'productos': Package,
    'clientes': Users,
    'sincronizacion': RefreshCw,
    'configuracion': Settings,
    
    // Submenús - General
    'empresa': Building,
    'arca': Landmark,
    'localidades': MapPin,
    'provincias': Map,
    
    // Submenús - Caja
    'administracion': LayoutDashboard,
    'cerradas': LockKeyhole,
    'arqueo': Calculator,
    'ingreso': Plus,
    'egreso': Minus,
    
    // Submenús - Ventas
    'preventas': ClipboardList,
    'facturas': FileText,
    'notascredito': Receipt,
    'notasdebito': Receipt,
    'recibos': CreditCard,
    'informes': BarChart3,
    'presupuestos': ClipboardList,
    
    // Submenús - Informes (sub-submenús)
    'facturacion': BarChart3,
    'productos-informe': Box,
    'clientes-informe': Users,
    'vendedores': UserCircle,
    'rubros': Tag,
    'marcas': Tag,
    'proveedores-informe': Factory,
    'fechas': Map,
    
    // Submenús - Compras
    'proveedores': Factory,
    
    // Submenús - Productos
    'productos-list': Box,
    'stock': Boxes,
    'rubros-list': Tag,
    'precios-listado': DollarSign,
    'precios-actualizacion': TrendingUp,
    'precios-listas': Upload,
    
    // Submenús - Clientes
    'listado': Users,
    'cuentascorrientes': CreditCard,
    
    // Submenús - Sincronización
    'preventas-sync': Download,
    'actualizar': Upload,
    'configuracion-sync': Settings,
    
    // Submenús - Configuración
    'general-config': Settings,
    'optimizacion': Zap
  };

  // Estructura del menú con iconos (sin configuracionItems en definición inicial)
  const baseMenuItems: MenuItem[] = [
    {
      id: 'general',
      label: 'General',
      icon: 'general',
      submenus: [
        { label: 'Mi Empresa', url: '/empresa', icon: 'empresa' },
        { label: 'Estado ARCA', url: '/arca', icon: 'arca' },
        { label: 'Localidades', url: '/localidades', icon: 'localidades' },
        { label: 'Provincias', url: '/provincias', icon: 'provincias' }
      ]
    },
    {
      id: 'caja',
      label: 'Caja',
      icon: 'caja',
      submenus: [
        { label: 'Administración', url: '/ventas/bot/caja', icon: 'administracion' },
        { label: 'Cajas Cerradas', url: '/ventas/bot/caja/cerradas', icon: 'cerradas' },
        { label: 'Arqueo', url: '/ventas/bot/caja/arqueo', icon: 'arqueo' },
        { label: 'Ingresos', url: '/ventas/bot/caja/ingreso', icon: 'ingreso' },
        { label: 'Egresos', url: '/ventas/bot/caja/egreso', icon: 'egreso' }
      ]
    },
    {
      id: 'ventas',
      label: 'Ventas',
      icon: '🛒',
      items: [
        { label: 'Preventas', url: '/ventas/preventas', icon: 'preventas' },
        { label: 'Facturas', url: '/ventas/facturas', icon: 'facturas' },
        { label: 'Notas de Crédito', url: '/ventas/notascredito', icon: 'notascredito' },
        { label: 'Notas de Débito', url: '/ventas/notasdebito', icon: 'notasdebito' },
        { label: 'Recibos', url: '/ventas/recibos', icon: 'recibos' },
        { 
          label: 'Informes', 
          url: '/ventas/informes',
          icon: 'informes',
          submenus: [
            { label: 'Facturación', url: '/ventas/informes/facturacion', icon: 'facturacion' },
            { label: 'Productos', url: '/ventas/informes/productos', icon: 'productos-informe' },
            { label: 'Clientes', url: '/ventas/informes/clientes', icon: 'clientes-informe' },
            { label: 'Vendedores', url: '/ventas/informes/vendedores', icon: 'vendedores' },
            { label: 'Rubros', url: '/ventas/informes/rubros', icon: 'rubros' },
            { label: 'Marcas', url: '/ventas/informes/marcas', icon: 'marcas' },
            { label: 'Proveedores', url: '/ventas/informes/proveedores', icon: 'proveedores-informe' },
            { label: 'Fechas', url: '/ventas/informes/fechas', icon: 'fechas' }
          ]
        },
        { label: 'Presupuestos', url: '/ventas/presupuestos', icon: 'presupuestos' }
      ]
    },
    {
      id: 'compras',
      label: 'Compras',
      icon: 'compras',
      submenus: [
        { label: 'Proveedores', url: '/compras/proveedores', icon: 'proveedores' }
      ]
    },
    {
      id: 'productos',
      label: 'Productos',
      icon: 'productos',
      submenus: [
        { label: 'Productos', url: '/productos', icon: 'productos-list' },
        { label: 'Stock', url: '/productos/stock', icon: 'stock' },
        { label: 'Rubros', url: '/rubros', icon: 'rubros-list' },
        { label: 'Listado de Precios', url: '/productos/precios/listado', icon: 'precios-listado' },
        { label: 'Actualización de Precios', url: '/productos/precios/actualizacion', icon: 'precios-actualizacion' },
        { label: 'Actualización desde listas', url: '/productos/precios/actualizarconlista', icon: 'precios-listas' }
      ]
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: 'clientes',
      items: [
        { label: 'Listado', url: '/clientes', icon: 'listado' },
        { label: 'Cuentas Corrientes', url: '/clientes/cuentascorrientes', icon: 'cuentascorrientes' }
      ]
    },
    {
      id: 'sincronizacion',
      label: 'Sincronizar Móviles',
      icon: 'sincronizacion',
      items: [
        { label: 'Descargar Preventas', url: '/sincronizacion/preventas', icon: 'preventas-sync' },
        { label: 'Actualizar Datos', url: '/sincronizacion/actualizar-datos', icon: 'actualizar' },
        { label: 'Configuración', url: '/sincronizacion/configuracion', icon: 'configuracion-sync' }
      ]
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      icon: 'configuracion',
      items: [] // Se actualizará dinámicamente
    }
  ];

  // Menú items derivados con configuración dinámica
  const menuItems = $derived(
    baseMenuItems.map(item => 
      item.id === 'configuracion' 
        ? { ...item, items: configuracionItems }
        : item
    )
  );

  function toggleCollapsed() {
    sidebarCollapsed.set(!$sidebarCollapsed);
    // Cerrar menús al colapsar
    if ($sidebarCollapsed) {
      expandedMenu = null;
      expandedSubmenu = null;
    }
  }

  function toggleMenu(menuId: string) {
    if (expandedMenu === menuId) {
      expandedMenu = null;
      expandedSubmenu = null;
    } else {
      expandedMenu = menuId;
      expandedSubmenu = null;
    }
  }

  function toggleSubmenu(submenuLabel: string, event: MouseEvent) {
    event.stopPropagation();
    if (expandedSubmenu === submenuLabel) {
      expandedSubmenu = null;
    } else {
      expandedSubmenu = submenuLabel;
    }
  }

  function handleNavigation(event: MouseEvent, url: string, label: string, iconComponent?: any) {
    event.preventDefault();
    // Si hay un componente de icono, no lo pasamos como string
    smartNavigate(url, event, { label });
  }

  function isActiveUrl(url: string): boolean {
    return $page.url.pathname === url || $page.url.pathname.startsWith(url + '/');
  }
</script>

<aside
  class="sidebar fixed top-[116px] left-0 h-[calc(100vh-116px)] bg-gray-800 text-white shadow-lg transition-all duration-300 z-20 overflow-hidden flex flex-col
    {isCollapsed ? 'w-16' : 'w-60'}"
>
  <!-- Botón toggle -->
  <button
    class="toggle-btn flex items-center justify-center p-3 hover:bg-gray-700 transition-all border-b border-gray-700 group"
    onclick={toggleCollapsed}
    title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
  >
    {#if isCollapsed}
      <Icon icon={ChevronRight} size={24} strokeWidth={2.5} glass={true} />
    {:else}
      <Icon icon={ChevronLeft} size={24} strokeWidth={2.5} glass={true} />
    {/if}
  </button>

  <!-- Menú de navegación -->
  <nav class="flex-1 overflow-y-auto">
    {#each menuItems as item (item.id)}
      <div class="menu-item">
        <button
          class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-all
            {expandedMenu === item.id ? 'bg-gray-700' : ''}"
          onclick={() => toggleMenu(item.id)}
          title={isCollapsed ? item.label : ''}
        >
          <div class="flex-shrink-0">
            <Icon icon={iconMap[item.icon]} size={20} strokeWidth={2.5} />
          </div>
          {#if !isCollapsed}
            <span class="flex-1 text-left text-sm font-medium truncate">{item.label}</span>
            <div class="flex-shrink-0 transition-transform duration-200 {expandedMenu === item.id ? 'rotate-180' : ''}">
              <Icon icon={ChevronDown} size={16} strokeWidth={2.5} />
            </div>
          {/if}
        </button>

        <!-- Submenú -->
        {#if !isCollapsed && expandedMenu === item.id}
          <div class="submenu bg-gray-900">
            {#each (item.id === 'configuracion' ? configuracionItems : (item.submenus || item.items || [])) as submenu}
              {#if submenu.submenus}
                <!-- Item con sub-submenú -->
                <div>
                  <button
                    class="w-full flex items-center gap-2 px-6 py-2 text-sm hover:bg-gray-700 transition-all"
                    onclick={(e) => toggleSubmenu(submenu.label, e)}
                  >
                    {#if submenu.icon && iconMap[submenu.icon]}
                      <div class="flex-shrink-0">
                        <Icon icon={iconMap[submenu.icon]} size={14} strokeWidth={2.5} />
                      </div>
                    {/if}
                    <span class="flex-1 truncate text-left">{submenu.label}</span>
                    <div class="flex-shrink-0 transition-transform duration-200 {expandedSubmenu === submenu.label ? 'rotate-180' : ''}">
                      <Icon icon={ChevronDown} size={14} strokeWidth={2.5} />
                    </div>
                  </button>
                  
                  {#if expandedSubmenu === submenu.label}
                    <div class="sub-submenu bg-gray-950">
                      {#each submenu.submenus as subsubmenu}
                        <a
                          href={subsubmenu.url}
                          class="flex items-center gap-2 px-8 py-2 text-xs hover:bg-gray-700 transition-all truncate
                            {isActiveUrl(subsubmenu.url) ? 'bg-gray-600 border-l-2 border-blue-500' : ''}"
                          onclick={(e) => handleNavigation(e, subsubmenu.url, subsubmenu.label, subsubmenu.icon ? iconMap[subsubmenu.icon] : undefined)}
                        >
                          {#if subsubmenu.icon && iconMap[subsubmenu.icon]}
                            <div class="flex-shrink-0">
                              <Icon icon={iconMap[subsubmenu.icon]} size={12} strokeWidth={2.5} />
                            </div>
                          {/if}
                          <span class="truncate">{subsubmenu.label}</span>
                        </a>
                      {/each}
                    </div>
                  {/if}
                </div>
              {:else}
                <!-- Item simple -->
                <a
                  href={submenu.url}
                  class="flex items-center gap-2 px-6 py-2 text-sm hover:bg-gray-700 transition-all truncate
                    {isActiveUrl(submenu.url) ? 'bg-gray-600 border-l-2 border-blue-500' : ''}"
                  onclick={(e) => handleNavigation(e, submenu.url, submenu.label, submenu.icon ? iconMap[submenu.icon] : undefined)}
                >
                  {#if submenu.icon && iconMap[submenu.icon]}
                    <div class="flex-shrink-0">
                      <Icon icon={iconMap[submenu.icon]} size={14} strokeWidth={2.5} />
                    </div>
                  {/if}
                  <span class="truncate">{submenu.label}</span>
                </a>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </nav>
</aside>

<style>
  .sidebar::-webkit-scrollbar {
    width: 6px;
  }

  .sidebar::-webkit-scrollbar-track {
    background: #1f2937;
  }

  .sidebar::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 3px;
  }

  .sidebar::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }

  nav::-webkit-scrollbar {
    width: 6px;
  }

  nav::-webkit-scrollbar-track {
    background: #1f2937;
  }

  nav::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 3px;
  }
</style>
