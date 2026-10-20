const { alicuotaIvaArticulo } = require('./ivaArticulo');

function redondear2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function valorListaDeArticulo(articulo, listaId) {
  const id = String(listaId || '1');
  const listas = {
    1: articulo.Lista1,
    2: articulo.Lista2,
    3: articulo.Lista3,
    4: articulo.Lista4,
    5: articulo.Lista5,
  };
  const crudo = listas[id] ?? articulo.Lista1;
  const valor = Number(crudo);
  return Number.isFinite(valor) ? valor : 0;
}

function resolverValorLista(precioCosto, valorLista) {
  if (valorLista === 0) return redondear2(precioCosto);
  if (precioCosto > 0) {
    if (valorLista > precioCosto * 1.05) return redondear2(valorLista);
    if (Math.abs(valorLista) <= 1000) return redondear2(precioCosto * (1 + valorLista / 100));
    return redondear2(valorLista);
  }
  return redondear2(valorLista);
}

function precioListaSinIva(articulo, listaId = '1') {
  const precioCosto = Math.max(Number(articulo.PrecioCosto) || 0, 0);
  let precio = resolverValorLista(precioCosto, valorListaDeArticulo(articulo, listaId));
  if (precio > 0) return precio;

  if (String(listaId) !== '1') {
    precio = resolverValorLista(precioCosto, valorListaDeArticulo(articulo, '1'));
    if (precio > 0) return precio;
  }

  return redondear2(precioCosto);
}

function itemFacturaDesdeArticulo(articulo, cantidad, listaId = '1') {
  const qty = Number(cantidad) || 0;
  const iva = alicuotaIvaArticulo(articulo);
  const precioLista = precioListaSinIva(articulo, listaId);
  const factor = 1 + iva / 100;
  const precioUnitarioConIva = redondear2(precioLista * factor);
  const total = redondear2(precioUnitarioConIva * qty);

  return {
    ArticuloCodigo: articulo.Codigo,
    Descripcion: articulo.Descripcion,
    DescripcionLibre: articulo.Descripcion,
    Cantidad: qty,
    PrecioLista: precioLista,
    PorcentajeBonificado: 0,
    ImporteBonificado: 0,
    PrecioUnitario: precioLista,
    PorcentajeIva: iva,
    PrecioUnitarioConIva: precioUnitarioConIva,
    Total: total,
  };
}

module.exports = {
  redondear2,
  precioListaSinIva,
  itemFacturaDesdeArticulo,
};
