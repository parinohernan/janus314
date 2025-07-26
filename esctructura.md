
## Resumen de la estructura:

### **Backend (Node.js/Express)**
- **`janus314/backend/`** - Aplicación principal del backend
  - **`src/controllers/`** - Controladores de la API
  - **`src/models/`** - Modelos de Sequelize
  - **`src/routes/`** - Rutas de la API
  - **`src/services/`** - Servicios de negocio
  - **`src/templates/pdf/`** - Plantillas para generar PDFs
  - **`src/utils/`** - Utilidades y helpers
  - **`migrations/`** - Migraciones de base de datos
  - **`seeders/`** - Datos iniciales

### **Frontend (SvelteKit)**
- **`janus314/frontend/`** - Aplicación frontend
  - **`src/routes/`** - Páginas y rutas de la aplicación
  - **`src/lib/components/`** - Componentes reutilizables
  - **`src/lib/services/`** - Servicios del frontend
  - **`src/lib/types/`** - Definiciones de tipos TypeScript
  - **`src/lib/utils/`** - Utilidades del frontend

### **Características principales:**
- **Sistema multi-tenant** con base de datos por empresa
- **Gestión de ventas** (facturas, preventas, recibos, notas de crédito)
- **Gestión de inventario** (artículos, stock, precios)
- **Gestión de clientes y proveedores**
- **Generación de PDFs** para comprobantes
- **Integración con AFIP** (Argentina)
- **Sistema de cajas** y arqueos
- **Bot de Telegram** para ventas
- **Sincronización** con sistema móvil

El proyecto es un sistema completo de gestión empresarial (ERP) desarrollado en Node.js/Express para el backend y SvelteKit para el frontend.

