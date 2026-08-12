const { QueryTypes } = require('sequelize');
const PDFDocument = require('pdfkit');
const renderInformeRubrosProvincia = require('../templates/pdf/informeRubrosProvincia.template');

/**
 * Datos del informe de ventas/NC por rubro agrupado por provincia.
 * @param {{ db: import('sequelize').Sequelize, models?: object }} ctx
 * @param {{ fechaDesde: string, fechaHasta: string, pagoTipo?: string, provinciaCodigo?: string, tipo?: string }} query
 */
async function obtenerDatosVentasPorRubroProvincia(ctx, query) {
  try {
    const { fechaDesde, fechaHasta, pagoTipo, provinciaCodigo, tipo = 'facturas' } = query;
    const esNotasCredito = tipo === 'notasCredito';
    const tablaCabeza = esNotasCredito ? 'notacreditocabeza' : 'facturacabeza';
    const tablaItems = esNotasCredito ? 'notacreditoitems' : 'facturaitems';
    const campoCliente = esNotasCredito ? 'CodigoCliente' : 'ClienteCodigo';

    if (!fechaDesde || !fechaHasta) {
      const error = new Error('Se requieren fechaDesde y fechaHasta');
      error.statusCode = 400;
      throw error;
    }

    if (!ctx?.db) {
      const error = new Error('Error: conexión de empresa no disponible');
      error.statusCode = 500;
      throw error;
    }

    const replacements = {
      fechaDesde,
      fechaHasta
    };
    const filtros = [
      'fc.Fecha BETWEEN :fechaDesde AND :fechaHasta',
      'fc.FechaAnulacion IS NULL',
      "CAST(COALESCE(NULLIF(TRIM(fc.afip_cae), ''), '0') AS UNSIGNED) > 0"
    ];

    if (!esNotasCredito) {
      filtros.push("fc.DocumentoTipo IN ('FCA', 'FCB', 'FCC', 'PRF')");
    }

    if (pagoTipo && !esNotasCredito) {
      replacements.pagoTipo = pagoTipo;
      filtros.push('fc.PagoTipo = :pagoTipo');
    }

    if (provinciaCodigo) {
      replacements.provinciaCodigo = provinciaCodigo;
      filtros.push('COALESCE(c.ProvinciaCodigo, cp.Provincia) = :provinciaCodigo');
    }

    const importeItem = esNotasCredito
      ? 'COALESCE(fi.PrecioUnitario, 0) * COALESCE(fi.Cantidad, 0)'
      : 'CASE WHEN COALESCE(fi.ImporteBonificado, 0) <> 0 THEN fi.ImporteBonificado ELSE COALESCE(fi.PrecioUnitario, 0) * COALESCE(fi.Cantidad, 0) END';
    const categoria = "UPPER(COALESCE(ci.Descripcion, ''))";
    const iva = 'ROUND(COALESCE(a.PorcentajeIVA1, 0), 1)';

    const rows = await ctx.db.query(
      `
      SELECT
        COALESCE(p_cli.Codigo, p_cp.Codigo, 'SIN_PROVINCIA') AS provinciaCodigo,
        COALESCE(p_cli.Descripcion, p_cp.Descripcion, 'Sin provincia') AS provinciaDescripcion,
        COALESCE(r.Codigo, 'SIN_RUBRO') AS rubroCodigo,
        COALESCE(r.Descripcion, 'Sin Rubro') AS rubroDescripcion,
        SUM(COALESCE(fi.Cantidad, 0)) AS cantidadTotal,

        SUM(CASE
          WHEN (${categoria} LIKE '%INSCRIP%' OR ${categoria} LIKE '%RESPONSABLE%')
           AND ${iva} = 10.5
          THEN ${importeItem}
          ELSE 0
        END) AS ri105,

        SUM(CASE
          WHEN (${categoria} LIKE '%INSCRIP%' OR ${categoria} LIKE '%RESPONSABLE%')
           AND ${iva} = 21.0
          THEN ${importeItem}
          ELSE 0
        END) AS ri21,

        SUM(CASE
          WHEN ${categoria} LIKE '%MONOTR%'
           AND ${iva} = 10.5
          THEN ${importeItem}
          ELSE 0
        END) AS rm105,

        SUM(CASE
          WHEN ${categoria} LIKE '%MONOTR%'
           AND ${iva} = 21.0
          THEN ${importeItem}
          ELSE 0
        END) AS rm21,

        SUM(CASE
          WHEN ${categoria} NOT LIKE '%INSCRIP%'
           AND ${categoria} NOT LIKE '%RESPONSABLE%'
           AND ${categoria} NOT LIKE '%MONOTR%'
           AND ${iva} = 10.5
          THEN ${importeItem}
          ELSE 0
        END) AS otros105,

        SUM(CASE
          WHEN ${categoria} NOT LIKE '%INSCRIP%'
           AND ${categoria} NOT LIKE '%RESPONSABLE%'
           AND ${categoria} NOT LIKE '%MONOTR%'
           AND ${iva} = 21.0
          THEN ${importeItem}
          ELSE 0
        END) AS otros21,

        SUM(${importeItem}) AS total
      FROM ${tablaCabeza} fc
      INNER JOIN ${tablaItems} fi
        ON fi.DocumentoTipo = fc.DocumentoTipo
       AND fi.DocumentoSucursal = fc.DocumentoSucursal
       AND fi.DocumentoNumero = fc.DocumentoNumero
      INNER JOIN t_articulos a ON a.Codigo = fi.CodigoArticulo
      LEFT JOIN t_rubros r ON r.Codigo = a.RubroCodigo
      LEFT JOIN t_clientes c ON c.Codigo = fc.${campoCliente}
      LEFT JOIN t_categoriasiva ci ON ci.Codigo = c.CategoriaIva
      LEFT JOIN t_codigospostales cp ON cp.Codigo = c.CodigoPostal
      LEFT JOIN t_provincias p_cli ON p_cli.Codigo = c.ProvinciaCodigo
      LEFT JOIN t_provincias p_cp ON p_cp.Codigo = cp.Provincia
      WHERE ${filtros.join('\n        AND ')}
      GROUP BY
        COALESCE(p_cli.Codigo, p_cp.Codigo, 'SIN_PROVINCIA'),
        COALESCE(p_cli.Descripcion, p_cp.Descripcion, 'Sin provincia'),
        COALESCE(r.Codigo, 'SIN_RUBRO'),
        COALESCE(r.Descripcion, 'Sin Rubro')
      ORDER BY
        provinciaDescripcion ASC,
        rubroDescripcion ASC
      `,
      {
        replacements,
        type: QueryTypes.SELECT
      }
    );

    const columnas = ['ri105', 'ri21', 'rm105', 'rm21', 'otros105', 'otros21', 'total', 'cantidadTotal'];
    const crearTotales = () => columnas.reduce((acc, columna) => {
      acc[columna] = 0;
      return acc;
    }, {});
    const toNumber = (value) => Number.parseFloat(value) || 0;
    const provinciasMap = new Map();
    const totales = crearTotales();

    for (const row of rows) {
      const provinciaCodigoRow = row.provinciaCodigo || 'SIN_PROVINCIA';
      if (!provinciasMap.has(provinciaCodigoRow)) {
        provinciasMap.set(provinciaCodigoRow, {
          codigo: provinciaCodigoRow,
          descripcion: row.provinciaDescripcion || 'Sin provincia',
          rubros: [],
          subtotales: crearTotales()
        });
      }

      const provincia = provinciasMap.get(provinciaCodigoRow);
      const rubro = {
        codigo: row.rubroCodigo || 'SIN_RUBRO',
        descripcion: row.rubroDescripcion || 'Sin Rubro'
      };

      for (const columna of columnas) {
        rubro[columna] = toNumber(row[columna]);
        provincia.subtotales[columna] += rubro[columna];
        totales[columna] += rubro[columna];
      }

      provincia.rubros.push(rubro);
    }

    const provincias = Array.from(provinciasMap.values()).sort((a, b) =>
      a.descripcion.localeCompare(b.descripcion, 'es')
    );

    return {
      provincias,
      totales,
      totalVentas: totales.total,
      periodo: {
        fechaDesde,
        fechaHasta
      },
      filtrosAplicados: {
        pagoTipo: esNotasCredito ? null : (pagoTipo || null),
        provinciaCodigo: provinciaCodigo || null,
        tipo: esNotasCredito ? 'notasCredito' : 'facturas'
      },
      tipoInforme: esNotasCredito ? 'notasCredito' : 'facturas',
      titulo: esNotasCredito
        ? 'Informe de Notas de Crédito por Rubro y Provincia'
        : 'Informe de Ventas por Rubro y Provincia'
    };
  } catch (error) {
    console.error('Error obteniendo datos de ventas por rubro y provincia:', error);
    throw error;
  }
}

