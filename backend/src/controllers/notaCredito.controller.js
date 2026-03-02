const NotaCreditoCabeza = require("../models/notaCreditoCabeza.model");
const NotaCreditoItem = require("../models/notaCreditoItem.model");
const Articulo = require("../models/articulo.model");
const Cliente = require("../models/cliente.model");
const sequelize = require("../config/database");
const { Op } = require("sequelize");
const numerosControlController = require("./numerosControl.controller");
const NotaCreditoService = require("../services/notaCredito.service");

// Obtener listado de notas de crédito (con paginación y filtros)
exports.listarNotasCredito = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const tipo = req.query.tipo || null;
    const clienteCodigo = req.query.cliente || null;
    const vendedorCodigo = req.query.vendedor || null;
    const fechaDesde = req.query.fechaDesde || null;
    const fechaHasta = req.query.fechaHasta || null;
    const sucursal = req.query.sucursal || null;

    // Construir condiciones de filtrado
    const whereClause = {};

    if (tipo) whereClause.DocumentoTipo = tipo;
    if (clienteCodigo) whereClause.CodigoCliente = clienteCodigo;
    if (sucursal) whereClause.DocumentoSucursal = sucursal;

    if (fechaDesde && fechaHasta) {
      whereClause.Fecha = {
        [Op.between]: [fechaDesde, fechaHasta],
      };
    } else if (fechaDesde) {
      whereClause.Fecha = {
        [Op.gte]: fechaDesde,
      };
    } else if (fechaHasta) {
      whereClause.Fecha = {
        [Op.lte]: fechaHasta,
      };
    }
    
    console.log("whereClause", whereClause);

    // Definir los modelos para esta conexión
    const NotaCreditoCabezaEmpresa = require('../models/notaCreditoCabeza.model');
    NotaCreditoCabezaEmpresa.init(NotaCreditoCabezaEmpresa.getAttributes(), {
      sequelize: req.dbConnection,
      tableName: "notacreditocabeza",
      timestamps: false
    });
    
    const ClienteEmpresa = req.dbConnection.model('Cliente');
    
    // Establecer asociación
    NotaCreditoCabezaEmpresa.belongsTo(ClienteEmpresa, {
      foreignKey: "CodigoCliente",
      targetKey: "Codigo",
    });

    // Consulta con join a cliente
    const notasCredito = await NotaCreditoCabezaEmpresa.findAndCountAll({
      where: whereClause,
      attributes: [
        'DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero', 'Fecha', 
        'ImporteTotal', 'FechaAnulacion', 'afip_cae', 'afip_cae_vencimiento',
        'afip_cae_observaciones', 'CodigoCliente', 
        'factura_tipo', 'factura_sucursal', 'factura_numero'
      ],
      include: [
        {
          model: ClienteEmpresa,
          attributes: ["Codigo", "Descripcion"],
        },
      ],
      order: [
        ["DocumentoSucursal", "DESC"],
        ["DocumentoTipo", "DESC"],
        ["DocumentoNumero", "DESC"],
      ],
      limit: vendedorCodigo ? 9999 : limit, // Si hay filtro de vendedor, traer todas para filtrar después
      offset: vendedorCodigo ? 0 : offset,
    });

    let itemsFiltrados = notasCredito.rows;
    let totalFiltrado = notasCredito.count;

    // Si hay filtro por vendedor, filtrar por facturas relacionadas
    if (vendedorCodigo) {
      const FacturaCabezaEmpresa = req.dbConnection.model('FacturaCabeza');
      
      // Función para normalizar tipo de documento
      const normalizarTipo = (tipo) => {
        if (!tipo) return null;
        const tipoUpper = tipo.toUpperCase();
        // Mapear tipos cortos a completos
        if (tipoUpper === 'A') return 'FCA';
        if (tipoUpper === 'B') return 'FCB';
        if (tipoUpper === 'C') return 'FCC';
        if (tipoUpper === 'F') return 'PRF';
        return tipoUpper;
      };
      
      // Obtener todas las facturas del vendedor para cachearlas
      const facturasVendedor = await FacturaCabezaEmpresa.findAll({
        where: {
          VendedorCodigo: vendedorCodigo,
          FechaAnulacion: null
        },
        attributes: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero', 'VendedorCodigo'],
        raw: true
      });
      
      console.log(`Facturas del vendedor ${vendedorCodigo}: ${facturasVendedor.length}`);
      
      // Crear un mapa para búsqueda rápida
      const facturasMap = new Map();
      facturasVendedor.forEach(f => {
        // Clave exacta
        const claveExacta = `${f.DocumentoTipo}-${f.DocumentoSucursal}-${f.DocumentoNumero}`;
        facturasMap.set(claveExacta, f);
        
        // Clave normalizada (sin ceros a la izquierda)
        const claveNormalizada = `${f.DocumentoTipo}-${parseInt(f.DocumentoSucursal)}-${parseInt(f.DocumentoNumero)}`;
        facturasMap.set(claveNormalizada, f);
      });
      
      // Filtrar NC por vendedor de factura relacionada
      const ncFiltradas = [];
      for (const nc of notasCredito.rows) {
        if (nc.factura_tipo && nc.factura_sucursal && nc.factura_numero) {
          // Normalizar el tipo de factura
          const tipoNormalizado = normalizarTipo(nc.factura_tipo);
          
          // Intentar diferentes combinaciones de búsqueda
          const claves = [
            // Con tipo normalizado, exacto
            `${tipoNormalizado}-${nc.factura_sucursal}-${nc.factura_numero}`,
            // Con tipo original, exacto
            `${nc.factura_tipo.toUpperCase()}-${nc.factura_sucursal}-${nc.factura_numero}`,
            // Con tipo normalizado, sin ceros
            `${tipoNormalizado}-${parseInt(nc.factura_sucursal)}-${parseInt(nc.factura_numero)}`
          ];
          
          let encontrada = false;
          for (const clave of claves) {
            if (facturasMap.has(clave)) {
              ncFiltradas.push(nc);
              encontrada = true;
              break;
            }
          }
          
          if (!encontrada) {
            console.log(`NC no encontrada: ${nc.DocumentoTipo}-${nc.DocumentoSucursal}-${nc.DocumentoNumero}, busca factura: ${nc.factura_tipo}-${nc.factura_sucursal}-${nc.factura_numero}`);
          }
        }
      }
      
      console.log(`NC filtradas por vendedor: ${ncFiltradas.length}`);
      
      itemsFiltrados = ncFiltradas;
      totalFiltrado = ncFiltradas.length;
      
      // Aplicar paginación manual
      const start = offset;
      const end = offset + limit;
      itemsFiltrados = ncFiltradas.slice(start, end);
    }

    res.json({
      items: itemsFiltrados,
      meta: {
        totalItems: totalFiltrado,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: Math.ceil(totalFiltrado / limit),
      },
    });
  } catch (error) {
    console.error("Error al listar notas de crédito:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener notas de crédito",
      error: error.message,
    });
  }
};

