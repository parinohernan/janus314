const sequelize = require("../config/database");
const { Op } = require("sequelize");
const fetch = require("node-fetch");
const numerosControlController = require("./numerosControl.controller");
const FacturaService = require("../services/factura.service");

// Obtener listado de facturas (con paginación y filtros)
exports.listarFacturas = async (req, res) => {
  try {
    const { FacturaCabeza, Cliente } = req.models;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const tipo = req.query.tipo || null;
    const clienteCodigo = req.query.cliente || null;
    const fechaDesde = req.query.fechaDesde || null;
    const fechaHasta = req.query.fechaHasta || null;
    const fecha = req.query.fecha || null;
    const vendedor = req.query.vendedor || null;

    // Construir condiciones de filtrado
    const whereClause = {};
    if (tipo) whereClause.DocumentoTipo = tipo;
    if (clienteCodigo) whereClause.ClienteCodigo = clienteCodigo;
    if (vendedor) whereClause.VendedorCodigo = vendedor;

    // Manejo de fechas con ajuste de zona horaria GMT-3
    if (fecha) {
      // Si se proporciona una fecha específica
      // Para asegurar que obtengamos todo el día en GMT-3, usamos el mismo día sin ajuste
      whereClause.Fecha = fecha;
      console.log('Filtrando por fecha específica (GMT-3):', fecha);
    } else if (fechaDesde && fechaHasta) {
      // Si se proporciona un rango de fechas
      whereClause.Fecha = {
        [Op.between]: [fechaDesde, fechaHasta],
      };
      console.log('Filtrando por rango de fechas (GMT-3):', fechaDesde, 'hasta', fechaHasta);
    } else if (fechaDesde) {
      whereClause.Fecha = {
        [Op.gte]: fechaDesde,
      };
      console.log('Filtrando desde fecha (GMT-3):', fechaDesde);
    } else if (fechaHasta) {
      whereClause.Fecha = {
        [Op.lte]: fechaHasta,
      };
      console.log('Filtrando hasta fecha (GMT-3):', fechaHasta);
    }

    // Consulta con join a cliente
    const facturas = await FacturaCabeza.findAndCountAll({
      where: whereClause,
      attributes: [
        'DocumentoTipo',
        'DocumentoSucursal',
        'DocumentoNumero',
        'Fecha',
        'ImporteTotal',
        'FechaAnulacion',
        'afip_cae'
      ],
      include: [
        {
          model: Cliente,
          attributes: ["Codigo", "Descripcion"],
        },
      ],
      order: [
        ["DocumentoSucursal", "DESC"],
        ["DocumentoTipo", "DESC"],
        ["DocumentoNumero", "DESC"],
      ],
      limit,
      offset,
    });

    // Mapear resultados para asegurar formato de fecha consistente
    const itemsMapeados = facturas.rows.map(factura => {
      const item = factura.toJSON();
      
      // Aseguramos que la fecha se muestre en formato YYYY-MM-DD sin ajustes de zona horaria
      if (item.Fecha) {
        const fechaObj = new Date(item.Fecha);
        item.FechaFormateada = fechaObj.toISOString().split('T')[0];
      }
      
      return item;
    });

    res.json({
      items: itemsMapeados,
      meta: {
        totalItems: facturas.count,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: Math.ceil(facturas.count / limit),
      },
    });
  } catch (error) {
    console.error("Error al listar facturas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener facturas",
      error: error.message,
    });
  }
};

