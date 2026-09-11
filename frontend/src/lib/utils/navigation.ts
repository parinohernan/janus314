import { goto } from '$app/navigation';
import { tabsStore, type Tab } from '$lib/stores/tabsStore';
import { get } from 'svelte/store';

/**
 * Detecta si se debe abrir en nuevo tab basado en el evento
 * @param event - Evento del mouse
 * @returns true si se presionó Ctrl (Windows/Linux) o Cmd (Mac)
 */
export function shouldOpenInNewTab(event: MouseEvent | KeyboardEvent): boolean {
  // Ctrl en Windows/Linux o Cmd en Mac
  return event.ctrlKey || event.metaKey;
}

/**
 * Abre contenido en un nuevo tab
 * @param url - URL del contenido a abrir
 * @param label - Título del tab
 * @param icon - Icono opcional (emoji)
 * @param type - Tipo de tab (view, edit, create)
 */
export function openInNewTab(
  url: string,
  label: string,
  icon?: string,
  type: 'view' | 'edit' | 'create' = 'view'
): void {
  tabsStore.openTab({
    url,
    label,
    icon,
    type
  });
  goto(url);
}

/**
 * Navega reemplazando el contenido del tab actual
 * @param url - URL destino
 */
export function replaceCurrentTab(url: string): void {
  goto(url);
  // Actualizar el tab actual con la nueva URL si existe
  const state = get(tabsStore);
  if (state.activeTabId) {
    const activeTab = state.tabs.find(t => t.id === state.activeTabId);
    if (activeTab) {
      // Se podría actualizar la URL del tab actual aquí si se desea
      // Por ahora solo navegamos
    }
  }
}

/**
 * Navega considerando si debe abrir en nuevo tab o reemplazar el actual
 * @param event - Evento del mouse
 * @param url - URL destino
 * @param label - Título para el nuevo tab (si aplica)
 * @param icon - Icono opcional
 * @param type - Tipo de tab
 */
export function navigateToTab(
  event: MouseEvent | KeyboardEvent,
  url: string,
  label: string,
  icon?: string,
  type: 'view' | 'edit' | 'create' = 'view'
): void {
  if (shouldOpenInNewTab(event)) {
    openInNewTab(url, label, icon, type);
  } else {
    replaceCurrentTab(url);
  }
}

/**
 * Obtiene un label apropiado para una URL basándose en el path
 * @param url - URL a procesar
 * @returns Label generado
 */
export function getLabelFromUrl(url: string): string {
  const pathParts = url.split('/').filter(p => p);
  
  if (pathParts.length === 0) return 'Inicio';
  
  // Mapa de traducciones comunes
  const translations: Record<string, string> = {
    'ventas': 'Ventas',
    'facturas': 'Facturas',
    'nueva': 'Nueva',
    'nuevo': 'Nuevo',
    'editar': 'Editar',
    'imprimir': 'Imprimir',
    'clientes': 'Clientes',
    'cuentascorrientes': 'Cuentas Corrientes',
    'productos': 'Productos',
    'articulos': 'Artículos',
    'proveedores': 'Proveedores',
    'compras': 'Compras',
    'informes': 'Informes',
    'configuracion': 'Configuración',
    'notascredito': 'Notas de Crédito',
    'notasdebito': 'Notas de Débito',
    'recibos': 'Recibos',
    'preventas': 'Preventas',
    'pedidos': 'Pedidos',
    'sincronizacion': 'Sincronización',
    'caja': 'Caja',
    'empresa': 'Mi Empresa',
    'localidades': 'Localidades',
    'provincias': 'Provincias',
    'rubros': 'Rubros',
    'stock': 'Stock',
    'precios': 'Precios',
    'listado': 'Listado',
    'actualizacion': 'Actualización',
    'facturacion': 'Facturación',
    'vendedores': 'Vendedores',
    'marcas': 'Marcas',
    'fechas': 'Fechas',
    'arca': 'Estado ARCA',
    'facturas-sin-cae': 'Facturas sin CAE',
    'presupuestos': 'Presupuestos',
    'arqueo': 'Arqueo',
    'cerradas': 'Cerradas',
    'ingreso': 'Ingreso',
    'egreso': 'Egreso',
    'cierre': 'Cierre',
    'optimizacion': 'Optimización',
    'ayuda': 'Ayuda',
    'wiki': 'Wiki'
  };
  
  // Intentar construir un label más descriptivo
  const relevantParts = pathParts.filter(p => !['ventas', 'compras', 'bot'].includes(p));
  
  if (relevantParts.length === 0) return 'Inicio';
  
  // Si es una ruta con ID al final (ejemplo: /clientes/123), usar el penúltimo elemento
  const lastPart = relevantParts[relevantParts.length - 1];
  const isId = /^[0-9a-f-]+$/i.test(lastPart);
  
  if (isId && relevantParts.length > 1) {
    const section = translations[relevantParts[relevantParts.length - 2]] || capitalizeFirst(relevantParts[relevantParts.length - 2]);
    return `${section} - Detalle`;
  }
  
  // Intentar crear label compuesto para rutas específicas
  if (relevantParts.length >= 2) {
    const lastTranslated = translations[lastPart] || capitalizeFirst(lastPart);
    const prevPart = relevantParts[relevantParts.length - 2];
    const prevTranslated = translations[prevPart];
    
    if (prevTranslated && !['nueva', 'nuevo', 'editar', 'imprimir'].includes(lastPart)) {
      return `${prevTranslated} - ${lastTranslated}`;
    }
  }
  
  return translations[lastPart] || capitalizeFirst(lastPart);
}

