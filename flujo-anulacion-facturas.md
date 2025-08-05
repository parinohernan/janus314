# Flujo de Anulación de Facturas - Janus314

## Descripción General

La anulación de facturas en Janus314 es un proceso que marca las facturas como anuladas sin eliminarlas físicamente de la base de datos. Este proceso incluye la restauración del stock de artículos y mantiene un registro histórico completo.

## Arquitectura Multiempresas

### Contexto de Base de Datos
- **Base de Datos Maestra**: `janus314empresas` (configuración de empresas)
- **Base de Datos Específica**: Cada empresa tiene su propia base de datos
- **Conexión Dinámica**: Se establece según el JWT del usuario

## Flujo Completo de Anulación

### 1. Inicio del Proceso
```
CLIENTE → PUT /api/facturas/anular/:tipo/:sucursal/:numero
├── Headers: Authorization: Bearer <JWT>
├── Params: tipo (FAC, PRF, NCA, etc.)
├── Params: sucursal (0001, 0002, etc.)
└── Params: numero (00000001, etc.)
```

### 2. Middleware de Autenticación
```javascript
// middleware/dbConnection.js
const getEmpresaConnection = async (req, res, next) => {
  // 1. Decodificar JWT
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  // 2. Obtener configuración de empresa
  const empresaData = await Empresa.findByPk(decoded.empresaId);
  
  // 3. Conectar a base de datos específica
  const empresaDB = await DBManager.getConnectionWithConfig(empresaData);
  
  // 4. Inicializar modelos
  const models = initializeModels(empresaDB);
  
  // 5. Adjuntar al request
  req.db = empresaDB;           // Conexión específica de la empresa
  req.models = models;          // Modelos de la empresa
  req.empresaData = empresaData; // Configuración de la empresa
  req.userData = decoded;       // Datos del usuario
}
```

