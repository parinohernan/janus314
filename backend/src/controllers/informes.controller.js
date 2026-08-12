const { Op, fn, col, QueryTypes } = require('sequelize');
const PDFDocument = require('pdfkit');
const renderInformeVendedor = require('../templates/pdf/informeVendedor.template');
const renderInformeClienteDetalle = require('../templates/pdf/informeClienteDetalle.template');
const {
  obtenerDatosVentasPorRubroProvincia,
  generarPdfBuffer
} = require('../services/informeRubrosProvincia.service');
const { exportarRubrosProvinciaADisco } = require('../services/reportesAuto.service');
const {
  obtenerDatosInformePreventista,
  TIPOS_FACTURA_DEFAULT,
  TIPOS_NC_DEFAULT,
  parseTipos,
  obtenerNotasCreditoDeFacturas
} = require('../services/informeVentasPreventista.service');

// Informe de ventas por productos
exports.ventasPorProductos = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, productos } = req.query;
    
    console.log("Parámetros recibidos:", { fechaDesde, fechaHasta, productos });
    
    if (!fechaDesde || !fechaHasta || !productos) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaDesde, fechaHasta y productos"
      });
    }

    // Obtener los modelos específicos de la empresa
    const { FacturaCabeza, FacturaItem, Articulo } = req.models;
    
    if (!FacturaCabeza || !FacturaItem || !Articulo) {
      return res.status(500).json({
        success: false,
        message: "Error: Modelos no disponibles"
      });
    }

    const productosIds = productos.split(',');
    console.log("IDs de productos:", productosIds);
    
    // Construir la consulta para facturas
    const whereClause = {
      Fecha: {
        [Op.between]: [fechaDesde, fechaHasta]
      },
      FechaAnulacion: null // Excluir facturas anuladas
    };
    
    // Obtener las facturas en el rango de fechas
    const facturas = await FacturaCabeza.findAll({
      where: whereClause,
      attributes: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero', 'ClienteCodigo', 'Fecha', 'FechaAnulacion'],
      raw: true,
      nest: false
    });

    console.log("Facturas encontradas:", facturas.length);
    
    // Obtener los items de las facturas
    const items = [];
    for (const factura of facturas) {
      const itemsFactura = await FacturaItem.findAll({
        where: {
          DocumentoTipo: factura.DocumentoTipo,
          DocumentoSucursal: factura.DocumentoSucursal,
          DocumentoNumero: factura.DocumentoNumero,
          CodigoArticulo: { [Op.in]: productosIds }
        },
        attributes: ['CodigoArticulo', 'Cantidad', 'PrecioUnitario', 'ImporteBonificado'],
        raw: true
      });
      items.push(...itemsFactura);
    }

    // Obtener la información de los artículos usando findByPk
    const articulos = await Promise.all(
      productosIds.map(codigo => 
        Articulo.findByPk(codigo, {
          attributes: ['Codigo', 'Descripcion'],
          raw: true
        })
      )
    );

    // Crear un mapa de artículos para fácil acceso
    const articulosMap = articulos.reduce((acc, articulo) => {
      if (articulo) {
        acc[articulo.Codigo] = articulo.Descripcion;
      }
      return acc;
    }, {});

    // Agrupar los items por código de artículo
    const itemsAgrupados = items.reduce((acumulado, item) => {
      const codigo = item.CodigoArticulo;
      if (!acumulado[codigo]) {
        acumulado[codigo] = {
          codigo: codigo,
          descripcion: articulosMap[codigo] || 'Artículo no encontrado',
          cantidad: 0,
          importeTotal: 0
        };
      }
      acumulado[codigo].cantidad += item.Cantidad;
      acumulado[codigo].importeTotal += item.ImporteBonificado || (item.PrecioUnitario * item.Cantidad);
      return acumulado;
    }, {});

    // Convertir el objeto a array y ordenar por cantidad
    const resultado = Object.values(itemsAgrupados).sort((a, b) => b.cantidad - a.cantidad);

    res.json({
      success: true,
      data: {
        productos: resultado,
        totalVentas: resultado.reduce((total, item) => total + item.importeTotal, 0)
      }
    });
  } catch (error) {
    console.error("Error al generar informe de ventas por productos:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar el informe",
      error: error.message
    });
  }
}; 

// ================================================================
// ESTADÍSTICAS DE VENDEDORES
// ================================================================

// Estadísticas de ventas por vendedor
exports.ventasPorVendedor = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, vendedorCodigo } = req.query;
    
    // Validar parámetros
    if (!fechaDesde || !fechaHasta) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaDesde y fechaHasta"
      });
    }

    // Obtener los modelos específicos de la empresa
    const { FacturaCabeza } = req.models;
    
    if (!FacturaCabeza) {
      return res.status(500).json({
        success: false,
        message: "Error: Modelo no disponible"
      });
    }

    // Construir consulta base
    const whereClause = {
      Fecha: { [Op.between]: [fechaDesde, fechaHasta] },
      FechaAnulacion: null // Excluir facturas anuladas
    };

    // Si se especifica un vendedor, filtrar por él
    if (vendedorCodigo) {
      whereClause.VendedorCodigo = vendedorCodigo;
    }
    
    // Obtener estadísticas de ventas
    const ventasStats = await FacturaCabeza.findAll({
      where: whereClause,
      attributes: [
        'VendedorCodigo',
        [fn('COUNT', col('DocumentoNumero')), 'totalComprobantes'],
        [fn('SUM', col('ImporteTotal')), 'montoTotal']
      ],
      group: ['VendedorCodigo'],
      raw: true
    });

    res.json({
      success: true,
      data: ventasStats
    });
  } catch (error) {
    console.error("Error al generar informe de ventas por vendedor:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar el informe",
      error: error.message
    });
  }
};

// Estadísticas de productos vendidos por vendedor
exports.productosPorVendedor = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, vendedorCodigo } = req.query;
    
    // Validar parámetros
    if (!fechaDesde || !fechaHasta) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaDesde y fechaHasta"
      });
    }

    // Obtener los modelos específicos de la empresa
    const { FacturaCabeza, FacturaItem, Articulo } = req.models;
    
    if (!FacturaCabeza || !FacturaItem || !Articulo) {
      return res.status(500).json({
        success: false,
        message: "Error: Modelos no disponibles"
      });
    }

    // Construir consulta para facturas
    const whereClause = {
      Fecha: { [Op.between]: [fechaDesde, fechaHasta] },
      FechaAnulacion: null // Excluir facturas anuladas
    };

    // Si se especifica un vendedor, filtrar por él
    if (vendedorCodigo) {
      whereClause.VendedorCodigo = vendedorCodigo;
    }

    // Obtener las facturas en el rango de fechas
    const facturas = await FacturaCabeza.findAll({
      where: whereClause,
      attributes: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero', 'VendedorCodigo'],
      raw: true
    });

    // Si no hay facturas, retornar resultado vacío
    if (facturas.length === 0) {
      return res.json({
        success: true,
        data: {
          totalProductos: 0,
          vendedores: []
        }
      });
    }

    // Preparar estructura para consultar items de facturas
    const facturasItems = {};
    const vendedores = new Set();
    
    // Agrupar facturas por vendedor
    facturas.forEach(factura => {
      const vendedor = factura.VendedorCodigo;
      vendedores.add(vendedor);
      
      if (!facturasItems[vendedor]) {
        facturasItems[vendedor] = [];
      }
      
      facturasItems[vendedor].push({
        tipo: factura.DocumentoTipo,
        sucursal: factura.DocumentoSucursal,
        numero: factura.DocumentoNumero
      });
    });

    // Obtener items para cada vendedor
    const resultadoVendedores = [];
    
    for (const vendedor of vendedores) {
      const facturasCodigos = facturasItems[vendedor];
      let itemsVendedor = [];
      
      // Consultar items para cada factura del vendedor
      for (const factura of facturasCodigos) {
        const items = await FacturaItem.findAll({
          where: {
            DocumentoTipo: factura.tipo,
            DocumentoSucursal: factura.sucursal,
            DocumentoNumero: factura.numero
          },
          attributes: ['CodigoArticulo', 'Cantidad', 'PrecioUnitario'],
          raw: true
        });
        itemsVendedor = itemsVendedor.concat(items);
      }
      
      // Agrupar items por artículo
      const productosAgrupados = itemsVendedor.reduce((acumulado, item) => {
        const codigo = item.CodigoArticulo;
        if (!acumulado[codigo]) {
          acumulado[codigo] = {
            codigo,
            cantidad: 0,
            montoTotal: 0
          };
        }
        acumulado[codigo].cantidad += item.Cantidad;
        acumulado[codigo].montoTotal += item.PrecioUnitario * item.Cantidad;
        return acumulado;
      }, {});
      
      // Obtener info de los artículos
      const codigosArticulos = Object.keys(productosAgrupados);
      const articulos = await Articulo.findAll({
        where: { Codigo: { [Op.in]: codigosArticulos } },
        attributes: ['Codigo', 'Descripcion'],
        raw: true
      });
      
      // Crear mapa de artículos
      const articulosMap = articulos.reduce((acc, articulo) => {
        acc[articulo.Codigo] = articulo.Descripcion;
        return acc;
      }, {});
      
      // Completar información de artículos
      for (const codigo in productosAgrupados) {
        productosAgrupados[codigo].descripcion = articulosMap[codigo] || 'Artículo no encontrado';
      }
      
      // Convertir a array y ordenar por cantidad
      const productosArray = Object.values(productosAgrupados).sort((a, b) => b.cantidad - a.cantidad);
      
      // Agregar a resultado
      resultadoVendedores.push({
        vendedor,
        cantidadProductos: productosArray.reduce((total, item) => total + item.cantidad, 0),
        productos: productosArray
      });
    }

    // Calcular total de productos vendidos
    const totalProductosVendidos = resultadoVendedores.reduce(
      (total, vendedorData) => total + vendedorData.cantidadProductos, 0
    );

    res.json({
      success: true,
      data: {
        totalProductos: totalProductosVendidos,
        vendedores: resultadoVendedores
      }
    });
    
  } catch (error) {
    console.error("Error al generar informe de productos por vendedor:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar el informe",
      error: error.message
    });
  }
};

