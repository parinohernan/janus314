# Tabbed Workspace y Livesidebar - Guía de Uso

## Resumen

Se ha implementado un sistema de tabs estilo IDE/navegador que permite trabajar con múltiples documentos simultáneamente, junto con un sidebar colapsable mejorado que contiene el menú de navegación principal.

## Características Implementadas

### 1. Sistema de Tabs (TabBar)

El TabBar aparece debajo del Navbar y permite:

- **Abrir múltiples documentos**: Puedes tener varios documentos/páginas abiertos simultáneamente
- **Navegación rápida**: Click en cualquier tab para cambiar entre ellos
- **Cerrar tabs**: Click en la X para cerrar un tab individual
- **Menú contextual**: Click derecho en un tab para acceder a opciones adicionales:
  - Cerrar
  - Cerrar otros
  - Cerrar todos
  - Cerrar a la derecha
  - Anclar/Desanclar
- **Tabs anclados**: Los tabs anclados se mantienen abiertos y no se pueden cerrar accidentalmente
- **Indicador de cambios**: Un punto rojo aparece en tabs con cambios sin guardar
- **Scroll horizontal**: Si hay muchos tabs, puedes hacer scroll horizontal
- **Persistencia**: Los tabs se guardan automáticamente en localStorage

### 2. Navegación con Tabs

#### Creación automática de tabs:
- **Al navegar a cualquier página**, se crea automáticamente un tab
- Ejemplo: Click en "Clientes" en el sidebar → se crea un tab "Clientes"
- Ejemplo: Click en "Cuentas Corrientes" → se crea un tab "Cuentas Corrientes"

#### Abrir en nuevo tab adicional:
- **Ctrl + Click** (Windows/Linux) o **Cmd + Click** (Mac) en cualquier botón o enlace para forzar la apertura en un nuevo tab
- Útil cuando ya tienes un tab de "Clientes" abierto y quieres abrir otro recurso

#### Navegación normal:
- Click normal navega en la aplicación y crea/activa el tab correspondiente
- Si el tab ya existe, lo activa en lugar de crear uno duplicado

#### Componentes integrados:
- ✅ Lista de Facturas → Ver detalle, Nueva factura
- ✅ Lista de Clientes → Editar cliente
- ✅ Lista de Productos → Editar producto
- ✅ Sidebar → Todos los enlaces del menú

### 3. Sidebar Colapsable

El nuevo sidebar incluye:

- **Siempre visible**: Posición fija en el lado izquierdo
- **Colapsable**: Click en el botón superior para expandir/colapsar
  - Expandido: 240px de ancho (muestra iconos + texto)
  - Colapsado: 60px de ancho (solo iconos)
- **Menú de navegación**: Todos los items del menú principal:
  - 🏢 General
  - 💰 Caja
  - 🛒 Ventas
  - 📦 Compras
  - 📦 Productos
  - 👥 Clientes
  - 🔄 Sincronización
  - ⚙️ Configuración
- **Submenús expandibles**: Click en un item para ver sus sub-opciones
- **Integración con tabs**: 
  - Click normal → navegar en tab actual
  - Ctrl+Click → abrir en nuevo tab
- **Persistencia**: El estado colapsado se guarda en localStorage
- **Responsive**: El contenido principal se ajusta automáticamente

### 4. Layout Mejorado

```
┌─────────────────────────────────────────┐
│         MainBar (logo, logout)          │
├─────────────────────────────────────────┤
│         TabBar (tabs abiertos)          │
├───────┬─────────────────────────────────┤
│       │                                 │
│ Side  │    Contenido Principal          │
│ bar   │                                 │
│       │                                 │
│       │                                 │
└───────┴─────────────────────────────────┘
```

**Nota:** La barra de menú horizontal (Navbar) ha sido eliminada ya que toda la navegación está ahora en el Sidebar colapsable.

## Flujos de Uso

### Escenario 1: Navegación simple desde el sidebar

1. Inicias sesión y estás en el dashboard
2. Click en "Clientes" en el sidebar → se crea automáticamente un tab "Clientes"
3. Click en "Cuentas Corrientes" en el sidebar → se crea un tab "Cuentas Corrientes"
4. Ahora tienes 2 tabs abiertos y puedes alternar entre ellos
5. Click en cualquier tab para volver a esa vista

