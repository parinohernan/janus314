const { ensureArticulosSubproductosSchema } = require('../utils/articuloSubproductoSchema');
const { itemFacturaDesdeArticulo } = require('../utils/precioListaArticulo');
const { esArticuloPosVarios } = require('../utils/posVarios');

function normalizarCodigo(value) {
  return String(value || '').trim();
}

async function listarPorPadre(sequelize, codigoPadre) {
  await ensureArticulosSubproductosSchema(sequelize);
  const padre = normalizarCodigo(codigoPadre);
  const [rows] = await sequelize.query(
    `
    SELECT
      r.CodigoArticuloPadre,
      r.CodigoArticuloSub,
      r.CantidadPorUnidad,
      r.Activo,
      a.Descripcion AS SubDescripcion,
      a.Lista1, a.Lista2, a.Lista3, a.Lista4, a.Lista5,
      a.PrecioCosto, a.PorcentajeIVA1, a.PorcentajeIVA2,
      a.Activo AS SubActivo, a.SeVende AS SubSeVende
    FROM t_articulos_subproductos r
    INNER JOIN t_articulos a ON a.Codigo = r.CodigoArticuloSub
    WHERE r.CodigoArticuloPadre = :padre AND r.Activo = 1
    ORDER BY r.CodigoArticuloSub
    `,
    { replacements: { padre } }
  );
  return rows;
}

async function listarPorPadres(sequelize, codigosPadre) {
  await ensureArticulosSubproductosSchema(sequelize);
  const codigos = [...new Set(codigosPadre.map(normalizarCodigo).filter(Boolean))];
  if (codigos.length === 0) {
    return { reglas: [], articulosSub: [] };
  }

  const [rows] = await sequelize.query(
    `
    SELECT
      r.CodigoArticuloPadre,
      r.CodigoArticuloSub,
      r.CantidadPorUnidad,
      r.Activo,
      a.Descripcion AS SubDescripcion,
      a.Lista1, a.Lista2, a.Lista3, a.Lista4, a.Lista5,
      a.PrecioCosto, a.PorcentajeIVA1, a.PorcentajeIVA2,
      a.Activo AS SubActivo, a.SeVende AS SubSeVende
    FROM t_articulos_subproductos r
    INNER JOIN t_articulos a ON a.Codigo = r.CodigoArticuloSub
    WHERE r.Activo = 1 AND r.CodigoArticuloPadre IN (:codigos)
    ORDER BY r.CodigoArticuloPadre, r.CodigoArticuloSub
    `,
    { replacements: { codigos } }
  );

  const subCodigos = [...new Set(rows.map((r) => r.CodigoArticuloSub))];
  let articulosSub = [];
  if (subCodigos.length > 0) {
    const [subs] = await sequelize.query(
      `
      SELECT Codigo, Descripcion, Lista1, Lista2, Lista3, Lista4, Lista5,
             PrecioCosto, PorcentajeIVA1, PorcentajeIVA2, Activo, SeVende
      FROM t_articulos
      WHERE Codigo IN (:subCodigos)
      `,
      { replacements: { subCodigos } }
    );
    articulosSub = subs;
  }

  return { reglas: rows, articulosSub };
}

async function guardarPorPadre(sequelize, codigoPadre, reglas, Articulo, transaction) {
  await ensureArticulosSubproductosSchema(sequelize);
  const padre = normalizarCodigo(codigoPadre);
  if (!padre) {
    throw new Error('Código de artículo padre inválido');
  }

  const padreRow = await Articulo.findByPk(padre, { transaction });
  if (!padreRow) {
    throw new Error(`Artículo padre ${padre} no encontrado`);
  }

  const limpias = (reglas || []).map((r) => ({
    CodigoArticuloSub: normalizarCodigo(r.CodigoArticuloSub || r.codigoSub),
    CantidadPorUnidad: Math.max(Number(r.CantidadPorUnidad ?? r.cantidadPorUnidad) || 0, 0.001),
    Activo: r.Activo === 0 || r.activo === false ? 0 : 1,
  })).filter((r) => r.CodigoArticuloSub);

  for (const regla of limpias) {
    const sub = await Articulo.findByPk(regla.CodigoArticuloSub, { transaction });
    if (!sub) {
      throw new Error(`Subproducto ${regla.CodigoArticuloSub} no encontrado`);
    }
    if (regla.CodigoArticuloSub === padre) {
      throw new Error('Un artículo no puede ser subproducto de sí mismo');
    }
  }

  await sequelize.query(
    'DELETE FROM t_articulos_subproductos WHERE CodigoArticuloPadre = :padre',
    { replacements: { padre }, transaction }
  );

  for (const regla of limpias) {
    await sequelize.query(
      `
      INSERT INTO t_articulos_subproductos
        (CodigoArticuloPadre, CodigoArticuloSub, CantidadPorUnidad, Activo)
      VALUES (:padre, :sub, :cantidad, :activo)
      `,
      {
        replacements: {
          padre,
          sub: regla.CodigoArticuloSub,
          cantidad: regla.CantidadPorUnidad,
          activo: regla.Activo,
        },
        transaction,
      }
    );
  }

  return listarPorPadre(sequelize, padre);
}

function codigoItem(item) {
  return normalizarCodigo(item.ArticuloCodigo || item.CodigoArticulo);
}

function esLineaPadre(item, subCodigos) {
  const codigo = codigoItem(item);
  if (!codigo) return false;
  if (esArticuloPosVarios(codigo)) return false;
  if (subCodigos.has(codigo)) return false;
  return true;
}

async function expandirItemsFactura(items, models, listaPrecio = '1', sequelize) {
  const lista = String(listaPrecio || '1');
  const entrada = Array.isArray(items) ? items : [];
  if (entrada.length === 0 || !sequelize) {
    return entrada;
  }

  await ensureArticulosSubproductosSchema(sequelize);

  const codigosPadre = [
    ...new Set(
      entrada
        .map(codigoItem)
        .filter((c) => c && !esArticuloPosVarios(c))
    ),
  ];

  const { reglas, articulosSub } = await listarPorPadres(sequelize, codigosPadre);
  if (reglas.length === 0) {
    return entrada;
  }

  const subCodigos = new Set(reglas.map((r) => r.CodigoArticuloSub));
  const subsPorCodigo = new Map(articulosSub.map((a) => [a.Codigo, a]));

  const padres = entrada.filter((item) => esLineaPadre(item, subCodigos));

  const cantidadSub = new Map();
  for (const item of padres) {
    const codigoPadre = codigoItem(item);
    const cantidadPadre = Number(item.Cantidad) || 0;
    if (!(cantidadPadre > 0)) continue;

    const reglasPadre = reglas.filter((r) => r.CodigoArticuloPadre === codigoPadre);
    for (const regla of reglasPadre) {
      const subCode = regla.CodigoArticuloSub;
      const add = cantidadPadre * (Number(regla.CantidadPorUnidad) || 1);
      cantidadSub.set(subCode, (cantidadSub.get(subCode) || 0) + add);
    }
  }

  const itemsSub = [];
  for (const [subCode, cantidad] of cantidadSub.entries()) {
    const articulo = subsPorCodigo.get(subCode);
    if (!articulo) continue;
    itemsSub.push(itemFacturaDesdeArticulo(articulo, cantidad, lista));
  }

  return [...padres, ...itemsSub];
}

module.exports = {
  listarPorPadre,
  listarPorPadres,
  guardarPorPadre,
  expandirItemsFactura,
};