// Detalle de ventas por vendedor
exports.detalleVentasPorVendedor = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, vendedorCodigo } = req.query;
    
    if (!fechaDesde || !fechaHasta || !vendedorCodigo) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaDesde, fechaHasta y vendedorCodigo"
      });
    }

    // Obtener los modelos específicos de la empresa
    const { FacturaCabeza } = req.models;
    
    if (!FacturaCabeza) {
      return res.status(500).json({
        success: false,
        message: "Error: Modelo no disponible"
      });
    }

    // Obtener facturas del vendedor
    const facturas = await FacturaCabeza.findAll({
      where: {
        Fecha: { [Op.between]: [fechaDesde, fechaHasta] },
        VendedorCodigo: vendedorCodigo,
        FechaAnulacion: null
      },
      attributes: [
        'DocumentoTipo', 
        'DocumentoSucursal', 
        'DocumentoNumero', 
        'Fecha', 
        'ClienteCodigo', 
        'ImporteTotal'
      ],
      order: [['Fecha', 'DESC']],
      raw: true
    });

    res.json({
      success: true,
      data: facturas
    });
    
  } catch (error) {
    console.error("Error al generar detalle de ventas por vendedor:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar el informe",
      error: error.message
    });
  }
};

// ================================================================
// INFORME DE FACTURACIÓN
// ================================================================

// Informe completo de facturación
exports.informeFacturacion = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, agruparPor = 'dia' } = req.query;
    
    console.log("Parámetros recibidos:", { fechaDesde, fechaHasta, agruparPor });
    
    if (!fechaDesde || !fechaHasta) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaDesde y fechaHasta"
      });
    }

    // Obtener los modelos específicos de la empresa
    const { FacturaCabeza, Cliente, Vendedor } = req.models;
    
    console.log("Modelos disponibles:", { 
      FacturaCabeza: !!FacturaCabeza, 
      Cliente: !!Cliente, 
      Vendedor: !!Vendedor 
    });
    
    if (!FacturaCabeza) {
      return res.status(500).json({
        success: false,
        message: "Error: Modelo no disponible"
      });
    }

    // Construir consulta base
    const whereClause = {
      Fecha: { [Op.between]: [fechaDesde, fechaHasta] },
      FechaAnulacion: null // Excluir facturas anuladas
    };

    console.log("Consultando facturas con whereClause:", whereClause);

    // Obtener datos de facturación
    const facturas = await FacturaCabeza.findAll({
      where: whereClause,
      attributes: [
        'DocumentoTipo',
        'DocumentoSucursal', 
        'DocumentoNumero',
        'Fecha',
        'ClienteCodigo',
        'VendedorCodigo',
        'ImporteBruto',
        'ImporteBonificado',
        'ImporteNeto',
        'ImporteIva1',
        'ImporteIva2',
        'ImporteTotal',
        'PagoTipo',
        'afip_cae'
      ],
      order: [['Fecha', 'ASC']],
      raw: true
    });

    console.log("Facturas encontradas:", facturas.length);

    // Obtener información de clientes y vendedores por separado
    const clienteCodigos = [...new Set(facturas.map(f => f.ClienteCodigo).filter(Boolean))];
    const vendedorCodigos = [...new Set(facturas.map(f => f.VendedorCodigo).filter(Boolean))];

    console.log("Códigos de clientes únicos:", clienteCodigos.length);
    console.log("Códigos de vendedores únicos:", vendedorCodigos.length);

    // Obtener clientes
    const clientes = await Cliente.findAll({
      where: { Codigo: { [Op.in]: clienteCodigos } },
      attributes: ['Codigo', 'Descripcion'],
      raw: true
    });

    // Obtener vendedores
    const vendedores = await Vendedor.findAll({
      where: { Codigo: { [Op.in]: vendedorCodigos } },
      attributes: ['Codigo', 'Descripcion'],
      raw: true
    });

    // Crear mapas para acceso rápido
    const clientesMap = clientes.reduce((acc, cliente) => {
      acc[cliente.Codigo] = cliente.Descripcion;
      return acc;
    }, {});

    const vendedoresMap = vendedores.reduce((acc, vendedor) => {
      acc[vendedor.Codigo] = vendedor.Descripcion;
      return acc;
    }, {});

    // Agregar información de clientes y vendedores a las facturas
    const facturasConInfo = facturas.map(factura => ({
      ...factura,
      Cliente: { Descripcion: clientesMap[factura.ClienteCodigo] || 'Sin cliente' },
      Vendedor: { Descripcion: vendedoresMap[factura.VendedorCodigo] || 'Sin vendedor' }
    }));

    // Procesar datos para diferentes visualizaciones
    const datosProcesados = procesarDatosFacturacion(facturasConInfo, agruparPor);

    console.log("Datos procesados correctamente");

    res.json({
      success: true,
      data: datosProcesados
    });

  } catch (error) {
    console.error("Error al generar informe de facturación:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error al generar el informe",
      error: error.message
    });
  }
};

