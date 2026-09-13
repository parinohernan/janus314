function normalizarTipo(tipo) {
  if (!tipo) return null;
  const tipoUpper = String(tipo).toUpperCase();
  if (tipoUpper === 'A') return 'FCA';
  if (tipoUpper === 'B') return 'FCB';
  if (tipoUpper === 'C') return 'FCC';
  if (tipoUpper === 'F') return 'PRF';
  return tipoUpper;
}

function mapaFacturas(facturas) {
  const map = new Map();
  for (const f of facturas || []) {
    const tipo = f.DocumentoTipo || f.tipo;
    const suc = f.DocumentoSucursal ?? f.sucursal;
    const num = f.DocumentoNumero ?? f.numeroDoc;
    map.set(`${tipo}-${suc}-${num}`, f);
    map.set(`${tipo}-${parseInt(suc, 10)}-${parseInt(num, 10)}`, f);
  }
  return map;
}

function encontrarFacturaOrigen(nc, facturasMap) {
  if (!nc?.factura_tipo || !nc?.factura_sucursal || !nc?.factura_numero) return null;
  const tipoNormalizado = normalizarTipo(nc.factura_tipo);
  const claves = [
    `${tipoNormalizado}-${nc.factura_sucursal}-${nc.factura_numero}`,
    `${String(nc.factura_tipo).toUpperCase()}-${nc.factura_sucursal}-${nc.factura_numero}`,
    `${tipoNormalizado}-${parseInt(nc.factura_sucursal, 10)}-${parseInt(nc.factura_numero, 10)}`
  ];
  for (const clave of claves) {
    if (facturasMap.has(clave)) return facturasMap.get(clave);
  }
  return null;
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function parseFecha(valor) {
  if (!valor) return null;
  const fecha = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function clavePeriodo(fecha, agruparPor) {
  switch (agruparPor) {
    case 'semana':
      return `${fecha.getFullYear()}-W${getWeekNumber(fecha)}`;
    case 'mes':
      return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    default:
      return fecha.toISOString().split('T')[0];
  }
}

function ivaDe(doc) {
  return (Number(doc?.ImporteIva1) || 0) + (Number(doc?.ImporteIva2) || 0);
}

function asegurarGrupo(mapa, clave, inicial) {
  if (!mapa[clave]) mapa[clave] = inicial;
  return mapa[clave];
}

function mapearNotaObservacion(nc, motivo) {
  return {
    numero: `${nc.DocumentoSucursal}-${nc.DocumentoNumero}`,
    fecha: nc.Fecha,
    tipo: nc.DocumentoTipo,
    cliente: nc['Cliente.Descripcion'] || nc.Cliente?.Descripcion || 'Sin cliente',
    monto: Number(nc.ImporteTotal) || 0,
    motivo
  };
}

function clasificarNotasSinAsociar(notasDelPeriodo = [], facturasMap) {
  const sinAsociar = [];
  for (const nc of notasDelPeriodo || []) {
    const origen = encontrarFacturaOrigen(nc, facturasMap);
    if (origen) continue;
    const tieneOrigen = Boolean(nc.factura_tipo && nc.factura_sucursal && nc.factura_numero);
    sinAsociar.push(mapearNotaObservacion(nc, tieneOrigen ? 'factura_fuera_periodo' : 'sin_origen'));
  }
  return sinAsociar;
}

function procesarFacturacionNeta(facturas = [], notas = [], agruparPor = 'dia', notasDelPeriodo = []) {
  const facturasMap = mapaFacturas(facturas);
  const notasLigadas = [];
  const notasSinAsociar = clasificarNotasSinAsociar(notasDelPeriodo, facturasMap);

  for (const nc of notas || []) {
    const origen = encontrarFacturaOrigen(nc, facturasMap);
    if (!origen) continue;
    notasLigadas.push({ nc, origen });
  }

  const totalVentas = facturas.reduce((sum, f) => sum + (Number(f.ImporteTotal) || 0), 0);
  const totalIvaFacturas = facturas.reduce((sum, f) => sum + ivaDe(f), 0);
  const totalBonificaciones = facturas.reduce((sum, f) => sum + (Number(f.ImporteBonificado) || 0), 0);
  const totalNotasCredito = notasLigadas.reduce((sum, { nc }) => sum + (Number(nc.ImporteTotal) || 0), 0);
  const totalIvaNc = notasLigadas.reduce((sum, { nc }) => sum + ivaDe(nc), 0);
  const totalVentasNetas = totalVentas - totalNotasCredito;
  const totalIva = totalIvaFacturas - totalIvaNc;

  const estadisticasGenerales = {
    totalFacturas: facturas.length,
    totalVentas,
    totalNotasCredito,
    cantidadNotasCredito: notasLigadas.length,
    totalVentasNetas,
    totalIva,
    totalBonificaciones,
    promedioTicket: facturas.length > 0 ? totalVentasNetas / facturas.length : 0,
    facturasConCae: facturas.filter((f) => f.afip_cae).length,
    facturasSinCae: facturas.filter((f) => !f.afip_cae).length
  };

  const agrupacionPorPeriodo = {};
  const agrupacionPorTipo = {};
  const agrupacionPorVendedor = {};
  const agrupacionPorCliente = {};

  for (const factura of facturas) {
    const fecha = parseFecha(factura.Fecha);
    if (fecha) {
      const clave = clavePeriodo(fecha, agruparPor);
      const grupo = asegurarGrupo(agrupacionPorPeriodo, clave, {
        periodo: clave,
        cantidad: 0,
        monto: 0,
        iva: 0
      });
      grupo.cantidad += 1;
      grupo.monto += Number(factura.ImporteTotal) || 0;
      grupo.iva += ivaDe(factura);
    }

    const tipo = factura.DocumentoTipo;
    const grupoTipo = asegurarGrupo(agrupacionPorTipo, tipo, { tipo, cantidad: 0, monto: 0 });
    grupoTipo.cantidad += 1;
    grupoTipo.monto += Number(factura.ImporteTotal) || 0;

    const codigoVendedor = factura.VendedorCodigo || 'SIN_VENDEDOR';
    const grupoVend = asegurarGrupo(agrupacionPorVendedor, codigoVendedor, {
      codigo: codigoVendedor,
      nombre: factura.Vendedor?.Descripcion || 'Sin vendedor',
      cantidad: 0,
      monto: 0
    });
    grupoVend.cantidad += 1;
    grupoVend.monto += Number(factura.ImporteTotal) || 0;

    const codigoCliente = factura.ClienteCodigo || 'SIN_CLIENTE';
    const grupoCli = asegurarGrupo(agrupacionPorCliente, codigoCliente, {
      codigo: codigoCliente,
      nombre: factura.Cliente?.Descripcion || 'Sin cliente',
      cantidad: 0,
      monto: 0
    });
    grupoCli.cantidad += 1;
    grupoCli.monto += Number(factura.ImporteTotal) || 0;
  }

  for (const { nc, origen } of notasLigadas) {
    const importe = Number(nc.ImporteTotal) || 0;
    const iva = ivaDe(nc);
    const fechaOrigen = parseFecha(origen.Fecha);
    if (fechaOrigen) {
      const clave = clavePeriodo(fechaOrigen, agruparPor);
      const grupo = agrupacionPorPeriodo[clave];
      if (grupo) {
        grupo.monto -= importe;
        grupo.iva -= iva;
      }
    }

    const grupoTipo = agrupacionPorTipo[origen.DocumentoTipo];
    if (grupoTipo) grupoTipo.monto -= importe;

    const codigoVendedor = origen.VendedorCodigo || 'SIN_VENDEDOR';
    if (agrupacionPorVendedor[codigoVendedor]) {
      agrupacionPorVendedor[codigoVendedor].monto -= importe;
    }

    const codigoCliente = origen.ClienteCodigo || 'SIN_CLIENTE';
    if (agrupacionPorCliente[codigoCliente]) {
      agrupacionPorCliente[codigoCliente].monto -= importe;
    }
  }

  return {
    estadisticasGenerales,
    evolucionVentas: Object.values(agrupacionPorPeriodo).sort((a, b) =>
      a.periodo.localeCompare(b.periodo)
    ),
    agrupacionPorTipo: Object.values(agrupacionPorTipo),
    agrupacionPorVendedor: Object.values(agrupacionPorVendedor).sort((a, b) => b.monto - a.monto),
    agrupacionPorCliente: Object.values(agrupacionPorCliente)
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 10),
    facturas: facturas.map((f) => ({
      numero: `${f.DocumentoSucursal}-${f.DocumentoNumero}`,
      fecha: f.Fecha,
      cliente: f.Cliente?.Descripcion || 'Sin cliente',
      vendedor: f.Vendedor?.Descripcion || 'Sin vendedor',
      monto: Number(f.ImporteTotal) || 0,
      tipo: f.DocumentoTipo,
      tieneCae: !!f.afip_cae
    })),
    notasCredito: notasLigadas.map(({ nc, origen }) => ({
      numero: `${nc.DocumentoSucursal}-${nc.DocumentoNumero}`,
      fecha: nc.Fecha,
      tipo: nc.DocumentoTipo,
      facturaOrigen: `${origen.DocumentoTipo}-${origen.DocumentoSucursal}-${origen.DocumentoNumero}`,
      cliente: origen.Cliente?.Descripcion || nc['Cliente.Descripcion'] || 'Sin cliente',
      monto: Number(nc.ImporteTotal) || 0
    })),
    observacion: {
      cantidad: notasSinAsociar.length,
      importe: notasSinAsociar.reduce((sum, nc) => sum + (Number(nc.monto) || 0), 0),
      notas: notasSinAsociar
    }
  };
}

module.exports = {
  normalizarTipo,
  mapaFacturas,
  encontrarFacturaOrigen,
  clasificarNotasSinAsociar,
  procesarFacturacionNeta
};
