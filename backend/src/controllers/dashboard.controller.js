const { Op } = require('sequelize');
const moment = require('moment-timezone');

/**
 * Obtener estado de vendedores para el dashboard
 */
exports.getEstadoVendedores = async (req, res) => {
  try {
    const { PreventaCabeza, Vendedor, Cliente } = req.models;

    // Obtener todos los vendedores activos
    const vendedores = await Vendedor.findAll({
      where: {
        Activo: true
      },
      order: [['Descripcion', 'ASC']]
    });

    // Fecha de inicio del día (hoy a las 00:00)
    const inicioHoy = moment().tz('America/Argentina/Buenos_Aires').startOf('day').toDate();
    
    // Fecha de hace 7 días para considerar inactividad
    const hace7Dias = moment().tz('America/Argentina/Buenos_Aires').subtract(7, 'days').toDate();

    // Obtener información de cada vendedor
    const vendedoresConInfo = await Promise.all(
      vendedores.map(async (vendedor) => {
        // Buscar la última preventa del vendedor
        const ultimaPreventa = await PreventaCabeza.findOne({
          where: {
            VendedorCodigo: vendedor.Codigo,
            Fecha: {
              [Op.gte]: hace7Dias
            }
          },
          include: [{
            model: Cliente,
            as: 'Cliente',
            attributes: ['Descripcion']
          }],
          order: [['Fecha', 'DESC']],
          limit: 1
        });

        // Contar preventas sin facturar (pendientes)
        // Una preventa está sin facturar si FacturaNumero es null o vacío y no está anulada
        const preventasSinFacturar = await PreventaCabeza.count({
          where: {
            VendedorCodigo: vendedor.Codigo,
            FechaAnulacion: null,
            [Op.or]: [
              { FacturaNumero: null },
              { FacturaNumero: '' }
            ]
          }
        });

        // Obtener lista de preventas pendientes
        const preventasPendientes = await PreventaCabeza.findAll({
          where: {
            VendedorCodigo: vendedor.Codigo,
            FechaAnulacion: null,
            [Op.or]: [
              { FacturaNumero: null },
              { FacturaNumero: '' }
            ]
          },
          include: [{
            model: Cliente,
            as: 'Cliente',
            attributes: ['Descripcion']
          }],
          order: [['Fecha', 'DESC']],
          limit: 10
        });

        // Determinar si el vendedor está activo hoy
        const activoHoy = ultimaPreventa && 
          moment(ultimaPreventa.Fecha).tz('America/Argentina/Buenos_Aires').isAfter(inicioHoy);

        return {
          codigo: vendedor.Codigo,
          nombre: vendedor.Descripcion,
          activo: activoHoy,
          ultimoPedido: ultimaPreventa ? {
            fecha: ultimaPreventa.Fecha,
            numero: `${ultimaPreventa.DocumentoTipo}-${ultimaPreventa.DocumentoSucursal.toString().padStart(4, '0')}-${ultimaPreventa.DocumentoNumero.toString().padStart(8, '0')}`,
            cliente: ultimaPreventa.Cliente?.Descripcion || 'Sin cliente'
          } : null,
          pedidosSinFacturar: preventasSinFacturar,
          pedidosPendientes: preventasPendientes.map(p => ({
            numero: `${p.DocumentoTipo}-${p.DocumentoSucursal.toString().padStart(4, '0')}-${p.DocumentoNumero.toString().padStart(8, '0')}`,
            fecha: p.Fecha,
            cliente: p.Cliente?.Descripcion || 'Sin cliente',
            enviado: !!p.FechaHoraEnvio
          }))
        };
      })
    );

    // Calcular resumen
    const totalActivos = vendedoresConInfo.filter(v => v.activo).length;
    const totalPedidosPendientes = vendedoresConInfo.reduce((sum, v) => sum + v.pedidosSinFacturar, 0);
    const vendedorConMasPedidos = vendedoresConInfo.reduce((max, v) => 
      v.pedidosSinFacturar > (max?.pedidosSinFacturar || 0) ? v : max
    , null);

    res.json({
      success: true,
      vendedores: vendedoresConInfo,
      resumen: {
        totalVendedores: vendedores.length,
        totalActivos,
        totalPedidosPendientes,
        vendedorConMasPedidos: vendedorConMasPedidos?.nombre || null
      }
    });

  } catch (error) {
    console.error('Error al obtener estado de vendedores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estado de vendedores',
      error: error.message
    });
  }
};

