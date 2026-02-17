# 📊 Panel de Control Mejorado - Janus314

## Descripción

Dashboard interactivo y moderno que muestra información en tiempo real sobre el estado del negocio, diseñado para proporcionar una experiencia acogedora y productiva al usuario.

## 🎯 Características Principales

### 1. Saludo Personalizado
- Saludo dinámico según la hora del día (Buenos días/tardes/noches)
- Muestra el nombre del usuario logueado
- Fecha actual completa
- Nombre de la empresa

### 2. Métricas del Día
Tarjetas con información instantánea:
- **Ventas del Día**: Monto total y cantidad de facturas con comparativa vs ayer
- **Ticket Promedio**: Valor promedio por factura
- **Stock Crítico**: Productos sin stock o bajo mínimo
- **Vendedores Activos**: Cantidad de vendedores con actividad hoy

### 3. Widget de Vendedores (★ NUEVO)
- Lista de todos los vendedores activos
- Estado visual con indicadores de color:
  - 🟢 Verde: Activo hoy (envió pedidos)
  - 🟡 Amarillo: Inactivo hoy pero con pendientes
  - 🔴 Rojo (badge): Con pedidos sin facturar
- Información por vendedor:
  - Último pedido con tiempo relativo ("Hoy 08:30", "Ayer", "Hace 3 días")
  - Cantidad de pedidos sin facturar
  - Detalles del último pedido (número y cliente)
- Click en vendedor para ver sus pedidos pendientes

### 4. Actividad Reciente
- Últimas 10 facturas emitidas
- Formato con fecha relativa
- Monto total por factura
- Click para ver detalle

### 5. Stock Crítico
Categorizado en dos secciones:
- **Sin Stock**: Productos con existencia ≤ 0
- **Bajo Mínimo**: Productos por debajo del stock mínimo
- Muestra hasta 10 productos por categoría
- Click para ver detalle del producto

### 6. Accesos Rápidos
Botones grandes con efecto glassmorphism para:
- Nueva Factura
- Nuevo Cliente
- Consultar Stock
- Cuentas Corrientes
- Sincronizar Datos

## 📡 Endpoints Backend

### `GET /api/dashboard/vendedores-estado`
Obtiene el estado de todos los vendedores activos.

**Respuesta:**
```json
{
  "success": true,
  "vendedores": [
    {
      "codigo": "001",
      "nombre": "Juan Pérez",
      "activo": true,
      "ultimoPedido": {
        "fecha": "2026-02-17T08:30:00Z",
        "numero": "A-0001-00000123",
        "cliente": "Cliente XYZ"
      },
      "pedidosSinFacturar": 3,
      "pedidosPendientes": [...]
    }
  ],
  "resumen": {
    "totalVendedores": 6,
    "totalActivos": 4,
    "totalPedidosPendientes": 12,
    "vendedorConMasPedidos": "Juan Pérez"
  }
}
```

### `GET /api/dashboard/resumen-dia`
Obtiene el resumen de ventas del día.

**Respuesta:**
```json
{
  "success": true,
  "ventasHoy": {
    "monto": 408775.93,
    "cantidad": 28,
    "comparativa": "12.5" // % vs ayer
  },
  "ticketPromedio": "14599.14"
}
```

### `GET /api/dashboard/stock-critico`
Obtiene productos con stock crítico.

**Respuesta:**
```json
{
  "success": true,
  "sinStock": [
    {
      "codigo": "001",
      "descripcion": "Producto ABC",
      "existencia": 0,
      "stockMinimo": 10
    }
  ],
  "bajoMinimo": [...]
}
```

### `GET /api/dashboard/actividad-reciente`
Obtiene las últimas facturas emitidas.

**Respuesta:**
```json
{
  "success": true,
  "ultimasFacturas": [
    {
      "tipo": "A",
      "sucursal": 1,
      "numero": 123,
      "fecha": "2026-02-17T10:30:00Z",
      "cliente": "Cliente ABC",
      "total": 15000
    }
  ]
}
```

### `GET /api/dashboard/graficos`
Obtiene datos para gráficos (para futuras implementaciones).

## 🎨 Componentes Creados

### `DashboardCard.svelte`
Tarjeta reutilizable para métricas con:
- Icono con gradiente
- Título y valor
- Indicador de tendencia (opcional)
- Subtítulo descriptivo
- Colores personalizables

### `VendedoresWidget.svelte`
Widget completo para mostrar el estado de vendedores:
- Lista interactiva
- Estados visuales con colores
- Información contextual
- Navegación a pedidos

### `ActividadRecienteWidget.svelte`
Muestra las últimas facturas:
- Scroll vertical
- Fechas relativas
- Formato de moneda
- Click para ver detalle

### `StockCriticoWidget.svelte`
Alerta de productos críticos:
- Categorización clara
- Badges de cantidad
- Estados visuales
- Navegación a productos

### `AccesosRapidosWidget.svelte`
Grid de acciones rápidas:
- Botones grandes e intuitivos
- Iconos con gradiente
- Hover effects
- Responsive design

## 💾 Archivos Modificados/Creados

### Backend:
- `backend/src/controllers/dashboard.controller.js` (nuevo)
- `backend/src/routes/dashboard.routes.js` (nuevo)
- `backend/src/app.js` (modificado)

### Frontend:
- `frontend/src/routes/+page.svelte` (modificado completamente)
- `frontend/src/lib/components/dashboard/DashboardCard.svelte` (nuevo)
- `frontend/src/lib/components/dashboard/VendedoresWidget.svelte` (nuevo)
- `frontend/src/lib/components/dashboard/ActividadRecienteWidget.svelte` (nuevo)
- `frontend/src/lib/components/dashboard/StockCriticoWidget.svelte` (nuevo)
- `frontend/src/lib/components/dashboard/AccesosRapidosWidget.svelte` (nuevo)
- `frontend/DASHBOARD_README.md` (nuevo)

## 🔄 Actualizaciones Automáticas

El dashboard se actualiza automáticamente cada 5 minutos para mantener la información fresca sin sobrecargar el servidor.

## 📱 Responsive Design

El dashboard está optimizado para diferentes tamaños de pantalla:
- **Desktop**: Grid completo de 4 columnas
- **Tablet**: Grid de 2 columnas
- **Mobile**: Columna única con scroll vertical

## 🎯 Interacciones

- **Click en vendedor**: Navega a sus pedidos pendientes
- **Click en factura**: Abre el detalle de la factura
- **Click en producto**: Abre la ficha del producto
- **Soporte para Ctrl+Click**: Abre en nueva pestaña (integración con tabbed workspace)

## 🚀 Futuras Mejoras

- Gráficos interactivos (ventas semanales, productos más vendidos)
- Notificaciones en tiempo real
- Personalización de widgets
- Modo compacto/expandido
- Filtros por sucursal/vendedor
- Exportación de métricas

## 🔐 Seguridad

Todos los endpoints requieren autenticación y selección de empresa mediante el middleware `getEmpresaConnection`.