// Función para procesar los datos de facturación
function procesarDatosFacturacion(facturas, agruparPor) {
  console.log("Iniciando procesamiento de datos con", facturas.length, "facturas");
  
  try {
    // Estadísticas generales
    const estadisticasGenerales = {
      totalFacturas: facturas.length,
      totalVentas: facturas.reduce((sum, f) => sum + (f.ImporteTotal || 0), 0),
      totalIva: facturas.reduce((sum, f) => sum + (f.ImporteIva1 || 0) + (f.ImporteIva2 || 0), 0),
      totalBonificaciones: facturas.reduce((sum, f) => sum + (f.ImporteBonificado || 0), 0),
      promedioTicket: 0,
      facturasConCae: facturas.filter(f => f.afip_cae).length,
      facturasSinCae: facturas.filter(f => !f.afip_cae).length
    };

    console.log("Estadísticas generales calculadas:", estadisticasGenerales);

  if (estadisticasGenerales.totalFacturas > 0) {
    estadisticasGenerales.promedioTicket = estadisticasGenerales.totalVentas / estadisticasGenerales.totalFacturas;
  }

  // Agrupar por período (día, semana, mes)
  const agrupacionPorPeriodo = {};
  facturas.forEach(factura => {
    console.log("Procesando factura con fecha:", factura.Fecha, "tipo:", typeof factura.Fecha);
    
    // Manejar diferentes formatos de fecha
    let fecha;
    if (typeof factura.Fecha === 'string') {
      fecha = new Date(factura.Fecha);
    } else if (factura.Fecha instanceof Date) {
      fecha = factura.Fecha;
    } else {
      console.warn("Fecha inválida:", factura.Fecha);
      return; // Saltar esta factura
    }
    
    // Verificar que la fecha sea válida
    if (isNaN(fecha.getTime())) {
      console.warn("Fecha inválida después de conversión:", factura.Fecha);
      return; // Saltar esta factura
    }
    
    let clave;
    
    switch (agruparPor) {
      case 'dia':
        clave = fecha.toISOString().split('T')[0];
        break;
      case 'semana':
        const semana = getWeekNumber(fecha);
        clave = `${fecha.getFullYear()}-W${semana}`;
        break;
      case 'mes':
        clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        clave = fecha.toISOString().split('T')[0];
    }
    
    console.log("Clave generada:", clave);

    if (!agrupacionPorPeriodo[clave]) {
      agrupacionPorPeriodo[clave] = {
        periodo: clave,
        cantidad: 0,
        monto: 0,
        iva: 0
      };
    }

    agrupacionPorPeriodo[clave].cantidad++;
    agrupacionPorPeriodo[clave].monto += factura.ImporteTotal || 0;
    agrupacionPorPeriodo[clave].iva += (factura.ImporteIva1 || 0) + (factura.ImporteIva2 || 0);
  });

  // Agrupar por tipo de documento
  const agrupacionPorTipo = {};
  facturas.forEach(factura => {
    const tipo = factura.DocumentoTipo;
    if (!agrupacionPorTipo[tipo]) {
      agrupacionPorTipo[tipo] = {
        tipo,
        cantidad: 0,
        monto: 0
      };
    }
    agrupacionPorTipo[tipo].cantidad++;
    agrupacionPorTipo[tipo].monto += factura.ImporteTotal || 0;
  });

  // Agrupar por vendedor
  const agrupacionPorVendedor = {};
  facturas.forEach(factura => {
    const vendedor = factura.Vendedor?.Descripcion || 'Sin vendedor';
    const codigoVendedor = factura.VendedorCodigo || 'SIN_VENDEDOR';
    
    if (!agrupacionPorVendedor[codigoVendedor]) {
      agrupacionPorVendedor[codigoVendedor] = {
        codigo: codigoVendedor,
        nombre: vendedor,
        cantidad: 0,
        monto: 0
      };
    }
    agrupacionPorVendedor[codigoVendedor].cantidad++;
    agrupacionPorVendedor[codigoVendedor].monto += factura.ImporteTotal || 0;
  });

  // Agrupar por cliente
  const agrupacionPorCliente = {};
  facturas.forEach(factura => {
    const cliente = factura.Cliente?.Descripcion || 'Sin cliente';
    const codigoCliente = factura.ClienteCodigo || 'SIN_CLIENTE';
    
    if (!agrupacionPorCliente[codigoCliente]) {
      agrupacionPorCliente[codigoCliente] = {
        codigo: codigoCliente,
        nombre: cliente,
        cantidad: 0,
        monto: 0
      };
    }
    agrupacionPorCliente[codigoCliente].cantidad++;
    agrupacionPorCliente[codigoCliente].monto += factura.ImporteTotal || 0;
  });

  // Evolución diaria de ventas
  const evolucionVentas = Object.values(agrupacionPorPeriodo)
    .sort((a, b) => a.periodo.localeCompare(b.periodo));

  console.log("Agrupación por período:", agrupacionPorPeriodo);
  console.log("Evolución de ventas:", evolucionVentas);

  const resultado = {
    estadisticasGenerales,
    evolucionVentas,
    agrupacionPorTipo: Object.values(agrupacionPorTipo),
    agrupacionPorVendedor: Object.values(agrupacionPorVendedor).sort((a, b) => b.monto - a.monto),
    agrupacionPorCliente: Object.values(agrupacionPorCliente).sort((a, b) => b.monto - a.monto).slice(0, 10), // Top 10 clientes
    facturas: facturas.map(f => ({
      numero: `${f.DocumentoSucursal}-${f.DocumentoNumero}`,
      fecha: f.Fecha,
      cliente: f.Cliente?.Descripcion || 'Sin cliente',
      vendedor: f.Vendedor?.Descripcion || 'Sin vendedor',
      monto: f.ImporteTotal || 0,
      tipo: f.DocumentoTipo,
      tieneCae: !!f.afip_cae
    }))
  };

  console.log("Resultado final:", {
    totalFacturas: resultado.estadisticasGenerales.totalFacturas,
    evolucionVentasLength: resultado.evolucionVentas.length,
    agrupacionPorTipoLength: resultado.agrupacionPorTipo.length,
    agrupacionPorVendedorLength: resultado.agrupacionPorVendedor.length,
    agrupacionPorClienteLength: resultado.agrupacionPorCliente.length
  });

  return resultado;
  } catch (error) {
    console.error("Error en procesarDatosFacturacion:", error);
    console.error("Stack trace:", error.stack);
    throw error;
  }
}

// Función auxiliar para obtener número de semana
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
}

// ================================================================
// ESTADÍSTICAS DE PRODUCTOS
// ================================================================

// Productos más vendidos
exports.productosMasVendidos = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, limite = 10 } = req.query;
    
    if (!fechaDesde || !fechaHasta) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaDesde y fechaHasta"
      });
    }

    // Obtener los modelos específicos de la empresa
    const { FacturaCabeza, FacturaItem, Articulo } = req.models;
    
    if (!FacturaCabeza || !FacturaItem || !Articulo) {
      return res.status(500).json({
        success: false,
        message: "Error: Modelos no disponibles"
      });
    }

    // Obtener facturas en rango de fechas
    const facturas = await FacturaCabeza.findAll({
      where: {
        Fecha: { [Op.between]: [fechaDesde, fechaHasta] },
        FechaAnulacion: null
      },
      attributes: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
      raw: true
    });

    if (facturas.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Obtener items de todas las facturas
    let allItems = [];
    for (const factura of facturas) {
      const items = await FacturaItem.findAll({
        where: {
          DocumentoTipo: factura.DocumentoTipo,
          DocumentoSucursal: factura.DocumentoSucursal,
          DocumentoNumero: factura.DocumentoNumero
        },
        attributes: ['CodigoArticulo', 'Cantidad', 'PrecioUnitario'],
        raw: true
      });
      allItems = allItems.concat(items);
    }

    // Agrupar por producto
    const productosTotales = allItems.reduce((acumulado, item) => {
      const codigo = item.CodigoArticulo;
      if (!acumulado[codigo]) {
        acumulado[codigo] = {
          codigo,
          cantidad: 0,
          montoTotal: 0
        };
      }
      acumulado[codigo].cantidad += item.Cantidad;
      acumulado[codigo].montoTotal += item.PrecioUnitario * item.Cantidad;
      return acumulado;
    }, {});

    // Obtener descripciones de los productos
    const codigosProductos = Object.keys(productosTotales);
    const productos = await Articulo.findAll({
      where: { Codigo: { [Op.in]: codigosProductos } },
      attributes: ['Codigo', 'Descripcion', 'Existencia'],
      raw: true
    });

    // Crear mapa de productos
    const productosMap = productos.reduce((acc, producto) => {
      acc[producto.Codigo] = {
        descripcion: producto.Descripcion,
        stock: producto.Existencia
      };
      return acc;
    }, {});

    // Completar información de productos
    for (const codigo in productosTotales) {
      if (productosMap[codigo]) {
        productosTotales[codigo].descripcion = productosMap[codigo].descripcion;
        productosTotales[codigo].stock = productosMap[codigo].stock || 0;
      } else {
        productosTotales[codigo].descripcion = 'Artículo no encontrado';
        productosTotales[codigo].stock = 0;
      }
    }

    // Convertir a array, ordenar por cantidad y limitar resultados
    const resultado = Object.values(productosTotales)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, parseInt(limite));

    res.json({
      success: true,
      data: resultado
    });
    
  } catch (error) {
    console.error("Error al obtener productos más vendidos:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar el informe",
      error: error.message
    });
  }
};

// Productos menos vendidos
exports.productosMenosVendidos = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, limite = 10 } = req.query;
    
    if (!fechaDesde || !fechaHasta) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaDesde y fechaHasta"
      });
    }

    // Obtener los modelos específicos de la empresa
    const { FacturaCabeza, FacturaItem, Articulo } = req.models;
    
    if (!FacturaCabeza || !FacturaItem || !Articulo) {
      return res.status(500).json({
        success: false,
        message: "Error: Modelos no disponibles"
      });
    }

    // Obtener todos los productos activos
    const todosLosProductos = await Articulo.findAll({
      where: { 
        Activo: true 
      },
      attributes: ['Codigo', 'Descripcion', 'Existencia'],
      raw: true
    });

    // Crear mapa de productos
    const productosMap = todosLosProductos.reduce((acc, producto) => {
      acc[producto.Codigo] = {
        codigo: producto.Codigo,
        descripcion: producto.Descripcion,
        stock: producto.Existencia || 0,
        cantidad: 0, // Cantidad vendida, inicialmente 0
        montoTotal: 0
      };
      return acc;
    }, {});

    // Obtener facturas en rango de fechas
    const facturas = await FacturaCabeza.findAll({
      where: {
        Fecha: { [Op.between]: [fechaDesde, fechaHasta] },
        FechaAnulacion: null
      },
      attributes: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
      raw: true
    });

    // Si hay facturas, procesar ventas
    if (facturas.length > 0) {
      // Obtener items de todas las facturas
      for (const factura of facturas) {
        const items = await FacturaItem.findAll({
          where: {
            DocumentoTipo: factura.DocumentoTipo,
            DocumentoSucursal: factura.DocumentoSucursal,
            DocumentoNumero: factura.DocumentoNumero
          },
          attributes: ['CodigoArticulo', 'Cantidad', 'PrecioUnitario'],
          raw: true
        });
        
        // Actualizar cantidades vendidas
        items.forEach(item => {
          const codigo = item.CodigoArticulo;
          if (productosMap[codigo]) {
            productosMap[codigo].cantidad += item.Cantidad;
            productosMap[codigo].montoTotal += item.PrecioUnitario * item.Cantidad;
          }
        });
      }
    }

    // Convertir a array y ordenar por cantidad ascendente
    const resultado = Object.values(productosMap)
      .sort((a, b) => a.cantidad - b.cantidad)
      .slice(0, parseInt(limite));

    res.json({
      success: true,
      data: resultado
    });
    
  } catch (error) {
    console.error("Error al obtener productos menos vendidos:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar el informe",
      error: error.message
    });
  }
};