### 3. Controlador de Anulación
```javascript
// controllers/factura.controller.js
exports.anularFactura = async (req, res) => {
  // ✅ USAR CONEXIÓN ESPECÍFICA DE LA EMPRESA
  const t = await req.db.transaction(); // ❌ ANTES: sequelize.transaction()

  try {
    const { FacturaCabeza, FacturaItem, Articulo } = req.models;
    const { tipo, sucursal, numero } = req.params;

    // 1. Verificar existencia de la factura
    const factura = await FacturaCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      transaction: t,
    });

    // 2. Validar que no esté ya anulada
    if (factura.FechaAnulacion) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "La factura ya se encuentra anulada",
      });
    }

    // 3. ✅ Verificar que solo se puedan anular prefacturas (PRF) y notas de crédito tipo NCF
    if (tipo !== "PRF" && tipo !== "NCF") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `No se puede anular el documento tipo ${tipo}. Solo se pueden anular prefacturas (PRF) y notas de crédito tipo NCF.`,
      });
    }

    // 4. ✅ Verificar que no exista recibo asociado
    const reciboAsociado = await ReciboItem.findOne({
      where: {
        FacturaTipo: tipo,
        FacturaSucursal: sucursal,
        FacturaNumero: numero,
      },
      transaction: t,
    });

    if (reciboAsociado) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Error: primero debe anular el recibo ${reciboAsociado.DocumentoTipo}-${reciboAsociado.DocumentoSucursal}-${reciboAsociado.DocumentoNumero}`,
      });
    }

    // 5. Obtener ítems para restaurar stock
    const items = await FacturaItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      attributes: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero', 'CodigoArticulo', 'Cantidad'],
      transaction: t,
    });

    // 5. Restaurar stock de artículos
    for (const item of items) {
      // Obtener el artículo por separado para evitar problemas de relaciones
      const articulo = await Articulo.findOne({
        where: { Codigo: item.CodigoArticulo },
        attributes: ['Codigo', 'Descripcion', 'Existencia', 'ExistenciaMinima', 'ExistenciaMaxima'],
        transaction: t
      });

      if (articulo) {
        let nuevoStock;

        if (tipo === "PRF") {
          // Prefactura: devolver stock al inventario (no es documento legal)
          nuevoStock = parseFloat(articulo.Existencia) + parseFloat(item.Cantidad);
        } else if (tipo === "NCF") {
          // Nota de crédito NCF: restar stock del inventario
          nuevoStock = parseFloat(articulo.Existencia) - parseFloat(item.Cantidad);
        }

        await articulo.update(
          { Existencia: nuevoStock },
          { transaction: t }
        );
      }
    }

    // 6. ✅ Actualizar saldo del cliente si es cuenta corriente
    if (factura.PagoTipo === "CC") {
      const cliente = await Cliente.findOne({
        where: { Codigo: factura.ClienteCodigo },
        transaction: t
      });
      
      if (cliente) {
        // Restar el importe de la factura del saldo del cliente
        const nuevoSaldo = parseFloat(cliente.ImporteDeuda || 0) - parseFloat(factura.ImporteTotal || 0);
        
        await cliente.update(
          { ImporteDeuda: nuevoSaldo },
          { transaction: t }
        );
        
        console.log(`✅ Saldo del cliente ${cliente.Codigo} actualizado: ${cliente.ImporteDeuda} → ${nuevoSaldo}`);
      }
    }

    // 7. Marcar factura como anulada y poner importes en 0
    await factura.update(
      {
        FechaAnulacion: new Date(),
        ImporteTotal: 0,        // ✅ Poner importe total en 0
        ImportePagado: 0,       // ✅ Poner importe pagado en 0
        ImporteBruto: 0,        // ✅ Poner importe bruto en 0
        ImporteNeto: 0,         // ✅ Poner importe neto en 0
        ImporteIva1: 0,         // ✅ Poner importe IVA en 0
        ImporteIva2: 0,         // ✅ Poner importe IVA en 0
        ImporteAdicional: 0,    // ✅ Poner importe adicional en 0
        ImporteBonificado: 0,   // ✅ Poner importe bonificado en 0
        ImportePercepcionIIBB: 0 // ✅ Poner importe percepción en 0
      },
      { transaction: t }
    );

    // 8. Confirmar transacción
    await t.commit();

    res.json({
      success: true,
      message: "Factura anulada correctamente",
    });
  } catch (error) {
    await t.rollback();
    console.error("Error al anular factura:", error);
    res.status(500).json({
      success: false,
      message: "Error al anular factura",
      error: error.message,
    });
  }
};
```

## 4. Tipos de Documentos que se Pueden Anular

### Documentos Anulables
- **PRF**: Prefactura (no es documento legal)
- **NCF**: Nota de Crédito tipo NCF

### Documentos NO Anulables
- **FAC**: Factura A (documento legal)
- **FCB**: Factura B (documento legal)
- **FCC**: Factura C (documento legal)
- **NCA**: Nota de Crédito A (documento legal)
- **NCB**: Nota de Crédito B (documento legal)
- **NCC**: Nota de Crédito C (documento legal)

## 5. Lógica de Restauración de Stock

### Para Prefacturas (PRF)
```javascript
// Al anular una prefactura, el stock se devuelve al inventario
nuevoStock = stockActual + cantidadPrefacturada
```

### Para Notas de Crédito tipo NCF
```javascript
// Al anular una nota de crédito NCF, el stock se resta del inventario
nuevoStock = stockActual - cantidadNotaCredito
```

### Validaciones de Datos Numéricos
```javascript
// ✅ Validar que los valores sean números válidos
const existenciaActual = parseFloat(articulo.Existencia) || 0;
const cantidad = parseFloat(item.Cantidad) || 0;

if (isNaN(existenciaActual) || isNaN(cantidad)) {
  throw new Error(`Valores inválidos para artículo ${articulo.Codigo}: existencia=${articulo.Existencia}, cantidad=${item.Cantidad}`);
}

// ✅ Validar que el nuevo stock sea un número válido
if (isNaN(nuevoStock)) {
  throw new Error(`Error al calcular nuevo stock para artículo ${articulo.Codigo}`);
}
```

### Manejo de Valores Nulos/Undefined
- **Existencia**: Si es `null` o `undefined`, se convierte a `0`
- **Cantidad**: Si es `null` o `undefined`, se convierte a `0`
- **Resultado**: Si el cálculo produce `NaN`, se lanza un error descriptivo

### Manejo de Existencias Negativas
- **Existencia negativa**: Se permite (ej: -15 significa que faltan 15 unidades)
- **Cálculo correcto**: Si existencia = -15 y cantidad = 10, nuevo stock = -5
- **Advertencia**: Se registra un warning si el stock es muy negativo (< -1000)
- **Log detallado**: Se indica si el resultado es positivo o negativo

## 6. Manejo de Existencias Negativas

### Concepto de Stock Negativo
En sistemas de inventario, una existencia negativa indica que se han vendido más unidades de las que estaban disponibles en stock. Esto puede suceder por:
- Ventas realizadas sin verificación previa de stock
- Errores en el sistema de inventario
- Ventas a crédito con entrega diferida

### Ejemplos de Cálculo con Stock Negativo

#### Caso 1: Anular Prefactura con Stock Negativo
```javascript
// Existencia actual: -15 (faltan 15 unidades)
// Cantidad en prefactura: 10 unidades
// Al anular: nuevoStock = -15 + 10 = -5
// Resultado: Ahora faltan solo 5 unidades
```

#### Caso 2: Anular Nota de Crédito NCF con Stock Negativo
```javascript
// Existencia actual: -5 (faltan 5 unidades)
// Cantidad en nota de crédito: 8 unidades
// Al anular: nuevoStock = -5 - 8 = -13
// Resultado: Ahora faltan 13 unidades
```

### Validaciones Implementadas
```javascript
// ✅ Permitir stock negativo pero con advertencia
if (nuevoStock < -1000) {
  console.warn(`⚠️ Stock muy negativo para artículo ${articulo.Codigo}: ${nuevoStock}`);
}

