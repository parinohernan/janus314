/**
 * Lee CantidadProveedor persistida en el ítem (prv_orden_compra_items).
 */
function cantidadProveedorDesdeOrden(i) {
  const storedRaw = i.CantidadProveedor;
  const storedStr =
    typeof storedRaw === 'string' ? storedRaw.trim() : storedRaw;
  const storedParsed =
    storedStr != null && storedStr !== '' ? parseFloat(String(storedStr)) : NaN;
  const hasStored =
    storedStr != null &&
    storedStr !== '' &&
    Number.isFinite(storedParsed) &&
    storedParsed >= 0;
  return { hasStored, value: hasStored ? storedParsed : null };
}

/**
 * Enriquece ítems de orden de compra con t_relaciones_articulo_proveedor.
 * Si el ítem ya tiene CantidadProveedor persistida, se respeta; si no, se calcula Cantidad empresa / Relacion.
 * CantidadProveedorOrigen: 'orden' | 'relacion' | null
 */
async function enrichOrdenCompraItems(itemsPlain, proveedorCodigo, RelacionArticuloProveedor) {
  if (!itemsPlain || itemsPlain.length === 0) return itemsPlain || [];
  const codProv = String(proveedorCodigo || '').trim();
  if (!codProv || !RelacionArticuloProveedor) {
    return itemsPlain.map((i) => {
      const { hasStored, value } = cantidadProveedorDesdeOrden(i);
      return {
        ...i,
        Relacion: null,
        CodigoArticuloProveedor: null,
        DescripcionProveedor: null,
        CantidadProveedor: hasStored ? value : null,
        CantidadProveedorOrigen: hasStored ? 'orden' : null,
      };
    });
  }

  const relaciones = await RelacionArticuloProveedor.findAll({
    where: { ProveedorCodigo: codProv },
  });
  const map = new Map();
  for (const r of relaciones) {
    const p = r.get({ plain: true });
    const k = String(p.CodigoArticuloEmpresa || '').trim();
    if (k) map.set(k, p);
  }

  return itemsPlain.map((i) => {
    const cod = String(i.CodigoArticulo || '').trim();
    const rel = map.get(cod);
    const relVal = rel && parseFloat(rel.Relacion) > 0 ? parseFloat(rel.Relacion) : null;
    const cantEmp = parseFloat(i.Cantidad) || 0;
    const { hasStored, value: storedVal } = cantidadProveedorDesdeOrden(i);
    let cantProv;
    let cantidadProveedorOrigen = null;
    if (hasStored) {
      cantProv = storedVal;
      cantidadProveedorOrigen = 'orden';
    } else if (relVal != null) {
      cantProv = cantEmp / relVal;
      cantidadProveedorOrigen = 'relacion';
    } else {
      cantProv = null;
    }
    return {
      ...i,
      Relacion: relVal,
      CantidadProveedor: cantProv,
      CantidadProveedorOrigen: cantidadProveedorOrigen,
      CodigoArticuloProveedor: rel ? rel.CodigoArticuloProveedor : null,
      DescripcionProveedor: rel ? rel.DescripcionProveedor : null,
    };
  });
}

module.exports = { enrichOrdenCompraItems };
