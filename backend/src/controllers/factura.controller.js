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
    
    // Log para ver qué campos están disponibles
    console.log("Campos de la factura:", Object.keys(facturaPlana));
    console.log("Datos de lista de precios en factura:", {
      ListaNumero: facturaPlana.ListaNumero,
      ListaPrecio: facturaPlana.ListaPrecio,
      Lista: facturaPlana.Lista
    });
    
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

// Crear nueva factura - Versión optimizada
exports.crearFactura = async (req, res) => {
  let t = null;
  try {
    const { FacturaCabeza, FacturaItem, Cliente, Articulo, MovimientoStock, NumerosControl } = req.models;
    const facturaData = req.body;
    
    // Obtener la conexión de la empresa
    const connection = req.db;
    
    // Crear transacción usando la conexión de la empresa específica
    t = await connection.transaction();
    
    // Usar la fecha exacta que viene del frontend
    if (!facturaData.Fecha) {
      facturaData.Fecha = new Date().toISOString().split('T')[0];
      console.log('Usando fecha actual:', facturaData.Fecha);
    } else {
      console.log('Usando fecha del frontend:', facturaData.Fecha);
    }
    
    // Completar los campos necesarios
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
      },
      transaction: t
    });

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

    // ✅ Obtener y actualizar el número de control (una sola vez)
    const numeroControl = await numerosControlController.actualizarNumeroDirecto(
      facturaData.DocumentoTipo,
      facturaData.DocumentoSucursal,
      facturaData.ImporteTotal,
      t,
      req.models
    );

    // Asignar el número obtenido a la factura
    facturaData.DocumentoNumero = numeroControl;

    // ✅ Crear factura usando el servicio (sin crear nueva transacción)
    const facturaCreada = await FacturaService.crearFactura(
      facturaData, 
      t,  // Pasar la transacción existente
      { FacturaCabeza, FacturaItem, Articulo, MovimientoStock, NumerosControl },
      connection
    );

    // ✅ Confirmar la transacción
    await t.commit();

    res.status(201).json({
      success: true,
      message: "Factura creada correctamente",
      data: facturaCreada,
    });
  } catch (error) {
    // ✅ Hacer rollback en caso de error
    if (t) {
      await t.rollback();
    }
    console.error(`[${new Date().toLocaleString()}] Error al crear factura:`, error);
    res.status(500).json({
      success: false,
      message: "Error al crear factura",
      error: error.message,
    });
  }
};

// Anular factura
exports.anularFactura = async (req, res) => {
  const t = await req.db.transaction();

  try {
    const { FacturaCabeza, FacturaItem, Articulo, ReciboItem, Cliente } = req.models;
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

    // ✅ Verificar que solo se puedan anular prefacturas (PRF) y notas de crédito tipo NCF
    if (tipo !== "PRF" && tipo !== "NCF") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `No se puede anular el documento tipo ${tipo}. Solo se pueden anular prefacturas (PRF) y notas de crédito tipo NCF.`,
      });
    }

    // ✅ Verificar si existe un recibo asociado a la factura
    const reciboAsociado = await ReciboItem.findOne({
      where: {
        FacturaTipo: tipo,
        FacturaSucursal: sucursal,
        FacturaNumero: numero,
      },
      transaction: t,
    });

    if (reciboAsociado) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Error: primero debe anular el recibo ${reciboAsociado.DocumentoTipo}-${reciboAsociado.DocumentoSucursal}-${reciboAsociado.DocumentoNumero}`,
      });
    }

    // Obtener ítems de factura para restaurar stock
    const items = await FacturaItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      attributes: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero', 'CodigoArticulo', 'Cantidad'],
      transaction: t,
    });

    // Restaurar stock de artículos
    for (const item of items) {
      // Obtener el artículo por separado para evitar problemas de relaciones
      const articulo = await Articulo.findOne({
        where: { Codigo: item.CodigoArticulo },
        attributes: ['Codigo', 'Descripcion', 'Existencia', 'ExistenciaMinima', 'ExistenciaMaxima'],
        transaction: t
      });

      if (articulo) {
        // ✅ Validar que los valores sean números válidos
        const existenciaActual = parseFloat(articulo.Existencia) || 0;
        const cantidad = parseFloat(item.Cantidad) || 0;
        
        if (isNaN(existenciaActual) || isNaN(cantidad)) {
          console.error(`❌ Valores inválidos para artículo ${articulo.Codigo}:`, {
            existencia: articulo.Existencia,
            cantidad: item.Cantidad,
            existenciaActual,
            cantidad
          });
          throw new Error(`Valores inválidos para artículo ${articulo.Codigo}: existencia=${articulo.Existencia}, cantidad=${item.Cantidad}`);
        }

        let nuevoStock;

        if (tipo === "PRF") {
          // Prefactura: devolver stock al inventario (no es documento legal)
          nuevoStock = existenciaActual + cantidad;
        } else if (tipo === "NCF") {
          // Nota de crédito NCF: restar stock del inventario
          nuevoStock = existenciaActual - cantidad;
        }

        // ✅ Validar que el nuevo stock sea un número válido
        if (isNaN(nuevoStock)) {
          console.error(`❌ Nuevo stock inválido para artículo ${articulo.Codigo}:`, {
            existenciaActual,
            cantidad,
            nuevoStock,
            tipo
          });
          throw new Error(`Error al calcular nuevo stock para artículo ${articulo.Codigo}`);
        }

        // ✅ Validar que el nuevo stock no sea excesivamente negativo (opcional)
        if (nuevoStock < -1000) {
          console.warn(`⚠️ Stock muy negativo para artículo ${articulo.Codigo}: ${nuevoStock}`);
        }

        console.log(`✅ Actualizando stock artículo ${articulo.Codigo}: ${existenciaActual} + ${cantidad} = ${nuevoStock} (${nuevoStock >= 0 ? 'positivo' : 'negativo'})`);

        await articulo.update(
          { Existencia: nuevoStock },
          { transaction: t }
        );
      }
    }

    // ✅ Actualizar saldo del cliente si es cuenta corriente
    if (factura.PagoTipo === "CC") {
      const cliente = await Cliente.findOne({
        where: { Codigo: factura.ClienteCodigo },
        transaction: t
      });
      
      if (cliente) {
        // Restar el importe de la factura del saldo del cliente
        const nuevoSaldo = parseFloat(cliente.ImporteDeuda || 0) - parseFloat(factura.ImporteTotal || 0);
        
        await cliente.update(
          { ImporteDeuda: nuevoSaldo },
          { transaction: t }
        );
        
        console.log(`✅ Saldo del cliente ${cliente.Codigo} actualizado: ${cliente.ImporteDeuda} → ${nuevoSaldo}`);
      }
    }

    // Marcar como anulada y poner importes en 0
    await factura.update(
      {
        FechaAnulacion: new Date(),
        ImporteTotal: 0,        // ✅ Poner importe total en 0
        ImportePagado: 0,       // ✅ Poner importe pagado en 0
        ImporteBruto: 0,        // ✅ Poner importe bruto en 0
        ImporteNeto: 0,         // ✅ Poner importe neto en 0
        ImporteIva1: 0,         // ✅ Poner importe IVA en 0
        ImporteIva2: 0,         // ✅ Poner importe IVA en 0
        ImporteAdicional: 0,    // ✅ Poner importe adicional en 0
        ImporteBonificado: 0,   // ✅ Poner importe bonificado en 0
        ImportePercepcionIIBB: 0 // ✅ Poner importe percepción en 0
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