### Escenario 2: Facturando y corrigiendo artículo

1. Estás en "Lista de Facturas"
2. Click en "Nueva Factura" → se abre un tab "Nueva Factura"
3. Al cargar artículos, notas un error en un precio
4. **Ctrl+Click** en "Editar artículo" → se abre en nuevo tab "Artículo: XXX"
5. Corriges el precio y guardas
6. Click en el tab "Nueva Factura" para volver
7. Continúas con la factura actualizada

### Escenario 3: Comparando clientes

1. Estás en "Listado de Clientes" (ya tienes un tab abierto)
2. **Ctrl+Click** en "Editar" de "Juan Pérez" → nuevo tab "Cliente: Juan Pérez"
3. **Ctrl+Click** en "Editar" de "María García" → nuevo tab "Cliente: María García"
4. Ahora tienes 3 tabs: Listado + Juan + María
5. Alternas entre tabs para comparar información

### Escenario 4: Navegación múltiple desde sidebar

1. Click en "Clientes" en el sidebar → se crea tab "Clientes"
2. Click en "Productos" en el sidebar → se crea tab "Productos"
3. Click en "Facturas" en el sidebar → se crea tab "Facturas"
4. Ahora tienes 3 tabs y puedes alternar entre ellos
5. Si vuelves a hacer click en "Clientes", el tab existente se activa (no se duplica)

## Limitaciones

- **Máximo 10 tabs**: Al alcanzar el límite, se cierra automáticamente el tab más antiguo no anclado
- **Solo en desktop**: Los tabs y el sidebar no se muestran en rutas `/ventas/bot/*` (versión móvil)
- **Confirmación de cierre**: Si un tab tiene cambios sin guardar, se requiere confirmación para cerrarlo

## Archivos Creados/Modificados

### Nuevos archivos:
- `frontend/src/lib/stores/tabsStore.ts` - Gestión de estado de tabs
- `frontend/src/lib/stores/sidebarStore.ts` - Estado del sidebar
- `frontend/src/lib/components/TabBar.svelte` - Componente de barra de tabs
- `frontend/src/lib/utils/navigation.ts` - Utilidades de navegación con tabs

### Archivos modificados:
- `frontend/src/routes/+layout.svelte` - Layout principal con tabs y sidebar (Navbar removido)
- `frontend/src/lib/components/Sidebar.svelte` - Sidebar colapsable mejorado (reemplaza Navbar)
- `frontend/src/routes/ventas/facturas/+page.svelte` - Integración con tabs
- `frontend/src/routes/clientes/+page.svelte` - Integración con tabs
- `frontend/src/routes/productos/+page.svelte` - Integración con tabs

### Archivos obsoletos (ya no se usan):
- `frontend/src/lib/components/Navbar.svelte` - Reemplazado por el Sidebar colapsable

## Atajos de Teclado

- **Ctrl+Click / Cmd+Click**: Abrir en nuevo tab
- **Click derecho en tab**: Menú contextual
- **Enter en tab (foco)**: Activar tab

## Personalización Futura

Para agregar navegación con tabs a otros componentes:

```svelte
<script>
  import { smartNavigate } from '$lib/utils/navigation';
  
  function handleClick(event: MouseEvent) {
    const url = '/mi-ruta';
    const label = 'Mi Documento';
    const icon = '📄';
    
    smartNavigate(url, event, { label, icon, type: 'view' });
  }
</script>

<button 
  onclick={handleClick}
  title="Click para ver, Ctrl+Click para abrir en nuevo tab"
>
  Ver Documento
</button>
```

## Troubleshooting

### Los tabs no se guardan
- Verifica que localStorage esté habilitado en el navegador
- Abre la consola y busca errores relacionados con `janus314_tabs`

### El sidebar no se colapsa
- Limpia el localStorage: `localStorage.removeItem('janus314_sidebar_collapsed')`
- Recarga la página

### Los tabs duplicados no se detectan
- Verifica que las URLs sean exactamente iguales
- El sistema compara URLs completas

## Mejoras Futuras

- [ ] Drag & drop para reordenar tabs
- [ ] Atajos de teclado para cambiar tabs (Ctrl+Tab)
- [ ] Búsqueda en tabs abiertos
- [ ] Grupos de tabs
- [ ] Sesiones guardadas (conjuntos de tabs)