// Obtener detalle de una factura
exports.obtenerFactura = async (req, res) => {
  console.log("obtenerFactura");
  try {
    const { FacturaCabeza, Cliente, FacturaItem, Articulo } = req.models;
    const { tipo, sucursal, numero } = req.params;

    console.log("Parámetros de búsqueda:", {
      tipo,
      sucursal,
      numero
    });

    // Obtener encabezado
    const factura = await FacturaCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      },
      include: [
        {
          model: Cliente,
          attributes: ["Codigo", "Descripcion", "CategoriaIva"],
        },
      ],
    });

    if (!factura) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      });
    }

    // Convertir factura a un objeto plano
    const facturaPlana = factura.toJSON();
    
    // Ajustar la fecha para que sea consistente
    if (facturaPlana.Fecha) {
      const fechaObj = new Date(facturaPlana.Fecha);
      facturaPlana.FechaFormateada = fechaObj.toISOString().split('T')[0];
    }

    // Obtener items con la información del artículo
    const items = await FacturaItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      },
      attributes: [
        'DocumentoTipo',
        'DocumentoSucursal',
        'DocumentoNumero',
        'CodigoArticulo',
        'Cantidad',
        'PrecioLista',
        'PorcentajeBonificado',
        'ImporteBonificado',
        'PrecioUnitario',
        'ImporteCosto'
      ],
      include: [{
        model: Articulo,
        required: false,
        attributes: ['Codigo', 'Descripcion', 'PorcentajeIVA1', 'PorcentajeIVA2']
      }]
    });

    console.log("Items encontrados:", items);

    // Mapear los items para incluir la información necesaria
    const itemsMapeados = items.map(item => {
      const itemData = item.toJSON();
      return {
        CodigoArticulo: itemData.CodigoArticulo || '',
        Descripcion: itemData.Articulo?.Descripcion || 'Artículo no encontrado',
        Cantidad: itemData.Cantidad || 0,
        PrecioUnitario: itemData.PrecioUnitario || 0,
        PorcentajeBonificado: itemData.PorcentajeBonificado || 0,
        PorcentajeIva: itemData.Articulo?.PorcentajeIVA1 || 21,
        PrecioUnitarioConIva: (itemData.PrecioUnitario || 0) * (1 + (itemData.Articulo?.PorcentajeIVA1 || 21) / 100),
        Total: (itemData.Cantidad || 0) * (itemData.PrecioUnitario || 0),
        TotalConIva: (itemData.Cantidad || 0) * (itemData.PrecioUnitario || 0) * (1 + (itemData.Articulo?.PorcentajeIVA1 || 21) / 100)
      };
    });

    console.log("Items mapeados:", itemsMapeados);

    res.json({
      success: true,
      data: {
        encabezado: facturaPlana,
        items: itemsMapeados
      }
    });
  } catch (error) {
    console.error("Error al obtener detalle de factura:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener detalle de factura",
      error: error.message
    });
  }
};

// Crear nueva factura - Versión modularizada
exports.crearFactura = async (req, res) => {
  try {
    const { FacturaCabeza, FacturaItem, Cliente, Articulo, MovimientoStock, NumerosControl } = req.models;
    const facturaData = req.body;
    
    // Obtener la conexión de la empresa
    const connection = req.db;
    
    // Crear transacción usando la conexión de la empresa específica, no la global
    const t = await connection.transaction();
    
    try {
      // Usar la fecha exacta que viene del frontend
      if (!facturaData.Fecha) {
        // Si no viene fecha, usar la fecha actual
        facturaData.Fecha = new Date().toISOString().split('T')[0];
        console.log('Usando fecha actual:', facturaData.Fecha);
      } else {
        console.log('Usando fecha del frontend:', facturaData.Fecha);
      }
      
      // completo los campos necesarios con los nombres adecuados
      facturaData.PagoTipo = facturaData.FormaPagoCodigo;
      delete facturaData.FormaPagoCodigo;
      facturaData.VendedorCodigo = facturaData.Vendedor || "1";
      delete facturaData.Vendedor;
      facturaData.PorcentajeIva1 = "21";
      facturaData.PorcentajeIva2 = "10.5";
      facturaData.ListaNumero = facturaData.ListaPrecio;
      delete facturaData.ListaPrecio;
      facturaData.CodigoUsuario = "admin";

      // Verificar si el tipo de pago aplica saldo
      const { TipoDePago } = req.models;
      const tipoPago = await TipoDePago.findOne({
        where: { 
          Codigo: facturaData.PagoTipo,
          Activo: 1
        }
      });

      if (tipoPago && tipoPago.aplicaSaldo) {
        console.log(`Corregir saldo por importe: ${facturaData.ImporteTotal}`);
      }

      // Si es cuenta corriente, el importe pagado es 0
      if (facturaData.PagoTipo === "CC") {
        facturaData.ImportePagado = 0;
        
        // Actualizar saldo del cliente
        const cliente = await Cliente.findOne({
          where: { Codigo: facturaData.ClienteCodigo },
          transaction: t
        });
        
        if (!cliente) {
          throw new Error("Cliente no encontrado");
        }
        
        // Actualizar el saldo del cliente
        await Cliente.update(
          { 
            ImporteDeuda: connection.literal(`COALESCE(ImporteDeuda, 0) + ${parseFloat(facturaData.ImporteTotal) || 0}`)
          },
          { 
            where: { Codigo: facturaData.ClienteCodigo },
            transaction: t 
          }
        );
      } else {
        // Si es contado, el importe pagado es el total
        facturaData.ImportePagado = facturaData.ImporteTotal;
      }

      // Obtener y actualizar el número de control
      const numeroControl = await numerosControlController.actualizarNumeroDirecto(
        facturaData.DocumentoTipo,
        facturaData.DocumentoSucursal,
        facturaData.ImporteTotal,
        t,
        req.models
      );

      // Asignar el número obtenido a la factura
      facturaData.DocumentoNumero = numeroControl;

      // Crear factura usando el servicio (pasando la transacción y los modelos dinámicos)
      const facturaCreada = await FacturaService.crearFactura(
        facturaData, 
        t,  // Pasar la transacción para que todo se haga en la misma
        { FacturaCabeza, FacturaItem, Articulo, MovimientoStock, NumerosControl },
        connection  // Pasar la conexión específica de la empresa
      );

      // Confirmar la transacción
      await t.commit();

      //aca incluir Comunicacion con ARCA o AFIP
      res.status(201).json({
        success: true,
        message: "Factura creada correctamente",
        data: facturaCreada,
      });
    } catch (error) {
      // Si hay error, hacer rollback
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error al crear factura:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear factura",
      error: error.message,
    });
  }
};

