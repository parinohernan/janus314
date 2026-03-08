/**
 * Estructura plana de todos los elementos del menú (principales y submenús)
 * para configuración de visibilidad.
 */
export interface MenuEntry {
	id: string;
	url: string;
	label: string;
	parentId: string;
	parentLabel: string;
}

// Lista plana de todas las entradas del menú (main + submenus)
export const MENU_ENTRIES: MenuEntry[] = [
	// General
	{ id: 'general', url: '', label: 'General', parentId: '', parentLabel: '' },
	{ id: '/empresa', url: '/empresa', label: 'Mi Empresa', parentId: 'general', parentLabel: 'General' },
	{ id: '/arca', url: '/arca', label: 'Estado ARCA', parentId: 'general', parentLabel: 'General' },
	{ id: '/localidades', url: '/localidades', label: 'Localidades', parentId: 'general', parentLabel: 'General' },
	{ id: '/provincias', url: '/provincias', label: 'Provincias', parentId: 'general', parentLabel: 'General' },
	// Caja
	{ id: 'caja', url: '', label: 'Caja', parentId: '', parentLabel: '' },
	{ id: '/caja', url: '/caja', label: 'Administración', parentId: 'caja', parentLabel: 'Caja' },
	{ id: '/caja/cerradas', url: '/caja/cerradas', label: 'Cajas Cerradas', parentId: 'caja', parentLabel: 'Caja' },
	{ id: '/caja/arqueo', url: '/caja/arqueo', label: 'Arqueo', parentId: 'caja', parentLabel: 'Caja' },
	{ id: '/caja/ingreso', url: '/caja/ingreso', label: 'Ingresos', parentId: 'caja', parentLabel: 'Caja' },
	{ id: '/caja/egreso', url: '/caja/egreso', label: 'Egresos', parentId: 'caja', parentLabel: 'Caja' },
	// Ventas
	{ id: 'ventas', url: '', label: 'Ventas', parentId: '', parentLabel: '' },
	{ id: '/ventas/preventas', url: '/ventas/preventas', label: 'Preventas', parentId: 'ventas', parentLabel: 'Ventas' },
	{ id: '/ventas/facturas', url: '/ventas/facturas', label: 'Facturas', parentId: 'ventas', parentLabel: 'Ventas' },
	{ id: '/ventas/notascredito', url: '/ventas/notascredito', label: 'Notas de Crédito', parentId: 'ventas', parentLabel: 'Ventas' },
	{ id: '/ventas/notasdebito', url: '/ventas/notasdebito', label: 'Notas de Débito', parentId: 'ventas', parentLabel: 'Ventas' },
	{ id: '/ventas/recibos', url: '/ventas/recibos', label: 'Recibos', parentId: 'ventas', parentLabel: 'Ventas' },
	{ id: '/ventas/presupuestos', url: '/ventas/presupuestos', label: 'Presupuestos', parentId: 'ventas', parentLabel: 'Ventas' },
	// Compras
	{ id: 'compras', url: '', label: 'Compras', parentId: '', parentLabel: '' },
	{ id: '/compras/proveedores', url: '/compras/proveedores', label: 'Proveedores', parentId: 'compras', parentLabel: 'Compras' },
	{ id: '/compras/facturas', url: '/compras/facturas', label: 'Facturas de compra (beta)', parentId: 'compras', parentLabel: 'Compras' },
	{ id: '/compras/ordenes', url: '/compras/ordenes', label: 'Órdenes de compra (beta)', parentId: 'compras', parentLabel: 'Compras' },
	{ id: '/compras/recibos', url: '/compras/recibos', label: 'Comprobantes de pago (recibos) (beta)', parentId: 'compras', parentLabel: 'Compras' },
	{ id: '/compras/notascredito', url: '/compras/notascredito', label: 'Notas de Crédito (beta)', parentId: 'compras', parentLabel: 'Compras' },
	{ id: '/compras/notasdebito', url: '/compras/notasdebito', label: 'Notas de Débito (beta)', parentId: 'compras', parentLabel: 'Compras' },
	{ id: '/compras/cuentascorrientes', url: '/compras/cuentascorrientes', label: 'Cuentas Corrientes (beta)', parentId: 'compras', parentLabel: 'Compras' },
	// Productos
	{ id: 'productos', url: '', label: 'Productos', parentId: '', parentLabel: '' },
	{ id: '/productos', url: '/productos', label: 'Productos', parentId: 'productos', parentLabel: 'Productos' },
	{ id: '/productos/stock', url: '/productos/stock', label: 'Stock - movimientos', parentId: 'productos', parentLabel: 'Productos' },
	{ id: '/productos/existencia', url: '/productos/existencia', label: 'Existencia', parentId: 'productos', parentLabel: 'Productos' },
	{ id: '/rubros', url: '/rubros', label: 'Rubros', parentId: 'productos', parentLabel: 'Productos' },
	{ id: '/productos/precios/listado', url: '/productos/precios/listado', label: 'Listado de Precios', parentId: 'productos', parentLabel: 'Productos' },
	{ id: '/productos/precios/actualizacion', url: '/productos/precios/actualizacion', label: 'Actualización de Precios', parentId: 'productos', parentLabel: 'Productos' },
	{ id: '/productos/precios/actualizarconlista', url: '/productos/precios/actualizarconlista', label: 'Actualización desde listas', parentId: 'productos', parentLabel: 'Productos' },
	// Clientes
	{ id: 'clientes', url: '', label: 'Clientes', parentId: '', parentLabel: '' },
	{ id: '/clientes', url: '/clientes', label: 'Listado', parentId: 'clientes', parentLabel: 'Clientes' },
	{ id: '/clientes/cuentascorrientes', url: '/clientes/cuentascorrientes', label: 'Cuentas Corrientes', parentId: 'clientes', parentLabel: 'Clientes' },
	// Informes
	{ id: 'informes', url: '', label: 'Informes', parentId: '', parentLabel: '' },
	{ id: '/ventas/informes/facturacion', url: '/ventas/informes/facturacion', label: 'Facturación', parentId: 'informes', parentLabel: 'Informes' },
	{ id: '/ventas/informes/vendedores', url: '/ventas/informes/vendedores', label: 'Vendedores', parentId: 'informes', parentLabel: 'Informes' },
	{ id: '/ventas/informes/productos', url: '/ventas/informes/productos', label: 'Productos', parentId: 'informes', parentLabel: 'Informes' },
	{ id: '/ventas/informes/rubros', url: '/ventas/informes/rubros', label: 'Rubros', parentId: 'informes', parentLabel: 'Informes' },
	{ id: '/ventas/informes/marcas', url: '/ventas/informes/marcas', label: 'Marcas', parentId: 'informes', parentLabel: 'Informes' },
	{ id: '/ventas/informes/clientes', url: '/ventas/informes/clientes', label: 'Clientes', parentId: 'informes', parentLabel: 'Informes' },
	{ id: '/ventas/informes/proveedores', url: '/ventas/informes/proveedores', label: 'Proveedores', parentId: 'informes', parentLabel: 'Informes' },
	{ id: '/ventas/informes/fechas', url: '/ventas/informes/fechas', label: 'Fechas', parentId: 'informes', parentLabel: 'Informes' },
	// Sincronización
	{ id: 'sincronizacion', url: '', label: 'Sincronizar Móviles', parentId: '', parentLabel: '' },
	{ id: '/sincronizacion/preventas', url: '/sincronizacion/preventas', label: 'Descargar Preventas', parentId: 'sincronizacion', parentLabel: 'Sincronizar Móviles' },
	{ id: '/sincronizacion/actualizar-datos', url: '/sincronizacion/actualizar-datos', label: 'Actualizar Datos', parentId: 'sincronizacion', parentLabel: 'Sincronizar Móviles' },
	{ id: '/sincronizacion/configuracion', url: '/sincronizacion/configuracion', label: 'Configuración', parentId: 'sincronizacion', parentLabel: 'Sincronizar Móviles' },
	// Configuración
	{ id: 'configuracion', url: '', label: 'Configuración', parentId: '', parentLabel: '' },
	{ id: '/configuracion', url: '/configuracion', label: 'General', parentId: 'configuracion', parentLabel: 'Configuración' },
	{ id: '/configuracion/optimizacion', url: '/configuracion/optimizacion', label: 'Optimización', parentId: 'configuracion', parentLabel: 'Configuración' }
];
