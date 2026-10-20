async function ensureArticulosSubproductosSchema(sequelize) {
  if (!sequelize || sequelize.__articulosSubproductosOk) return;
  if (!sequelize.__articulosSubproductosPromise) {
    sequelize.__articulosSubproductosPromise = (async () => {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS t_articulos_subproductos (
          CodigoArticuloPadre VARCHAR(20) NOT NULL,
          CodigoArticuloSub VARCHAR(20) NOT NULL,
          CantidadPorUnidad DECIMAL(15,3) NOT NULL DEFAULT 1,
          Activo TINYINT NOT NULL DEFAULT 1,
          PRIMARY KEY (CodigoArticuloPadre, CodigoArticuloSub),
          KEY idx_subproductos_sub (CodigoArticuloSub)
        )
      `);
      sequelize.__articulosSubproductosOk = true;
    })().catch((error) => {
      sequelize.__articulosSubproductosPromise = null;
      throw error;
    });
  }
  await sequelize.__articulosSubproductosPromise;
}

module.exports = { ensureArticulosSubproductosSchema };