// Rotación de stock
exports.rotacionStock = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    
    if (!fechaDesde || !fechaHasta) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaDesde y fechaHasta"
      });
    }

    // Obtener los modelos específicos de la empresa
    const { FacturaCabeza, FacturaItem, Articulo } = req.models;
    
    if (!FacturaCabeza || !FacturaItem || !Articulo) {
      return res.status(500).json({
        success: false,
        message: "Error: Modelos no disponibles"
      });
    }

    // Obtener productos con stock
    const productos = await Articulo.findAll({
      where: { 
        Activo: true,
        Existencia: { [Op.gt]: 0 }
      },
      attributes: ['Codigo', 'Descripcion', 'Existencia'],
      raw: true
    });

    // Crear mapa de productos
    const productosMap = productos.reduce((acc, producto) => {
      acc[producto.Codigo] = {
        codigo: producto.Codigo,
        descripcion: producto.Descripcion,
        stock: producto.Existencia || 0,
        cantidadVendida: 0,
        rotacion: 0 // Se calculará después
      };
      return acc;
    }, {});

    // Obtener facturas en rango de fechas
    const facturas = await FacturaCabeza.findAll({
      where: {
        Fecha: { [Op.between]: [fechaDesde, fechaHasta] },
        FechaAnulacion: null
      },
      attributes: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
      raw: true
    });

    // Si hay facturas, procesar ventas
    if (facturas.length > 0) {
      // Obtener items de todas las facturas
      for (const factura of facturas) {
        const items = await FacturaItem.findAll({
          where: {
            DocumentoTipo: factura.DocumentoTipo,
            DocumentoSucursal: factura.DocumentoSucursal,
            DocumentoNumero: factura.DocumentoNumero
          },
          attributes: ['CodigoArticulo', 'Cantidad'],
          raw: true
        });
        
        // Actualizar cantidades vendidas
        items.forEach(item => {
          const codigo = item.CodigoArticulo;
          if (productosMap[codigo]) {
            productosMap[codigo].cantidadVendida += item.Cantidad;
          }
        });
      }
    }

    // Calcular índice de rotación (cantidadVendida / stock) para cada producto
    for (const codigo in productosMap) {
      const producto = productosMap[codigo];
      // Evitar división por cero
      if (producto.stock > 0) {
        producto.rotacion = producto.cantidadVendida / producto.stock;
      } else {
        producto.rotacion = 0;
      }
    }

    // Convertir a array y ordenar por rotación descendente
    const resultado = Object.values(productosMap)
      .sort((a, b) => b.rotacion - a.rotacion);

    res.json({
      success: true,
      data: resultado
    });
    
  } catch (error) {
    console.error("Error al calcular rotación de stock:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar el informe",
      error: error.message
    });
  }
};

// Informe detallado de ventas por vendedor con notas de crédito
exports.informeVentasVendedor = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, vendedorCodigo, pagoTipo, tiposFactura, tiposNotaCredito } = req.query;
    
    console.log("Parámetros recibidos:", { fechaDesde, fechaHasta, vendedorCodigo, pagoTipo, tiposFactura, tiposNotaCredito });
    
    // Validar parámetros
    if (!fechaDesde || !fechaHasta || !vendedorCodigo) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaDesde, fechaHasta y vendedorCodigo"
      });
    }

    // Obtener los modelos específicos de la empresa
    const { FacturaCabeza, NotaCredito, Vendedor, Cliente } = req.models;
    
    if (!FacturaCabeza || !NotaCredito || !Vendedor || !Cliente) {
      return res.status(500).json({
        success: false,
        message: "Error: Modelos no disponibles"
      });
    }

    const tiposFacturaFiltro = parseTipos(tiposFactura, TIPOS_FACTURA_DEFAULT, TIPOS_FACTURA_DEFAULT);
    const tiposNcFiltro = parseTipos(tiposNotaCredito, TIPOS_NC_DEFAULT, TIPOS_NC_DEFAULT);

    // 1. Obtener facturas del vendedor en el rango de fechas (opcional: filtro por forma de pago)
    let facturas = [];
    if (tiposFacturaFiltro.length > 0) {
      const whereFacturas = {
        VendedorCodigo: vendedorCodigo,
        Fecha: { [Op.between]: [fechaDesde, fechaHasta] },
        FechaAnulacion: null,
        DocumentoTipo: { [Op.in]: tiposFacturaFiltro }
      };
      if (pagoTipo) {
        whereFacturas.PagoTipo = pagoTipo;
      }

      facturas = await FacturaCabeza.findAll({
        where: whereFacturas,
        attributes: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero', 'Fecha', 'ClienteCodigo', 'ImporteTotal'],
        include: [
          {
            model: Cliente,
            attributes: ['Codigo', 'Descripcion'],
            required: false
          }
        ],
        raw: true
      });
    }

    console.log(`Facturas encontradas: ${facturas.length}`);

    // 2. NC relacionadas con esas facturas, filtradas por tipo
    const notasCredito = await obtenerNotasCreditoDeFacturas(
      NotaCredito,
      Cliente,
      facturas,
      tiposNcFiltro
    );

    console.log(`Notas de crédito relacionadas encontradas: ${notasCredito.length}`);

    // 3. Calcular totales
    const totalFacturas = facturas.reduce((sum, f) => sum + (parseFloat(f.ImporteTotal) || 0), 0);
    const totalNotasCredito = notasCredito.reduce((sum, nc) => sum + (parseFloat(nc.ImporteTotal) || 0), 0);
    const totalGeneral = totalFacturas - totalNotasCredito;

    // 4. Obtener información del vendedor
    const vendedor = await Vendedor.findByPk(vendedorCodigo, {
      attributes: ['Codigo', 'Descripcion'],
      raw: true
    });

    // 5. Preparar respuesta
    const respuesta = {
      vendedor: {
        codigo: vendedorCodigo,
        descripcion: vendedor ? vendedor.Descripcion : 'Vendedor no encontrado'
      },
      periodo: {
        fechaDesde,
        fechaHasta
      },
      filtrosAplicados: {
        tiposFactura: tiposFacturaFiltro,
        tiposNotaCredito: tiposNcFiltro,
        pagoTipo: pagoTipo || null
      },
      facturas: facturas.map(f => ({
        tipo: f.DocumentoTipo,
        numero: `${f.DocumentoSucursal}-${f.DocumentoNumero}`,
        fecha: f.Fecha,
        clienteCodigo: f.ClienteCodigo,
        clienteDescripcion: f['Cliente.Descripcion'] || 'Sin descripción',
        importe: parseFloat(f.ImporteTotal) || 0
      })),
      notasCredito: notasCredito.map(nc => ({
        tipo: nc.DocumentoTipo,
        numero: `${nc.DocumentoSucursal}-${nc.DocumentoNumero}`,
        fecha: nc.Fecha,
        clienteCodigo: nc.CodigoCliente,
        clienteDescripcion: nc['Cliente.Descripcion'] || 'Sin descripción',
        importe: -(parseFloat(nc.ImporteTotal) || 0), // Negativo
        facturaRelacionada: `${nc.factura_tipo}-${nc.factura_sucursal}-${nc.factura_numero}`
      })),
      totales: {
        facturas: {
          cantidad: facturas.length,
          importe: totalFacturas
        },
        notasCredito: {
          cantidad: notasCredito.length,
          importe: -totalNotasCredito // Negativo
        },
        general: totalGeneral
      }
    };

    res.json({
      success: true,
      data: respuesta
    });

  } catch (error) {
    console.error("Error al generar informe de ventas por vendedor:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error al generar el informe",
      error: error.message
    });
  }
};