// ✅ Log detallado del resultado
console.log(`✅ Actualizando stock: ${existenciaActual} + ${cantidad} = ${nuevoStock} (${nuevoStock >= 0 ? 'positivo' : 'negativo'})`);
```

### Consideraciones de Negocio
- **Stock negativo es válido** en sistemas de venta a crédito
- **Indica unidades faltantes** que deben reponerse
- **Facilita el seguimiento** de compromisos de entrega
- **Permite continuar operaciones** sin bloquear ventas

## 7. Actualización del Saldo del Cliente

### Tipos de Pago que Aplican Saldo
- **CC**: Cuenta Corriente - Aplica saldo al cliente
- **CO**: Contado - No aplica saldo

### Lógica de Actualización
```javascript
// Solo actualizar saldo si es cuenta corriente
if (factura.PagoTipo === "CC") {
  const cliente = await Cliente.findOne({
    where: { Codigo: factura.ClienteCodigo },
    transaction: t
  });
  
  if (cliente) {
    // Restar el importe de la factura del saldo del cliente
    const nuevoSaldo = parseFloat(cliente.ImporteDeuda || 0) - parseFloat(factura.ImporteTotal || 0);
    
    await cliente.update(
      { ImporteDeuda: nuevoSaldo },
      { transaction: t }
    );
  }
}
```

### Campos Involucrados
- **Cliente.ImporteDeuda**: Saldo actual del cliente
- **Factura.ImporteTotal**: Importe total de la factura a anular
- **Factura.PagoTipo**: Tipo de pago (CC = Cuenta Corriente)

## 8. Manejo de Facturas Anuladas en Cuenta Corriente

### Problema Identificado
Las facturas anuladas aparecían en el detalle de cuenta corriente con sus importes originales, lo que causaba confusión en el saldo del cliente.

### Solución Implementada

#### 1. Excluir Facturas Anuladas del Detalle
```javascript
// ✅ En el controlador de cliente
const facturas = await FacturaCabeza.findAll({
  where: { 
    ClienteCodigo: id,
    FechaAnulacion: null // ✅ Excluir facturas anuladas
  },
  // ... resto de la consulta
});
```

#### 2. Poner Importes en 0 al Anular
```javascript
// ✅ Al anular la factura, poner todos los importes en 0
await factura.update({
  FechaAnulacion: new Date(),
  ImporteTotal: 0,        // ✅ Importe total en 0
  ImportePagado: 0,       // ✅ Importe pagado en 0
  ImporteBruto: 0,        // ✅ Importe bruto en 0
  ImporteNeto: 0,         // ✅ Importe neto en 0
  ImporteIva1: 0,         // ✅ Importe IVA en 0
  ImporteIva2: 0,         // ✅ Importe IVA en 0
  ImporteAdicional: 0,    // ✅ Importe adicional en 0
  ImporteBonificado: 0,   // ✅ Importe bonificado en 0
  ImportePercepcionIIBB: 0 // ✅ Importe percepción en 0
});
```

### Beneficios de la Solución
- ✅ **Detalle de cuenta corriente limpio**: No aparecen facturas anuladas
- ✅ **Saldo correcto**: Los importes anulados no afectan el saldo
- ✅ **Consistencia de datos**: Facturas anuladas tienen importes en 0
- ✅ **Trazabilidad**: Se mantiene la fecha de anulación para auditoría

## 9. Estructura de Base de Datos

### Tablas Involucradas
```sql
-- Base de datos específica de la empresa
USE empresa_especifica_db;

-- Tabla principal de facturas
facturacabeza
├── DocumentoTipo (FAC, PRF, NCA, etc.)
├── DocumentoSucursal (0001, 0002, etc.)
├── DocumentoNumero (00000001, etc.)
├── FechaAnulacion (NULL = activa, DATE = anulada)
├── PagoTipo (CC = Cuenta Corriente, CO = Contado)
├── ImporteTotal (importe de la factura)
└── ... otros campos

