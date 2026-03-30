/**
 * Indica si existe la columna CantidadProveedor en prv_orden_compra_items
 * (p. ej. migración no aplicada en esa base).
 */
async function prvOrdenCompraItemsHasCantidadProveedor(sequelize) {
  try {
    const qi = sequelize.getQueryInterface();
    const desc = await qi.describeTable('prv_orden_compra_items');
    const keys = Object.keys(desc || {});
    return keys.some((k) => String(k).toLowerCase() === 'cantidadproveedor');
  } catch (e) {
    console.warn('[orden compra] describeTable prv_orden_compra_items:', e.message);
    return false;
  }
}

module.exports = { prvOrdenCompraItemsHasCantidadProveedor };
