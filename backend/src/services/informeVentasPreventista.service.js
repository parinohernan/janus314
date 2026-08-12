const { QueryTypes } = require('sequelize');
const {
  JOIN_PREVENTA_A_FACTURA,
  WHERE_PREVENTA_VIGENTE_FACTURADA,
  claveFacturaNormalizada,
} = require('./preventaFacturaLink.service');

const TIPOS_FACTURA_DEFAULT = ['FCA', 'FCB', 'FCC', 'PRF'];
const TIPOS_NC_DEFAULT = ['NCA', 'NCB', 'NCF'];

function normalizarTipo(tipo) {
  if (!tipo) return null;
  const tipoUpper = String(tipo).toUpperCase();
  if (tipoUpper === 'A') return 'FCA';
  if (tipoUpper === 'B') return 'FCB';
  if (tipoUpper === 'C') return 'FCC';
  if (tipoUpper === 'F') return 'PRF';
  return tipoUpper;
}

/**
 * Parsea lista de tipos desde query.
 * - ausente/null → defaults (todos)
 * - string vacío o array vacío → ninguno
 * - CSV / array → intersección con allowed
 */
function parseTipos(value, allowed, defaults) {
  if (value === undefined || value === null) {
    return [...defaults];
  }

  let raw = [];
  if (Array.isArray(value)) {
    raw = value;
  } else if (typeof value === 'string') {
    if (!value.trim()) return [];
    raw = value.split(/[,|]/).map((s) => s.trim()).filter(Boolean);
  } else {
    return [...defaults];
  }

  if (raw.length === 0) return [];

  const allowedSet = new Set(allowed);
  return [...new Set(raw.map((t) => String(t).toUpperCase()).filter((t) => allowedSet.has(t)))];
}

/**
 * NC ligadas a un set de facturas (misma lógica que el informe por vendedor de factura).
 * @param {string[]|null} tiposNc - si array vacío, no busca NC; si null/undefined usa default
 */
async function obtenerNotasCreditoDeFacturas(NotaCredito, Cliente, facturas, tiposNc = null) {
  const tiposPermitidos = Array.isArray(tiposNc) ? tiposNc : [...TIPOS_NC_DEFAULT];
  if (!facturas.length || tiposPermitidos.length === 0) return [];

  const facturasMap = new Map();
  facturas.forEach((f) => {
    const tipo = f.DocumentoTipo || f.tipo;
    const suc = f.DocumentoSucursal ?? f.sucursal;
    const num = f.DocumentoNumero ?? f.numeroDoc;
    facturasMap.set(`${tipo}-${suc}-${num}`, f);
    facturasMap.set(`${tipo}-${parseInt(suc, 10)}-${parseInt(num, 10)}`, f);
  });

  const todasLasNC = await NotaCredito.findAll({
    where: {
      FechaAnulacion: null,
      DocumentoTipo: tiposPermitidos
    },
    attributes: [
      'DocumentoTipo',
      'DocumentoSucursal',
      'DocumentoNumero',
      'Fecha',
      'CodigoCliente',
      'ImporteTotal',
      'factura_tipo',
      'factura_sucursal',
      'factura_numero'
    ],
    include: [
      {
        model: Cliente,
        attributes: ['Codigo', 'Descripcion'],
        required: false
      }
    ],
    raw: true
  });

  const notasCredito = [];
  for (const nc of todasLasNC) {
    if (!nc.factura_tipo || !nc.factura_sucursal || !nc.factura_numero) continue;
    const tipoNormalizado = normalizarTipo(nc.factura_tipo);
    const claves = [
      `${tipoNormalizado}-${nc.factura_sucursal}-${nc.factura_numero}`,
      `${String(nc.factura_tipo).toUpperCase()}-${nc.factura_sucursal}-${nc.factura_numero}`,
      `${tipoNormalizado}-${parseInt(nc.factura_sucursal, 10)}-${parseInt(nc.factura_numero, 10)}`
    ];
    for (const clave of claves) {
      if (facturasMap.has(clave)) {
        notasCredito.push(nc);
        break;
      }
    }
  }
  return notasCredito;
}

/**
 * Facturas atribuidas al preventista (preventa_cabeza.VendedorCodigo) en un rango de fechas de factura.
 * @param {{ db: import('sequelize').Sequelize, models: object }} ctx
 * @param {{ fechaDesde: string, fechaHasta: string, vendedorCodigo: string, pagoTipo?: string, tiposFactura?: string|string[], tiposNotaCredito?: string|string[] }} query
 */
