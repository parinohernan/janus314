<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  // Props 
  export let customPath: Array<{ label: string; path: string }> | null = null;
  export let hideHome = false; // Opción para ocultar el enlace a home
  
  // Tipos para las rutas
  interface BreadcrumbItem {
    label: string;
    path: string;
    active: boolean;
  }
  
  // Mapeo de rutas a nombres legibles
  const routeLabels: Record<string, string> = {
    'ventas': 'Ventas',
    'bot': 'Bot',
    'productos': 'Productos',
    'nuevo': 'Nuevo',
    'editar': 'Editar',
    'detalles': 'Detalles',
    'clientes': 'Clientes',
    'proveedores': 'Proveedores',
    'alertas': 'Alertas',
    'stock': 'Stock',
    'usuarios': 'Usuarios',
    'configuracion': 'Configuración',
  };
  
  // Función para generar el breadcrumb basado en la ruta actual
  function generateBreadcrumbs(currentPath: string): BreadcrumbItem[] {
    // Si se proporciona una ruta personalizada, usarla
    if (customPath) {
      return customPath.map((item, index) => ({
        label: item.label,
        path: item.path,
        active: index === customPath.length - 1
      }));
    }
    
    // Inicializar con Home
    const items: BreadcrumbItem[] = !hideHome 
      ? [{ label: 'Home', path: '/ventas/bot', active: false }] 
      : [];
    
    // Procesar la ruta actual
    const segments = currentPath.split('/').filter(segment => segment);
    let currentRoute = '';
    
    segments.forEach((segment, index) => {
      currentRoute += `/${segment}`;
      
      // Ignorar segmentos dinámicos (los que comienzan con '[' o contienen números puros)
      if (segment.startsWith('[') || /^\d+$/.test(segment)) {
        return;
      }
      
      // Verificar si estamos en una ruta de producto
      if (segment === 'productos' && segments[index+1] === 'detalles' && segments[index+2] && /^\d+$/.test(segments[index+2])) {
        return;
      }
      
      // Obtener la etiqueta para este segmento o usar el segmento como respaldo
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      items.push({
        label,
        path: currentRoute,
        active: index === segments.length - 1
      });
    });
    
    return items;
  }
  
  // Procesar la ruta actual cuando cambia la página
  $: breadcrumbs = generateBreadcrumbs($page.url.pathname);
  
  // Navegar a una ruta específica
  function navigateTo(path: string) {
    goto(path);
  }
</script>

<nav class="breadcrumb-container" aria-label="Breadcrumb">
  <ol class="breadcrumb-list">
    {#each breadcrumbs as item, i}
      <li class="breadcrumb-item {item.active ? 'active' : ''}">
        {#if !item.active}
          <button 
            on:click={() => navigateTo(item.path)}
            class="breadcrumb-link"
            aria-current={item.active ? 'page' : undefined}
          >
            {item.label}
          </button>
          <span class="separator" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </span>
        {:else}
          <span class="current-page">{item.label}</span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  .breadcrumb-container {
    margin-bottom: 16px;
    padding: 8px 0;
    font-size: 0.9rem;
  }
  
  .breadcrumb-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: 0;
    margin: 0;
    list-style: none;
  }
  
  .breadcrumb-item {
    display: flex;
    align-items: center;
  }
  
  .breadcrumb-link {
    background: none;
    border: none;
    padding: 4px 4px;
    color: var(--tg-theme-link-color, #2481cc);
    cursor: pointer;
    font-size: 0.9rem;
    border-radius: 4px;
    transition: background-color 0.2s;
    text-decoration: none;
  }
  
  .breadcrumb-link:hover {
    background-color: rgba(36, 129, 204, 0.1);
    text-decoration: underline;
  }
  
  .current-page {
    color: var(--tg-theme-hint-color, #777);
    padding: 4px 0;
    font-weight: 500;
  }
  
  .separator {
    display: flex;
    align-items: center;
    color: var(--tg-theme-hint-color, #aaa);
    margin: 0 4px;
    line-height: 1;
  }
  
  .separator svg {
    width: 14px;
    height: 14px;
  }
  
  @media (max-width: 480px) {
    .breadcrumb-container {
      font-size: 0.8rem;
      overflow-x: auto;
      white-space: nowrap;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none; /* Firefox */
    }
    
    .breadcrumb-container::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Edge */
    }
    
    .breadcrumb-list {
      flex-wrap: nowrap;
    }
  }
</style> 