// Obtener detalle de una nota de crédito
exports.obtenerNotaCredito = async (req, res) => {
  try {
    const { tipo, sucursal, numero } = req.params;

    // Definir los modelos para esta conexión
    const NotaCreditoCabezaEmpresa = require('../models/notaCreditoCabeza.model');
    NotaCreditoCabezaEmpresa.init(NotaCreditoCabezaEmpresa.getAttributes(), {
      sequelize: req.dbConnection,
      tableName: "notacreditocabeza",
      timestamps: false
    });
    
    const NotaCreditoItemEmpresa = require('../models/notaCreditoItem.model');
    NotaCreditoItemEmpresa.init(NotaCreditoItemEmpresa.getAttributes(), {
      sequelize: req.dbConnection,
      tableName: "notacreditoitems",
      timestamps: false
    });
    
    const ClienteEmpresa = req.dbConnection.model('Cliente');
    const ArticuloEmpresa = req.dbConnection.model('Articulo');
    
    // Establecer asociaciones
    NotaCreditoCabezaEmpresa.belongsTo(ClienteEmpresa, {
      foreignKey: "CodigoCliente",
      targetKey: "Codigo",
    });
    
    NotaCreditoItemEmpresa.belongsTo(ArticuloEmpresa, {
      foreignKey: 'CodigoArticulo',
      targetKey: 'Codigo'
    });

    // Obtener encabezado
    const notaCredito = await NotaCreditoCabezaEmpresa.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      include: [
        {
          model: ClienteEmpresa,
          attributes: ["Codigo", "Descripcion", "CategoriaIva"],
        },
      ],
    });

    if (!notaCredito) {
      return res.status(404).json({
        success: false,
        message: "Nota de crédito no encontrada",
      });
    }

    // Obtener items manualmente
    const items = await NotaCreditoItemEmpresa.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      attributes: [
        'DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero',
        'CodigoArticulo', 'Cantidad', 'PrecioUnitario'
      ],
      include: [{ 
        model: ArticuloEmpresa,
        attributes: ['Codigo', 'Descripcion', 'UnidadVenta', 'Lista1', 'PorcentajeIVA1', 'PorcentajeIVA2']
      }],
    });

    // Obtener los códigos de artículos para buscarlos
    const codigosArticulos = items.map((item) => item.CodigoArticulo);

    // Buscar los artículos correspondientes
    const articulos = await ArticuloEmpresa.findAll({
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
      return {
        ...item.get({ plain: true }),
        Articulo: articulo,
      };
    });

    res.json({
      success: true,
      data: {
        encabezado: notaCredito,
        items: itemsConArticulos,
      },
    });
  } catch (error) {
    console.error("Error al obtener detalle de nota de crédito:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener detalle de nota de crédito",
      error: error.message,
    });
  }
};