function buildFilename(data) {
  const prefijo = data.tipoInforme === 'notasCredito'
    ? 'notas-credito-rubros-provincia'
    : 'ventas-rubros-provincia';
  return `${prefijo}-${data.periodo.fechaDesde}-${data.periodo.fechaHasta}.pdf`;
}

/**
 * Genera el PDF del informe como Buffer (sin HTTP).
 * @param {{ db: import('sequelize').Sequelize, models?: object }} ctx
 * @param {object} query
 * @returns {Promise<{ buffer: Buffer, filename: string, data: object }>}
 */
async function generarPdfBuffer(ctx, query) {
  const data = await obtenerDatosVentasPorRubroProvincia(ctx, query);
  const { DatosEmpresa } = ctx.models || {};
  const datosEmpresa = DatosEmpresa ? await DatosEmpresa.findOne({ raw: true }) : {};

  const doc = new PDFDocument({
    margin: 30,
    size: 'A4',
    layout: 'landscape'
  });

  const filename = buildFilename(data);
  const bufferPromise = new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  await renderInformeRubrosProvincia(doc, data, datosEmpresa || {});
  doc.end();

  const buffer = await bufferPromise;
  return { buffer, filename, data };
}

module.exports = {
  obtenerDatosVentasPorRubroProvincia,
  generarPdfBuffer,
  buildFilename
};