-- Tabla de ítems de factura
facturaitems
├── DocumentoTipo
├── DocumentoSucursal
├── DocumentoNumero
├── Cantidad
└── ... otros campos

-- Tabla de artículos (para stock)
articulos
├── Codigo
├── Existencia (stock actual)
└── ... otros campos

-- Tabla de clientes (para saldo)
t_clientes
├── Codigo
├── ImporteDeuda (saldo actual del cliente)
└── ... otros campos

-- Tabla de ítems de recibo (para validación)
recibositems
├── DocumentoTipo (tipo del recibo)
├── DocumentoSucursal (sucursal del recibo)
├── DocumentoNumero (número del recibo)
├── FacturaTipo (tipo de factura asociada)
├── FacturaSucursal (sucursal de factura asociada)
├── FacturaNumero (número de factura asociada)
└── ImportePagado
```

## 10. Validaciones del Proceso

### Validaciones Previas
1. **Existencia de la factura**: Verificar que la factura existe
2. **Estado de anulación**: Verificar que no esté ya anulada
3. **Tipo de documento anulable**: Verificar que sea PRF o NCF
4. **Recibo asociado**: Verificar que no exista un recibo asociado a la factura
5. **Permisos del usuario**: Verificar JWT válido
6. **Empresa activa**: Verificar que la empresa esté activa

### Validaciones de Negocio
1. **Stock disponible**: Para notas de crédito, verificar stock suficiente
2. **Integridad referencial**: Verificar que los ítems existan
3. **Consistencia de datos**: Verificar que los artículos estén activos
4. **Valores numéricos válidos**: Verificar que existencia y cantidad sean números válidos
5. **Cálculo de stock**: Validar que el nuevo stock sea un número válido

## 11. Manejo de Errores

### Errores Comunes
```javascript
// Error de conexión incorrecta (PROBLEMA CORREGIDO)
"Table 'janus314empresas.facturacabeza' doesn't exist"
// ✅ SOLUCIÓN: Usar req.db en lugar de sequelize

// Error de factura no encontrada
{
  success: false,
  message: "Factura no encontrada"
}

// Error de factura ya anulada
{
  success: false,
  message: "La factura ya se encuentra anulada"
}

// Error de recibo asociado
{
  success: false,
  message: "Error: primero debe anular el recibo REC-0001-00000001"
}

// Error de tipo de documento no anulable
{
  success: false,
  message: "No se puede anular el documento tipo FAC. Solo se pueden anular prefacturas (PRF) y notas de crédito tipo NCF."
}

// Error de valores inválidos en stock
{
  success: false,
  message: "Valores inválidos para artículo 495: existencia=null, cantidad=undefined"
}

// Error de relación mal configurada (PROBLEMA CORREGIDO)
"Unknown column 'FacturaItem.FacturaCabezaDocumentoTipo' in 'field list'"
// ✅ SOLUCIÓN: Configurar correctamente las relaciones en modelInitializer.js

