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
