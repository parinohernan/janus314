const { Op, fn, col } = require('sequelize');

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
      productos: resultado,
      totalVentas: resultado.reduce((total, item) => total + item.importeTotal, 0)
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