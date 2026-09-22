/**
 * Historial de precio de costo por empresa.
 * La columna y la tabla se crean en la primera petición de esa conexión.
 */

function redondearCosto(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  if (!Number.isFinite(n)) return null;
  return Number(n.toFixed(2));
}

function costoCambio(anterior, nuevo) {
  const costoNuevo = redondearCosto(nuevo);
  if (costoNuevo === null) return false;
  const costoAnterior = redondearCosto(anterior);
  if (costoAnterior === null) return true;
  return costoAnterior !== costoNuevo;
}

async function ensureCostoHistorialSchema(sequelize) {
  if (!sequelize || sequelize.__costoHistorialOk) return;
  if (!sequelize.__costoHistorialPromise) {
    sequelize.__costoHistorialPromise = (async () => {
      try {
        await sequelize.query(
          'ALTER TABLE t_articulos ADD COLUMN FechaActualizacionCosto DATETIME NULL'
        );
      } catch (error) {
        const msg = String(error?.message || error);
        if (!/duplicate column|ER_DUP_FIELDNAME/i.test(msg)) {
          throw error;
        }
      }
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS t_articulos_costo_historial (
          Id INT NOT NULL AUTO_INCREMENT,
          ArticuloCodigo VARCHAR(20) NOT NULL,
          Fecha DATETIME NOT NULL,
          PrecioCosto DECIMAL(18,2) NOT NULL,
          PRIMARY KEY (Id),
          KEY idx_costo_historial_codigo_fecha (ArticuloCodigo, Fecha)
        )
      `);
      sequelize.__costoHistorialOk = true;
    })().catch((error) => {
      sequelize.__costoHistorialPromise = null;
      throw error;
    });
  }
  await sequelize.__costoHistorialPromise;
}

async function registrarCostoSiCambio({
  sequelize,
  Historial,
  articulo,
  costoAnterior,
  costoNuevo,
  transaction,
  ahora = new Date(),
}) {
  if (!costoCambio(costoAnterior, costoNuevo)) return false;
  await ensureCostoHistorialSchema(sequelize);
  const costo = redondearCosto(costoNuevo);
  await Historial.create(
    {
      ArticuloCodigo: articulo.Codigo,
      Fecha: ahora,
      PrecioCosto: costo,
    },
    { transaction }
  );
  await articulo.update({ FechaActualizacionCosto: ahora }, { transaction });
  return true;
}

function limiteSeguro(limite) {
  const n = parseInt(limite, 10);
  if (!Number.isFinite(n) || n < 1) return 3;
  return Math.min(n, 20);
}

async function ultimosCostos(sequelize, codigo, limite = 3) {
  await ensureCostoHistorialSchema(sequelize);
  const n = limiteSeguro(limite);
  const rows = await sequelize.query(
    `SELECT Fecha, PrecioCosto
     FROM t_articulos_costo_historial
     WHERE ArticuloCodigo = :codigo
     ORDER BY Fecha DESC, Id DESC
     LIMIT ${n}`,
    {
      replacements: { codigo },
      type: sequelize.QueryTypes.SELECT,
    }
  );
  return rows.map((row) => ({
    Fecha: row.Fecha,
    PrecioCosto: Number(row.PrecioCosto),
  }));
}

async function ultimosCostosPorCodigos(sequelize, codigos, limite = 3) {
  await ensureCostoHistorialSchema(sequelize);
  if (!codigos.length) return new Map();
  const n = limiteSeguro(limite);
  const rows = await sequelize.query(
    `SELECT h.ArticuloCodigo, h.Fecha, h.PrecioCosto
     FROM t_articulos_costo_historial h
     WHERE h.ArticuloCodigo IN (:codigos)
       AND (
         SELECT COUNT(*)
         FROM t_articulos_costo_historial h2
         WHERE h2.ArticuloCodigo = h.ArticuloCodigo
           AND (h2.Fecha > h.Fecha OR (h2.Fecha = h.Fecha AND h2.Id > h.Id))
       ) < ${n}
     ORDER BY h.ArticuloCodigo ASC, h.Fecha DESC, h.Id DESC`,
    {
      replacements: { codigos },
      type: sequelize.QueryTypes.SELECT,
    }
  );
  const porCodigo = new Map();
  for (const row of rows) {
    const lista = porCodigo.get(row.ArticuloCodigo) || [];
    lista.push({
      Fecha: row.Fecha,
      PrecioCosto: Number(row.PrecioCosto),
    });
    porCodigo.set(row.ArticuloCodigo, lista);
  }
  return porCodigo;
}

module.exports = {
  redondearCosto,
  costoCambio,
  ensureCostoHistorialSchema,
  registrarCostoSiCambio,
  ultimosCostos,
  ultimosCostosPorCodigos,
};
