const { Model, DataTypes, Op } = require('sequelize');
const masterDB = require('../config/masterDB');

class WikiArticulo extends Model {}

WikiArticulo.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    slug: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true
    },
    titulo: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    categoria: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'General'
    },
    resumen: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    contenido: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    publicado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    autor: {
      type: DataTypes.STRING(80),
      allowNull: true
    }
  },
  {
    sequelize: masterDB.getConnection(),
    modelName: 'WikiArticulo',
    tableName: 'wiki_articulos',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [
      { fields: ['categoria'] },
      { fields: ['publicado'] }
    ]
  }
);

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

const ARTICULOS_SISTEMA = [
  {
    slug: 'exportar-detalle-ventas-cliente-pdf',
    titulo: 'Cómo exportar el detalle de ventas y notas de crédito de un cliente (PDF)',
    categoria: 'Informes',
    resumen:
      'Pasos para descargar el PDF con facturas, notas de crédito y total neto de un cliente.',
    contenido: `# Cómo exportar el detalle de ventas y notas de crédito de un cliente (PDF)

Cuando un cliente te pide el detalle de sus compras (y devoluciones) en un período, podés generar un PDF desde el ERP y enviárselo por mail o WhatsApp.

El informe incluye **facturas**, **notas de credito** y el **total neto** (ventas - NC).

## Pasos

1. Entrá a **Informes → Clientes** (ruta: \`/ventas/informes/clientes\`).
2. Elegí **Fecha Desde** y **Fecha Hasta**.
3. Opcional: filtrá por localidad, vendedor o categoría IVA.
4. Presioná **Buscar**.
5. En la lista vas a ver por cliente: facturas, ventas, **NC** y **Neto**.
6. En la fila del cliente, usá **Exportar Detalle**.
7. Se descarga un PDF con:
   - Datos del cliente
   - Resumen: total facturas, total NC, total neto e IVA
   - Listado de facturas del período
   - Listado de notas de crédito del período (con factura relacionada si existe)

También podés abrir **Ver Detalle** (ahí ves facturas y NC) y exportar desde el modal.

## Qué muestra el neto

- **Ventas**: suma de facturas no anuladas del período
- **NC**: suma de notas de crédito no anuladas del período
- **Neto**: Ventas - NC

Si un cliente solo tiene notas de crédito (sin facturas) en el período, igual aparece en el listado.

## Tips

- El PDF es por **un cliente** y el **período** elegido.
- No hace falta que el cliente tenga usuario en el ERP: vos descargás y se lo enviás.
- Si no aparece el cliente, revisá fechas y filtros.
- Las facturas o NC **anuladas** no se incluyen.

## Relacionado

- Informe: Ventas por Clientes
- Pantalla: \`/ventas/informes/clientes\`
`,
    publicado: true,
    autor: 'sistema'
  },
  {
    slug: 'como-crear-un-cliente',
    titulo: 'Cómo crear un cliente',
    categoria: 'Clientes',
    resumen: 'Pasos para dar de alta un cliente nuevo desde el listado de clientes.',
    contenido: `# Cómo crear un cliente

Alta de un cliente nuevo en el ERP para poder facturarlo y llevar su cuenta corriente.

## Pasos

1. Entrá a **Clientes → Listado** (ruta: \`/clientes\`).
2. Presioná **Nuevo Cliente** (abre \`/clientes/nuevo\`).
3. Completá los **campos obligatorios** (marcados con *):
   - **Código**: identificador del cliente (máx. 8 caracteres). Si lo dejás vacío, el sistema puede autogenerarlo según la configuración.
   - **Razón Social**
   - **Categoría IVA**
   - **CUIT**
   - **Calle** y **Número**
   - **Provincia**
   - **Localidad** (selector de código postal/localidad)
   - **Vendedor**
   - **Lista de Precio**
4. Opcional pero recomendado:
   - Nombre fantasía
   - Teléfono / celular / email
   - Contacto comercial
   - Límite de crédito
   - Dirección de entrega
5. Dejá el cliente **Activo** tildado.
6. Presioná **Guardar**.

Si todo está bien, vuelve al listado y el cliente ya queda disponible para preventas, facturas y recibos.

## Tips

- El **código** no se puede cambiar después de crear el cliente.
- La **localidad** se toma del catálogo de localidades; al elegir el código postal se completa el nombre.
- Si falta un obligatorio, el formulario marca el error y no guarda.
- Para editar uno existente: desde el listado abrí el cliente y modificá los datos.

## Relacionado

- Pantalla: \`/clientes\`
- Alta: \`/clientes/nuevo\`
`,
    publicado: true,
    autor: 'sistema'
  },
  {
    slug: 'como-crear-un-proveedor',
    titulo: 'Cómo crear un proveedor',
    categoria: 'Compras',
    resumen: 'Pasos para dar de alta un proveedor nuevo desde Compras → Proveedores.',
    contenido: `# Cómo crear un proveedor

Alta de un proveedor para compras, órdenes de compra y cuenta corriente de proveedores.

## Pasos

1. Entrá a **Compras → Proveedores** (ruta: \`/compras/proveedores\`).
2. Presioná **Nuevo Proveedor** (abre \`/compras/proveedores/nuevo\`).
3. Completá al menos:
   - **Código** * (máx. 8 caracteres; no se puede cambiar después)
   - **Descripción** * (nombre / razón social)
4. Completá el resto según necesites:
   - **CUIT**
   - Dirección: calle, número, piso, departamento, localidad/código postal
   - Contacto: teléfono, email, contacto comercial
   - Datos comerciales (condición de venta, tipo de proveedor, etc. si aplica)
5. Presioná **Guardar**.

Al guardar correctamente, el sistema te lleva de nuevo al listado de proveedores.

## Tips

- El **código** es obligatorio y queda fijo una vez creado.
- La **descripción** también es obligatoria.
- CUIT, dirección y contacto son opcionales, pero conviene cargarlos para reportes y pagos.
- Para editar: abrí el proveedor desde el listado.

## Relacionado

- Pantalla: \`/compras/proveedores\`
- Alta: \`/compras/proveedores/nuevo\`
`,
    publicado: true,
    autor: 'sistema'
  },
  {
    slug: 'configurar-sincronizacion-moviles',
    titulo: 'Cómo configurar la sincronización con móviles',
    categoria: 'Sincronizacion',
    resumen:
      'Cómo conectar el ERP con la base de datos de preventas (móviles): servidor, puerto, usuario y prueba de conexión.',
    contenido: `# Cómo configurar la sincronización con móviles

Antes de actualizar datos o descargar preventas, el ERP necesita saber cómo conectarse a la **base de datos de preventas** (la que usan las apps móviles).

Sin esta configuración completa, **Actualizar Datos** y **Descargar Preventas** van a fallar.

## Para qué sirve

- Definir servidor, puerto, nombre de base, usuario y contraseña de la BD de preventas.
- Verificar que la conexión funciona y que existen las tablas necesarias.
- Ver cuántas preventas hay pendientes de descargar.

## Pasos

1. Entrá a **Sincronizar Móviles → Configuración** (ruta: \`/sincronizacion/configuracion\`).
2. Completá:
   - **Servidor** (ej.: \`localhost\` o la IP del servidor MySQL)
   - **Puerto** (por defecto \`3306\`)
   - **Base de Datos** (ej.: \`db_preventas\`)
   - **Usuario**
   - **Contraseña**
3. Presioná **Guardar**.
4. Presioná **Verificar conexión** para comprobar que el ERP llega a esa base.

Si la verificación es exitosa, el sistema confirma la conexión y puede informar tablas existentes/faltantes y preventas pendientes.

## Tips

- Todos los campos son obligatorios (incluido el password).
- El puerto debe ser un número entre 1 y 65535.
- Si la conexión falla, revisá red, firewall, usuario/clave y que MySQL acepte conexiones remotas antes de seguir.
- Orden recomendado: **Configurar → Actualizar Datos → Descargar Preventas**.

## Relacionado

- Pantalla: \`/sincronizacion/configuracion\`
- Guía: Actualizar datos hacia los móviles
- Guía: Descargar preventas desde los móviles
`,
    publicado: true,
    autor: 'sistema'
  },
  {
    slug: 'actualizar-datos-moviles',
    titulo: 'Cómo actualizar datos hacia los móviles',
    categoria: 'Sincronizacion',
    resumen:
      'Envía artículos, clientes y vendedores del ERP a la base de preventas para que las apps móviles tengan el catálogo al día.',
    contenido: `# Cómo actualizar datos hacia los móviles

Esta pantalla copia del **ERP hacia la base de preventas** los datos que necesitan los preventistas en el celular: artículos, clientes y vendedores.

## Para qué sirve

- Dejar precios, stock y artículos activos actualizados en el móvil.
- Sincronizar clientes (altas, cambios de lista, vendedor, etc.).
- Actualizar el listado de vendedores disponibles en la app.

El proceso **borra y vuelve a copiar** esos catálogos en la BD de preventas (no modifica las preventas ya cargadas en el móvil).

## Cuándo usarlo

- Después de altas o cambios importantes de artículos, precios, clientes o vendedores.
- Idealmente **antes** de que los preventistas salgan a ruta.
- Siempre con la **configuración de sincronización** ya guardada y verificada.

## Pasos

1. Entrá a **Sincronizar Móviles → Actualizar Datos** (ruta: \`/sincronizacion/actualizar-datos\`).
2. Revisá la fecha de **Última Actualización** (si nunca se hizo, va a decir que no hay ninguna).
3. Presioná el botón para **iniciar la actualización**.
4. El sistema ejecuta, en orden:
   1. Verificar configuración
   2. Actualizar artículos
   3. Actualizar clientes
   4. Actualizar vendedores
   5. Finalizar (guarda la fecha de última actualización)
5. Esperá a que todos los pasos queden en verde / estado completado.

Si algún paso falla, se detiene ahí: corregí el error (casi siempre configuración o conexión) y volvé a intentar.

## Tips

- No hace falta actualizar cada 5 minutos: usalo cuando haya cambios relevantes en el ERP.
- Si falla en "verificar configuración", andá primero a **Configuración** y completá/verificá la conexión.
- Solo se copian artículos **activos** del ERP.
- La fecha de última actualización queda guardada en la configuración de la empresa.

## Relacionado

- Pantalla: \`/sincronizacion/actualizar-datos\`
- Guía: Configurar la sincronización con móviles
- Guía: Descargar preventas desde los móviles
`,
    publicado: true,
    autor: 'sistema'
  },
  {
    slug: 'descargar-preventas-desde-moviles',
    titulo: 'Cómo descargar preventas desde los móviles',
    categoria: 'Sincronizacion',
    resumen:
      'Importa al ERP las preventas cargadas en la app móvil, las numera como PRV y las saca de la cola de la base de preventas.',
    contenido: `# Cómo descargar preventas desde los móviles

Esta pantalla trae al **ERP** las preventas que los preventistas cargaron en el celular (base de preventas).

## Para qué sirve

- Importar pedidos/preventas hechos en ruta.
- Asignarles número de documento tipo **PRV** en el ERP.
- Dejarlas disponibles en el sistema para facturar o gestionar después.
- Limpiar esas preventas de la cola en la BD de preventas (una vez descargadas no quedan pendientes ahí).

## Cuándo usarlo

- Al cierre del día, al volver de ruta, o cuando haya preventas pendientes.
- Con la configuración de sincronización correcta.
- Recomendado: haber **actualizado datos** antes (así el móvil trabajó con catálogo al día); la descarga en sí importa lo ya cargado.

## Pasos

1. Entrá a **Sincronizar Móviles → Descargar Preventas** (ruta: \`/sincronizacion/preventas\`).
2. Revisá la fecha de **Última Descarga**.
3. Presioná **Iniciar Descarga**.
4. Esperá el resultado:
   - Si hay pendientes: indica cuántas preventas se procesaron.
   - Si no había ninguna: el mensaje dice que la descarga terminó y **no había preventas pendientes** (no es un error).

## Tips

- Cantidad \`0\` = no había nada pendiente; no hace falta repetir de inmediato.
- Si falla por configuración o conexión, andá a **Configuración**, guardá y verificá la conexión.
- Necesitás estar autenticado; si la sesión expiró, volvé a iniciar sesión.
- Después de descargar, las preventas quedan en el ERP listas para el circuito de ventas/facturación.

## Relacionado

- Pantalla: \`/sincronizacion/preventas\`
- Guía: Configurar la sincronización con móviles
- Guía: Actualizar datos hacia los móviles
`,
    publicado: true,
    autor: 'sistema'
  },
  {
    slug: 'que-son-las-preventas-y-como-facturarlas',
    titulo: 'Qué son las preventas, de dónde vienen y cómo facturarlas',
    categoria: 'Ventas',
    resumen:
      'Qué es una preventa (PRV), de dónde entra al ERP (móviles o alta manual) y cómo facturarla desde el listado.',
    contenido: `# Qué son las preventas, de dónde vienen y cómo facturarlas

Una **preventa** es un pedido de venta previo: el preventista (o alguien en oficina) carga lo que el cliente quiere comprar **antes** de emitir la factura fiscal.

En el ERP el documento es tipo **PRV** (sucursal + número). Sirve de base para facturar después, sin volver a tipear cliente e ítems.

## De dónde vienen

Hay dos orígenes habituales:

### 1. Desde los móviles (lo más común)

1. El preventista carga el pedido en la app móvil.
2. En el ERP: **Sincronizar Móviles → Descargar Preventas** (\`/sincronizacion/preventas\`).
3. El sistema importa las preventas a la empresa, les asigna número **PRV** y las deja en el listado.

Si todavía no configuraste la conexión a la BD de preventas, primero usá **Configuración** y, cuando haga falta, **Actualizar Datos** (catálogo hacia el móvil).

### 2. Alta manual en el ERP

1. Entrá a **Ventas → Preventas** (\`/ventas/preventas\`).
2. Presioná **Nueva Preventa** (\`/ventas/preventas/nueva\`).
3. Completá cliente, vendedor, ítems y guardá.

Queda una preventa **Pendiente**, igual que las descargadas del móvil.

## Dónde se ven

Listado principal: **Ventas → Preventas** (\`/ventas/preventas\`).

Por defecto filtra **Solo pendientes**. Podés filtrar por cliente, vendedor(es) y fechas.

### Estados

| Estado | Significado |
|--------|-------------|
| **Pendiente** | Todavía no facturada ni anulada |
| **Facturada** | Ya tiene factura vinculada |
| **Devolución** | Se generó nota de crédito (devolución) desde la preventa |
| **Anulada** | Se anuló; no se puede facturar |

Al facturar, la preventa **no se borra ni se anula**: queda **vinculada** a la factura (tipo, sucursal y número) y pasa a **Facturada**.

## Cómo facturarlas

1. Entrá a **Ventas → Preventas**.
2. Asegurate de ver la preventa (si no aparece, desmarcá "solo pendientes" o ajustá filtros).
3. En la fila, usá la acción verde **Facturar** (no disponible si está anulada).
4. Se abre **Nueva factura** con la preventa precargada (\`/ventas/facturas/nueva?preventa=PRV/...\`):
   - Cliente
   - Observación
   - Forma de pago
   - Ítems y cantidades
5. Si los precios del ERP cambiaron respecto a la preventa, puede aparecer un aviso para elegir precios actuales o los de la preventa.
6. Elegí el **Tipo de Documento** según el cliente (por ejemplo prefatura **PRF**, factura A **FCA**, factura B **FCB**, según categoría IVA).
7. Revisá totales y **Guardá**.
8. Si corresponde, seguí el flujo de **CAE** e impresión.

Al guardar, el sistema asocia esa factura a la preventa: en el listado pasa a **Facturada**.

## Otras acciones útiles

- **Nota de crédito (devolución):** desde la misma fila, acción de NC rápida. Sirve para devoluciones vinculadas a la preventa; el estado puede quedar en **Devolución**.
- **Anular:** marca la preventa como anulada (no la borra). No se puede facturar después.
- **Informes / selección múltiple:** en el listado podés marcar varias y generar resúmenes e impresión según las opciones de la pantalla.

## Flujo resumido

1. (Opcional) Actualizar catálogo a los móviles.
2. Preventista carga pedidos en el móvil **o** se carga una preventa en el ERP.
3. **Descargar Preventas** (si vinieron del móvil).
4. En **Ventas → Preventas**, revisar pendientes.
5. **Facturar** cada una (o gestionar NC / anulación si aplica).

## Tips

- "Solo pendientes" es el filtro por defecto: las ya facturadas no se ven hasta que lo desmarques.
- Facturar desde la preventa evita errores de tipeo y mantiene trazabilidad (qué factura salió de qué PRV).
- Si no llegan preventas del móvil, revisá la guía de descarga y la configuración de sincronización.
- Una preventa anulada no se factura: hay que cargar otra o corregir el circuito operativo.

## Relacionado

- Listado: \`/ventas/preventas\`
- Alta: \`/ventas/preventas/nueva\`
- Factura desde preventa: \`/ventas/facturas/nueva?preventa=...\`
- Descarga móviles: \`/sincronizacion/preventas\`
- Guías: Configurar sincronización, Actualizar datos, Descargar preventas
`,
    publicado: true,
    autor: 'sistema'
  },
  {
    slug: 'como-crear-una-factura',
    titulo: 'Cómo crear una factura',
    categoria: 'Ventas',
    resumen:
      'Pasos para emitir una factura desde cero: cliente, tipo de documento, ítems, forma de pago, CAE e impresión.',
    contenido: `# Cómo crear una factura

Emisión de una factura de venta en el ERP, desde el listado o precargada desde una preventa.

## Para qué sirve

- Facturar una venta al mostrador o por teléfono (sin preventa).
- Completar el circuito cuando ya tenés una **preventa** pendiente.
- Generar prefatura (**PRF**) o factura fiscal (**FCA** / **FCB**) según el cliente.

## Cómo llegar

1. Entrá a **Ventas → Facturas** (ruta: \`/ventas/facturas\`).
2. Presioná **Nueva Factura** (abre \`/ventas/facturas/nueva\`).

## Pasos (factura desde cero)

### 1. Datos de la factura

1. Elegí el **Cliente** * (buscá con al menos 2 caracteres y seleccioná de la lista).
2. Elegí el **Tipo de Documento** *:
   - **PRF** (Prefactura): siempre disponible.
   - **FCA** (Factura A): si el cliente es Responsable Inscripto o Monotributo.
   - **FCB** (Factura B): si el cliente es Consumidor Final o Exento.
3. Al elegir el tipo, el sistema completa **Sucursal - Número** (solo lectura). Si necesitás refrescar el próximo número, usá **Actualizar**.
4. Elegí la **Forma de Pago** (obligatoria al guardar).
5. Opcional: **Lista de Precios** (Lista 1 a 5; por defecto Lista 1), **Fecha**, y en **Detalles adicionales**:
   - **Observación**
   - **Vendedor** (si el cliente tiene vendedor, se precarga)

### 2. Artículos

1. Buscá el **Artículo** (mínimo 2 caracteres).
2. Indicá **Cantidad** y, si aplica, **% Desc.**
3. Presioná **Agregar**.
4. Repetí hasta cargar todos los renglones.
5. Revisá los totales (bruto, neto, IVA, total).

En la grilla podés editar o eliminar renglones. Si un artículo tiene cantidad mayor a la existencia, la fila se marca en rojo (es una **advertencia**: no bloquea el guardado).

### 3. Guardar

1. Presioná **Guardar Factura**.
2. Si falta cliente, tipo, forma de pago o no hay ítems, el sistema avisa y no guarda.
3. Si hay un renglón en edición, terminá de editarlo antes de guardar.

## Qué pasa después de guardar

1. Se confirma que la factura quedó guardada.
2. Si el tipo **no es PRF** (por ejemplo FCA/FCB), se abre el proceso de **autorización AFIP** para pedir el **CAE**.
3. Luego (o de inmediato si es PRF) aparece la pregunta de **impresión**:
   - **Sí, imprimir** → abre la impresión del comprobante.
   - **No, cancelar** → vuelve al listado de facturas.

Si el CAE falló o lo dejaste para después, desde el listado de facturas podés usar **Obtener CAE**.

## Facturar desde una preventa

Si el pedido ya está en una preventa:

1. **Ventas → Preventas**.
2. Acción **Facturar** en la fila.
3. Se abre la misma pantalla de nueva factura con cliente e ítems precargados.
4. Si hay diferencias de precio, elegí **Mantener Precios de Preventa** o **Usar Precios Actuales**.
5. Completá tipo de documento y forma de pago, y guardá.

Detalle completo en la guía: *Qué son las preventas, de dónde vienen y cómo facturarlas*.

## Tips

- Al cambiar de cliente se **resetea** el tipo de documento: volvé a elegirlo.
- Forma de pago **CC** (cuenta corriente): la venta suma a la deuda del cliente. Otras formas se tratan como contado.
- Al guardar se descuenta stock de los artículos.
- **Cancelar** pide confirmación y vuelve al listado sin guardar.
- Ctrl+Click en **Nueva Factura** puede abrir el alta en otra pestaña.

## Relacionado

- Listado: \`/ventas/facturas\`
- Alta: \`/ventas/facturas/nueva\`
- Guía: Qué son las preventas y cómo facturarlas
- Guía: Cómo crear un cliente
`,
    publicado: true,
    autor: 'sistema'
  },
  {
    slug: 'listado-de-facturas-filtros-y-acciones',
    titulo: 'Listado de facturas: filtros y acciones',
    categoria: 'Ventas',
    resumen:
      'Cómo usar el listado de facturas: configurar filtros, limpiarlos cuando quedan seteados, y acciones (imprimir, clonar, anular, CAE, cambiar vendedor).',
    contenido: `# Listado de facturas: filtros y acciones

Pantalla principal para buscar, revisar y operar sobre facturas ya emitidas.

Ruta: **Ventas → Facturas** (\`/ventas/facturas\`).

## Importante: los filtros quedan seteados

El listado **recuerda** los filtros (y la página) cuando salís y volvés. Eso es útil, pero es la causa más frecuente de "no encuentro una factura":

- Las fechas por defecto (y al **Limpiar Filtros**) son **hoy - hoy**.
- Si buscaste un cliente o un tipo ayer, al volver pueden seguir aplicados.
- Si ves pocas facturas o "ninguna", **revisá primero Fecha Desde / Hasta, cliente y tipo**.

**Qué hacer:**

1. Mirá los filtros arriba.
2. Presioná **Limpiar Filtros** (vuelve a hoy/hoy y saca cliente, tipo, vendedor y pago).
3. Ampliá el rango de fechas si necesitás histórico.
4. Presioná **Aplicar Filtros**.

Cambiar un filtro en pantalla **no filtra solo**: siempre hay que pulsar **Aplicar Filtros**.

## Cómo configurar los filtros

| Filtro | Para qué |
|--------|----------|
| **Tipo de Documento** | Todos, Factura A/B/C, Prefactura, Nota de Crédito A/B/C |
| **Cliente** | Escribí al menos 2 letras, elegí de la lista. La X limpia el cliente |
| **Vendedor** | Filtra por vendedor (o Todos) |
| **Pago** | Filtra por forma de pago (o Todas) |
| **Fecha Desde / Hasta** | Rango de fechas del comprobante |

Botones:

- **Aplicar Filtros**: busca con lo elegido (vuelve a la página 1).
- **Limpiar Filtros**: resetea tipo/cliente/vendedor/pago y deja fechas en **hoy**.

## Qué muestra la tabla

Columnas: Tipo, Número, Fecha, Cliente, Vendedor, Preventista, Pago, Total, CAE, Estado (Activa / Anulada) y **Acciones**.

Las acciones quedan fijas a la derecha; si no ves alguna columna, deslizá la tabla horizontalmente.

Orden: más recientes primero. Paginación de 10 por página.

## Acciones del encabezado

- **Nueva Factura**: abre el alta. Ctrl+Click puede abrir en otra pestaña.

## Acciones por factura

En la columna **Acciones** (iconos):

- **Imprimir**: abre la impresión del comprobante. Al volver, intenta restaurar filtros/página.
- **Clonar**: copia la factura a una nueva (no disponible si está anulada).
- **Anular**: pide confirmación y anula (no disponible si ya está anulada).

En la fila también:

- **Cambiar vendedor**: en facturas activas, click en el nombre del vendedor abre el modal para cambiarlo.
- **Obtener CAE**: si es FCA/FCB (o NC A/B) sin CAE y no anulada, solicita CAE a AFIP.
- **Colocar Manualmente**: carga CAE y vencimiento a mano (misma condición).

Si está **Anulada**: no se clona, no se anula de nuevo, no se cambia vendedor; el CAE se muestra como N/A si no tenía.

## Tips

- **Primera sospecha si "falta" una factura: filtros viejos o fechas en solo hoy.** Limpiá y ampliá el rango.
- **Limpiar Filtros** no deja el listado "sin fechas": vuelve a hoy. Para ver más días, cambiá Desde/Hasta y aplicá.
- El filtro **Pago** del listado muestra el código en la columna; el select usa la descripción de la forma de pago.
- Desde el listado también podés pedir CAE a facturas fiscales que quedaron sin autorización.

## Relacionado

- Pantalla: \`/ventas/facturas\`
- Guía: Cómo crear una factura
- Guía: Qué son las preventas y cómo facturarlas
`,
    publicado: true,
    autor: 'sistema'
  },
  {
    slug: 'cuentas-corrientes-de-clientes',
    titulo: 'Cuentas corrientes de clientes: listado, extracto y cobro',
    categoria: 'Clientes',
    resumen:
      'Cómo ver saldos, consultar el extracto de un cliente, imprimir o descargar PDF, y cobrar con recibos. Los filtros del listado quedan seteados.',
    contenido: `# Cuentas corrientes de clientes: listado, extracto y cobro

La **cuenta corriente** es el saldo del cliente con la empresa: lo que debe (deudor) o lo que la empresa le debe (acreedor).

Ruta: **Clientes → Cuentas Corrientes** (\`/clientes/cuentascorrientes\`).

## Para qué sirve

- Ver quién debe y cuánto.
- Abrir el **extracto** (comprobantes: facturas, NC, ND y recibos).
- Imprimir, descargar PDF o compartir el extracto.
- Saber cuándo ir a cobrar: el cobro **no se hace acá**, se hace en **Ventas → Recibos**.

## Cómo se mueve el saldo

| Qué pasa | Efecto |
|----------|--------|
| Factura con forma de pago **CC** | Suma deuda |
| Factura de **contado** | No suma deuda (igual puede verse en el extracto) |
| Nota de débito | Suma deuda |
| Nota de crédito con forma de pago **CC** | Resta deuda |
| Recibo | Resta lo cobrado (efectivo, cheque, etc.) e imputa facturas/ND/NC |
| Anular factura CC o anular recibo | Revierte esa deuda |

En el listado el saldo es: deuda del cliente menos NC todavía no aplicadas.

## Importante: los filtros quedan seteados

El listado **recuerda** búsqueda, orden, página y cantidad por página cuando salís y volvés.

Si "no aparece" un cliente:

1. Vaciá el campo **Buscar**.
2. Revisá en qué **página** estás y cuántos muestra **Mostrar**.
3. Volvé a buscar por código o nombre.

No hay botón "Limpiar filtros": borralo a mano el texto de **Buscar**.

## Listado: cómo filtrar y qué se ve

Muestra **todos los clientes** (también los que están en cero). No hay filtro "solo con deuda".

| Control | Para qué |
|---------|----------|
| **Buscar** | Código o descripción. Escribí y espera un momento: filtra solo. |
| **Mostrar** | 5, 10, 25 o 50 por página (por defecto 10). |

Columnas: **Código**, **Descripción**, **Saldo**, **Acciones**.

Podés ordenar clickeando Código, Descripción o Saldo (flecha ↑/↓).

Acción de la fila: **Mostrar Resumen** abre el extracto de ese cliente (\`/clientes/cuentascorrientes/{código}\`).

## Extracto del cliente

Arriba ves nombre, código y **Saldo actual**:

- **Verde** (cero o positivo): el cliente **debe**.
- **Rojo** (negativo): la empresa le debe (NC o cobro de más).

Tabla: Fecha, Detalle (tipo-sucursal-número), Débito, Crédito, Saldo.

- En pantalla el más **reciente** queda arriba.
- En el **PDF** va del más viejo al más nuevo, con todos los comprobantes (no solo la página).

Los comprobantes **anulados** no entran.

### Acciones del extracto

- **Volver a Cuentas Corrientes**: vuelve al listado (con los filtros que habías dejado).
- **Imprimir**: imprime lo que ves en pantalla (la página actual).
- **Descargar PDF**: baja el extracto completo (\`cuenta-corriente-{código}.pdf\`).
- **Compartir**: si el dispositivo puede compartir archivos, manda el PDF; si no, lo descarga.

Para mandar el extracto por mail o WhatsApp, usá **Descargar PDF** o **Compartir**, no **Imprimir**.

## Cómo cobrar (recibos)

1. Tené **caja abierta** del vendedor (**Caja → Administración**).
2. Entrá a **Ventas → Recibos** (\`/ventas/recibos\`) → **Nuevo Recibo**.
3. Elegí el **Cliente**: vas a ver su deuda.
4. Marcá las facturas/ND a cobrar y, si aplica, las NC a usar.
5. Cargá las **formas de pago**.
6. Revisá el resumen y **Grabá**.

El recibo baja la cuenta corriente y deja el movimiento en el extracto.

En el listado de recibos, las fechas suelen quedar en **hoy**. Si no ves un recibo, ampliá **Fecha Desde / Hasta**, pulsá **Limpiar Filtros** si hace falta y después **Aplicar Filtros**.

## Tips

- Facturar en **CC** es lo que deja la venta en cuenta corriente. Contado no suma deuda.
- No hay "ajustar saldo" ni "aplicar recibo" en Cuentas Corrientes: el cobro es **Nuevo Recibo**.
- El listado incluye clientes en cero: usá **Buscar** o ordená por **Saldo**.
- **Imprimir** = página de pantalla. **Descargar PDF** = extracto completo.
- Si el saldo no cierra, revisá si la NC o la factura se grabaron con forma de pago **CC**, y si hay comprobantes anulados.

## Relacionado

- Listado: \`/clientes/cuentascorrientes\`
- Extracto: \`/clientes/cuentascorrientes/{código}\`
- Recibos: \`/ventas/recibos\`
- Guía: Cómo crear una factura (forma de pago CC)
- Guía: Listado de facturas: filtros y acciones
- Guía: Cómo crear un cliente
`,
    publicado: true,
    autor: 'sistema'
  }
];

