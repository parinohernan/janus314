const { esFamiliaConIva } = require("../../../utils/matematicaExacta");

/**
 * Precio de lista sin IVA para armar renglones de PDF.
 * Facturas traen PrecioLista; notas de crédito solo PrecioUnitario/PrecioBase.
 */
function resolverPrecioLista(item) {
  const lista = Number(item?.PrecioLista);
  if (Number.isFinite(lista) && lista > 0) return lista;
  const base = Number(item?.PrecioBase);
  if (Number.isFinite(base) && base > 0) return base;
  const unitario = Number(item?.PrecioUnitario);
  if (Number.isFinite(unitario) && unitario > 0) return unitario;
  return 0;
}

function redondear2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function alicuotaIva(item) {
  const iva1 = Number(item?.PorcentajeIva ?? item?.PorcentajeIVA1);
  if (Number.isFinite(iva1) && iva1 > 0) return iva1;
  const iva2 = Number(item?.PorcentajeIVA2);
  if (Number.isFinite(iva2) && iva2 > 0) return iva2;
  return 0;
}

function esAlicuota21(n) {
  return Math.abs(Number(n) - 21) < 0.01;
}

function esAlicuota105(n) {
  return Math.abs(Number(n) - 10.5) < 0.01;
}

function precioUnitarioNeto(item) {
  const base = Number(item?.PrecioBase);
  if (Number.isFinite(base) && base > 0) return base;
  const unitario = Number(item?.PrecioUnitario);
  if (Number.isFinite(unitario) && unitario > 0) return unitario;
  const lista = resolverPrecioLista(item);
  const descuento = Number(item?.PorcentajeBonificado ?? item?.PorcentajeBonificacion) || 0;
  return lista * (1 - descuento / 100);
}

/**
 * Renglón PRF/FCB: precios con IVA a 2 decimales; el total es cantidad × Precio U. ya redondeado.
 */
function renglonPdfConIva(item) {
  const cantidad = Number(item?.Cantidad) || 0;
  const precioListaSinIva = resolverPrecioLista(item);
  const descuento = Number(item?.PorcentajeBonificado ?? item?.PorcentajeBonificacion) || 0;
  const porcentajeIva = alicuotaIva(item);
  const precioUnitarioSinIva = precioUnitarioNeto(item);

  const precioListaConIva = redondear2(precioListaSinIva * (1 + porcentajeIva / 100));
  const precioUnitarioConIva = redondear2(precioUnitarioSinIva * (1 + porcentajeIva / 100));
  const totalConIva = redondear2(cantidad * precioUnitarioConIva);

  return {
    cantidad,
    descuento,
    porcentajeIva,
    precioListaConIva,
    precioUnitarioConIva,
    totalConIva,
  };
}

/**
 * Renglón FCA/NCA: Precio U. = PrecioUnitario neto; subtotal = cantidad × unitario.
 */
function renglonPdfSinIva(item) {
  const cantidad = Number(item?.Cantidad) || 0;
  const descuento = Number(item?.PorcentajeBonificado ?? item?.PorcentajeBonificacion) || 0;
  const porcentajeIva = alicuotaIva(item);
  const precioUnitario = redondear2(precioUnitarioNeto(item));
  const subtotal = redondear2(cantidad * precioUnitario);

  return {
    cantidad,
    descuento,
    porcentajeIva,
    precioLista: redondear2(resolverPrecioLista(item)),
    precioUnitario,
    subtotal,
  };
}

function totalesPieConIva(items, porcentajeBonificacion = 0) {
  const renglones = (items || []).map(renglonPdfConIva);
  const subtotal = redondear2(renglones.reduce((sum, r) => sum + r.totalConIva, 0));
  const pct = Number(porcentajeBonificacion) || 0;
  const bonificacion = redondear2(subtotal * (pct / 100));
  const total = redondear2(subtotal - bonificacion);
  return { subtotal, bonificacion, porcentajeMostrar: pct > 0 ? pct : 0, total, renglones };
}

function totalesPieDiscriminado(items, porcentajeBonificacion = 0) {
  const renglones = (items || []).map(renglonPdfSinIva);
  const pct = Number(porcentajeBonificacion) || 0;
  const subtotal = redondear2(renglones.reduce((sum, r) => sum + r.subtotal, 0));
  const bonificacion = redondear2(subtotal * (pct / 100));
  const neto = redondear2(subtotal - bonificacion);

  let base21 = 0;
  let base105 = 0;
  renglones.forEach((r) => {
    const netoLinea = r.subtotal * (1 - pct / 100);
    if (esAlicuota21(r.porcentajeIva)) base21 += netoLinea;
    else if (esAlicuota105(r.porcentajeIva)) base105 += netoLinea;
  });

  const iva21 = redondear2(base21 * 0.21);
  const iva105 = redondear2(base105 * 0.105);
  const total = redondear2(neto + iva21 + iva105);

  return {
    subtotal,
    bonificacion,
    porcentajeMostrar: pct > 0 ? pct : 0,
    neto,
    base21: redondear2(base21),
    base105: redondear2(base105),
    iva21,
    iva105,
    total,
    renglones,
  };
}