/**
 * Obtener resumen del día para el dashboard
 */
exports.getResumenDia = async (req, res) => {
  try {
    const { FacturaCabeza, FacturaItem } = req.models;

    // Fecha de inicio del día
    const inicioHoy = moment().tz('America/Argentina/Buenos_Aires').startOf('day').toDate();
    const finHoy = moment().tz('America/Argentina/Buenos_Aires').endOf('day').toDate();

    // Ventas del día
    const ventasHoy = await FacturaCabeza.findAll({
      where: {
        Fecha: {
          [Op.between]: [inicioHoy, finHoy]
        },
        Anulado: false
      },
      include: [{
        model: FacturaItem,
        as: 'items'
      }]
    });

    // Calcular totales
    const montoTotal = ventasHoy.reduce((sum, factura) => {
      const totalFactura = factura.items.reduce((itemSum, item) => 
        itemSum + (parseFloat(item.Importe) || 0), 0
      );
      return sum + totalFactura;
    }, 0);

    const cantidadFacturas = ventasHoy.length;

    // Calcular ticket promedio
    const ticketPromedio = cantidadFacturas > 0 ? montoTotal / cantidadFacturas : 0;

    // Ventas de ayer para comparación
    const inicioAyer = moment().tz('America/Argentina/Buenos_Aires').subtract(1, 'day').startOf('day').toDate();
    const finAyer = moment().tz('America/Argentina/Buenos_Aires').subtract(1, 'day').endOf('day').toDate();

    const ventasAyer = await FacturaCabeza.findAll({
      where: {
        Fecha: {
          [Op.between]: [inicioAyer, finAyer]
        },
        Anulado: false
      },
      include: [{
        model: FacturaItem,
        as: 'items'
      }]
    });

    const montoAyer = ventasAyer.reduce((sum, factura) => {
      const totalFactura = factura.items.reduce((itemSum, item) => 
        itemSum + (parseFloat(item.Importe) || 0), 0
      );
      return sum + totalFactura;
    }, 0);

    // Calcular comparativa
    const comparativa = montoAyer > 0 ? ((montoTotal - montoAyer) / montoAyer) * 100 : 0;

    res.json({
      success: true,
      ventasHoy: {
        monto: montoTotal,
        cantidad: cantidadFacturas,
        comparativa: comparativa.toFixed(2)
      },
      ticketPromedio: ticketPromedio.toFixed(2)
    });

  } catch (error) {
    console.error('Error al obtener resumen del día:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen del día',
      error: error.message
    });
  }
};

/**
 * Obtener productos con stock crítico
 */
exports.getStockCritico = async (req, res) => {
  try {
    const { Articulo } = req.models;

    // Productos sin stock o con stock 0
    const sinStock = await Articulo.findAll({
      where: {
        [Op.or]: [
          { Existencia: { [Op.lte]: 0 } },
          { Existencia: null }
        ],
        [Op.or]: [
          { Activo: 1 },
          { Estado: 'A' }
        ]
      },
      order: [['Descripcion', 'ASC']],
      limit: 10,
      raw: true
    });

    // Productos bajo mínimo
    // Intentar con ExistenciaMinima y StockMinimo
    const bajoMinimo = await Articulo.findAll({
      where: {
        Existencia: { [Op.gt]: 0 },
        [Op.or]: [
          req.db.literal('Existencia < COALESCE(ExistenciaMinima, StockMinimo, 999999)'),
          req.db.literal('(ExistenciaMinima > 0 AND Existencia < ExistenciaMinima)'),
          req.db.literal('(StockMinimo > 0 AND Existencia < StockMinimo)')
        ],
        [Op.or]: [
          { Activo: 1 },
          { Estado: 'A' }
        ]
      },
      order: [['Existencia', 'ASC']],
      limit: 10,
      raw: true
    });

    res.json({
      success: true,
      sinStock: sinStock.map(a => ({
        codigo: a.Codigo,
        descripcion: a.Descripcion,
        existencia: a.Existencia || 0,
        stockMinimo: a.ExistenciaMinima || a.StockMinimo || 0
      })),
      bajoMinimo: bajoMinimo.map(a => ({
        codigo: a.Codigo,
        descripcion: a.Descripcion,
        existencia: a.Existencia || 0,
        stockMinimo: a.ExistenciaMinima || a.StockMinimo || 0
      }))
    });

  } catch (error) {
    console.error('Error al obtener stock crítico:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener stock crítico',
      error: error.message
    });
  }
};