function sanitizeWikiText(text) {
  return String(text || '')
    // Guion tipografico U+2212 y similares -> ASCII
    .replace(/[\u2212\u2013\u2014\u2015]/g, '-')
    // Comillas tipograficas
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Espacios no separables
    .replace(/\u00A0/g, ' ');
}

async function ensureWikiCharset(sequelize) {
  try {
    await sequelize.query(
      "ALTER TABLE `wiki_articulos` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );
  } catch (error) {
    // Si la tabla no existe aun, sync la crea; otros errores no deben tumbar el boot
    console.warn('⚠️ No se pudo convertir charset de wiki_articulos:', error.message);
  }
}

async function upsertArticuloSistema(articulo) {
  const payload = {
    ...articulo,
    titulo: sanitizeWikiText(articulo.titulo),
    categoria: sanitizeWikiText(articulo.categoria),
    resumen: articulo.resumen ? sanitizeWikiText(articulo.resumen) : null,
    contenido: sanitizeWikiText(articulo.contenido)
  };

  const existente = await WikiArticulo.findOne({
    where: { slug: payload.slug }
  });

  if (!existente) {
    await WikiArticulo.create(payload);
    console.log(`✅ Wiki creada: ${payload.slug}`);
    return;
  }

  if (existente.autor === 'sistema') {
    await existente.update({
      titulo: payload.titulo,
      categoria: payload.categoria,
      resumen: payload.resumen,
      contenido: payload.contenido,
      publicado: payload.publicado
    });
    console.log(`✅ Wiki actualizada: ${payload.slug}`);
  }
}

async function ensureWikiTableAndSeed() {
  const sequelize = masterDB.getConnection();
  await WikiArticulo.sync();
  await ensureWikiCharset(sequelize);

  for (const articulo of ARTICULOS_SISTEMA) {
    await upsertArticuloSistema(articulo);
  }
}

module.exports = {
  WikiArticulo,
  Op,
  slugify,
  ensureWikiTableAndSeed
};