/**
 * Crea una nota de crédito RÁPIDA (tipo NCA, NCB o NCF) desde una preventa (devolución).
 * El comprobante asociado debe ser una factura de este cliente.
 */
exports.crearNotaCreditoRapidaDesdePreventa = async (req, res) => {
  try {
    const { preventaTipo, preventaSucursal, preventaNumero, FormaPagoCodigo, DocumentoTipo, FacturaReferencia } = req.body;
    if (!preventaTipo || !preventaSucursal || !preventaNumero) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos de la preventa (preventaTipo, preventaSucursal, preventaNumero)",
      });
    }
    const tipoNC = (DocumentoTipo === "NCA" || DocumentoTipo === "NCB" || DocumentoTipo === "NCF") ? DocumentoTipo : "NCF";
    if (!FacturaReferencia || !FacturaReferencia.tipo || !FacturaReferencia.sucursal || !FacturaReferencia.numero) {
      return res.status(400).json({
        success: false,
        message: "El comprobante asociado es obligatorio: debe seleccionar una factura del cliente.",
      });
    }

    const { PreventaCabeza, PreventaItem, Cliente, Articulo, DatosEmpresa, FacturaCabeza } = req.models;
    const dbConnection = req.dbConnection;

    // Obtener sucursal de la empresa
    const datosEmpresa = await DatosEmpresa.findOne({ raw: true });
    const sucursal = (datosEmpresa && datosEmpresa.Sucursal) ? String(datosEmpresa.Sucursal).trim() : "0001";
    const sucursalPadded = sucursal.padStart(4, "0");

    // Cargar preventa (cabeza + items)
    const preventaCabeza = await PreventaCabeza.findOne({
      where: {
        DocumentoTipo: preventaTipo,
        DocumentoSucursal: preventaSucursal,
        DocumentoNumero: preventaNumero,
      },
      include: [{ model: Cliente, attributes: ["Codigo", "Descripcion", "CategoriaIva"] }],
    });

    if (!preventaCabeza) {
      return res.status(404).json({
        success: false,
        message: "Preventa no encontrada",
      });
    }

    if (preventaCabeza.FechaAnulacion) {
      return res.status(400).json({
        success: false,
        message: "No se puede generar NC rápida desde una preventa anulada",
      });
    }

    const preventaItems = await PreventaItem.findAll({
      where: {
        DocumentoTipo: preventaTipo,
        DocumentoSucursal: preventaSucursal,
        DocumentoNumero: preventaNumero,
      },
      include: [{ model: Articulo, attributes: ["Codigo", "Descripcion"] }],
    });

    if (!preventaItems || preventaItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "La preventa no tiene ítems",
      });
    }

    const cabeza = preventaCabeza.get ? preventaCabeza.get({ plain: true }) : preventaCabeza;
    const cliente = cabeza.Cliente || {};

    // Validar que la factura de referencia sea de este cliente
    const facturaRef = FacturaReferencia;
    const facturaAsociada = await FacturaCabeza.findOne({
      where: {
        DocumentoTipo: facturaRef.tipo,
        DocumentoSucursal: facturaRef.sucursal,
        DocumentoNumero: facturaRef.numero,
        ClienteCodigo: cabeza.ClienteCodigo,
      },
    });
    if (!facturaAsociada) {
      return res.status(400).json({
        success: false,
        message: "La factura seleccionada no corresponde al cliente de la preventa o no existe.",
      });
    }

    // Mapear ítems preventa -> ítems nota de crédito (con campos que espera el servicio/validador)
    let importeBruto = 0;
    let baseImponible1 = 0;
    let baseImponible2 = 0;
    const Items = preventaItems.map((pi) => {
      const plain = pi.get ? pi.get({ plain: true }) : pi;
      const articulo = plain.Articulo || {};
      const cantidad = parseFloat(plain.Cantidad) || 0;
      const precioUnitario = parseFloat(plain.PrecioUnitario) || 0;
      // IVA: la tabla t_articulos puede no tener PorcentajeIva; usar 21 por defecto
      const porcIva = (articulo.PorcentajeIva != null && articulo.PorcentajeIva !== undefined)
        ? parseFloat(articulo.PorcentajeIva)
        : 21;
      const subtotal = cantidad * precioUnitario;
      importeBruto += subtotal;
      if (porcIva === 21) baseImponible1 += subtotal;
      else if (porcIva === 10.5) baseImponible2 += subtotal;
      return {
        CodigoArticulo: plain.CodigoArticulo,
        Descripcion: articulo.Descripcion || "",
        Cantidad: cantidad,
        PrecioUnitario: precioUnitario,
        PorcentajeIva: porcIva,
        PorcentajeBonificacion: parseFloat(plain.PorcentajeBonificacion) || 0,
        // No enviar DocummentoLiq*: la tabla notacreditoitems no tiene esas columnas (igual que notas de crédito comunes)
      };
    });

    const importeIva1 = baseImponible1 * 0.21;
    const importeIva2 = baseImponible2 * 0.105;
    const importeTotal = importeBruto + importeIva1 + importeIva2;
    const hoy = new Date().toISOString().slice(0, 10);

    const notaCreditoData = {
      DocumentoTipo: tipoNC,
      DocumentoSucursal: sucursalPadded,
      DocumentoNumero: "", // lo asigna el servicio
      Fecha: hoy,
      CodigoCliente: cabeza.ClienteCodigo,
      Cliente: { Codigo: cliente.Codigo, Descripcion: cliente.Descripcion, CategoriaIva: cliente.CategoriaIva },
      ListaNumero: String(cabeza.ListaNumero || "1"),
      ImporteBruto: importeBruto,
      ImporteBonificado: 0,
      ImporteNeto: importeBruto,
      ImporteIva1: importeIva1,
      ImporteIva2: importeIva2,
      BaseImponible1: baseImponible1,
      BaseImponible2: baseImponible2,
      PorcentajeIva1: 21,
      PorcentajeIva2: 10.5,
      ImporteTotal: importeTotal,
      ImporteUtilizado: 0,
      Observacion: (cabeza.Observacion || "") + (cabeza.Observacion ? " " : "") + `[NC rápida desde ${preventaTipo}-${preventaSucursal}-${preventaNumero}]`,
      PorStock: true,
      Items,
      FormaPagoCodigo: FormaPagoCodigo || "CC",
      CodigoVendedor: cabeza.VendedorCodigo || "1",
      factura_tipo: facturaRef.tipo,
      factura_sucursal: facturaRef.sucursal,
      factura_numero: facturaRef.numero,
    };

    const notaCreditoCreada = await NotaCreditoService.crearNotaCredito(notaCreditoData, dbConnection);

    // Marcar la preventa para que no siga pendiente (usada para devolución)
    await PreventaCabeza.update(
      {
        FacturaTipo: tipoNC,
        FacturaSucursal: notaCreditoCreada.DocumentoSucursal,
        FacturaNumero: notaCreditoCreada.DocumentoNumero,
      },
      {
        where: {
          DocumentoTipo: preventaTipo,
          DocumentoSucursal: preventaSucursal,
          DocumentoNumero: preventaNumero,
        },
      }
    );

    res.json({
      success: true,
      data: {
        ...notaCreditoCreada,
        factura_tipo: facturaRef.tipo,
        factura_sucursal: facturaRef.sucursal,
        factura_numero: facturaRef.numero,
      },
    });
  } catch (error) {
    console.error("Error al crear nota de crédito rápida desde preventa:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear nota de crédito rápida",
      error: error.message,
    });
  }
};