/**
 * Capitaliza la primera letra de un string
 * @param str - String a capitalizar
 * @returns String capitalizado
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Obtiene un icono apropiado para una URL basándose en el path
 * @param url - URL a procesar
 * @returns Emoji representativo
 */
export function getIconFromUrl(url: string): string {
  const icons: Record<string, string> = {
    'ventas': '🛒',
    'facturas': '📄',
    'clientes': '👥',
    'cuentascorrientes': '💵',
    'productos': '📦',
    'articulos': '📦',
    'proveedores': '🏭',
    'compras': '🛍️',
    'informes': '📊',
    'configuracion': '⚙️',
    'notascredito': '📝',
    'notasdebito': '📝',
    'recibos': '🧾',
    'preventas': '💰',
    'pedidos': '📋',
    'sincronizacion': '🔄',
    'caja': '💰',
    'empresa': '🏢',
    'rubros': '🏷️',
    'stock': '📊',
    'precios': '💲',
    'localidades': '📍',
    'provincias': '🗺️',
    'arca': '🏛️',
    'vendedores': '👔',
    'presupuestos': '📋',
    'ayuda': '❓',
    'wiki': '📖',
    'arqueo': '🔢',
    'optimizacion': '⚡'
  };
  
  for (const [key, icon] of Object.entries(icons)) {
    if (url.includes(key)) {
      return icon;
    }
  }
  
  return '📄'; // Icono por defecto
}

/**
 * Crea un tab inteligente desde una URL, generando label e icon automáticamente
 * @param url - URL del tab
 * @param customLabel - Label personalizado (opcional)
 * @param customIcon - Icono personalizado (opcional)
 * @param type - Tipo de tab
 */
export function createTabFromUrl(
  url: string,
  customLabel?: string,
  customIcon?: string,
  type: 'view' | 'edit' | 'create' = 'view'
): void {
  const label = customLabel || getLabelFromUrl(url);
  const icon = customIcon || getIconFromUrl(url);
  
  tabsStore.openTab({
    url,
    label,
    icon,
    type
  });
  goto(url);
}

/**
 * Navega a una URL abriendo tab si es necesario
 * Útil para links e integraciones
 * @param event - Evento opcional del mouse
 * @param url - URL destino
 * @param options - Opciones adicionales
 */
export function smartNavigate(
  url: string,
  event?: MouseEvent | KeyboardEvent,
  options?: {
    label?: string;
    icon?: string;
    type?: 'view' | 'edit' | 'create';
    forceNewTab?: boolean;
  }
): void {
  const shouldNewTab = options?.forceNewTab || (event && shouldOpenInNewTab(event));
  
  if (shouldNewTab) {
    createTabFromUrl(url, options?.label, options?.icon, options?.type);
  } else {
    goto(url);
  }
}