/**
 * Obtener actividad reciente
 */
exports.getActividadReciente = async (req, res) => {
  try {
    const { FacturaCabeza, Cliente } = req.models;

    // Últimas 10 facturas
    const ultimasFacturas = await FacturaCabeza.findAll({
      include: [{
        model: Cliente,
        as: 'cliente',
        attributes: ['Descripcion']
      }],
      order: [['Fecha', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      ultimasFacturas: ultimasFacturas.map(f => ({
        tipo: f.Tipo,
        sucursal: f.Sucursal,
        numero: f.Numero,
        fecha: f.Fecha,
        cliente: f.cliente?.Descripcion || 'Sin cliente',
        total: f.Total
      }))
    });

  } catch (error) {
    console.error('Error al obtener actividad reciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener actividad reciente',
      error: error.message
    });
  }
};

/**
 * Obtener gráficos para el dashboard
 */
exports.getGraficos = async (req, res) => {
  try {
    const { FacturaCabeza, FacturaItem, Articulo } = req.models;

    // Ventas de los últimos 7 días
    const hace7Dias = moment().tz('America/Argentina/Buenos_Aires').subtract(7, 'days').startOf('day').toDate();
    const hoy = moment().tz('America/Argentina/Buenos_Aires').endOf('day').toDate();

    const ventasSemanales = await FacturaCabeza.findAll({
      where: {
        Fecha: {
          [Op.between]: [hace7Dias, hoy]
        },
        Anulado: false
      },
      include: [{
        model: FacturaItem,
        as: 'items'
      }],
      order: [['Fecha', 'ASC']]
    });

    // Agrupar por día
    const ventasPorDia = {};
    for (let i = 0; i < 7; i++) {
      const fecha = moment().tz('America/Argentina/Buenos_Aires').subtract(i, 'days').format('YYYY-MM-DD');
      ventasPorDia[fecha] = 0;
    }

    ventasSemanales.forEach(factura => {
      const fecha = moment(factura.Fecha).tz('America/Argentina/Buenos_Aires').format('YYYY-MM-DD');
      const total = factura.items.reduce((sum, item) => sum + (parseFloat(item.Importe) || 0), 0);
      if (ventasPorDia.hasOwnProperty(fecha)) {
        ventasPorDia[fecha] += total;
      }
    });

    // Productos más vendidos del mes
    const inicioMes = moment().tz('America/Argentina/Buenos_Aires').startOf('month').toDate();
    
    const productosMasVendidos = await FacturaItem.findAll({
      attributes: [
        'CodigoArticulo',
        [req.db.fn('SUM', req.db.col('Cantidad')), 'totalVendido']
      ],
      include: [
        {
          model: FacturaCabeza,
          as: 'factura',
          where: {
            Fecha: {
              [Op.gte]: inicioMes
            },
            Anulado: false
          },
          attributes: []
        },
        {
          model: Articulo,
          as: 'articulo',
          attributes: ['Descripcion']
        }
      ],
      group: ['CodigoArticulo', 'articulo.Codigo'],
      order: [[req.db.fn('SUM', req.db.col('Cantidad')), 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      ventasSemanales: Object.entries(ventasPorDia)
        .map(([fecha, monto]) => ({ fecha, monto }))
        .reverse(),
      productosMasVendidos: productosMasVendidos.map(p => ({
        nombre: p.articulo?.Descripcion || 'Producto desconocido',
        cantidad: parseInt(p.dataValues.totalVendido) || 0
      }))
    });

  } catch (error) {
    console.error('Error al obtener gráficos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener gráficos',
      error: error.message
    });
  }
};