// Generar PDF del informe de ventas por vendedor
exports.generarPDFInformeVendedor = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, vendedorCodigo, pagoTipo, tiposFactura, tiposNotaCredito } = req.query;
    
    console.log("Generando PDF - Parámetros recibidos:", { fechaDesde, fechaHasta, vendedorCodigo, pagoTipo, tiposFactura, tiposNotaCredito });
    
    // Validar parámetros
    if (!fechaDesde || !fechaHasta || !vendedorCodigo) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaDesde, fechaHasta y vendedorCodigo"
      });
    }

    // Obtener los modelos específicos de la empresa
    const { FacturaCabeza, NotaCredito, Vendedor, Cliente, DatosEmpresa } = req.models;
    
    if (!FacturaCabeza || !NotaCredito || !Vendedor || !Cliente || !DatosEmpresa) {
      return res.status(500).json({
        success: false,
        message: "Error: Modelos no disponibles"
      });
    }

    const tiposFacturaFiltro = parseTipos(tiposFactura, TIPOS_FACTURA_DEFAULT, TIPOS_FACTURA_DEFAULT);
    const tiposNcFiltro = parseTipos(tiposNotaCredito, TIPOS_NC_DEFAULT, TIPOS_NC_DEFAULT);

    let facturas = [];
    if (tiposFacturaFiltro.length > 0) {
      const whereFacturasPdf = {
        VendedorCodigo: vendedorCodigo,
        Fecha: { [Op.between]: [fechaDesde, fechaHasta] },
        FechaAnulacion: null,
        DocumentoTipo: { [Op.in]: tiposFacturaFiltro }
      };
      if (pagoTipo) {
        whereFacturasPdf.PagoTipo = pagoTipo;
      }

      facturas = await FacturaCabeza.findAll({
        where: whereFacturasPdf,
        attributes: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero', 'Fecha', 'ClienteCodigo', 'ImporteTotal'],
        include: [
          {
            model: Cliente,
            attributes: ['Codigo', 'Descripcion'],
            required: false
          }
        ],
        raw: true
      });
    }

    const notasCredito = await obtenerNotasCreditoDeFacturas(
      NotaCredito,
      Cliente,
      facturas,
      tiposNcFiltro
    );

    // 3. Calcular totales
    const totalFacturas = facturas.reduce((sum, f) => sum + (parseFloat(f.ImporteTotal) || 0), 0);
    const totalNotasCredito = notasCredito.reduce((sum, nc) => sum + (parseFloat(nc.ImporteTotal) || 0), 0);
    const totalGeneral = totalFacturas - totalNotasCredito;

    // 4. Obtener información del vendedor
    const vendedor = await Vendedor.findByPk(vendedorCodigo, {
      attributes: ['Codigo', 'Descripcion'],
      raw: true
    });

    // 5. Obtener datos de la empresa
    const datosEmpresa = await DatosEmpresa.findOne({
      raw: true
    });

    // 6. Preparar datos para el PDF
    const datosPDF = {
      vendedor: {
        codigo: vendedorCodigo,
        descripcion: vendedor ? vendedor.Descripcion : 'Vendedor no encontrado'
      },
      periodo: {
        fechaDesde,
        fechaHasta
      },
      facturas: facturas.map(f => ({
        tipo: f.DocumentoTipo,
        numero: `${f.DocumentoSucursal}-${f.DocumentoNumero}`,
        fecha: f.Fecha,
        clienteCodigo: f.ClienteCodigo,
        clienteDescripcion: f['Cliente.Descripcion'] || 'Sin descripción',
        importe: parseFloat(f.ImporteTotal) || 0
      })),
      notasCredito: notasCredito.map(nc => ({
        tipo: nc.DocumentoTipo,
        numero: `${nc.DocumentoSucursal}-${nc.DocumentoNumero}`,
        fecha: nc.Fecha,
        clienteCodigo: nc.CodigoCliente,
        clienteDescripcion: nc['Cliente.Descripcion'] || 'Sin descripción',
        importe: -(parseFloat(nc.ImporteTotal) || 0),
        facturaRelacionada: `${nc.factura_tipo}-${nc.factura_sucursal}-${nc.factura_numero}`
      })),
      totales: {
        facturas: {
          cantidad: facturas.length,
          importe: totalFacturas
        },
        notasCredito: {
          cantidad: notasCredito.length,
          importe: -totalNotasCredito
        },
        general: totalGeneral
      }
    };

    // 7. Generar el PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="informe-vendedor-${vendedorCodigo}-${fechaDesde}-${fechaHasta}.pdf"`
    );

    // Pipe el PDF a la respuesta
    doc.pipe(res);

    // Renderizar el contenido
    await renderInformeVendedor(doc, datosPDF, datosEmpresa);

    // Finalizar el documento
    doc.end();

  } catch (error) {
    console.error("Error al generar PDF de informe de vendedor:", error);
    console.error("Stack trace:", error.stack);
    
    // Si aún no se han enviado los headers
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Error al generar el PDF",
        error: error.message
      });
    }
  }
};

// Informe de ventas por preventista (vendedor de la preventa que originó la factura)
exports.informeVentasPreventista = async (req, res) => {
  try {
    const data = await obtenerDatosInformePreventista(
      { db: req.db, models: req.models },
      req.query
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error al generar informe de ventas por preventista:', error);
    console.error('Stack trace:', error.stack);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Error al generar el informe',
      error: error.message
    });
  }
};