async function obtenerDatosInformePreventista(ctx, query) {
  const { fechaDesde, fechaHasta, vendedorCodigo, pagoTipo, tiposFactura, tiposNotaCredito } = query;
  const { NotaCredito, Vendedor, Cliente } = ctx.models || {};

  if (!fechaDesde || !fechaHasta || !vendedorCodigo) {
    const error = new Error('Se requieren fechaDesde, fechaHasta y vendedorCodigo');
    error.statusCode = 400;
    throw error;
  }

  if (!ctx.db || !NotaCredito || !Vendedor || !Cliente) {
    const error = new Error('Error: modelos o conexión no disponibles');
    error.statusCode = 500;
    throw error;
  }

  const tiposFacturaFiltro = parseTipos(tiposFactura, TIPOS_FACTURA_DEFAULT, TIPOS_FACTURA_DEFAULT);
  const tiposNcFiltro = parseTipos(tiposNotaCredito, TIPOS_NC_DEFAULT, TIPOS_NC_DEFAULT);

  const replacements = { fechaDesde, fechaHasta, vendedorCodigo };
  let pagoFiltro = '';
  if (pagoTipo) {
    replacements.pagoTipo = pagoTipo;
    pagoFiltro = 'AND f.PagoTipo = :pagoTipo';
  }

  let facturas = [];

  if (tiposFacturaFiltro.length > 0) {
    tiposFacturaFiltro.forEach((tipo, i) => {
      replacements[`tipoFactura${i}`] = tipo;
    });
    const tiposIn = tiposFacturaFiltro.map((_, i) => `:tipoFactura${i}`).join(', ');

    const rows = await ctx.db.query(
      `
      SELECT
        f.DocumentoTipo,
        f.DocumentoSucursal,
        f.DocumentoNumero,
        f.Fecha,
        f.ClienteCodigo,
        f.ImporteTotal,
        f.VendedorCodigo AS VendedorFacturaCodigo,
        p.DocumentoTipo AS PreventaTipo,
        p.DocumentoSucursal AS PreventaSucursal,
        p.DocumentoNumero AS PreventaNumero,
        c.Descripcion AS ClienteDescripcion
      FROM preventa_cabeza p
      ${JOIN_PREVENTA_A_FACTURA}
      LEFT JOIN t_clientes c ON c.Codigo = f.ClienteCodigo
      WHERE p.VendedorCodigo = :vendedorCodigo
        AND ${WHERE_PREVENTA_VIGENTE_FACTURADA}
        AND f.FechaAnulacion IS NULL
        AND f.Fecha BETWEEN :fechaDesde AND :fechaHasta
        AND f.DocumentoTipo IN (${tiposIn})
        ${pagoFiltro}
      ORDER BY f.Fecha ASC, f.DocumentoTipo ASC, f.DocumentoSucursal ASC, f.DocumentoNumero ASC
      `,
      { replacements, type: QueryTypes.SELECT }
    );

    const seen = new Set();
    for (const row of rows) {
      const key = claveFacturaNormalizada(
        row.DocumentoTipo,
        row.DocumentoSucursal,
        row.DocumentoNumero
      );
      if (seen.has(key)) continue;
      seen.add(key);
      facturas.push(row);
    }
  }

  const notasCredito = await obtenerNotasCreditoDeFacturas(
    NotaCredito,
    Cliente,
    facturas,
    tiposNcFiltro
  );

  const totalFacturas = facturas.reduce((sum, f) => sum + (parseFloat(f.ImporteTotal) || 0), 0);
  const totalNotasCredito = notasCredito.reduce((sum, nc) => sum + (parseFloat(nc.ImporteTotal) || 0), 0);
  const totalGeneral = totalFacturas - totalNotasCredito;

  const vendedor = await Vendedor.findByPk(vendedorCodigo, {
    attributes: ['Codigo', 'Descripcion'],
    raw: true
  });

  return {
    origen: 'preventa',
    titulo: 'Informe de Ventas por Preventista',
    vendedor: {
      codigo: vendedorCodigo,
      descripcion: vendedor ? vendedor.Descripcion : 'Vendedor no encontrado'
    },
    periodo: { fechaDesde, fechaHasta },
    filtrosAplicados: {
      tiposFactura: tiposFacturaFiltro,
      tiposNotaCredito: tiposNcFiltro,
      pagoTipo: pagoTipo || null
    },
    facturas: facturas.map((f) => ({
      tipo: f.DocumentoTipo,
      numero: `${f.DocumentoSucursal}-${f.DocumentoNumero}`,
      fecha: f.Fecha,
      clienteCodigo: f.ClienteCodigo,
      clienteDescripcion: f.ClienteDescripcion || 'Sin descripción',
      importe: parseFloat(f.ImporteTotal) || 0,
      preventa: {
        tipo: f.PreventaTipo,
        sucursal: f.PreventaSucursal,
        numero: f.PreventaNumero,
        label: `${f.PreventaTipo}-${f.PreventaSucursal}-${f.PreventaNumero}`
      },
      vendedorFactura: f.VendedorFacturaCodigo || null
    })),
    notasCredito: notasCredito.map((nc) => ({
      tipo: nc.DocumentoTipo,
      numero: `${nc.DocumentoSucursal}-${nc.DocumentoNumero}`,
      fecha: nc.Fecha,
      clienteCodigo: nc.CodigoCliente,
      clienteDescripcion: nc['Cliente.Descripcion'] || 'Sin descripción',
      importe: -(parseFloat(nc.ImporteTotal) || 0),
      facturaRelacionada: `${nc.factura_tipo}-${nc.factura_sucursal}-${nc.factura_numero}`
    })),
    totales: {
      facturas: { cantidad: facturas.length, importe: totalFacturas },
      notasCredito: { cantidad: notasCredito.length, importe: -totalNotasCredito },
      general: totalGeneral
    }
  };
}

module.exports = {
  TIPOS_FACTURA_DEFAULT,
  TIPOS_NC_DEFAULT,
  parseTipos,
  obtenerDatosInformePreventista,
  obtenerNotasCreditoDeFacturas
};
