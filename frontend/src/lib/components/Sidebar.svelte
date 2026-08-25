<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { smartNavigate } from '$lib/utils/navigation';
  import { auth } from '$lib/stores/authStore';
  import { sidebarCollapsed } from '$lib/stores/sidebarStore';
  import { menuVisibilityStore } from '$lib/stores/menuVisibilityStore';
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
    Zap,
    PieChart,
    TrendingUp as TrendingUpIcon,
    Calendar,
    Pencil,
    FolderSync,
    CircleHelp,
    BookOpen
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
          { label: 'Reportes automáticos', url: '/configuracion/reportes', icon: 'reportes-auto' },
          { label: 'Optimización', url: '/configuracion/optimizacion', icon: 'optimizacion' }
        ]
      : [
          { label: 'General', url: '/configuracion', icon: 'general-config' },
          { label: 'Reportes automáticos', url: '/configuracion/reportes', icon: 'reportes-auto' }
        ]
  );

  // Mapeo de iconos de Lucide (menú principal y submenús)
  const iconMap: Record<string, any> = {
    // Menú principal
    'general': Building2,
    'caja': Wallet,
    'ventas': ShoppingCart,
    'compras': ShoppingBag,
    'productos': Package,
    'clientes': Users,
    'informes': BarChart3,
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
    'ordenes': ClipboardList,
    'notascredito': Receipt,
    'notasdebito': Receipt,
    'recibos': CreditCard,
    'presupuestos': ClipboardList,
    
    // Submenús - Informes (nivel 1)
    'informes-ventas': ShoppingCart,
    'informes-productos': Package,
    'informes-clientes': Users,
    'informes-proveedores': Factory,
    'informes-fechas': Calendar,
    
    // Submenús - Informes (nivel 2 - detalles)
    'facturacion': PieChart,
    'vendedores': UserCircle,
    'preventistas': ClipboardList,
    'productos-informe': Box,
    'rubros': Tag,
    'rubros-provincia': Map,
    'marcas': Tag,
    
    // Submenús - Compras
    'proveedores': Factory,
    
    // Submenús - Productos
    'productos-list': Box,
    'stock': Boxes,
    'existencia': Boxes,
    'rubros-list': Tag,
    'precios-listado': DollarSign,
    'precios-actualizacion': TrendingUp,
    'precios-listas': Upload,
    'precios-manual': Pencil,
    
    // Submenús - Clientes
    'listado': Users,
    'cuentascorrientes': CreditCard,
    
    // Submenús - Sincronización
    'preventas-sync': Download,
    'actualizar': Upload,
    'configuracion-sync': Settings,
    
    // Submenús - Configuración
    'general-config': Settings,
    'reportes-auto': FolderSync,
    'optimizacion': Zap,

    // Ayuda
    'ayuda': CircleHelp,
    'wiki': BookOpen
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
        { label: 'Administración', url: '/caja', icon: 'administracion' },
        { label: 'Cajas Cerradas', url: '/caja/cerradas', icon: 'cerradas' },
        { label: 'Arqueo', url: '/caja/arqueo', icon: 'arqueo' },
        { label: 'Ingresos', url: '/caja/ingreso', icon: 'ingreso' },
        { label: 'Egresos', url: '/caja/egreso', icon: 'egreso' }
      ]
    },
    {
      id: 'ventas',
      label: 'Ventas',
      icon: 'ventas',
      items: [
        { label: 'Preventas', url: '/ventas/preventas', icon: 'preventas' },
        { label: 'Facturas', url: '/ventas/facturas', icon: 'facturas' },
        { label: 'Notas de Crédito', url: '/ventas/notascredito', icon: 'notascredito' },
        { label: 'Notas de Débito', url: '/ventas/notasdebito', icon: 'notasdebito' },
        { label: 'Recibos', url: '/ventas/recibos', icon: 'recibos' },
        { label: 'Presupuestos', url: '/ventas/presupuestos', icon: 'presupuestos' }
      ]
    },
    {
      id: 'compras',
      label: 'Compras',
      icon: 'compras',
      submenus: [
        { label: 'Proveedores', url: '/compras/proveedores', icon: 'proveedores' },
        { label: 'Facturas de compra (beta)', url: '/compras/facturas', icon: 'facturas' },
        { label: 'Órdenes de compra (beta)', url: '/compras/ordenes', icon: 'ordenes' },
        { label: 'Comprobantes de pago (recibos) (beta)', url: '/compras/recibos', icon: 'recibos' },
        { label: 'Notas de Crédito (beta)', url: '/compras/notascredito', icon: 'notascredito' },
        { label: 'Notas de Débito (beta)', url: '/compras/notasdebito', icon: 'notasdebito' },
        { label: 'Cuentas Corrientes (beta)', url: '/compras/cuentascorrientes', icon: 'cuentascorrientes' }
      ]
    },
    {
      id: 'productos',
      label: 'Productos',
      icon: 'productos',
      submenus: [
        { label: 'Productos', url: '/productos', icon: 'productos-list' },
        { label: 'Stock - movimientos', url: '/productos/stock', icon: 'stock' },
        { label: 'Existencia', url: '/productos/existencia', icon: 'existencia' },
        { label: 'Rubros', url: '/rubros', icon: 'rubros-list' },
        { label: 'Listado de Precios', url: '/productos/precios/listado', icon: 'precios-listado' },
        { label: 'Actualización de Precios', url: '/productos/precios/actualizacion', icon: 'precios-actualizacion' },
        { label: 'Actualización manual', url: '/productos/precios/actualizacionmanual', icon: 'precios-manual' },
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
      id: 'informes',
      label: 'Informes',
      icon: 'informes',
      items: [
        { 
          label: 'Ventas', 
          url: '/ventas/informes',
          icon: 'informes-ventas',
          submenus: [
            { label: 'Facturación', url: '/ventas/informes/facturacion', icon: 'facturacion' },
            { label: 'Vendedores', url: '/ventas/informes/vendedores', icon: 'vendedores' },
            { label: 'Preventistas', url: '/ventas/informes/vendedores-preventa', icon: 'preventistas' }
          ]
        },
        { 
          label: 'Productos', 
          url: '/ventas/informes/productos',
          icon: 'informes-productos',
          submenus: [
            { label: 'Productos', url: '/ventas/informes/productos', icon: 'productos-informe' },
            { label: 'Rubros', url: '/ventas/informes/rubros', icon: 'rubros' },
            { label: 'Rubros por Provincia', url: '/ventas/informes/rubros-provincia', icon: 'rubros-provincia' },
            { label: 'Marcas', url: '/ventas/informes/marcas', icon: 'marcas' }
          ]
        },
        { label: 'Clientes', url: '/ventas/informes/clientes', icon: 'informes-clientes' },
        { label: 'Proveedores', url: '/ventas/informes/proveedores', icon: 'informes-proveedores' },
        { label: 'Fechas', url: '/ventas/informes/fechas', icon: 'informes-fechas' }
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
      id: 'ayuda',
      label: 'Ayuda',
      icon: 'ayuda',
      items: [
        { label: 'Wiki', url: '/ayuda', icon: 'wiki' }
      ]
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      icon: 'configuracion',
      items: [] // Se actualizará dinámicamente
    }
  ];

  // Filtrar submenus/items por visibilidad (usa url como key en el store)
  function filterByVisibility(list: { url: string; submenus?: unknown[] }[] | undefined, vis: Record<string, boolean>): unknown[] {
    if (!list) return [];
    return list
      .map((entry) => {
        if (entry.submenus && Array.isArray(entry.submenus)) {
          const filteredSubs = filterByVisibility(entry.submenus as { url: string; submenus?: unknown[] }[], vis);
          if (filteredSubs.length === 0) return null;
          return { ...entry, submenus: filteredSubs };
        }
        return (vis[entry.url] ?? true) ? entry : null;
      })
      .filter((e) => e !== null);
  }

  // Menú items derivados con configuración dinámica y filtrados por visibilidad
  const menuItems = $derived.by(() => {
    const vis = $menuVisibilityStore;
    return baseMenuItems
      .filter((item) => (vis[item.id] ?? true))
      .map((item) => {
        if (item.id === 'configuracion') {
          const filteredConfig = filterByVisibility(configuracionItems as { url: string }[], vis) as SubmenuItem[];
          return { ...item, items: filteredConfig };
        }
        if (item.submenus) {
          const filtered = filterByVisibility(item.submenus as { url: string; submenus?: unknown[] }[], vis) as SubmenuItem[];
          return filtered.length > 0 ? { ...item, submenus: filtered } : null;
        }
        if (item.items) {
          const filtered = filterByVisibility(item.items as { url: string; submenus?: unknown[] }[], vis) as SubmenuItem[];
          return filtered.length > 0 ? { ...item, items: filtered } : null;
        }
        return item;
      })
      .filter((e): e is (typeof baseMenuItems)[0] => e !== null);
  });

  function toggleCollapsed() {
    sidebarCollapsed.set(!$sidebarCollapsed);
    // Cerrar menús al colapsar
    if ($sidebarCollapsed) {
      expandedMenu = null;
      expandedSubmenu = null;
    }
  }

  function expandSidebar() {
    if (isCollapsed) {
      sidebarCollapsed.set(false);
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

  /** Colapsar solo el panel expandido tras inactividad (el rail de 64px sigue visible) */
  const SIDEBAR_IDLE_COLLAPSE_MS = 6000;
  let idleCollapseTimer: ReturnType<typeof setTimeout> | null = null;

  function clearIdleCollapseTimer() {
    if (idleCollapseTimer !== null) {
      clearTimeout(idleCollapseTimer);
      idleCollapseTimer = null;
    }
  }

  function scheduleIdleCollapse() {
    clearIdleCollapseTimer();
    if (!browser || isCollapsed) return;
    idleCollapseTimer = setTimeout(() => {
      idleCollapseTimer = null;
      sidebarCollapsed.set(true);
      expandedMenu = null;
      expandedSubmenu = null;
    }, SIDEBAR_IDLE_COLLAPSE_MS);
  }

  function onSidebarActivity() {
    if (!isCollapsed) scheduleIdleCollapse();
  }

  let lastPointerMoveReset = 0;
  function onSidebarPointerMove() {
    if (!browser || isCollapsed) return;
    const now = Date.now();
    if (now - lastPointerMoveReset < 400) return;
    lastPointerMoveReset = now;
    scheduleIdleCollapse();
  }

  $effect(() => {
    if (!browser) return;
    if (isCollapsed) {
      clearIdleCollapseTimer();
    } else {
      scheduleIdleCollapse();
    }
  });

  onDestroy(() => {
    clearIdleCollapseTimer();
  });
</script>

<!-- Panel lateral: eventos para reiniciar temporizador de inactividad -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<aside
  class="sidebar fixed top-[116px] left-0 z-30 flex h-[calc(100vh-116px)] flex-col overflow-hidden bg-gray-800 text-white transition-all duration-300 ease-out
    {isCollapsed
    ? 'w-16 cursor-pointer shadow-lg'
    : 'w-60 cursor-default rounded-r-xl shadow-2xl ring-1 ring-white/10'}"
  onclick={isCollapsed ? expandSidebar : undefined}
  onpointerdown={onSidebarActivity}
  onpointermove={onSidebarPointerMove}
  onkeydown={onSidebarActivity}
  role="navigation"
  aria-label="Menú principal"
  title={isCollapsed ? 'Clic para expandir' : ''}
>
  <!-- Botón toggle -->
  <button
    type="button"
    class="toggle-btn group flex items-center justify-center border-b border-gray-700 p-3 transition-all hover:bg-gray-700"
    onclick={(e) => {
      e.stopPropagation();
      toggleCollapsed();
    }}
    title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
  >
    {#if isCollapsed}
      <Icon icon={ChevronRight} size={24} strokeWidth={2.5} glass={true} />
    {:else}
      <Icon icon={ChevronLeft} size={24} strokeWidth={2.5} glass={true} />
    {/if}
  </button>

  <!-- Menú de navegación -->
  <nav class="flex-1 overflow-y-auto" onscroll={onSidebarActivity}>
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
