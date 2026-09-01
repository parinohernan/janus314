function porcentajeBonificacionDesdeFactura(factura) {
  const pct = Number(factura?.PorcentajeBonificacion);
  if (Number.isFinite(pct) && pct > 0) {
    return pct;
  }

  const bruto = Number(factura?.ImporteBruto);
  const bonificado = Number(factura?.ImporteBonificado);
  if (bruto > 0 && bonificado > 0) {
    return parseFloat(((bonificado / bruto) * 100).toFixed(2));
  }

  return 0;
}

function aplicarBonificacionATotales(
  { importeBruto = 0, baseImponible1 = 0, baseImponible2 = 0 },
  porcentajeBonificacion = 0
) {
  const pct = Number(porcentajeBonificacion) || 0;
  const factor = 1 - pct / 100;
  const ImporteBruto = parseFloat(Number(importeBruto).toFixed(2));
  const ImporteBonificado = parseFloat((ImporteBruto * (pct / 100)).toFixed(2));
  const ImporteNeto = parseFloat((ImporteBruto - ImporteBonificado).toFixed(2));
  const BaseImponible1 = parseFloat((Number(baseImponible1) * factor).toFixed(2));
  const BaseImponible2 = parseFloat((Number(baseImponible2) * factor).toFixed(2));
  const ImporteIva1 = parseFloat((BaseImponible1 * 0.21).toFixed(2));
  const ImporteIva2 = parseFloat((BaseImponible2 * 0.105).toFixed(2));

  return {
    ImporteBruto,
    ImporteBonificado,
    ImporteNeto,
    BaseImponible1,
    BaseImponible2,
    ImporteIva1,
    ImporteIva2,
    ImporteTotal: parseFloat((ImporteNeto + ImporteIva1 + ImporteIva2).toFixed(2)),
  };
}

module.exports = {
  porcentajeBonificacionDesdeFactura,
  aplicarBonificacionATotales,
};