// Anular factura
exports.anularFactura = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { FacturaCabeza, FacturaItem, Articulo } = req.models;
    const { tipo, sucursal, numero } = req.params;

    // Verificar si la factura existe
    const factura = await FacturaCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      transaction: t,
    });

    if (!factura) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      });
    }

    // Verificar si ya está anulada
    if (factura.FechaAnulacion) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "La factura ya se encuentra anulada",
      });
    }

    // Obtener ítems de factura para restaurar stock
    const items = await FacturaItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      include: [{ model: Articulo }],
      transaction: t,
    });

    // Restaurar stock de artículos
    for (const item of items) {
      if (item.Articulo) {
        let nuevoStock;

        if (tipo === "FAC") {
          // Si es factura, devolvemos el stock
          nuevoStock =
            parseFloat(item.Articulo.Existencia) + parseFloat(item.Cantidad);
        } else if (tipo === "NCA") {
          // Si es nota de crédito, restamos el stock
          nuevoStock =
            parseFloat(item.Articulo.Existencia) - parseFloat(item.Cantidad);
        }

        await item.Articulo.update(
          { Existencia: nuevoStock },
          { transaction: t }
        );
      }
    }

    // Marcar como anulada
    await factura.update(
      {
        FechaAnulacion: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    res.json({
      success: true,
      message: "Factura anulada correctamente",
    });
  } catch (error) {
    await t.rollback();
    console.error("Error al anular factura:", error);
    res.status(500).json({
      success: false,
      message: "Error al anular factura",
      error: error.message,
    });
  }
};

// Obtener últimas facturas de un cliente
exports.obtenerUltimasFacturasCliente = async (req, res) => {
  const { FacturaCabeza, Cliente } = req.models;
  const { codigoCliente } = req.params;
  const { limit = 5 } = req.query;

  try {
    // Obtener las facturas
    const facturas = await FacturaCabeza.findAll({
      where: {
        ClienteCodigo: codigoCliente,
        FechaAnulacion: null, // Opcional: solo facturas no anuladas
      },
      include: [
        {
          model: Cliente,
          attributes: ["Codigo", "Descripcion"],
        },
      ],
      order: [["Fecha", "DESC"]],
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      items: facturas.map((factura) => ({
        tipo: factura.DocumentoTipo,
        sucursal: factura.DocumentoSucursal,
        numero: factura.DocumentoNumero,
        fecha: factura.Fecha,
        cliente: factura.Cliente?.Descripcion,
        total: factura.ImporteTotal,
        label: `${factura.DocumentoTipo}-${factura.DocumentoSucursal}-${
          factura.DocumentoNumero
        } (${new Date(factura.Fecha).toLocaleDateString()})`,
      })),
    });
  } catch (error) {
    console.error("Error al obtener últimas facturas del cliente:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener últimas facturas del cliente",
      error: error.message,
    });
  }
};