function ajustarIvaATotal({ ImporteNeto, ImporteIva1, ImporteIva2, percepcion, ImporteTotal }) {
  const suma = redondear2(ImporteNeto + ImporteIva1 + ImporteIva2 + percepcion);
  const diff = redondear2(ImporteTotal - suma);
  if (diff === 0) {
    return { ImporteIva1, ImporteIva2 };
  }
  if (ImporteIva1 > 0 || (ImporteIva1 === 0 && ImporteIva2 === 0)) {
    return { ImporteIva1: redondear2(ImporteIva1 + diff), ImporteIva2 };
  }
  return { ImporteIva1, ImporteIva2: redondear2(ImporteIva2 + diff) };
}

/**
 * Totales de cabecera para alta y PDF. Familia B: ImporteTotal = pie con IVA.
 * Familia A: ImporteTotal = neto + IVA + percepción.
 */
function calcularTotalesComprobante({
  items = [],
  tipo,
  porcentajeBonificacion = 0,
  percepcion = 0,
} = {}) {
  const pct = Number(porcentajeBonificacion) || 0;
  const perc = redondear2(percepcion);
  const pieA = totalesPieDiscriminado(items, pct);

  const ImporteBruto = pieA.subtotal;
  const ImporteBonificado = pieA.bonificacion;
  const ImporteNeto = pieA.neto;
  let ImporteIva1 = pieA.iva21;
  let ImporteIva2 = pieA.iva105;
  const BaseImponible1 = pieA.base21;
  const BaseImponible2 = pieA.base105;

  let ImporteTotal;
  let pieConIva = null;

  if (esFamiliaConIva(tipo)) {
    pieConIva = totalesPieConIva(items, pct);
    ImporteTotal = redondear2(pieConIva.total + perc);
    const ajustado = ajustarIvaATotal({
      ImporteNeto,
      ImporteIva1,
      ImporteIva2,
      percepcion: perc,
      ImporteTotal,
    });
    ImporteIva1 = ajustado.ImporteIva1;
    ImporteIva2 = ajustado.ImporteIva2;
  } else {
    ImporteTotal = redondear2(ImporteNeto + ImporteIva1 + ImporteIva2 + perc);
  }

  return {
    ImporteBruto,
    ImporteBonificado,
    ImporteNeto,
    BaseImponible1,
    BaseImponible2,
    ImporteIva1,
    ImporteIva2,
    ImporteIva: redondear2(ImporteIva1 + ImporteIva2),
    ImportePercepcionIIBB: perc,
    ImporteTotal,
    pieConIva,
    pieDiscriminado: pieA,
  };
}

function aplicarTotalesAFactura(facturaData) {
  const totales = calcularTotalesComprobante({
    items: facturaData.Items || [],
    tipo: facturaData.DocumentoTipo,
    porcentajeBonificacion: facturaData.PorcentajeBonificacion,
    percepcion:
      facturaData.ImportePercepcionIIBB || facturaData.ImporteIngresosBrutos || 0,
  });

  facturaData.ImporteBruto = totales.ImporteBruto;
  facturaData.ImporteBonificado = totales.ImporteBonificado;
  facturaData.ImporteNeto = totales.ImporteNeto;
  facturaData.BaseImponible1 = totales.BaseImponible1;
  facturaData.BaseImponible2 = totales.BaseImponible2;
  facturaData.ImporteIva1 = totales.ImporteIva1;
  facturaData.ImporteIva2 = totales.ImporteIva2;
  facturaData.ImporteIva = totales.ImporteIva;
  facturaData.ImporteTotal = totales.ImporteTotal;
  if (facturaData.PagoTipo !== "CC") {
    facturaData.ImportePagado = totales.ImporteTotal;
  }
  return totales;
}

module.exports = {
  resolverPrecioLista,
  redondear2,
  alicuotaIva,
  renglonPdfConIva,
  renglonPdfSinIva,
  totalesPieConIva,
  totalesPieDiscriminado,
  calcularTotalesComprobante,
  aplicarTotalesAFactura,
  ajustarIvaATotal,
};
