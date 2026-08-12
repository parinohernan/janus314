const { QueryTypes } = require('sequelize');

/** JOIN estándar preventa_cabeza → facturacabeza (informes y listados). */
const JOIN_PREVENTA_A_FACTURA = `
  INNER JOIN facturacabeza f
    ON TRIM(f.DocumentoTipo) = TRIM(p.FacturaTipo)
   AND CAST(f.DocumentoSucursal AS UNSIGNED) = CAST(NULLIF(TRIM(p.FacturaSucursal), '') AS UNSIGNED)
   AND CAST(f.DocumentoNumero AS UNSIGNED) = CAST(NULLIF(TRIM(p.FacturaNumero), '') AS UNSIGNED)
`;

/** Preventa facturada y no anulada. */
const WHERE_PREVENTA_VIGENTE_FACTURADA = `
  p.FechaAnulacion IS NULL
  AND p.FacturaNumero IS NOT NULL
  AND TRIM(p.FacturaNumero) <> ''
`;

/**
 * Clave normalizada de comprobante (tipo-suc-num) para deduplicar y mapear.
 */
function claveFacturaNormalizada(tipo, sucursal, numero) {
  const suc = parseInt(String(sucursal ?? '').trim(), 10);
  const num = parseInt(String(numero ?? '').trim(), 10);
  return `${String(tipo ?? '').trim().toUpperCase()}-${suc}-${num}`;
}

function extraerClavesFactura(item) {
  return {
    DocumentoTipo: item.DocumentoTipo ?? item.tipo,
    DocumentoSucursal: item.DocumentoSucursal ?? item.sucursal,
    DocumentoNumero: item.DocumentoNumero ?? item.numero ?? item.numeroDoc,
  };
}

/**
 * Genera cláusula OR para matchear facturas por tipo/sucursal/número (con CAST).
 */
function buildFacturaMatchOrClause(facturas, alias = 'f') {
  const orParts = [];
  const replacements = {};

  facturas.forEach((item, i) => {
    const { DocumentoTipo, DocumentoSucursal, DocumentoNumero } = extraerClavesFactura(item);
    if (!DocumentoTipo || !DocumentoSucursal || !DocumentoNumero) return;

    orParts.push(`(
      TRIM(${alias}.DocumentoTipo) = TRIM(:tipo${i})
      AND CAST(${alias}.DocumentoSucursal AS UNSIGNED) = CAST(NULLIF(TRIM(:suc${i}), '') AS UNSIGNED)
      AND CAST(${alias}.DocumentoNumero AS UNSIGNED) = CAST(NULLIF(TRIM(:num${i}), '') AS UNSIGNED)
    )`);
    replacements[`tipo${i}`] = DocumentoTipo;
    replacements[`suc${i}`] = DocumentoSucursal;
    replacements[`num${i}`] = DocumentoNumero;
  });

  return { orParts, replacements };
}

/**
 * Preventistas (preventa_cabeza.VendedorCodigo) indexados por factura.
 * @returns {Promise<Map<string, { Codigo: string, Descripcion: string|null, Preventa: object }>>}
 */
async function obtenerPreventistasPorFacturas(db, facturas) {
  if (!facturas?.length || !db) return new Map();

  const { orParts, replacements } = buildFacturaMatchOrClause(facturas);
  if (!orParts.length) return new Map();

  const rows = await db.query(
    `
    SELECT
      f.DocumentoTipo,
      f.DocumentoSucursal,
      f.DocumentoNumero,
      p.VendedorCodigo AS PreventistaCodigo,
      v.Descripcion AS PreventistaDescripcion,
      p.DocumentoTipo AS PreventaTipo,
      p.DocumentoSucursal AS PreventaSucursal,
      p.DocumentoNumero AS PreventaNumero
    FROM preventa_cabeza p
    ${JOIN_PREVENTA_A_FACTURA}
    LEFT JOIN t_vendedores v ON v.Codigo = p.VendedorCodigo
    WHERE ${WHERE_PREVENTA_VIGENTE_FACTURADA}
      AND (${orParts.join(' OR ')})
    `,
    { replacements, type: QueryTypes.SELECT }
  );

  const map = new Map();
  for (const row of rows) {
    const key = claveFacturaNormalizada(
      row.DocumentoTipo,
      row.DocumentoSucursal,
      row.DocumentoNumero
    );
    if (map.has(key) || !row.PreventistaCodigo) continue;

    map.set(key, {
      Codigo: row.PreventistaCodigo,
      Descripcion: row.PreventistaDescripcion,
      Preventa: {
        DocumentoTipo: row.PreventaTipo,
        DocumentoSucursal: row.PreventaSucursal,
        DocumentoNumero: row.PreventaNumero,
      },
    });
  }

  return map;
}

/**
 * Agrega campo Preventista { Codigo, Descripcion } a ítems de listado de facturas.
 */
async function adjuntarPreventistasAFacturas(items, db) {
  if (!items?.length || !db) return items;

  const map = await obtenerPreventistasPorFacturas(db, items);

  return items.map((item) => {
    const key = claveFacturaNormalizada(
      item.DocumentoTipo,
      item.DocumentoSucursal,
      item.DocumentoNumero
    );
    const data = map.get(key);
    if (!data) return item;

    return {
      ...item,
      Preventista: {
        Codigo: data.Codigo,
        Descripcion: data.Descripcion,
      },
    };
  });
}

module.exports = {
  JOIN_PREVENTA_A_FACTURA,
  WHERE_PREVENTA_VIGENTE_FACTURADA,
  claveFacturaNormalizada,
  buildFacturaMatchOrClause,
  obtenerPreventistasPorFacturas,
  adjuntarPreventistasAFacturas,
};