// PDF del informe de ventas por preventista
exports.generarPDFInformePreventista = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, vendedorCodigo } = req.query;
    if (!fechaDesde || !fechaHasta || !vendedorCodigo) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren fechaDesde, fechaHasta y vendedorCodigo'
      });
    }

    const { DatosEmpresa } = req.models || {};
    const data = await obtenerDatosInformePreventista(
      { db: req.db, models: req.models },
      req.query
    );
    const datosEmpresa = DatosEmpresa ? await DatosEmpresa.findOne({ raw: true }) : {};

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="informe-preventista-${vendedorCodigo}-${fechaDesde}-${fechaHasta}.pdf"`
    );
    doc.pipe(res);
    await renderInformeVendedor(doc, data, datosEmpresa || {});
    doc.end();
  } catch (error) {
    console.error('Error al generar PDF de informe por preventista:', error);
    console.error('Stack trace:', error.stack);
    if (!res.headersSent) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.statusCode ? error.message : 'Error al generar el PDF',
        error: error.message
      });
    }
  }
};

// Informe de ventas por proveedor - OPTIMIZADO
exports.ventasPorProveedor = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, proveedorCodigo, pagoTipo } = req.query;
    
    console.log("Parámetros recibidos:", { fechaDesde, fechaHasta, proveedorCodigo, pagoTipo });
    
    if (!fechaDesde || !fechaHasta) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaDesde y fechaHasta"
      });
    }

    // Obtener los modelos específicos de la empresa
    const { FacturaCabeza, FacturaItem, Articulo, Proveedor } = req.models;
    
    if (!FacturaCabeza || !FacturaItem || !Articulo || !Proveedor) {
      return res.status(500).json({
        success: false,
        message: "Error: Modelos no disponibles"
      });
    }

    console.time('ventasPorProveedor-total');

    // OPTIMIZACIÓN 1: Obtener solo los DocumentoTipo, DocumentoSucursal, DocumentoNumero de facturas válidas
    console.time('obtener-facturas-validas');
    const whereClauseFacturas = {
      Fecha: {
        [Op.between]: [fechaDesde, fechaHasta]
      },
      FechaAnulacion: null // Excluir facturas anuladas
    };

    // Filtro opcional por tipo de pago
    if (pagoTipo) {
      whereClauseFacturas.PagoTipo = pagoTipo;
    }
    
    const facturasValidas = await FacturaCabeza.findAll({
      where: whereClauseFacturas,
      attributes: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
      raw: true
    });

    console.timeEnd('obtener-facturas-validas');
    console.log("Facturas válidas encontradas:", facturasValidas.length);

    if (facturasValidas.length === 0) {
      return res.json({
        success: true,
        data: {
          proveedores: [],
          totalVentas: 0,
          periodo: {
            fechaDesde,
            fechaHasta
          }
        }
      });
    }

    // OPTIMIZACIÓN 2: Procesamiento por lotes para evitar consultas SQL demasiado grandes
    console.time('obtener-items-batch');
    
    // Filtro de proveedor para la consulta de Articulo (si se especifica)
    const proveedorCodigos = proveedorCodigo ? proveedorCodigo.split(',').map(c => c.trim()) : [];
    const whereClauseArticulo = proveedorCodigos.length > 0 
      ? { ProveedorCodigo: { [Op.in]: proveedorCodigos } }
      : {};

    // Configurar el tamaño del lote (ajustar según max_allowed_packet de MySQL)
    const BATCH_SIZE = 500;
    const todosLosItems = [];
    let batchesProcessed = 0;

    // Procesar facturas en lotes
    for (let i = 0; i < facturasValidas.length; i += BATCH_SIZE) {
      const batch = facturasValidas.slice(i, i + BATCH_SIZE);
      batchesProcessed++;
      
      console.log(`Procesando lote ${batchesProcessed}: ${batch.length} facturas (${i + 1} - ${Math.min(i + BATCH_SIZE, facturasValidas.length)} de ${facturasValidas.length})`);
      
      // Construir condiciones OR solo para este lote
      const condicionesBatch = batch.map(f => ({
        [Op.and]: [
          { DocumentoTipo: f.DocumentoTipo },
          { DocumentoSucursal: f.DocumentoSucursal },
          { DocumentoNumero: f.DocumentoNumero }
        ]
      }));

      // Obtener items para este lote
      const itemsBatch = await FacturaItem.findAll({
        where: {
          [Op.or]: condicionesBatch
        },
        attributes: ['CodigoArticulo', 'Cantidad', 'PrecioUnitario', 'ImporteBonificado'],
        include: [{
          model: Articulo,
          attributes: ['Codigo', 'Descripcion', 'ProveedorCodigo', 'Existencia', 'ExistenciaMinima'],
          where: whereClauseArticulo,
          required: proveedorCodigos.length > 0, // INNER JOIN si hay filtro, LEFT JOIN si no
          include: [{
            model: Proveedor,
            as: 'Proveedor',
            attributes: ['Codigo', 'Descripcion'],
            required: false
          }]
        }],
        raw: true,
        nest: true
      });

      todosLosItems.push(...itemsBatch);
      console.log(`Lote ${batchesProcessed} completado: ${itemsBatch.length} items obtenidos`);
    }

    console.timeEnd('obtener-items-batch');
    console.log(`Total de lotes procesados: ${batchesProcessed}`);
    console.log("Items totales obtenidos:", todosLosItems.length);

    // OPTIMIZACIÓN 3: Procesar los items directamente (sin filtrado adicional)
    console.time('procesar-items');
    const ventasPorProveedor = {};

    for (const item of todosLosItems) {
      // Verificar que el artículo tenga información
      if (!item.Articulo || !item.Articulo.Codigo) {
        continue;
      }

      const provCodigo = item.Articulo.ProveedorCodigo || 'SIN_PROVEEDOR';
      const provDescripcion = item.Articulo.Proveedor?.Descripcion || 'Sin Proveedor';
      const codigoArticulo = item.CodigoArticulo;
      const cantidad = parseFloat(item.Cantidad) || 0;
      const importe = parseFloat(item.ImporteBonificado) || (parseFloat(item.PrecioUnitario) * cantidad);

      // Inicializar proveedor si no existe
      if (!ventasPorProveedor[provCodigo]) {
        ventasPorProveedor[provCodigo] = {
          codigo: provCodigo,
          descripcion: provDescripcion,
          productos: {},
          cantidadTotal: 0,
          importeTotal: 0
        };
      }

      // Inicializar producto si no existe
      if (!ventasPorProveedor[provCodigo].productos[codigoArticulo]) {
        const existencia = parseFloat(item.Articulo.Existencia) || 0;
        const existenciaMinima = parseFloat(item.Articulo.ExistenciaMinima) || 0;
        const cantidadSugerida = existenciaMinima > 0 && existencia < existenciaMinima
          ? Math.max(0, existenciaMinima - existencia)
          : 0;
        ventasPorProveedor[provCodigo].productos[codigoArticulo] = {
          codigo: codigoArticulo,
          descripcion: item.Articulo.Descripcion || 'Sin descripción',
          existencia,
          existenciaMinima,
          cantidadSugerida,
          cantidad: 0,
          importeTotal: 0
        };
      }

      // Acumular cantidades e importes
      ventasPorProveedor[provCodigo].productos[codigoArticulo].cantidad += cantidad;
      ventasPorProveedor[provCodigo].productos[codigoArticulo].importeTotal += importe;
      ventasPorProveedor[provCodigo].cantidadTotal += cantidad;
      ventasPorProveedor[provCodigo].importeTotal += importe;
    }

    console.timeEnd('procesar-items');

    // OPTIMIZACIÓN 4: Convertir y ordenar de forma eficiente
    console.time('ordenar-resultados');
    
    // Convertir productos a arrays y ordenar
    for (const provCodigo in ventasPorProveedor) {
      ventasPorProveedor[provCodigo].productos = Object.values(
        ventasPorProveedor[provCodigo].productos
      ).sort((a, b) => b.cantidad - a.cantidad);
    }

    // Convertir a array y ordenar por importe total
    const resultado = Object.values(ventasPorProveedor)
      .sort((a, b) => b.importeTotal - a.importeTotal);

    const totalVentas = resultado.reduce((sum, proveedor) => sum + proveedor.importeTotal, 0);

    console.timeEnd('ordenar-resultados');
    console.timeEnd('ventasPorProveedor-total');

    res.json({
      success: true,
      data: {
        proveedores: resultado,
        totalVentas: totalVentas,
        periodo: {
          fechaDesde,
          fechaHasta
        }
      }
    });

  } catch (error) {
    console.error("Error en ventasPorProveedor:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

// ================================================================
// INFORME DE VENTAS POR RUBROS
// ================================================================

// Informe de ventas por rubro - OPTIMIZADO
exports.ventasPorRubro = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, rubroCodigo } = req.query;
    
    console.log("Parámetros recibidos:", { fechaDesde, fechaHasta, rubroCodigo });
    
    if (!fechaDesde || !fechaHasta) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaDesde y fechaHasta"
      });
    }

    // Obtener los modelos específicos de la empresa
    const { FacturaCabeza, FacturaItem, Articulo, Rubro } = req.models;
    
    if (!FacturaCabeza || !FacturaItem || !Articulo || !Rubro) {
      return res.status(500).json({
        success: false,
        message: "Error: Modelos no disponibles"
      });
    }

    console.time('ventasPorRubro-total');

    // OPTIMIZACIÓN 1: Obtener solo los DocumentoTipo, DocumentoSucursal, DocumentoNumero de facturas válidas
    console.time('obtener-facturas-validas');
    const whereClauseFacturas = {
      Fecha: {
        [Op.between]: [fechaDesde, fechaHasta]
      },
      FechaAnulacion: null // Excluir facturas anuladas
    };
    
    const facturasValidas = await FacturaCabeza.findAll({
      where: whereClauseFacturas,
      attributes: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
      raw: true
    });

    console.timeEnd('obtener-facturas-validas');
    console.log("Facturas válidas encontradas:", facturasValidas.length);

    if (facturasValidas.length === 0) {
      return res.json({
        success: true,
        data: {
          rubros: [],
          totalVentas: 0,
          periodo: {
            fechaDesde,
            fechaHasta
          }
        }
      });
    }

    // OPTIMIZACIÓN 2: Procesamiento por lotes para evitar consultas SQL demasiado grandes
    console.time('obtener-items-batch');
    
    // Filtro de rubro para la consulta de Articulo (si se especifica)
    const rubroCodigos = rubroCodigo ? rubroCodigo.split(',').map(c => c.trim()) : [];
    const whereClauseArticulo = rubroCodigos.length > 0 
      ? { RubroCodigo: { [Op.in]: rubroCodigos } }
      : {};

    // Configurar el tamaño del lote (ajustar según max_allowed_packet de MySQL)
    const BATCH_SIZE = 500;
    const todosLosItems = [];
    let batchesProcessed = 0;

    // Procesar facturas en lotes
    for (let i = 0; i < facturasValidas.length; i += BATCH_SIZE) {
      const batch = facturasValidas.slice(i, i + BATCH_SIZE);
      batchesProcessed++;
      
      console.log(`Procesando lote ${batchesProcessed}: ${batch.length} facturas (${i + 1} - ${Math.min(i + BATCH_SIZE, facturasValidas.length)} de ${facturasValidas.length})`);
      
      // Construir condiciones OR solo para este lote
      const condicionesBatch = batch.map(f => ({
        [Op.and]: [
          { DocumentoTipo: f.DocumentoTipo },
          { DocumentoSucursal: f.DocumentoSucursal },
          { DocumentoNumero: f.DocumentoNumero }
        ]
      }));

      // Obtener items para este lote
      const itemsBatch = await FacturaItem.findAll({
        where: {
          [Op.or]: condicionesBatch
        },
        attributes: ['CodigoArticulo', 'Cantidad', 'PrecioUnitario', 'ImporteBonificado'],
        include: [{
          model: Articulo,
          attributes: ['Codigo', 'Descripcion', 'RubroCodigo', 'Existencia'],
          where: whereClauseArticulo,
          required: rubroCodigos.length > 0, // INNER JOIN si hay filtro, LEFT JOIN si no
          include: [{
            model: Rubro,
            as: 'Rubro',
            attributes: ['Codigo', 'Descripcion'],
            required: false
          }]
        }],
        raw: true,
        nest: true
      });

      todosLosItems.push(...itemsBatch);
      console.log(`Lote ${batchesProcessed} completado: ${itemsBatch.length} items obtenidos`);
    }

    console.timeEnd('obtener-items-batch');
    console.log(`Total de lotes procesados: ${batchesProcessed}`);
    console.log("Items totales obtenidos:", todosLosItems.length);

    // OPTIMIZACIÓN 3: Procesar los items directamente (sin filtrado adicional)
    console.time('procesar-items');
    const ventasPorRubro = {};

    for (const item of todosLosItems) {
      // Verificar que el artículo tenga información
      if (!item.Articulo || !item.Articulo.Codigo) {
        continue;
      }

      const rubroCod = item.Articulo.RubroCodigo || 'SIN_RUBRO';
      const rubroDesc = item.Articulo.Rubro?.Descripcion || 'Sin Rubro';
      const codigoArticulo = item.CodigoArticulo;
      const cantidad = parseFloat(item.Cantidad) || 0;
      const importe = parseFloat(item.ImporteBonificado) || (parseFloat(item.PrecioUnitario) * cantidad);

      // Inicializar rubro si no existe
      if (!ventasPorRubro[rubroCod]) {
        ventasPorRubro[rubroCod] = {
          codigo: rubroCod,
          descripcion: rubroDesc,
          productos: {},
          cantidadTotal: 0,
          importeTotal: 0
        };
      }

      // Inicializar producto si no existe
      if (!ventasPorRubro[rubroCod].productos[codigoArticulo]) {
        ventasPorRubro[rubroCod].productos[codigoArticulo] = {
          codigo: codigoArticulo,
          descripcion: item.Articulo.Descripcion || 'Sin descripción',
          existencia: parseFloat(item.Articulo.Existencia) || 0,
          cantidad: 0,
          importeTotal: 0
        };
      }

      // Acumular cantidades e importes
      ventasPorRubro[rubroCod].productos[codigoArticulo].cantidad += cantidad;
      ventasPorRubro[rubroCod].productos[codigoArticulo].importeTotal += importe;
      ventasPorRubro[rubroCod].cantidadTotal += cantidad;
      ventasPorRubro[rubroCod].importeTotal += importe;
    }

    console.timeEnd('procesar-items');

    // OPTIMIZACIÓN 4: Convertir y ordenar de forma eficiente
    console.time('ordenar-resultados');
    
    // Convertir productos a arrays y ordenar
    for (const rubroCod in ventasPorRubro) {
      ventasPorRubro[rubroCod].productos = Object.values(
        ventasPorRubro[rubroCod].productos
      ).sort((a, b) => b.cantidad - a.cantidad);
    }

    // Convertir a array y ordenar por importe total
    const resultado = Object.values(ventasPorRubro)
      .sort((a, b) => b.importeTotal - a.importeTotal);

    const totalVentas = resultado.reduce((sum, rubro) => sum + rubro.importeTotal, 0);

    console.timeEnd('ordenar-resultados');
    console.timeEnd('ventasPorRubro-total');

    res.json({
      success: true,
      data: {
        rubros: resultado,
        totalVentas: totalVentas,
        periodo: {
          fechaDesde,
          fechaHasta
        }
      }
    });

  } catch (error) {
    console.error("Error en ventasPorRubro:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

// Informe de ventas por rubro agrupado por provincia
exports.ventasPorRubroProvincia = async (req, res) => {
  try {
    const data = await obtenerDatosVentasPorRubroProvincia(
      { db: req.db, models: req.models },
      req.query
    );

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error("Error en ventasPorRubroProvincia:", error);
    console.error("Stack trace:", error.stack);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Error interno del servidor",
      error: error.message
    });
  }
};

// PDF del informe de ventas por rubro agrupado por provincia
exports.generarPDFVentasPorRubroProvincia = async (req, res) => {
  try {
    const { buffer, filename } = await generarPdfBuffer(
      { db: req.db, models: req.models },
      req.query
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error("Error al generar PDF de ventas por rubro y provincia:", error);
    console.error("Stack trace:", error.stack);

    if (!res.headersSent) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.statusCode ? error.message : "Error al generar el PDF",
        error: error.message
      });
    }
  }
};

/**
 * Genera los PDF del informe y los guarda en la carpeta configurada
 * (reportes_auto_dir / rclone). Pensado para "Generar ahora" en /configuracion/reportes.
 * Body/query: fechaDesde, fechaHasta, tipo (facturas|notasCredito|ambos)
 */
exports.exportarRubrosProvinciaAuto = async (req, res) => {
  try {
    const src = { ...req.query, ...req.body };
    const result = await exportarRubrosProvinciaADisco(
      { db: req.db, models: req.models },
      {
        fechaDesde: src.fechaDesde,
        fechaHasta: src.fechaHasta,
        tipo: src.tipo || 'ambos',
        force: true,
        requireEnabled: false
      }
    );

    res.json({
      success: true,
      message: `Se generaron ${result.files.length} archivo(s) en ${result.outDir}`,
      data: result
    });
  } catch (error) {
    console.error('Error en exportarRubrosProvinciaAuto:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Error al exportar el informe',
      error: error.message
    });
  }
};

// ================================================================
// INFORME DE VENTAS POR CLIENTES
// ================================================================

function crearClienteInformeBase(clienteCodigo, cliente) {
  return {
    codigo: clienteCodigo,
    descripcion: cliente?.Descripcion || 'Sin descripción',
    localidad: cliente?.Localidad || 'Sin localidad',
    vendedorCodigo: cliente?.CodigoVendedor || null,
    categoriaIva: cliente?.CategoriaIva || null,
    cuit: cliente?.Cuit || null,
    cantidadFacturas: 0,
    totalVentas: 0,
    totalIva: 0,
    facturas: [],
    cantidadNotasCredito: 0,
    totalNotasCredito: 0,
    notasCredito: [],
    totalNeto: 0
  };
}

function facturaRelacionadaNc(nc) {
  if (!nc.factura_tipo || !nc.factura_sucursal || !nc.factura_numero) return null;
  return `${nc.factura_tipo}-${nc.factura_sucursal}-${nc.factura_numero}`;
}

// Informe de ventas por clientes con filtros
exports.informeVentasPorClientes = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, localidad, vendedorCodigo, categoriaIva } = req.query;
    
    console.log("Parámetros recibidos:", { fechaDesde, fechaHasta, localidad, vendedorCodigo, categoriaIva });
    
    if (!fechaDesde || !fechaHasta) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaDesde y fechaHasta"
      });
    }

    // Obtener los modelos específicos de la empresa
    const { FacturaCabeza, Cliente, Vendedor, CategoriaIva, NotaCredito } = req.models;
    
    if (!FacturaCabeza || !Cliente) {
      return res.status(500).json({
        success: false,
        message: "Error: Modelos no disponibles"
      });
    }

    // Construir filtros para clientes
    const clienteWhereClause = {};
    
    if (localidad) {
      clienteWhereClause.Localidad = {
        [Op.like]: `%${localidad}%`
      };
    }
    
    if (vendedorCodigo) {
      clienteWhereClause.CodigoVendedor = vendedorCodigo;
    }
    
    if (categoriaIva) {
      clienteWhereClause.CategoriaIva = categoriaIva;
    }

    // Obtener clientes que cumplen con los filtros
    const clientesFiltrados = await Cliente.findAll({
      where: clienteWhereClause,
      attributes: ['Codigo', 'Descripcion', 'Localidad', 'CodigoVendedor', 'CategoriaIva', 'Cuit'],
      raw: true
    });

    console.log(`Clientes filtrados: ${clientesFiltrados.length}`);

    if (clientesFiltrados.length === 0) {
      return res.json({
        success: true,
        data: {
          clientes: [],
          estadisticasGenerales: {
            totalClientes: 0,
            totalVentas: 0,
            totalFacturas: 0,
            totalNotasCredito: 0,
            totalNeto: 0,
            promedioVentaCliente: 0
          },
          periodo: {
            fechaDesde,
            fechaHasta
          }
        }
      });
    }

    // Obtener códigos de clientes filtrados
    const codigosClientes = clientesFiltrados.map(c => c.Codigo);

    // Crear un mapa de clientes para acceso rápido
    const clientesMap = clientesFiltrados.reduce((acc, cliente) => {
      acc[cliente.Codigo] = cliente;
      return acc;
    }, {});

    // Obtener facturas de los clientes filtrados
    const facturas = await FacturaCabeza.findAll({
      where: {
        Fecha: { [Op.between]: [fechaDesde, fechaHasta] },
        FechaAnulacion: null,
        ClienteCodigo: { [Op.in]: codigosClientes }
      },
      attributes: [
        'DocumentoTipo',
        'DocumentoSucursal',
        'DocumentoNumero',
        'Fecha',
        'ClienteCodigo',
        'ImporteTotal',
        'ImporteNeto',
        'ImporteIva1',
        'ImporteIva2'
      ],
      order: [['Fecha', 'DESC']],
      raw: true
    });

    console.log(`Facturas encontradas: ${facturas.length}`);

    let notasCredito = [];
    if (NotaCredito) {
      notasCredito = await NotaCredito.findAll({
        where: {
          Fecha: { [Op.between]: [fechaDesde, fechaHasta] },
          FechaAnulacion: null,
          CodigoCliente: { [Op.in]: codigosClientes }
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
        order: [['Fecha', 'DESC']],
        raw: true
      });
    }

    console.log(`Notas de crédito encontradas: ${notasCredito.length}`);

    // Agrupar facturas y NC por cliente
    const ventasPorCliente = {};

    const ensureCliente = (clienteCodigo) => {
      if (!ventasPorCliente[clienteCodigo]) {
        ventasPorCliente[clienteCodigo] = crearClienteInformeBase(
          clienteCodigo,
          clientesMap[clienteCodigo]
        );
      }
      return ventasPorCliente[clienteCodigo];
    };
    
    facturas.forEach(factura => {
      const entry = ensureCliente(factura.ClienteCodigo);
      entry.cantidadFacturas++;
      entry.totalVentas += parseFloat(factura.ImporteTotal) || 0;
      entry.totalIva += (parseFloat(factura.ImporteIva1) || 0) + (parseFloat(factura.ImporteIva2) || 0);
      entry.facturas.push({
        tipo: factura.DocumentoTipo,
        numero: `${factura.DocumentoSucursal}-${factura.DocumentoNumero}`,
        fecha: factura.Fecha,
        importe: parseFloat(factura.ImporteTotal) || 0
      });
    });

    notasCredito.forEach((nc) => {
      const entry = ensureCliente(nc.CodigoCliente);
      const importe = parseFloat(nc.ImporteTotal) || 0;
      entry.cantidadNotasCredito++;
      entry.totalNotasCredito += importe;
      entry.notasCredito.push({
        tipo: nc.DocumentoTipo,
        numero: `${nc.DocumentoSucursal}-${nc.DocumentoNumero}`,
        fecha: nc.Fecha,
        importe,
        facturaRelacionada: facturaRelacionadaNc(nc)
      });
    });

    // Obtener información de vendedores si hay alguno
    const vendedoresCodigos = [...new Set(
      Object.values(ventasPorCliente)
        .map(v => v.vendedorCodigo)
        .filter(Boolean)
    )];

    let vendedoresMap = {};
    if (Vendedor && vendedoresCodigos.length > 0) {
      const vendedores = await Vendedor.findAll({
        where: { Codigo: { [Op.in]: vendedoresCodigos } },
        attributes: ['Codigo', 'Descripcion'],
        raw: true
      });
      
      vendedoresMap = vendedores.reduce((acc, vendedor) => {
        acc[vendedor.Codigo] = vendedor.Descripcion;
        return acc;
      }, {});
    }

    // Obtener información de categorías IVA si hay alguna
    const categoriasIvaCodigos = [...new Set(
      Object.values(ventasPorCliente)
        .map(v => v.categoriaIva)
        .filter(Boolean)
    )];

    let categoriasIvaMap = {};
    if (CategoriaIva && categoriasIvaCodigos.length > 0) {
      const categoriasIva = await CategoriaIva.findAll({
        where: { Codigo: { [Op.in]: categoriasIvaCodigos } },
        attributes: ['Codigo', 'Descripcion'],
        raw: true
      });
      
      categoriasIvaMap = categoriasIva.reduce((acc, categoria) => {
        acc[categoria.Codigo] = categoria.Descripcion;
        return acc;
      }, {});
    }

    // Agregar descripciones y neto
    Object.values(ventasPorCliente).forEach(cliente => {
      cliente.vendedorDescripcion = cliente.vendedorCodigo ? 
        (vendedoresMap[cliente.vendedorCodigo] || 'Vendedor no encontrado') : 
        'Sin vendedor';
      
      cliente.categoriaIvaDescripcion = cliente.categoriaIva ? 
        (categoriasIvaMap[cliente.categoriaIva] || 'Categoría no encontrada') : 
        'Sin categoría';

      cliente.totalNeto = cliente.totalVentas - cliente.totalNotasCredito;
    });

    // Convertir a array y ordenar por total neto
    const clientesArray = Object.values(ventasPorCliente)
      .sort((a, b) => b.totalNeto - a.totalNeto);

    // Calcular estadísticas generales
    const totalVentas = clientesArray.reduce((sum, c) => sum + c.totalVentas, 0);
    const totalFacturas = clientesArray.reduce((sum, c) => sum + c.cantidadFacturas, 0);
    const totalNotasCredito = clientesArray.reduce((sum, c) => sum + c.totalNotasCredito, 0);
    const totalNeto = totalVentas - totalNotasCredito;

    // Preparar respuesta
    const respuesta = {
      clientes: clientesArray,
      estadisticasGenerales: {
        totalClientes: clientesArray.length,
        totalVentas,
        totalFacturas,
        totalNotasCredito,
        totalNeto,
        promedioVentaCliente: clientesArray.length > 0 ? totalVentas / clientesArray.length : 0,
        promedioFacturasCliente: clientesArray.length > 0 ? totalFacturas / clientesArray.length : 0
      },
      periodo: {
        fechaDesde,
        fechaHasta
      },
      filtrosAplicados: {
        localidad: localidad || 'Todos',
        vendedor: vendedorCodigo ? (vendedoresMap[vendedorCodigo] || vendedorCodigo) : 'Todos',
        categoriaIva: categoriaIva ? (categoriasIvaMap[categoriaIva] || categoriaIva) : 'Todas'
      }
    };

    res.json({
      success: true,
      data: respuesta
    });

  } catch (error) {
    console.error("Error al generar informe de ventas por clientes:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error al generar el informe",
      error: error.message
    });
  }
};

// PDF detalle de ventas de un cliente
exports.generarPDFDetalleCliente = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, clienteCodigo } = req.query;

    if (!fechaDesde || !fechaHasta || !clienteCodigo) {
      return res.status(400).json({
        success: false,
        message: "Se requieren fechaDesde, fechaHasta y clienteCodigo"
      });
    }

    const { FacturaCabeza, Cliente, Vendedor, CategoriaIva, DatosEmpresa, NotaCredito } = req.models || {};

    if (!FacturaCabeza || !Cliente) {
      return res.status(500).json({
        success: false,
        message: "Error: Modelos no disponibles"
      });
    }

    const cliente = await Cliente.findOne({
      where: { Codigo: clienteCodigo },
      attributes: ['Codigo', 'Descripcion', 'Localidad', 'CodigoVendedor', 'CategoriaIva', 'Cuit'],
      raw: true
    });

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado"
      });
    }

    const facturas = await FacturaCabeza.findAll({
      where: {
        ClienteCodigo: clienteCodigo,
        Fecha: { [Op.between]: [fechaDesde, fechaHasta] },
        FechaAnulacion: null
      },
      attributes: [
        'DocumentoTipo',
        'DocumentoSucursal',
        'DocumentoNumero',
        'Fecha',
        'ImporteTotal',
        'ImporteIva1',
        'ImporteIva2'
      ],
      order: [['Fecha', 'DESC'], ['DocumentoNumero', 'DESC']],
      raw: true
    });

    let notasCredito = [];
    if (NotaCredito) {
      notasCredito = await NotaCredito.findAll({
        where: {
          CodigoCliente: clienteCodigo,
          Fecha: { [Op.between]: [fechaDesde, fechaHasta] },
          FechaAnulacion: null
        },
        attributes: [
          'DocumentoTipo',
          'DocumentoSucursal',
          'DocumentoNumero',
          'Fecha',
          'ImporteTotal',
          'factura_tipo',
          'factura_sucursal',
          'factura_numero'
        ],
        order: [['Fecha', 'DESC'], ['DocumentoNumero', 'DESC']],
        raw: true
      });
    }

    let vendedorDescripcion = 'Sin vendedor';
    if (Vendedor && cliente.CodigoVendedor) {
      const vendedor = await Vendedor.findOne({
        where: { Codigo: cliente.CodigoVendedor },
        attributes: ['Descripcion'],
        raw: true
      });
      if (vendedor?.Descripcion) vendedorDescripcion = vendedor.Descripcion;
    }

    let categoriaIvaDescripcion = 'Sin categoría';
    if (CategoriaIva && cliente.CategoriaIva) {
      const categoria = await CategoriaIva.findOne({
        where: { Codigo: cliente.CategoriaIva },
        attributes: ['Descripcion'],
        raw: true
      });
      if (categoria?.Descripcion) categoriaIvaDescripcion = categoria.Descripcion;
    }

    const facturasPdf = facturas.map((factura) => ({
      tipo: factura.DocumentoTipo,
      numero: `${factura.DocumentoSucursal}-${factura.DocumentoNumero}`,
      fecha: factura.Fecha,
      importe: parseFloat(factura.ImporteTotal) || 0
    }));

    const notasCreditoPdf = notasCredito.map((nc) => ({
      tipo: nc.DocumentoTipo,
      numero: `${nc.DocumentoSucursal}-${nc.DocumentoNumero}`,
      fecha: nc.Fecha,
      importe: parseFloat(nc.ImporteTotal) || 0,
      facturaRelacionada: facturaRelacionadaNc(nc)
    }));

    const totalVentas = facturasPdf.reduce((sum, f) => sum + f.importe, 0);
    const totalNotasCredito = notasCreditoPdf.reduce((sum, nc) => sum + nc.importe, 0);
    const totalIva = facturas.reduce(
      (sum, f) => sum + (parseFloat(f.ImporteIva1) || 0) + (parseFloat(f.ImporteIva2) || 0),
      0
    );
    const cantidadFacturas = facturasPdf.length;
    const cantidadNotasCredito = notasCreditoPdf.length;

    const datosEmpresa = DatosEmpresa ? await DatosEmpresa.findOne({ raw: true }) : {};

    const datosPDF = {
      cliente: {
        codigo: cliente.Codigo,
        descripcion: cliente.Descripcion,
        cuit: cliente.Cuit,
        localidad: cliente.Localidad || 'Sin localidad',
        vendedorDescripcion,
        categoriaIvaDescripcion
      },
      periodo: { fechaDesde, fechaHasta },
      facturas: facturasPdf,
      notasCredito: notasCreditoPdf,
      totales: {
        totalVentas,
        totalNotasCredito,
        totalNeto: totalVentas - totalNotasCredito,
        totalIva,
        cantidadFacturas,
        cantidadNotasCredito,
        promedioFactura: cantidadFacturas > 0 ? totalVentas / cantidadFacturas : 0
      }
    };

    const safeName = String(cliente.Descripcion || clienteCodigo)
      .replace(/[^\w\-]+/g, '_')
      .slice(0, 40);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="detalle-cliente-${safeName}-${fechaDesde}-${fechaHasta}.pdf"`
    );
    doc.pipe(res);
    await renderInformeClienteDetalle(doc, datosPDF, datosEmpresa || {});
    doc.end();
  } catch (error) {
    console.error("Error al generar PDF de detalle de cliente:", error);
    console.error("Stack trace:", error.stack);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Error al generar el PDF",
        error: error.message
      });
    }
  }
}; 