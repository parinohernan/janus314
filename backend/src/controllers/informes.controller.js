const FacturaCabeza = require("../models/facturaCabeza.model");
const FacturaItem = require("../models/facturaItem.model");
const Articulo = require("../models/articulo.model");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

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
      acc[articulo.Codigo] = articulo.Descripcion;
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