// Error de transacción
{
  success: false,
  message: "Error al anular factura",
  error: error.message
}
```

### Rollback Automático
```javascript
try {
  // Operaciones de anulación
  await t.commit();
} catch (error) {
  await t.rollback(); // ✅ Rollback automático en caso de error
  throw error;
}
```

## 12. Logs y Auditoría

### Logs del Proceso
```javascript
console.log('🔄 Inicializando conexión para ruta:', req.path);
console.log('📦 Empresa:', empresaData.nombre);
console.log('📦 vendedor:', req.body.Vendedor);
console.log('✅ Modelos inicializados correctamente');
console.log(`✅ Saldo del cliente ${cliente.Codigo} actualizado: ${cliente.ImporteDeuda} → ${nuevoSaldo}`);
console.log(`✅ Actualizando stock: ${existenciaActual} + ${cantidad} = ${nuevoStock} (${nuevoStock >= 0 ? 'positivo' : 'negativo'})`);
console.error('Error al anular factura:', error);
```

### Información de Auditoría
- **Usuario que anuló**: Extraído del JWT
- **Fecha de anulación**: Timestamp automático
- **Empresa**: Contexto de la empresa
- **Transacción**: ID de transacción para trazabilidad

## 13. Frontend - Interfaz de Usuario

### Componente de Anulación
```javascript
// routes/ventas/facturas/[tipo]/[sucursal]/[numero]/+page.svelte
const anularFactura = async () => {
  if (!confirm('¿Está seguro que desea anular esta factura?')) {
    return;
  }
  
  try {
    const response = await fetch(
      `${PUBLIC_API_URL}/facturas/anular/${tipo}/${sucursal}/${numero}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Error al anular la factura');
    }
    
    alert('Factura anulada correctamente');
  } catch (err) {
    console.error('Error anulando factura:', err);
    alert(err.message);
  }
};
```

## 14. Consideraciones de Seguridad

### Validación de JWT
- Verificar token en cada request
- Extraer empresaId del token
- Validar que la empresa esté activa

### Aislamiento de Datos
- Cada empresa solo puede anular sus propias facturas
- Conexión específica por empresa
- No hay posibilidad de acceder a datos de otras empresas

### Transacciones
- Uso de transacciones para garantizar consistencia
- Rollback automático en caso de error
- No se pueden anular facturas parcialmente

## 15. Performance y Optimización

### Pool de Conexiones
```javascript
// Configuración optimizada del pool
pool: {
  max: 10,
  min: 2,
  acquire: 60000,
  idle: 30000,
  evict: 60000
}
```

### Cache de Configuración
- Cache de configuración de empresas en Redis
- Reducción de consultas a la base de datos maestra
- Invalidación automática en caso de error

### Consultas Optimizadas
- Uso de índices en DocumentoTipo, DocumentoSucursal, DocumentoNumero
- Inclusión de modelos relacionados en una sola consulta
- Transacciones para operaciones múltiples

## 16. Resumen del Flujo

```
1. CLIENTE → Request de anulación
2. MIDDLEWARE → Autenticación y conexión a BD específica
3. CONTROLLER → Validaciones y lógica de negocio
4. VALIDACIÓN → Verificar tipo de documento anulable (PRF/NCF)
5. VALIDACIÓN → Verificar que no exista recibo asociado
6. DATABASE → Transacción con rollback automático
7. STOCK → Restauración de inventario
8. SALDO → Actualización del saldo del cliente (si es CC)
9. FACTURA → Marcado como anulada
10. COMMIT → Confirmación de transacción
11. RESPONSE → Respuesta al cliente
```

## 17. Corrección del Error Principal

### Problema Identificado
El controlador estaba usando `sequelize.transaction()` que apunta a la base de datos maestra (`janus314empresas`) en lugar de la base de datos específica de la empresa.

### Solución Implementada
```javascript
// ❌ ANTES (INCORRECTO)
const t = await sequelize.transaction();

// ✅ DESPUÉS (CORRECTO)
const t = await req.db.transaction();
```

### Resultado
- ✅ Las consultas ahora se ejecutan en la base de datos correcta
- ✅ Cada empresa solo puede anular sus propias facturas
- ✅ Aislamiento total de datos entre empresas
- ✅ Funcionalidad de anulación completamente operativa

## 18. Configuración de Modelos y Relaciones

### Problema de Relaciones Mal Configuradas
El error `"Unknown column 'FacturaItem.FacturaCabezaDocumentoTipo' in 'field list'"` se debía a relaciones mal configuradas entre `FacturaCabeza` y `FacturaItem`.

### Solución Implementada
```javascript
// ✅ Configuración correcta en modelInitializer.js
// Relación FacturaCabeza -> FacturaItem
FacturaCabeza.hasMany(FacturaItem, {
  foreignKey: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
  sourceKey: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero']
});

// Relación FacturaItem -> FacturaCabeza
FacturaItem.belongsTo(FacturaCabeza, {
  foreignKey: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
  targetKey: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero']
});

// Relación FacturaItem -> Articulo
FacturaItem.belongsTo(Articulo, {
  foreignKey: 'CodigoArticulo',
  targetKey: 'Codigo'
});
```

### Evitar Dependencias Circulares
- Las relaciones se definen en `modelInitializer.js` en lugar de en los modelos individuales
- Se evitan importaciones circulares entre `FacturaCabeza` y `FacturaItem`
- Se centraliza la configuración de relaciones para mayor consistencia

### Solución para Consultas con Include
Para evitar problemas con campos automáticos generados por Sequelize, se realizan consultas separadas:
```javascript
// ❌ ANTES: Consulta con include que genera campos automáticos
const items = await FacturaItem.findAll({
  include: [{ model: Articulo }]
});

// ✅ DESPUÉS: Consultas separadas para evitar problemas de relaciones
const items = await FacturaItem.findAll({
  attributes: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero', 'CodigoArticulo', 'Cantidad']
});

for (const item of items) {
  const articulo = await Articulo.findOne({
    where: { Codigo: item.CodigoArticulo },
    attributes: ['Codigo', 'Descripcion', 'Existencia', 'ExistenciaMinima', 'ExistenciaMaxima']
  });
}
``` 