// Crear nueva nota de crédito
exports.crearNotaCredito = async (req, res) => {
  try {
    console.log("notaCreditoData", req.body);
    const notaCreditoData = req.body;

    // Completar datos necesarios
    notaCreditoData.DocumentoNumero = notaCreditoData.DocumentoNumero
      ? notaCreditoData.DocumentoNumero.toString().padStart(8, "0")
      : null;

    // Si tiene referencia a factura, formatear los datos
    if (notaCreditoData.FacturaReferencia) {
      notaCreditoData.factura_tipo = notaCreditoData.FacturaReferencia.tipo;
      notaCreditoData.factura_sucursal = notaCreditoData.FacturaReferencia.sucursal;
      notaCreditoData.factura_numero = notaCreditoData.FacturaReferencia.numero;
      delete notaCreditoData.FacturaReferencia;
    }

    // Crear nota de crédito usando el servicio
    const notaCreditoCreada = await NotaCreditoService.crearNotaCredito(
      notaCreditoData,
      req.dbConnection
    );

    res.json({
      success: true,
      data: notaCreditoCreada,
    });
  } catch (error) {
    console.error("Error al crear nota de crédito:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear nota de crédito",
      error: error.message,
    });
  }
};

// Anular nota de crédito
exports.anularNotaCredito = async (req, res) => {
  try {
    const { NotaCreditoCabeza, NotaCreditoItem, Articulo } = req.models;
    const sequelizeEmpresa = NotaCreditoCabeza.sequelize;
    const t = await sequelizeEmpresa.transaction();

    try {
      const { tipo, sucursal, numero } = req.params;

      // Verificar si la nota de crédito existe
      const notaCredito = await NotaCreditoCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      transaction: t,
    });

    if (!notaCredito) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Nota de crédito no encontrada",
      });
    }

    // Verificar si ya está anulada
    if (notaCredito.FechaAnulacion) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "La nota de crédito ya se encuentra anulada",
      });
    }

    // Solo se pueden anular notas de crédito tipo F (NCF). NCA y NCB no se anulan.
    if (tipo !== "NCF") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Solo se pueden anular notas de crédito tipo F (NCF). Las notas de crédito A y B no pueden anularse.",
      });
    }

    // Obtener ítems para restaurar stock si es necesario
    if (notaCredito.PorStock) {
      const items = await NotaCreditoItem.findAll({
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
          // Al anular nota de crédito, restamos el stock (ya que la NC había sumado)
          const nuevoStock =
            parseFloat(item.Articulo.Existencia) - parseFloat(item.Cantidad);
          await item.Articulo.update(
            { Existencia: nuevoStock },
            { transaction: t }
          );
        }
      }
    }

    // Marcar como anulada
    await notaCredito.update(
      {
        FechaAnulacion: new Date(),
      },
      { transaction: t }
    );

    // Actualizar la deuda del cliente
    const { Cliente } = req.models;
    const cliente = await Cliente.findByPk(notaCredito.CodigoCliente, { transaction: t });

    if (cliente) {
      // Al anular NC, restamos el saldo de NC no aplicado
      // Solo afecta el saldo disponible (ImporteTotal - ImporteUtilizado)
      const saldoDisponible = (notaCredito.ImporteTotal || 0) - (notaCredito.ImporteUtilizado || 0);
      await cliente.update({
        SaldoNTCNoAplicado: Math.max(0, (cliente.SaldoNTCNoAplicado || 0) - saldoDisponible)
      }, { transaction: t });
    }

      await t.commit();

      res.json({
        success: true,
        message: "Nota de crédito anulada correctamente",
      });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error al anular nota de crédito:", error);
    res.status(500).json({
      success: false,
      message: "Error al anular nota de crédito",
      error: error.message,
    });
  }
};

// Obtener próximo número de nota de crédito
exports.obtenerProximoNumero = async (req, res) => {
  try {
    const { tipo, sucursal } = req.params;
    
    // Validar parámetros
    if (!tipo || !sucursal) {
      return res.status(400).json({
        success: false,
        message: "Tipo y sucursal son requeridos"
      });
    }

    // Obtener próximo número usando el controlador de números de control
    const proximoNumero = await numerosControlController.obtenerProximoNumeroDirecto(
      tipo,
      sucursal,
      req.models
    );

    res.json({
      success: true,
      data: proximoNumero
    });
  } catch (error) {
    console.error("Error al obtener próximo número:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener próximo número",
      error: error.message
    });
  }
};
