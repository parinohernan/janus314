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

    // Obtener encabezado
    const factura = await FacturaCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
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
    } else {
      console.log("factura", factura);
    }

    // Convertir factura a un objeto plano para poder modificarlo
    const facturaPlana = factura.toJSON();
    
    // Ajustar la fecha para que sea consistente (formato YYYY-MM-DD)
    if (facturaPlana.Fecha) {
      const fechaObj = new Date(facturaPlana.Fecha);
      facturaPlana.FechaFormateada = fechaObj.toISOString().split('T')[0];
      console.log('Fecha original:', facturaPlana.Fecha);
      console.log('Fecha formateada:', facturaPlana.FechaFormateada);
    }

    // Obtener items sin usar la asociación
    const items = await FacturaItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      attributes: [
        'DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero', 
        'CodigoArticulo', 'Cantidad', 'ImporteCosto', 'PrecioLista', 
        'PorcentajeBonificado', 'ImporteBonificado', 'PrecioUnitario', 
        'DocumentoLiqTipo', 'DocumentoLiqSucursal', 'DocumentoLiqNumero', 
        'LiqFecha', 'es_merma'
      ],
      raw: true,
    });

    // Obtener los códigos de artículos para buscarlos
    const codigosArticulos = items.map((item) => item.CodigoArticulo);

    // Buscar los artículos correspondientes
    const articulos = await Articulo.findAll({
      where: {
        Codigo: codigosArticulos,
      },
      raw: true,
    });

    // Crear un mapa de artículos por código para facilitar la búsqueda
    const articulosPorCodigo = {};
    articulos.forEach((articulo) => {
      articulosPorCodigo[articulo.Codigo] = articulo;
    });

    // Combinar los items con la información de artículos
    const itemsConArticulos = items.map((item) => {
      const articulo = articulosPorCodigo[item.CodigoArticulo] || null;
      // console.log("articulo", articulo);
      return {
        ...item,
        PorcentajeIVA1: articulo.PorcentajeIVA1,
        PorcentajeIVA2: articulo.PorcentajeIVA2,
        Descripcion: articulo.Descripcion,
      };
    });
    // console.log("itemsConArticulos", itemsConArticulos.length);
    res.json({
      success: true,
      data: {
        encabezado: facturaPlana,
        items: itemsConArticulos,
        // articulos: articulos,
      },
    });
  } catch (error) {
    console.error("Error al obtener detalle de factura:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener detalle de factura",
      error: error.message,
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
    
    // Ajuste de zona horaria: si viene una fecha en facturaData, la ajustamos a GMT-3
    if (facturaData.Fecha) {
      // Parseamos la fecha que llega
      const fechaOriginal = new Date(facturaData.Fecha);
      
      // Creamos una fecha en formato ISO pero ajustada al huso horario GMT-3
      // Esto garantiza que la fecha se guarde correctamente en la zona horaria local
      const fechaLocal = new Date(fechaOriginal.getTime());
      // Establecemos la hora a las 12 del mediodía para evitar problemas con cambios de día
      fechaLocal.setHours(12, 0, 0, 0);
      
      // Actualizamos la fecha en facturaData con el formato YYYY-MM-DD
      facturaData.Fecha = fechaLocal.toISOString().split('T')[0];
      console.log('Fecha ajustada para zona horaria GMT-3:', facturaData.Fecha);
    } else {
      // Si no viene fecha, creamos una fecha actual en GMT-3
      const ahora = new Date();
      ahora.setHours(12, 0, 0, 0); // Mediodía para evitar problemas con cambios de día
      facturaData.Fecha = ahora.toISOString().split('T')[0];
      console.log('Fecha actual ajustada para zona horaria GMT-3:', facturaData.Fecha);
    }
    
    // Obtener número de comprobante desde el servidor de forma segura
    // Utilizamos directamente una consulta SQL a la base de datos específica de la empresa
    try {
      // Usamos la conexión a la base de datos específica de la empresa
      console.log('Obteniendo número de comprobante con conexión de empresa:', connection.config.database);
      const [result] = await connection.query(
        `SELECT NumeroProximo FROM t_numeroscontrol 
         WHERE Codigo = ? AND Sucursal = ? 
         FOR UPDATE`,
        {
          replacements: [facturaData.DocumentoTipo, facturaData.DocumentoSucursal],
          type: connection.QueryTypes.SELECT,
          transaction: t,
        }
      );

      if (!result) {
        throw new Error(
          `No se encontró configuración para el comprobante ${facturaData.DocumentoTipo} y sucursal ${facturaData.DocumentoSucursal}`
        );
      }

      const numeroActual = result.NumeroProximo;

      // Actualizar inmediatamente el número incrementándolo
      await connection.query(
        `UPDATE t_numeroscontrol 
         SET NumeroProximo = NumeroProximo + 1 
         WHERE Codigo = ? AND Sucursal = ?`,
        {
          replacements: [facturaData.DocumentoTipo, facturaData.DocumentoSucursal],
          type: connection.QueryTypes.UPDATE,
          transaction: t,
        }
      );

      // Formatear el número como string con ceros a la izquierda (8 dígitos)
      facturaData.DocumentoNumero = numeroActual.toString().padStart(8, "0");
      console.log(`Número de factura asignado por el servidor: ${facturaData.DocumentoNumero}`);
      
      // Hacemos COMMIT para guardar el incremento del número, incluso si falla algo después
      await t.commit();
      console.log('Transacción confirmada: número de comprobante actualizado');
      
    } catch (numError) {
      console.error("Error al obtener número de comprobante:", numError);
      await t.rollback();
      return res.status(500).json({
        success: false,
        message: "Error al obtener número de comprobante",
        error: numError.message,
      });
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

    // Creamos una nueva transacción para el saldo del cliente
    const tCliente = await connection.transaction();
    
    try {
      if (facturaData.PagoTipo === "CC") {
        // actualizo saldo del cliente
        const cliente = await Cliente.findOne({
          where: { Codigo: facturaData.ClienteCodigo },
          transaction: tCliente
        });
        await Cliente.update(
          { ImporteDeuda: cliente.ImporteDeuda + facturaData.ImporteTotal },
          { 
            where: { Codigo: facturaData.ClienteCodigo },
            transaction: tCliente 
          }
        );
        
        // Confirmamos esta transacción también
        await tCliente.commit();
      } else {
        facturaData.ImportePagado = facturaData.ImporteTotal;
        // No necesitamos la transacción en este caso
        await tCliente.rollback();
      }
    } catch (clienteError) {
      await tCliente.rollback();
      console.error("Error al actualizar saldo del cliente:", clienteError);
      // Continuamos con la creación de la factura aunque haya fallado la actualización del saldo
    }

    // Crear factura usando el servicio (pasando la transacción y los modelos dinámicos)
    const facturaCreada = await FacturaService.crearFactura(
      facturaData, 
      null,  // No pasar transacción propia, el servicio creará una con la conexión adecuada
      { FacturaCabeza, FacturaItem, Articulo, MovimientoStock, NumerosControl },
      connection  // Pasar la conexión específica de la empresa
    );

    // No necesitamos manejar la transacción aquí, el servicio lo hace
    // Tampoco necesitamos actualizar el número de control aquí, se hace dentro del servicio

    //aca incluir Comunicacion con ARCA o AFIP
    res.status(201).json({
      success: true,
      message: "Factura creada correctamente",
      data: facturaCreada,
    });
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
