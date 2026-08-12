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

const ARTICULO_INICIAL = {
  slug: 'exportar-detalle-ventas-cliente-pdf',
  titulo: 'Cómo exportar el detalle de ventas y notas de crédito de un cliente (PDF)',
  categoria: 'Informes',
  resumen:
    'Pasos para descargar el PDF con facturas, notas de crédito y total neto de un cliente.',
  contenido: `# Cómo exportar el detalle de ventas y notas de crédito de un cliente (PDF)

Cuando un cliente te pide el detalle de sus compras (y devoluciones) en un período, podés generar un PDF desde el ERP y enviárselo por mail o WhatsApp.

El informe incluye **facturas**, **notas de crédito** y el **total neto** (ventas − NC).

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
- **Neto**: Ventas − NC

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
};

async function ensureWikiTableAndSeed() {
  await WikiArticulo.sync();

  const existente = await WikiArticulo.findOne({
    where: { slug: ARTICULO_INICIAL.slug }
  });

  if (!existente) {
    await WikiArticulo.create(ARTICULO_INICIAL);
    console.log('✅ Artículo inicial de wiki creado');
    return;
  }

  // Mantener al día el artículo sembrado por el sistema
  if (existente.autor === 'sistema') {
    await existente.update({
      titulo: ARTICULO_INICIAL.titulo,
      categoria: ARTICULO_INICIAL.categoria,
      resumen: ARTICULO_INICIAL.resumen,
      contenido: ARTICULO_INICIAL.contenido,
      publicado: ARTICULO_INICIAL.publicado
    });
    console.log('✅ Artículo inicial de wiki actualizado');
  }
}

module.exports = {
  WikiArticulo,
  Op,
  slugify,
  ensureWikiTableAndSeed
};
